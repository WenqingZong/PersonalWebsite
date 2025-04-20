use actix_web::{
    App, HttpRequest, HttpResponse, HttpServer,
    middleware::Logger,
    web::{self, Json},
};
use anyhow::Result;
use base64::{Engine, engine::general_purpose::STANDARD as BASE64};
use chrono::Utc;
use log::{info, warn};
use openssl::hash::MessageDigest;
use openssl::pkey::{PKey, Public};
use openssl::sha::Sha256;
use openssl::sign::Verifier;
use serde::Deserialize;
use std::process::Command;
use std::str::FromStr;
use std::sync::OnceLock;
use thiserror::Error;

static PUB_KEY: OnceLock<PKey<Public>> = OnceLock::new();
static PUB_KEY_FINGERPRINT: OnceLock<String> = OnceLock::new();

#[derive(Error, Debug)]
enum WebhookError {
    #[error("No x-public-key-fingerprint header")]
    NoXPublicKeyFingerprintHeader,

    #[error("No x-signature-timestamp header")]
    NoXSignatureTimestampHeader,

    #[error("No x-signature header")]
    NoXSignatureHeader,

    #[error("Invalid timestamp, send before 5 min")]
    InvalidTimestamp,

    #[error("Cannot decode base64 signature")]
    CannotDecodeBase64Signature,

    #[error("Invalid signature")]
    InvalidSignature,
}

#[derive(Debug, Deserialize)]
struct WebhookPayload {
    artifact_url: String,
}

fn log_failed_attempt(error: WebhookError, payload: &Json<WebhookPayload>, request: &HttpRequest) {
    warn!("{}", error);
    warn!("{:?}", payload);
    warn!("{:?}", request);
}

fn get_pub_key_and_fingerprint() -> (&'static PKey<Public>, &'static str) {
    let pub_key = PUB_KEY.get_or_init(|| {
        let pub_key_bytes = include_bytes!("../public.pem");
        PKey::public_key_from_pem(pub_key_bytes).unwrap()
    });

    let fingerprint = PUB_KEY_FINGERPRINT.get_or_init(|| {
        let der_bytes = pub_key.public_key_to_der().unwrap();
        let mut hasher = Sha256::new();
        hasher.update(&der_bytes);
        let hash = hasher.finish();
        hex::encode(hash)
    });

    (pub_key, fingerprint)
}

fn validate_timestamp(timestamp: &str) -> Result<()> {
    let timestamp = i64::from_str(timestamp)?;
    let now = Utc::now().timestamp();

    if (now - timestamp).abs() > 300 {
        anyhow::bail!("Time stamp out of valid range");
    }
    Ok(())
}

fn execute_shell_script(artifact_url: &str) -> Result<()> {
    let output = Command::new("sh")
        .arg("./update_deployment.sh")
        .arg(artifact_url)
        .output()?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("{}", error);
    }
    Ok(())
}

async fn personal_website(payload: Json<WebhookPayload>, request: HttpRequest) -> HttpResponse {
    let headers = request.headers();

    // Verify fingerprint.
    let (pub_key, calculated_fingerprint) = get_pub_key_and_fingerprint();
    let received_fingerprint = match headers.get("x-public-key-fingerprint") {
        Some(value) => value.to_str().unwrap_or_default(),
        None => {
            log_failed_attempt(
                WebhookError::NoXPublicKeyFingerprintHeader,
                &payload,
                &request,
            );
            return HttpResponse::NotFound().finish();
        }
    };
    if received_fingerprint != calculated_fingerprint {
        return HttpResponse::NotFound().finish();
    }

    // Verify timestamp.
    let received_timestamp = match headers.get("x-signature-timestamp") {
        Some(value) => value.to_str().unwrap_or_default(),
        None => {
            log_failed_attempt(
                WebhookError::NoXSignatureTimestampHeader,
                &payload,
                &request,
            );
            return HttpResponse::NotFound().finish();
        }
    };
    if validate_timestamp(received_timestamp).is_err() {
        log_failed_attempt(WebhookError::InvalidTimestamp, &payload, &request);
        return HttpResponse::NotFound().finish();
    }

    // Verify signature.
    let received_signature = match headers.get("x-signature") {
        Some(value) => value.to_str().unwrap_or_default(),
        None => {
            log_failed_attempt(WebhookError::NoXSignatureHeader, &payload, &request);
            return HttpResponse::NotFound().finish();
        }
    };
    let data_string = format!(
        "timestamp={}|artifact_url={}",
        received_timestamp, payload.artifact_url
    );
    let signature_bytes = match BASE64.decode(received_signature) {
        Ok(bytes) => bytes,
        Err(_) => {
            log_failed_attempt(
                WebhookError::CannotDecodeBase64Signature,
                &payload,
                &request,
            );
            return HttpResponse::NotFound().finish();
        }
    };
    let mut verifier = Verifier::new(MessageDigest::sha512(), pub_key).unwrap();
    verifier.update(data_string.as_bytes()).unwrap();
    if !verifier.verify(&signature_bytes).unwrap_or(false) {
        log_failed_attempt(WebhookError::InvalidSignature, &payload, &request);
        return HttpResponse::NotFound().finish();
    }
    if let Err(e) = execute_shell_script(&payload.artifact_url) {
        warn!("Cannot execute shell script due to: {}", e);
        return HttpResponse::InternalServerError().finish();
    }

    HttpResponse::Ok().finish()
}

#[actix_web::main]
async fn main() -> Result<()> {
    // System init.
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info,actix_server=warn"));
    let address = "127.0.0.1";
    let port = 1234;
    info!("Listening on {}:{}", address, port);

    HttpServer::new(|| {
        App::new()
            .wrap(Logger::default())
            .service(web::resource("/personal_website").route(web::post().to(personal_website)))
            .default_service(web::route().to(|| async { HttpResponse::NotFound().finish() }))
    })
    .bind((address, port))?
    .run()
    .await?;

    Ok(())
}

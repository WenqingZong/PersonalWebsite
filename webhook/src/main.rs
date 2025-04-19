use actix_web::{App, HttpResponse, HttpServer, middleware::Logger, web};
use anyhow::Result;
use log::{info, warn};
use openssl::pkey::{PKey, Public};
use openssl::sha::Sha256;
use std::sync::OnceLock;

static PUB_KEY: OnceLock<PKey<Public>> = OnceLock::new();
static PUB_KEY_FINGERPRINT: OnceLock<String> = OnceLock::new();

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

async fn personal_website() -> HttpResponse {
    unimplemented!()
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
    })
    .bind((address, port))?
    .run()
    .await?;

    Ok(())
}

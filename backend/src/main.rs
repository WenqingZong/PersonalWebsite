use actix_web::{App, HttpResponse, HttpServer, Responder, web};

async fn health_check() -> impl Responder {
    HttpResponse::Ok().json("Health check passed!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().route("/health", web::get().to(health_check)))
        // Because this backend server will only run behind a nginx reverse proxy.
        .bind("127.0.0.1:8080")?
        .run()
        .await
}

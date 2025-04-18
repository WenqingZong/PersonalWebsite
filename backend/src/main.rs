use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json("Health check passed!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        let app = App::new().route("/api/health", web::get().to(health_check));

        // 仅在debug模式启用CORS配置
        #[cfg(debug_assertions)]
        let app = app.wrap(
            Cors::default()
                .allowed_origin("http://127.0.0.1:3000")
                .allowed_origin("http://localhost:3000")
                .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
                .allow_any_header()
                .max_age(3600),
        );

        app
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

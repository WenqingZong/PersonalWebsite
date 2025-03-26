use rocket::launch;
use rocket::fs::{FileServer, Options, relative};

#[launch]
fn rocket() -> _ {
    let options = Options::default();
    rocket::build()
        .mount("/", FileServer::new(relative!("web/http"), options))
}

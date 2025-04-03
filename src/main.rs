#[macro_use]
extern crate rocket;

use include_dir::{include_dir, Dir};
use rocket::http::ContentType;
use std::path::{Path, PathBuf};
static STATIC_DIR: Dir = include_dir!("static");

/// Returns any requested files.
#[get("/<path..>")]
fn files(path: PathBuf) -> Option<(ContentType, &'static [u8])> {
    // Handle root path as index.html
    let path = if path.to_str() == Some("") {
        Path::new("index.html")
    } else {
        path.as_path()
    };

    // Find file in embedded directory
    let file = STATIC_DIR.get_file(path)?;

    // Get content type from file extension
    let content_type =
        ContentType::from_extension(path.extension()?.to_str()?).unwrap_or(ContentType::Bytes);

    Some((content_type, file.contents()))
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![files])
}

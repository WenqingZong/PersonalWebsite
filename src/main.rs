#[macro_use] extern crate rocket;

#[cfg(test)] mod tests;

use include_dir::{include_dir, Dir, DirEntry};
use rocket::{State, Shutdown};
use rocket::fs::{relative, FileServer, NamedFile};
use rocket::form::Form;
use rocket::http::ContentType;
use rocket::response::stream::{EventStream, Event};
use rocket::serde::{Serialize, Deserialize};
use rocket::tokio::sync::broadcast::{channel, Sender, error::RecvError};
use rocket::tokio::select;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, FromForm, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, UriDisplayQuery))]
#[serde(crate = "rocket::serde")]
struct Message {
    #[field(validate = len(..30))]
    pub room: String,
    #[field(validate = len(..20))]
    pub username: String,
    pub message: String,
}

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
    let content_type = ContentType::from_extension(
        path.extension()?.to_str()?
    ).unwrap_or(ContentType::Bytes);

    Some((content_type, file.contents()))
}

/// Returns an infinite stream of server-sent events. Each event is a message
/// pulled from a broadcast queue sent by the `post` handler.
#[get("/events")]
async fn events(queue: &State<Sender<Message>>, mut end: Shutdown) -> EventStream![] {
    let mut rx = queue.subscribe();
    EventStream! {
        loop {
            let msg = select! {
                msg = rx.recv() => match msg {
                    Ok(msg) => msg,
                    Err(RecvError::Closed) => break,
                    Err(RecvError::Lagged(_)) => continue,
                },
                _ = &mut end => break,
            };

            yield Event::json(&msg);
        }
    }
}

/// Receive a message from a form submission and broadcast it to any receivers.
#[post("/message", data = "<form>")]
fn post(form: Form<Message>, queue: &State<Sender<Message>>) {
    // A send 'fails' if there are no active subscribers. That's okay.
    let _res = queue.send(form.into_inner());
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .manage(channel::<Message>(1024).0)
        .mount("/", routes![post, events, files])
}

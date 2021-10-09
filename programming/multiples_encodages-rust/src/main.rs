use lazy_static::lazy_static;

use regex::Regex;

use data_encoding::BASE64;
use std::io::Read;
use std::io::Write;
use std::net::TcpStream;
use std::str::from_utf8;

fn extract_encoded(input: &str) -> Option<&str> {
    lazy_static! {
        static ref RE: Regex = Regex::new(r"'(?P<encoded>.*)'").unwrap();
    }
    RE.captures(input)
        .and_then(|cap| cap.name("encoded").map(|encoded| encoded.as_str()))
}

fn main() {
    match TcpStream::connect("challenge01.root-me.org:52017") {
        Ok(mut stream) => {
            println!("Successfully connected to server in port 52017");

            loop {
                // let mut data = [0 as u8; 335];
                let mut data = [0 as u8; 500]; // using 6 byte buffer
                println!("in loop");
                match stream.read(&mut data) {
                    Ok(_) => {
                        let text = from_utf8(&data).unwrap();
                        println!("reply: {}", text);
                        let encoded = extract_encoded(text);
                        match encoded {
                            Some(encoded) => {
                                println!("encoded: {}", encoded);
                                let bytes = BASE64.decode(text.as_bytes()).unwrap();
                                println!("{:?}", from_utf8(&bytes).unwrap());
                                stream.write(b"aaatoto").unwrap();
                            }
                            None => {
                                println!("No matched encoded")
                            }
                        }
                    }
                    Err(e) => {
                        println!("Failed to receive data: {}", e);
                    }
                }
            }
        }
        Err(e) => {
            println!("Failed to connect: {}", e);
        }
    }
    println!("Terminated.");
}

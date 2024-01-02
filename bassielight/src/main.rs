/*
 * Copyright (c) 2023-2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

use crate::{
    devices::usb_dmx::USBDMX,
    fixtures::{multidim_mkii::MultiDimMKII, p56led::P56LED, Color, Fixture, RGBFixture},
};
use http::Request;
use rust_embed::RustEmbed;
use std::collections::HashMap;
use std::thread::spawn;
use wry::{
    application::{
        dpi::{LogicalPosition, LogicalSize, PhysicalPosition},
        event::{Event, WindowEvent},
        event_loop::{ControlFlow, EventLoop},
        window::WindowBuilder,
    },
    http::{header::CONTENT_TYPE, Response},
    webview::{self, WebViewBuilder},
};

mod config;
mod devices;
mod fixtures;
mod widgets;

#[derive(RustEmbed)]
#[folder = "../web/"]
struct Web;

fn get_mime_type(path: &str) -> &str {
    if path.ends_with(".html") {
        "text/html"
    } else if path.ends_with(".css") {
        "text/css"
    } else if path.ends_with(".js") {
        "text/javascript"
    } else if path.ends_with(".json") {
        "application/json"
    } else if path.ends_with(".ico") {
        "image/x-icon"
    } else if path.ends_with(".png") {
        "image/png"
    } else if path.ends_with(".svg") {
        "image/svg+xml"
    } else {
        unimplemented!();
    }
}

fn get_wry_response(request: Request<Vec<u8>>) -> http::Response<Vec<u8>> {
    let mut path = String::from(request.uri().path());
    if path.ends_with('/') {
        path.push_str("index.html");
    }

    let content = Web::get(path[1..].into())
        .unwrap_or(Web::get("index.html").unwrap())
        .data;

    Response::builder()
        .header(CONTENT_TYPE, get_mime_type(path.as_str()))
        .body(content.into())
        .unwrap()
}

fn main() -> wry::Result<()> {
    // Window
    let event_loop = EventLoop::new();

    let window = WindowBuilder::new()
        .with_title("BassieLight")
        .with_inner_size(LogicalSize::new(1024.0, 768.0))
        .build(&event_loop)?;

    let screen_size = window.current_monitor().unwrap().size();
    let window_size = window.inner_size();
    window.set_outer_position(PhysicalPosition::new(
        (screen_size.width - window_size.width) / 2,
        (screen_size.height - window_size.height) / 2,
    ));

    let webview = WebViewBuilder::new(window)?
        .with_asynchronous_custom_protocol("wry".into(), move |request, responder| {
            responder.respond(get_wry_response(request));
        })
        .with_url("wry://index.html")?
        .build()?;

    // DMX thread

    spawn(move || loop {
        // Parse config
        let config = crate::config::load("config.json").unwrap_or_else(|| {
            panic!("Can't parse config");
        });

        // Create fixtures
        let mut fixtures: HashMap<String, Box<dyn Fixture>> = HashMap::new();
        for fixture_config in config.fixtures {
            fixtures.insert(
                fixture_config.name,
                match fixture_config.r#type {
                    config::FixtureType::P56LED => Box::new(P56LED::new(fixture_config.addr)),
                    config::FixtureType::MultiDimMKII => {
                        Box::new(MultiDimMKII::new(fixture_config.addr))
                    }
                },
            );
        }

        // Connect to USB DMX
        let mut usb_dmx = USBDMX::new();

        for fixture in fixtures.values_mut() {
            if let Some(rgb_fixture) = fixture.as_any().downcast_mut::<Box<dyn RGBFixture>>() {
                rgb_fixture.set_color(Color::new(255, 0, 0));
            }

            fixture.tick(&mut usb_dmx);
        }
    });

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => *control_flow = ControlFlow::Exit,
            _ => (),
        }
    });
}

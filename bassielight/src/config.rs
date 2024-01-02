/*
 * Copyright (c) 2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

use serde::Deserialize;
use std::fs::File;
use std::io::BufReader;

// Fixture
#[derive(Debug, Deserialize)]
pub enum FixtureType {
    #[serde(rename = "p56led")]
    P56LED,
    #[serde(rename = "multidim_mkii")]
    MultiDimMKII,
}

#[derive(Debug, Deserialize)]
pub struct Fixture {
    pub name: String,
    pub label: String,
    pub r#type: FixtureType,
    pub addr: usize,
}

// Tab
#[derive(Debug, Deserialize)]
pub enum WidgetType {
    #[serde(rename = "rgb")]
    RGB,
    #[serde(rename = "switch")]
    Switch,
}

#[derive(Debug, Deserialize)]
pub struct Widget {
    pub r#type: WidgetType,
    pub fixtures: Vec<String>,
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Deserialize)]
pub struct Tab {
    pub name: String,
    pub label: String,
    pub widgets: Vec<Widget>,
}

// Config
#[derive(Debug, Deserialize)]
pub struct Config {
    pub name: String,
    pub version: String,
    pub author: String,
    pub fixtures: Vec<Fixture>,
    pub tabs: Vec<Tab>,
}

pub fn load(path: &str) -> Option<Config> {
    let file = File::open(path).ok()?;
    let reader = BufReader::new(file);
    serde_json::from_reader(reader).ok()
}

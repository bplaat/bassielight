/*
 * Copyright (c) 2023-2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

use crate::devices::DMXEmitter;
use crate::fixtures::{Color, Fixture, RGBFixture};
use std::any::Any;
use std::time::{Duration, SystemTime};

const CHANNEL_RED: usize = 0;
const CHANNEL_GREEN: usize = 1;
const CHANNEL_BLUE: usize = 2;
const CHANNEL_MODE: usize = 5;

pub struct P56LED {
    addr: usize,

    color: Color,
    toggle_color: Color,
    intensity: f32,

    toggle_speed: Duration,
    toggle_time: SystemTime,
    is_toggle: bool,

    strobe_speed: Duration,
    strobe_time: SystemTime,
    is_strobe: bool,

    is_automatic: bool,
}

impl P56LED {
    pub fn new(addr: usize) -> Self {
        Self {
            addr: addr,

            color: Color::new(0, 0, 0),
            toggle_color: Color::new(0, 0, 0),
            intensity: 1.0,

            toggle_speed: Duration::from_millis(0),
            toggle_time: SystemTime::now(),
            is_toggle: false,

            strobe_speed: Duration::from_millis(0),
            strobe_time: SystemTime::now(),
            is_strobe: false,

            is_automatic: false,
        }
    }
}

impl Fixture for P56LED {
    fn as_any(&mut self) -> &mut dyn Any {
        self
    }

    fn tick(&mut self, dmx: &mut dyn DMXEmitter) {
        dmx.write(
            self.addr + CHANNEL_MODE,
            if self.is_automatic { 255 } else { 0 },
        );

        if SystemTime::now().duration_since(self.toggle_time).unwrap() >= self.toggle_speed {
            self.toggle_time = SystemTime::now();
            if self.toggle_speed.as_millis() != 0 {
                self.toggle();
            }
        }
        if SystemTime::now().duration_since(self.strobe_time).unwrap() >= self.strobe_speed {
            self.strobe_time = SystemTime::now();
            if self.strobe_speed.as_millis() != 0 {
                self.strobe();
            }
        }

        if (self.color.red == 0 && self.color.green == 0 && self.color.blue == 0) || self.is_strobe
        {
            dmx.write(self.addr + CHANNEL_RED, 0);
            dmx.write(self.addr + CHANNEL_GREEN, 0);
            dmx.write(self.addr + CHANNEL_BLUE, 0);
            return;
        }

        if self.is_toggle {
            dmx.write(
                self.addr + CHANNEL_RED,
                (self.toggle_color.red as f32 * self.intensity) as u8,
            );
            dmx.write(
                self.addr + CHANNEL_GREEN,
                (self.toggle_color.green as f32 * self.intensity) as u8,
            );
            dmx.write(
                self.addr + CHANNEL_BLUE,
                (self.toggle_color.blue as f32 * self.intensity) as u8,
            );
        } else {
            dmx.write(
                self.addr + CHANNEL_RED,
                (self.color.red as f32 * self.intensity) as u8,
            );
            dmx.write(
                self.addr + CHANNEL_GREEN,
                (self.color.green as f32 * self.intensity) as u8,
            );
            dmx.write(
                self.addr + CHANNEL_BLUE,
                (self.color.blue as f32 * self.intensity) as u8,
            );
        }
    }
}

impl RGBFixture for P56LED {
    fn color(&self) -> Color {
        self.color
    }
    fn set_color(&mut self, color: Color) {
        self.color = color;
    }
    fn toggle_color(&self) -> Color {
        self.toggle_color
    }
    fn set_toggle_color(&mut self, toggle_color: Color) {
        self.toggle_color = toggle_color;
    }
    fn intensity(&self) -> f32 {
        self.intensity
    }
    fn set_intensity(&mut self, intensity: f32) {
        self.intensity = intensity;
    }

    fn toggle_speed(&self) -> Duration {
        self.toggle_speed
    }
    fn set_toggle_speed(&mut self, toggle_speed: Duration) {
        self.toggle_speed = toggle_speed;
    }
    fn toggle(&mut self) {
        self.is_toggle = !self.is_toggle;
    }

    fn strobe_speed(&self) -> Duration {
        self.strobe_speed
    }
    fn set_strobe_speed(&mut self, strobe_speed: Duration) {
        self.strobe_speed = strobe_speed;
    }
    fn strobe(&mut self) {
        self.is_strobe = !self.is_strobe;
    }

    fn set_automatic(&mut self, automatic: bool) {
        self.is_automatic = automatic;
    }
}

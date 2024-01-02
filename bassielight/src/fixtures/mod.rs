/*
 * Copyright (c) 2023-2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

use crate::devices::DMXEmitter;
use std::any::Any;
use std::time::Duration;

pub mod multidim_mkii;
pub mod p56led;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Color {
    pub red: u8,
    pub green: u8,
    pub blue: u8,
}

impl Color {
    pub fn new(red: u8, green: u8, blue: u8) -> Self {
        Color {
            red: red,
            green: green,
            blue: blue,
        }
    }
}

pub trait Fixture {
    fn as_any(&mut self) -> &mut dyn Any;
    fn tick(&mut self, dmx: &mut dyn DMXEmitter);
}

pub trait RGBFixture: Fixture {
    fn color(&self) -> Color;
    fn set_color(&mut self, color: Color);
    fn toggle_color(&self) -> Color;
    fn set_toggle_color(&mut self, toggle_color: Color);
    fn intensity(&self) -> f32;
    fn set_intensity(&mut self, intensity: f32);

    fn toggle_speed(&self) -> Duration;
    fn set_toggle_speed(&mut self, toggle_speed: Duration);
    fn toggle(&mut self);

    fn strobe_speed(&self) -> Duration;
    fn set_strobe_speed(&mut self, strobe_speed: Duration);
    fn strobe(&mut self);

    fn set_automatic(&mut self, automatic: bool);
}

pub trait SwitchFixture: Fixture {
    fn state(&self, index: usize) -> bool;
    fn set_state(&mut self, index: usize, state: bool);
    fn toggle(&mut self, index: usize);
}

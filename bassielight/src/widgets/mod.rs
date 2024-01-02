/*
 * Copyright (c) 2023-2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

use crate::devices::launchpad_mini::LaunchpadMini;

pub mod rgb;
pub mod switch;

#[derive(Clone, Copy)]
pub struct Rect {
    x: i32,
    y: i32,
    width: i32,
    height: i32,
}

pub trait Widget {
    fn rect(&self) -> Rect;
    fn button_press(&mut self, x: i32, y: i32);
    fn button_release(&mut self, x: i32, y: i32);
    fn toggle_button_press(&mut self);
    fn strobe_button_press(&mut self);
    fn draw(&self, launchpad: &mut LaunchpadMini);
}

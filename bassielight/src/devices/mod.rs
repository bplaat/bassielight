/*
 * Copyright (c) 2023-2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

pub mod launchpad_mini;
pub mod usb_dmx;

pub trait DMXEmitter {
    fn read(&mut self, addr: usize) -> u8;
    fn write(&mut self, addr: usize, value: u8);
}

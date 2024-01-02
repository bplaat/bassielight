/*
 * Copyright (c) 2023-2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

use crate::devices::DMXEmitter;
use crate::fixtures::{Fixture, SwitchFixture};
use std::any::Any;

pub struct MultiDimMKII {
    addr: usize,

    state: [bool; 4],
}

impl MultiDimMKII {
    pub fn new(addr: usize) -> Self {
        Self {
            addr: addr,
            state: [false; 4],
        }
    }
}

impl Fixture for MultiDimMKII {
    fn as_any(&mut self) -> &mut dyn Any {
        self
    }

    fn tick(&mut self, dmx: &mut dyn DMXEmitter) {
        for i in 0..self.state.len() {
            dmx.write(self.addr + i, if self.state[i] { 255 } else { 0 });
        }
    }
}

impl SwitchFixture for MultiDimMKII {
    fn state(&self, index: usize) -> bool {
        self.state[index]
    }
    fn set_state(&mut self, index: usize, state: bool) {
        self.state[index] = state;
    }
    fn toggle(&mut self, index: usize) {
        self.state[index] = !self.state[index];
    }
}

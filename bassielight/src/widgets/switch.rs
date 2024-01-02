/*
 * Copyright (c) 2023-2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

use crate::devices::launchpad_mini::{LaunchpadMini, LaunchpadMiniColor};
use crate::fixtures::SwitchFixture;
use crate::widgets::{Rect, Widget};
use std::cell::RefCell;
use std::rc::Rc;

pub struct SwitchWidget {
    x: i32,
    y: i32,
    fixtures: Vec<Rc<RefCell<dyn SwitchFixture>>>,
    pressed: [bool; 4],
}

impl SwitchWidget {
    pub fn new(x: i32, y: i32, fixtures: Vec<Rc<RefCell<dyn SwitchFixture>>>) -> Self {
        Self {
            x: x,
            y: y,
            fixtures: fixtures,
            pressed: [false; 4],
        }
    }
}

impl Widget for SwitchWidget {
    fn rect(&self) -> Rect {
        Rect {
            x: self.x,
            y: self.y,
            width: 8,
            height: 1,
        }
    }

    fn button_press(&mut self, x: i32, _y: i32) {
        for i in 0..4 {
            if x == i * 2 {
                for fixture in &self.fixtures {
                    fixture.borrow_mut().toggle(i as usize);
                }
            }
            if x == i * 2 + 1 {
                self.pressed[i as usize] = true;
                for fixture in &self.fixtures {
                    fixture.borrow_mut().set_state(i as usize, true);
                }
            }
        }
    }

    fn button_release(&mut self, x: i32, _y: i32) {
        for i in 0..4 {
            if x == i * 2 + 1 {
                self.pressed[i as usize] = false;
                for fixture in &self.fixtures {
                    fixture.borrow_mut().set_state(i as usize, false);
                }
            }
        }
    }

    fn toggle_button_press(&mut self) {}
    fn strobe_button_press(&mut self) {}

    fn draw(&self, launchpad: &mut LaunchpadMini) {
        let first_fixture = self.fixtures[0].borrow();
        for i in 0..4 {
            launchpad.write(
                self.x + i * 2,
                self.y,
                if first_fixture.state(i as usize) {
                    LaunchpadMiniColor::Orange
                } else {
                    LaunchpadMiniColor::Yellow
                },
                format!("Label\nToggle"),
            );

            launchpad.write(
                self.x + i * 2 + 1,
                self.y,
                if self.pressed[i as usize] {
                    LaunchpadMiniColor::Orange
                } else {
                    LaunchpadMiniColor::Yellow
                },
                format!("Label\nPush"),
            );
        }
    }
}

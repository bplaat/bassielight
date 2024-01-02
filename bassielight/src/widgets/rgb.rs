/*
 * Copyright (c) 2023-2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

use crate::consts::SPEEDS;
use crate::devices::launchpad_mini::{LaunchpadMini, LaunchpadMiniColor};
use crate::fixtures::{Color, RGBFixture};
use crate::widgets::{Rect, Widget};
use std::cell::RefCell;
use std::rc::Rc;
use std::time::Duration;

pub const COLORS: [(&str, Color); 1] = [
    (
        "Off",
        Color {
            red: 0,
            green: 0,
            blue: 0,
        },
    ),
    // { name: 'Blue', red: 0, green: 0, blue: 170 },
    // { name: 'Green', red: 0, green: 170, blue: 0 },
    // { name: 'Cyan', red: 0, green: 170, blue: 170 },
    // { name: 'Red', red: 170, green: 0, blue: 0 },
    // { name: 'Magenta', red: 170, green: 0, blue: 170 },
    // { name: 'Brown', red: 170, green: 85, blue: 0 },
    // { name: 'Light Gray', red: 170, green: 170, blue: 170 },
    // { name: 'Dark Gray', red: 85, green: 85, blue: 85 },
    // { name: 'Light Blue', red: 85, green: 85, blue: 255 },
    // { name: 'Light Green', red: 85, green: 255, blue: 85 },
    // { name: 'Light Cyan', red: 85, green: 255, blue: 255 },
    // { name: 'Light Red', red: 255, green: 85, blue: 85 },
    // { name: 'Light Magenta', red: 255, green: 85, blue: 255 },
    // { name: 'Yellow', red: 255, green: 255, blue: 85 },
    // { name: 'White', red: 255, green: 255, blue: 255 },
];

pub const SPEEDS: [Duration; 8] = [
    Duration::from_millis(0),
    Duration::from_millis(1000),
    Duration::from_millis(750),
    Duration::from_millis(500),
    Duration::from_millis(250),
    Duration::from_millis(100),
    Duration::from_millis(50),
    Duration::from_millis(22),
];

pub struct RGBWidget {
    x: i32,
    y: i32,
    fixtures: Vec<Rc<RefCell<dyn RGBFixture>>>,
}

impl RGBWidget {
    pub fn new(x: i32, y: i32, fixtures: Vec<Rc<RefCell<dyn RGBFixture>>>) -> Self {
        Self {
            x: x,
            y: y,
            fixtures: fixtures,
        }
    }
}

impl Widget for RGBWidget {
    fn rect(&self) -> Rect {
        Rect {
            x: self.x,
            y: self.y,
            width: 8,
            height: 7,
        }
    }

    fn button_press(&mut self, x: i32, _y: i32) {
        // // Color
        // if (y === 0 || y === 1) {
        //     if (COLORS[y === 1 ? x + 8 : x]) {
        //         for (const fixture of this.fixtures) {
        //             fixture.color = COLORS[y === 1 ? x + 8 : x];
        //         }
        //     }
        // }

        // // Toggle color
        // if (y === 2 || y === 3) {
        //     if (COLORS[y === 3 ? x + 8 : x]) {
        //         for (const fixture of this.fixtures) {
        //             fixture.toggleColor = COLORS[y === 3 ? x + 8 : x];
        //         }
        //     }
        // }

        // // Intensity
        // if (y === 4) {
        //     for (const fixture of this.fixtures) {
        //         fixture.intensity = (x + 1) / 8;
        //     }
        // }

        // // Toggle speed
        // if (y === 5) {
        //     for (const fixture of this.fixtures) {
        //         if (SPEEDS[x] === 0) fixture.isToggle = false;
        //         fixture.toggleSpeed = SPEEDS[x];
        //     }
        // }

        // // Strobe speed
        // if (y === 6) {
        //     for (const fixture of this.fixtures) {
        //         if (SPEEDS[x] === 0) fixture.isStrobe = false;
        //         fixture.strobeSpeed = SPEEDS[x];
        //     }
        // }
    }

    fn button_release(&mut self, x: i32, _y: i32) {
        // // Color
        // if (y === 0 || y === 1) {
        //     if (COLORS[y === 1 ? x + 8 : x]) {
        //         for (const fixture of this.fixtures) {
        //             fixture.color = COLORS[y === 1 ? x + 8 : x];
        //         }
        //     }
        // }

        // // Toggle color
        // if (y === 2 || y === 3) {
        //     if (COLORS[y === 3 ? x + 8 : x]) {
        //         for (const fixture of this.fixtures) {
        //             fixture.toggleColor = COLORS[y === 3 ? x + 8 : x];
        //         }
        //     }
        // }

        // // Intensity
        // if (y === 4) {
        //     for (const fixture of this.fixtures) {
        //         fixture.intensity = (x + 1) / 8;
        //     }
        // }

        // // Toggle speed
        // if (y === 5) {
        //     for (const fixture of this.fixtures) {
        //         if (SPEEDS[x] === 0) fixture.isToggle = false;
        //         fixture.toggleSpeed = SPEEDS[x];
        //     }
        // }

        // // Strobe speed
        // if (y === 6) {
        //     for (const fixture of this.fixtures) {
        //         if (SPEEDS[x] === 0) fixture.isStrobe = false;
        //         fixture.strobeSpeed = SPEEDS[x];
        //     }
        // }
    }

    fn toggle_button_press(&mut self) {
        for fixture in &self.fixtures {
            fixture.borrow_mut().toggle();
        }
    }

    fn strobe_button_press(&mut self) {
        for fixture in &self.fixtures {
            fixture.borrow_mut().strobe();
        }
    }

    fn draw(&self, launchpad: &mut LaunchpadMini) {
        let first_fixture = self.fixtures[0].borrow();

        // Color

        for i in 0..8 {
            launchpad.write(
                self.x + i,
                self.y + 4,
                if (i + 1) as f32 / 8.0 == first_fixture.intensity() {
                    LaunchpadMiniColor::Orange
                } else {
                    LaunchpadMiniColor::Yellow
                },
                format!("Intensity\n{:.0}%", ((i + 1) as f32 / 8.0) * 100.0),
            );
        }

        const color = this.fixtures[0].color;
        for (let i = 0; i < COLORS.length; i++) {
            if (COLORS[i]) {
                launchpad.write(
                    this.x + (i >= 8 ? i - 8 : i),
                    this.y + (i >= 8 ? 1 : 0),
                    color.red === COLORS[i].red && color.green === COLORS[i].green && color.blue === COLORS[i].blue
                        ? 2
                        : 1,
                    `Color\n${COLORS[i].name}`
                );
            }
        }

        // // Toggle color
        // const toggleColor = this.fixtures[0].toggleColor;
        // for (let i = 0; i < COLORS.length; i++) {
        //     if (COLORS[i]) {
        //         launchpad.write(
        //             this.x + (i >= 8 ? i - 8 : i),
        //             this.y + (i >= 8 ? 3 : 2),
        //             toggleColor.red === COLORS[i].red && toggleColor.green === COLORS[i].green && toggleColor.blue === COLORS[i].blue
        //                 ? 2
        //                 : 1,
        //             `Toggle color\n${COLORS[i].name}`
        //         );
        //     }
        // }

        // Intensity
        for i in 0..8 {
            launchpad.write(
                self.x + i,
                self.y + 4,
                if (i + 1) as f32 / 8.0 == first_fixture.intensity() {
                    LaunchpadMiniColor::Orange
                } else {
                    LaunchpadMiniColor::Yellow
                },
                format!("Intensity\n{:.0}%", ((i + 1) as f32 / 8.0) * 100.0),
            );
        }

        // Toggle speed
        for i in 0..8 {
            launchpad.write(
                self.x + i,
                self.y + 5,
                if SPEEDS[i as usize] == first_fixture.toggle_speed() {
                    LaunchpadMiniColor::Orange
                } else {
                    LaunchpadMiniColor::Yellow
                },
                format!("Toggle speed\n{} ms", SPEEDS[i as usize].as_millis()),
            );
        }

        // Strobe speed
        for i in 0..8 {
            launchpad.write(
                self.x + i,
                self.y + 6,
                if SPEEDS[i as usize] == first_fixture.strobe_speed() {
                    LaunchpadMiniColor::Orange
                } else {
                    LaunchpadMiniColor::Yellow
                },
                format!("Strobe speed\n{} ms", SPEEDS[i as usize].as_millis()),
            );
        }
    }
}

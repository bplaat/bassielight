/*
 * Copyright (c) 2023-2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

pub enum LaunchpadMiniColor {
    Off,
    Yellow,
    Orange,
}

pub struct LaunchpadMini {}

impl LaunchpadMini {
    pub fn write(&mut self, x: i32, y: i32, color: LaunchpadMiniColor, label: String) {}
}

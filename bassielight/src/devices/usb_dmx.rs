/*
 * Copyright (c) 2023-2024, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

use crate::devices::DMXEmitter;
// use rusb::{UsbContext, ControlTransferDirection, ControlTransferType, DeviceHandle};

pub struct USBDMX {
    // device: Option<DeviceHandle<UsbContext>>,
    dmx: [u8; 512],
}

impl USBDMX {
    pub fn new() -> Self {
        Self {
            // device: None,
            dmx: [0; 512],
        }
    }

    // pub fn connect(&mut self) -> Result<(), rusb::Error> {
    //     // Find DMX USB device
    //     let context = UsbContext::new()?;
    //     let devices = context.devices()?;

    //     for dev in devices.iter() {
    //         let device_desc = dev.device_descriptor()?;
    //         if device_desc.vendor_id() == 0x0403 && device_desc.product_id() == 0x6001 {
    //             self.device = Some(dev.open()?);
    //             break;
    //         }
    //     }
    //     if self.device.is_none() {
    //         return Err(rusb::Error::NotFound);
    //     }

    //     self.device.claim_interface(0)?;

    //     // Set baud rate to 250000
    //     self.device
    //         .write_control(ControlTransferType::Vendor, 3, 0x0C, 0, &[])?;

    //     Ok(())
    // }
}

impl DMXEmitter for USBDMX {
    fn read(&mut self, addr: usize) -> u8 {
        self.dmx[addr]
    }

    fn write(&mut self, addr: usize, value: u8) {
        self.dmx[addr] = value;
    }

    // fn send(&mut self) -> Result<(), rusb::Error> {
    //     self.device.write_control(
    //         ControlTransferType::Vendor,
    //         4,
    //         0x08 | (2 << 11) | (0 << 8) | (1 << 14),
    //         0,
    //         &[],
    //     )?;

    //     self.device.write_control(
    //         ControlTransferType::Vendor,
    //         4,
    //         0x08 | (2 << 11) | (0 << 8) | (0 << 14),
    //         0,
    //         &[],
    //     )?;

    //     self.device.write_bulk(0x02, &self.dmx)?;
    // }
}

/*
 * Copyright (c) 2023, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

import { readFileSync } from 'fs';
import midi from 'midi';
import { webusb } from 'usb';

const COLORS = [
    { name: 'Off', red: 0, green: 0, blue: 0 },
    { name: 'Red', red: 255, green: 0, blue: 0 },
    { name: 'Yellow', red: 255, green: 255, blue: 0 },
    { name: 'Orange', red: 255, green: 128, blue: 0 },
    { name: 'Green', red: 0, green: 255, blue: 0 },
    { name: 'Blue', red: 0, green: 0, blue: 255 },
    { name: 'Cyan', red: 0, green: 255, blue: 255 },
    { name: 'Pink', red: 255, green: 0, blue: 255 },
    { name: 'White', red: 255, green: 255, blue: 255 },
];

const SPEEDS = [0, 10, 50, 100, 250, 500, 750, 1000];

class UsbDmx {
    async connect() {
        this.device = await webusb.requestDevice({ filters: [{ vendorId: 0x0403, productId: 0x6001 }] });
        if (!this.device) {
            console.log(`[ERROR] Can't connect to the USB DMX512 connector`);
            process.exit(1);
        }
        await this.device.open();
        console.log(`[INFO] Connected to the USB DMX512 connector`);

        await this.device.claimInterface(0);
        await this.device.controlTransferOut({ requestType: 'vendor', recipient: 'device', request: 3, value: 12, index: 0, });
    }

    async _send() {
        await this.device.controlTransferOut({ requestType: 'vendor', recipient: 'device', request: 4, value: 8 | (2 << 11) | (0 << 8) | (1 << 14), index: 0, });
        await this.device.controlTransferOut({ requestType: 'vendor', recipient: 'device', request: 4, value: 8 | (2 << 11) | (0 << 8) | (0 << 14), index: 0, });
        await this.device.transferOut(0x02, this.onDmx());
        setTimeout(this._send.bind(this), 22.4);
    }

    start() {
        this._send();
    }
}

class LaunchpadMini {
    constructor() {
        this.input = new midi.Input();
        this._openFirst(this.input);
        this.input.on('message', (dt, message) => this._onMessage(message));
        this.output = new midi.Output();
        this._openFirst(this.output);
        console.log(`[INFO] Connected to the Launchpad Mini`);
    }

    _openFirst(port) {
        for (let i = 0; i < port.getPortCount(); i++) {
            const portName = port.getPortName(i);
            if (portName.includes('Launchpad Mini')) {
                port.openPort(i);
                return;
            }
        }
        console.log(`[ERROR] Can't connect to the Launchpad Mini`);
        process.exit(1);
    }

    _onMessage(message) {
        if (message[0] == 0x90) {
            if (message[2] != 0) {
                this.onButtonPress(message[1] % 16, Math.floor(message[1] / 16));
            } else {
                this.onButtonRelease(message[1] % 16, Math.floor(message[1] / 16));
            }
        }
        if (message[0] == 0xb0) {
            if (message[2] != 0) {
                this.onButtonPress(message[1] - 104, -1);
            } else {
                this.onButtonRelease(message[1] - 104, -1);
            }
        }
    }

    write(x, y, color) {
        if (color == 0)
            this.output.sendMessage([y == -1 ? 0xb0 : 0x90, (y == -1 ? 104 : y * 16) + x, (0 << 4) | (0b01 << 2) | 0]);
        if (color == 1)
            this.output.sendMessage([y == -1 ? 0xb0 : 0x90, (y == -1 ? 104 : y * 16) + x, (2 << 4) | (0b01 << 2) | 2]);
        if (color == 2)
            this.output.sendMessage([y == -1 ? 0xb0 : 0x90, (y == -1 ? 104 : y * 16) + x, (0 << 4) | (0b01 << 2) | 2]);
    }

    close() {
        this.input.closePort();
        this.output.closePort();
    }
}

class P56LED {
    constructor(name, addr) {
        this.type = 'rgb';
        this.name = name;
        this.addr = addr;

        this.color = { red: 0, green: 0, blue: 0 };
        this.toggle = { red: 0, green: 0, blue: 0 };
        this.intensity = 1;

        this.toggleSpeed = 0;
        this.toggleTime = Date.now();
        this.isToggle = false;

        this.strobeSpeed = 0;
        this.strobeTime = Date.now();
        this.isStrobe = false;
    }

    automatic(dmx) {
        const CHANNEL_MODE = 5;
        dmx[this.addr + CHANNEL_MODE] = 255;
    }

    tick(dmx) {
        const CHANNEL_RED = 0;
        const CHANNEL_GREEN = 1;
        const CHANNEL_BLUE = 2;

        if (Date.now() - this.toggleTime >= this.toggleSpeed) {
            this.toggleTime = Date.now();
            this.isToggle = !this.isToggle;
        }
        if (Date.now() - this.strobeTime >= this.strobeSpeed) {
            this.strobeTime = Date.now();
            this.isStrobe = !this.isStrobe;
        }

        if (
            (this.color.red == 0 && this.color.green == 0 && this.color.blue == 0) ||
            (this.strobeSpeed != 0 && this.isStrobe)
        ) {
            dmx[this.addr + CHANNEL_RED] = 0;
            dmx[this.addr + CHANNEL_GREEN] = 0;
            dmx[this.addr + CHANNEL_BLUE] = 0;
            return;
        }

        if (this.toggleSpeed != 0 && this.isToggle) {
            dmx[this.addr + CHANNEL_RED] = this.toggle.red * this.intensity;
            dmx[this.addr + CHANNEL_GREEN] = this.toggle.green * this.intensity;
            dmx[this.addr + CHANNEL_BLUE] = this.toggle.blue * this.intensity;
        } else {
            dmx[this.addr + CHANNEL_RED] = this.color.red * this.intensity;
            dmx[this.addr + CHANNEL_GREEN] = this.color.green * this.intensity;
            dmx[this.addr + CHANNEL_BLUE] = this.color.blue * this.intensity;
        }
    }
}

class MultiDimMKII {
    constructor(name, addr) {
        this.type = 'multidim';
        this.name = name;
        this.addr = addr;
        this.state = [false, false, false, false];
    }

    tick(dmx) {
        dmx[this.addr + 0] = this.state[0] ? 255 : 0;
        dmx[this.addr + 1] = this.state[1] ? 255 : 0;
        dmx[this.addr + 2] = this.state[2] ? 255 : 0;
        dmx[this.addr + 3] = this.state[3] ? 255 : 0;
    }
}

class RGBWidget {
    constructor(fixtures, x, y) {
        this.fixtures = fixtures;
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 7;
        this.pressed = [false, false, false];
    }

    onButtonPress(x, y) {
        // Color
        if (y == 0 || y == 1) {
            if (COLORS[y == 1 ? x + 8 : x])
                for (const fixture of this.fixtures)
                    fixture.color = COLORS[y == 1 ? x + 8 : x];
        }

        // Toggle color
        if (y == 2 || y == 3) {
            if (COLORS[y == 3 ? x + 8 : x])
                for (const fixture of this.fixtures)
                    fixture.toggle = COLORS[y == 3 ? x + 8 : x];
        }

        // Intensity
        if (y == 4) {
            for (const fixture of this.fixtures)
                fixture.intensity = (x + 1) / 8;
        }

        // Toggle speed
        if (y == 5) {
            for (const fixture of this.fixtures)
                fixture.toggleSpeed = SPEEDS[x];
        }

        // Strobe speed
        if (y == 6) {
            for (const fixture of this.fixtures)
                fixture.strobeSpeed = SPEEDS[x];
        }
    }

    onButtonRelease(x, y) { }

    draw(launchpad) {
        // Color
        const color = this.fixtures[0].color;
        for (let i = 0; i < COLORS.length; i++) {
            launchpad.write(this.x + (i >= 8 ? i - 8 : i), this.y + (i >= 8 ? 1 : 0),
                color.red == COLORS[i].red && color.green == COLORS[i].green && color.blue == COLORS[i].blue ? 2 : 1);
        }

        // Toggle color
        const toggle = this.fixtures[0].toggle;
        for (let i = 0; i < COLORS.length; i++) {
            if (COLORS[i])
                launchpad.write(this.x + (i >= 8 ? i - 8 : i), this.y + (i >= 8 ? 3 : 2),
                    toggle.red == COLORS[i].red && toggle.green == COLORS[i].green && toggle.blue == COLORS[i].blue ? 2 : 1);
        }

        // Toggle speed
        const intensity = this.fixtures[0].intensity;
        for (let i = 0; i < SPEEDS.length; i++)
            launchpad.write(this.x + i, this.y + 4, (i + 1) / 8 == intensity ? 2 : 1);

        // Toggle speed
        const toggleSpeed = this.fixtures[0].toggleSpeed;
        for (let i = 0; i < SPEEDS.length; i++)
            launchpad.write(this.x + i, this.y + 5, SPEEDS[i] == toggleSpeed ? 2 : 1);

        // Strobe speed
        const strobeSpeed = this.fixtures[0].strobeSpeed;
        for (let i = 0; i < SPEEDS.length; i++)
            launchpad.write(this.x + i, this.y + 6, SPEEDS[i] == strobeSpeed ? 2 : 1);
    }
}

class SwitchWidget {
    constructor(fixtures, x, y) {
        this.fixtures = fixtures;
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 1;
        this.toggle = [false, false, false, false];
        this.pressed = [false, false, false, false];
    }

    onButtonPress(x, y) {
        const state = this.fixtures[0].state;
        for (let i = 0; i < 4; i++) {
            if (x == i * 2) {
                this.toggle[i] = !state[i];
                for (const fixture of this.fixtures)
                    fixture.state[i] = this.toggle[i];
            }
            if (x == i * 2 + 1) {
                this.pressed[i] = true;
                for (const fixture of this.fixtures)
                    fixture.state[i] = true;
            }
        }
    }

    onButtonRelease(x, y) {
        for (let i = 0; i < 4; i++) {
            if (x == i * 2 + 1) {
                this.toggle[i] = false;
                this.pressed[i] = false;
                for (const fixture of this.fixtures)
                    fixture.state[i] = false;
            }
        }
    }

    draw(launchpad) {
        const state = this.fixtures[0].state;
        for (let i = 0; i < 4; i++) {
            launchpad.write(this.x + i * 2, this.y, this.toggle[i] ? 2 : 1);
            launchpad.write(this.x + i * 2 + 1, this.y, this.pressed[i] ? 2 : 1);
        }
    }
}

const config = JSON.parse(readFileSync('config.json').toString());
console.log(`[INFO] Using ${config.name} config`);

const fixtures = [];
for (const fixture of config.fixtures) {
    if (fixture.type == 'p56led') {
        fixtures.push(new P56LED(fixture.name, fixture.addr));
    } else if (fixture.type == 'multidim_mkii') {
        fixtures.push(new MultiDimMKII(fixture.name, fixture.addr));
    } else {
        console.log(`[ERROR] Unknown fixture type`);
        process.exit(1);
    }
}

const tabs = [];
for (const tab of config.tabs) {
    const widgets = [];
    for (const widget of tab.widgets) {
        const widgetFixtures = [];
        for (const fixtureName of widget.fixtures)
            widgetFixtures.push(fixtures.find(fixture => fixture.name == fixtureName));

        if (widget.type == 'rgb') {
            widgets.push(new RGBWidget(widgetFixtures, widget.x, widget.y));
        } else if (widget.type == 'switch') {
            widgets.push(new SwitchWidget(widgetFixtures, widget.x, widget.y));
        } else {
            console.log(`[ERROR] Unknown widget type`);
            process.exit(1);
        }
    }
    tabs.push({ name: tab.name, label: tab.label, widgets });
}

const dmx = new Uint8Array(512);
let mode = 'everything_off';
let currentTab = tabs[0];

// Start launchpad
const launchpad = new LaunchpadMini();
launchpad.onButtonPress = (x, y) => {
    // Tabs selector
    if (y == -1 && x < tabs.length) {
        currentTab = tabs[x];
        return;
    }

    // Mode modes
    if (x == 8) {
        if (y == 0) mode = 'everything_off';
        if (y == 1) mode = 'automatic';
        if (y == 2) mode = 'manual';
        return;
    }

    // Current tab widgets
    for (const widget of currentTab.widgets) {
        if (x >= widget.x && y >= widget.y && x < widget.x + widget.width && y < widget.y + widget.height)
            widget.onButtonPress(x - widget.x, y - widget.y);
    }
};
launchpad.onButtonRelease = (x, y) => {
    // Current tab widgets
    for (const widget of currentTab.widgets)
        if (x >= widget.x && y >= widget.y && x < widget.x + widget.width && y < widget.y + widget.height)
            widget.onButtonRelease(x - widget.x, y - widget.y);
};

// Clear launchpad
for (let y = -1; y < 8; y++)
    for (let x = 0; x < 9; x++)
        launchpad.write(x, y, 0);

// Start USB DMX device
const usbDmx = new UsbDmx();
await usbDmx.connect();
usbDmx.onDmx = () => {
    // Draw launchpad
    launchpad.write(8, 0, mode == 'everything_off' ? 2 : 1);
    launchpad.write(8, 1, mode == 'automatic' ? 2 : 1);
    launchpad.write(8, 2, mode == 'manual' ? 2 : 1);

    if (mode == 'manual') {
        for (let i = 0; i < tabs.length; i++)
            launchpad.write(i, -1, tabs[i] == currentTab ? 2 : 1);
        for (const widget of currentTab.widgets)
            widget.draw(launchpad);
    } else {
        for (let y = -1; y < 8; y++)
            for (let x = 0; x < 8; x++)
                launchpad.write(x, y, 0);
    }

    // Write DMX
    if (mode == 'everything_off') {
        return new Uint8Array(512);
    }

    if (mode == 'automatic') {
        const dmx = new Uint8Array(512);
        for (const fixture of fixtures)
            if (fixture.type == 'rgb')
                fixture.automatic(dmx);
        return dmx;
    }

    if (mode == 'manual') {
        for (const fixture of fixtures)
            fixture.tick(dmx);
        return dmx;
    }
};
usbDmx.start();

/*
 * Copyright (c) 2023, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

import { readFile } from 'fs/promises';
import LaunchpadMini from './devices/LaunchpadMini.js';
import UsbDmx from './devices/UsbDmx.js';
import MultiDimMKII from './fixtures/MultiDimMKII.js';
import P56LED from './fixtures/P56LED.js';
import RGBWidget from './widgets/RGBWidget.js';
import SwitchWidget from './widgets/SwitchWidget.js';
import log from './log.js';
import { startServer, broadcast } from './server.js';

function createSetup(config) {
    // Create fixtures from config
    const fixtures = [];
    for (const fixture of config.fixtures) {
        if (fixture.type === 'p56led') {
            fixtures.push(new P56LED(fixture.name, fixture.addr, fixture.options));
        } else if (fixture.type === 'multidim_mkii') {
            fixtures.push(new MultiDimMKII(fixture.name, fixture.addr, fixture.options));
        } else {
            log.error('Unknown fixture type');
        }
    }

    // Create tabs from config
    const tabs = [];
    for (const tab of config.tabs) {
        const widgets = [];
        for (const widget of tab.widgets) {
            const widgetFixtures = [];
            for (const fixtureName of widget.fixtures) {
                widgetFixtures.push(fixtures.find((fixture) => fixture.name === fixtureName));
            }

            if (widget.type === 'rgb') {
                widgets.push(new RGBWidget(widgetFixtures, widget.x, widget.y));
            } else if (widget.type === 'switch') {
                widgets.push(new SwitchWidget(widgetFixtures, widget.x, widget.y));
            } else {
                log.error('Unknown widget type');
            }
        }
        tabs.push({ name: tab.name, label: tab.label, widgets });
    }

    return { fixtures, tabs };
}

const config = JSON.parse(await readFile('config.json', { encoding: 'utf-8' }));
log.info(`Using ${config.name} config by ${config.author}`);
const { fixtures, tabs } = createSetup(config);

const dmx = new Uint8Array(512);
let mode = 'everything_off';
let currentTab = tabs[0];

// Start launchpad
const launchpad = new LaunchpadMini();
launchpad.connect();
launchpad.on('buttonPress', ({ x, y }) => {
    // Mode modes
    if (x === 8) {
        if (y === 0) mode = 'everything_off';
        if (y === 1) mode = 'automatic';
        if (y === 2) mode = 'manual';
        return;
    }

    if (mode === 'manual') {
        // Tabs selector
        if (y === -1 && x < tabs.length) {
            currentTab = tabs[x];
            return;
        }

        // Current tab widgets
        for (const widget of currentTab.widgets) {
            if (x >= widget.x && y >= widget.y && x < widget.x + widget.width && y < widget.y + widget.height) {
                widget.emit('buttonPress', { x: x - widget.x, y: y - widget.y });
            }
        }
    }
});
launchpad.on('buttonRelease', ({ x, y }) => {
    if (mode === 'manual') {
        // Current tab widgets
        for (const widget of currentTab.widgets) {
            if (x >= widget.x && y >= widget.y && x < widget.x + widget.width && y < widget.y + widget.height) {
                widget.emit('buttonRelease', { x: x - widget.x, y: y - widget.y });
            }
        }
    }
});

// Clear launchpad
for (let y = -1; y < 8; y++) for (let x = 0; x < 9; x++) launchpad.write(x, y, 0);

// Start USB DMX device
const usbDmx = new UsbDmx();
await usbDmx.connect();
usbDmx.on('dmxRequest', () => {
    // Draw launchpad
    launchpad.write(8, 0, mode === 'everything_off' ? 2 : 1, 'Everything Off');
    launchpad.write(8, 1, mode === 'automatic' ? 2 : 1, 'Automatic');
    launchpad.write(8, 2, mode === 'manual' ? 2 : 1, 'Manual');
    if (mode === 'manual') {
        for (let i = 0; i < tabs.length; i++) {
            launchpad.write(i, -1, tabs[i] === currentTab ? 2 : 1, tabs[i].label);
        }

        for (const widget of currentTab.widgets) {
            widget.draw(launchpad);
        }
    } else {
        for (let y = -1; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                launchpad.write(x, y, 0);
            }
        }
    }

    // Broadcast new launchpad board
    broadcast('board', launchpad.buffer);

    // Tick fixtures and write DMX
    if (mode === 'everything_off') {
        usbDmx.dmx = new Uint8Array(512);
        return;
    }

    if (mode === 'automatic') {
        const dmx = new Uint8Array(512);
        for (const fixture of fixtures) {
            if (fixture.type === 'rgb') {
                fixture.automatic(dmx);
            }
        }
        usbDmx.dmx = dmx;
        return;
    }

    if (mode === 'manual') {
        for (const fixture of fixtures) {
            fixture.tick(dmx);
        }
        usbDmx.dmx = dmx;
        return;
    }
});
usbDmx.startSending();

// Start web GUI server
startServer(launchpad);

/*
 * Copyright (c) 2023, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

import { EventEmitter } from 'events';
import midi from 'midi';
import log from '../log.js';

export default class LaunchpadMini extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
        this.buffer = {
            colors: new Uint8Array(9 * 9),
            labels: Array(9 * 9).fill(null),
        };
    }

    connect() {
        this.input = new midi.Input();
        if (!this._openFirst(this.input)) {
            return false;
        }
        this.input.on('message', (dt, message) => this._onMessage(message));
        this.output = new midi.Output();
        if (!this._openFirst(this.output)) {
            return false;
        }
        this.connected = true;
        log.info('Connected to the Launchpad Mini');
        return true;
    }

    _openFirst(port) {
        for (let i = 0; i < port.getPortCount(); i++) {
            const portName = port.getPortName(i);
            if (portName.includes('Launchpad Mini')) {
                port.openPort(i);
                return true;
            }
        }
        return false;
    }

    _onMessage(message) {
        if (message[0] === 0x90) {
            if (message[2] !== 0) {
                this.emit('buttonPress', { x: message[1] % 16, y: Math.floor(message[1] / 16) });
            } else {
                this.emit('buttonRelease', { x: message[1] % 16, y: Math.floor(message[1] / 16) });
            }
        }
        if (message[0] === 0xb0) {
            if (message[2] !== 0) {
                this.emit('buttonPress', { x: message[1] - 104, y: -1 });
            } else {
                this.emit('buttonRelease', { x: message[1] - 104, y: -1 });
            }
        }
    }

    write(x, y, color, label = null) {
        const bufferOffset = (y + 1) * 9 + x;
        this.buffer.colors[bufferOffset] = color;
        this.buffer.labels[bufferOffset] = label;

        if (this.connected) {
            let colorByte;
            if (color === 0) colorByte = (0 << 4) | (0b01 << 2) | 0; // Off
            if (color === 1) colorByte = (2 << 4) | (0b01 << 2) | 2; // Yellow
            if (color === 2) colorByte = (0 << 4) | (0b01 << 2) | 2; // Red
            this.output.sendMessage([y === -1 ? 0xb0 : 0x90, (y === -1 ? 104 : y * 16) + x, colorByte]);
        }
    }
}

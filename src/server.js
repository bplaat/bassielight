/*
 * Copyright (c) 2023, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

import { readFile } from 'fs/promises';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { SERVER_PORT } from './consts.js';
import open from './open.js';
import log from './log.js';

function mime(filePath) {
    const ext = filePath.split('.').at(-1);
    if (ext === 'html') return 'text/html';
    if (ext === 'css') return 'text/css';
    if (ext === 'js') return 'text/javascript';
    if (ext === 'json') return 'application/json';
    if (ext === 'png') return 'image/png';
    if (ext === 'ico') return 'image/x-icon';
    if (ext === 'svg') return 'image/svg+xml';
    return null;
}

let clients = [];
export function broadcast(type, data) {
    for (const client of clients) {
        client.send(JSON.stringify({ type, data }));
    }
}

export function startServer(launchpad) {
    const wss = new WebSocketServer({ noServer: true });
    wss.on('connection', function (ws) {
        launchpad.colors.dirty = true;
        launchpad.labels.dirty = true;
        clients.push(ws);
        ws.on('message', (message) => {
            const { type, data } = JSON.parse(message);
            if (type === 'button_press') {
                launchpad.emit('buttonPress', { x: data.x, y: data.y });
            }
            if (type === 'button_release') {
                launchpad.emit('buttonRelease', { x: data.x, y: data.y });
            }
        });
        ws.on('error', log.error);
        ws.on('close', () => {
            clients = clients.filter((client) => client !== ws);
        });
    });

    const server = createServer(async (req, res) => {
        const url = new URL(req.url, `http://localhost:${SERVER_PORT}/`);
        log.info(`${req.method} ${url.pathname}`);

        try {
            let filePath = `web${url.pathname}`;
            if (filePath.endsWith('/')) filePath += 'index.html';
            const contents = await readFile(filePath);
            res.writeHead(200, { 'Content-Type': mime(filePath) });
            res.end(contents);
        } catch (e) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        }
    });

    server.on('upgrade', function upgrade(req, socket, head) {
        const url = new URL(req.url, `http://localhost:${SERVER_PORT}/`);
        log.info(`${req.method} ${url.pathname}`);

        if (url.pathname === '/ws') {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        } else {
            socket.destroy();
        }
    });

    server.listen(SERVER_PORT, () => {
        log.info(`Server is running on: http://localhost:${SERVER_PORT}/`);
        open(`http://localhost:${SERVER_PORT}/`);
    });
}

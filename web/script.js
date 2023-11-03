/*
 * Copyright (c) 2023, Bastiaan van der Plaat <bastiaan.v.d.plaat@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

const openPage = document.getElementById('open-page');
const boardPage = document.getElementById('board-page');
const boardContainer = document.getElementById('board-container');
let boardButtons = [];

let ws;
function connect() {
    ws = new WebSocket(`ws://${location.host}/ws`);
    ws.onopen = () => {
        openPage.classList.add('is-hidden');
        boardPage.classList.remove('is-hidden');
    };
    ws.onmessage = (event) => {
        const { type, data } = JSON.parse(event.data);
        if (type === 'board_colors') {
            for (let y = -1; y < 8; y++) {
                for (let x = 0; x < 9; x++) {
                    if (!boardButtons[y + 1][x]) continue;
                    const color = data[(y + 1) * 9 + x];
                    boardButtons[y + 1][x].classList.remove('is-black');
                    boardButtons[y + 1][x].classList.remove('is-yellow');
                    boardButtons[y + 1][x].classList.remove('is-red');
                    if (color === 0) boardButtons[y + 1][x].classList.add('is-black');
                    if (color === 1) boardButtons[y + 1][x].classList.add('is-yellow');
                    if (color === 2) boardButtons[y + 1][x].classList.add('is-red');
                }
            }
        }
        if (type === 'board_labels') {
            for (let y = -1; y < 8; y++) {
                for (let x = 0; x < 9; x++) {
                    if (!boardButtons[y + 1][x]) continue;
                    const label = data[(y + 1) * 9 + x];
                    boardButtons[y + 1][x].innerHTML = label !== null ? label.replace(/\n/g, '<br>') : '';
                }
            }
        }
    };
}

function send(type, data) {
    ws.send(JSON.stringify({ type, data }));
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
function createBoard() {
    const row = document.createElement('div');
    row.className = 'row';
    boardContainer.appendChild(row);

    for (let x = 0; x < 8; x++) {
        const column = document.createElement('div');
        column.className = 'label-horizontal';
        column.textContent = x + 1;
        row.appendChild(column);
    }

    for (let y = -1; y < 8; y++) {
        const row = document.createElement('div');
        row.className = 'row';
        boardContainer.appendChild(row);
        let boardRow = [];
        boardButtons.push(boardRow);

        const width = y === -1 ? 8 : 8 + 1;
        for (let x = 0; x < width; x++) {
            const column = document.createElement('button');
            column.className = `button ${y === -1 || x === 8 ? 'is-round' : ''}`;
            column.setAttribute('data-x', x);
            column.setAttribute('data-y', y);
            column.addEventListener('mousedown', (event) => {
                const target = event.target;
                send('button_press', {
                    x: parseInt(target.getAttribute('data-x')),
                    y: parseInt(target.getAttribute('data-y')),
                });
            });
            column.addEventListener('mouseup', (event) => {
                const target = event.target;
                send('button_release', {
                    x: parseInt(target.getAttribute('data-x')),
                    y: parseInt(target.getAttribute('data-y')),
                });
            });
            row.appendChild(column);
            boardRow.push(column);
        }

        if (y !== -1) {
            const column = document.createElement('div');
            column.className = 'label-vertical';
            column.textContent = LETTERS[y];
            row.appendChild(column);
        }
    }
}

createBoard();
setTimeout(connect, 750);

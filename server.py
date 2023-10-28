#!/usr/bin/env python3
import asyncio
from pyftdi.ftdi import Ftdi
import threading
import time
import websockets

# Connect to USB DMX512 device
ftdi = Ftdi()
try:
    ftdi.open(vendor=0x0403, product=0x6001)
except Ftdi.Error as e:
    print('Failed to open FTDI device:', e)
    exit(1)
ftdi.set_baudrate(250000)

# Send DMX signal loop
dmx = [0] * 512
def sendDMXSignal():
    while True:
        ftdi.set_line_property(8, 2, 'N', True)
        ftdi.set_line_property(8, 2, 'N', None)
        ftdi.write_data([0])
        ftdi.write_data(dmx)
        time.sleep(0.0224)

# Websocket client
async def websocketClient(websocket, path):
    global dmx
    async for message in websocket:
        dmx = message

# Start DMX Thread
thread1 = threading.Thread(target=sendDMXSignal)
thread1.start()

# Start websocket server
wss = websockets.serve(websocketClient, 'localhost', 8080)
asyncio.get_event_loop().run_until_complete(wss)
asyncio.get_event_loop().run_forever()

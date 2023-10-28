#include <stdio.h>
#include <ftdi.h>
#include <unistd.h>

int main() {
    struct ftdi_context c;

    if (ftdi_init(&c) < 0) {
        fprintf(stderr, "ftdi_init failed\n");
        return 1;
    }

    if (ftdi_usb_open(&c, 0x0403, 0x6001) < 0) {
        fprintf(stderr, "ftdi_usb_open failed\n");
        return 1;
    }

    ftdi_set_baudrate(&c, 250000);

    uint8_t dmx[512] = {0};

    int addr = 1;
    dmx[addr + 0] = 255;
    dmx[addr + 1] = 255;
    dmx[addr + 2] = 0;
    dmx[addr + 4] = 128;

    addr = 7;
    dmx[addr + 0] = 0;
    dmx[addr + 1] = 0;
    dmx[addr + 2] = 255;
    dmx[addr + 4] = 128;

    printf("Ready\n");

    for (;;) {
        ftdi_set_line_property2(&c, BITS_8, STOP_BIT_2, NONE, BREAK_ON);
        ftdi_set_line_property2(&c, BITS_8, STOP_BIT_2, NONE, BREAK_OFF);

        ftdi_write_data(&c, dmx, sizeof(dmx));
        usleep(22400);
    }

    ftdi_usb_close(&c);
    ftdi_deinit(&c);
    return 0;
}

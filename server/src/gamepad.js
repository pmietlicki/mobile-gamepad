var config = require('../../config/config');
var uinput = require('uinput');
var fs = require('fs');
var ioctl = require('ioctl');
var Struct = require('struct');

module.exports = class GameController {

    constructor(inputId) {
        this.inputId = inputId;
    }

    disconnect() {
        if (this.fd) {
            ioctl(this.fd, uinput.UI_DEV_DESTROY);
            fs.close(this.fd, err => {
                if (err) {
                    console.error('error to close file', err);
                }
            });
            this.fd = undefined;
        }
        return null;
    }

    connect() {
        console.log('connect gamepad');

        fs.open('/dev/uinput', 'w+', (err, fd) => {
            if (err) {
                console.log(err);
                throw (err);
            }

            this.fd = fd;

            ioctl(this.fd, uinput.UI_SET_EVBIT, uinput.EV_KEY);
            ioctl(this.fd, uinput.UI_SET_KEYBIT, uinput.BTN_A);
            ioctl(this.fd, uinput.UI_SET_KEYBIT, uinput.BTN_B);
            ioctl(this.fd, uinput.UI_SET_KEYBIT, uinput.BTN_X);
            ioctl(this.fd, uinput.UI_SET_KEYBIT, uinput.BTN_Y);
            ioctl(this.fd, uinput.UI_SET_KEYBIT, uinput.BTN_TL);
            ioctl(this.fd, uinput.UI_SET_KEYBIT, uinput.BTN_TR);
            ioctl(this.fd, uinput.UI_SET_KEYBIT, uinput.BTN_TL2);
            ioctl(this.fd, uinput.UI_SET_KEYBIT, uinput.BTN_TR2);
            ioctl(this.fd, uinput.UI_SET_KEYBIT, uinput.BTN_START);
            ioctl(this.fd, uinput.UI_SET_KEYBIT, uinput.BTN_SELECT);
            ioctl(this.fd, uinput.UI_SET_EVBIT, uinput.EV_ABS);
            ioctl(this.fd, uinput.UI_SET_ABSBIT, uinput.ABS_X);
            ioctl(this.fd, uinput.UI_SET_ABSBIT, uinput.ABS_Y);

            var input_id = Struct()
                .word16Ule('bustype')
                .word16Ule('vendor')
                .word16Ule('product')
                .word16Ule('version');

            var uidev = Struct()
                .chars('name', 80)
                .struct('id', input_id)
                .word32Ule('ff_effects_max')
                .word32Ule('absmax', uinput.ABS_CNT)
                .word32Ule('absmin', uinput.ABS_CNT)
                .word32Ule('absfuzz', uinput.ABS_CNT)
                .word32Ule('absflat', uinput.ABS_CNT);

            uidev.allocate();
            var buffer = uidev.buffer();

            // Assurez-vous que config.gamepadName est une chaîne et convertissez-la en Buffer
            const gamepadNameBuffer = Buffer.alloc(80);
            gamepadNameBuffer.write(config.gamepadName);

            uidev.fields.name = gamepadNameBuffer;
            uidev.fields.id.bustype = uinput.BUS_USB;
            uidev.fields.id.vendor = config.vendorId;
            uidev.fields.id.product = config.productId;
            uidev.fields.id.version = config.version;

            uidev.absmax[uinput.ABS_X] = 1023;
            uidev.absmin[uinput.ABS_X] = 0;
            uidev.absfuzz[uinput.ABS_X] = 0;
            uidev.absflat[uinput.ABS_X] = 15;

            uidev.absmax[uinput.ABS_Y] = 1023;
            uidev.absmin[uinput.ABS_Y] = 0;
            uidev.absfuzz[uinput.ABS_Y] = 0;
            uidev.absflat[uinput.ABS_Y] = 15;

            fs.write(fd, buffer, 0, buffer.length, (err, written, buffer) => {
                if (err) {
                    console.log(err);
                    throw (err);
                } else {
                    ioctl(this.fd, uinput.UI_DEV_CREATE);
                }
            });
        });
    }

    sendEvent(event) {
        if (this.fd) {
            var input_event = Struct()
                .struct('time', Struct()
                    .word32Sle('tv_sec')
                    .word32Sle('tv_usec')
                )
                .word16Ule('type')
                .word16Ule('code')
                .word32Sle('value');

            input_event.allocate();
            var ev_buffer = input_event.buffer();
            var ev = input_event.fields;
            ev.type = event.type;
            ev.code = event.code;
            ev.value = event.value;
            ev.time.tv_sec = Math.round(Date.now() / 1000);
            ev.time.tv_usec = Math.round(Date.now() % 1000 * 1000);

            var input_event_end = Struct()
                .struct('time', Struct()
                    .word32Sle('tv_sec')
                    .word32Sle('tv_usec')
                )
                .word16Ule('type')
                .word16Ule('code')
                .word32Sle('value');

            input_event_end.allocate();
            var ev_end_buffer = input_event_end.buffer();
            var ev_end = input_event_end.fields;
            ev_end.type = 0;
            ev_end.code = 0;
            ev_end.value = 0;
            ev_end.time.tv_sec = Math.round(Date.now() / 1000);
            ev_end.time.tv_usec = Math.round(Date.now() % 1000 * 1000);

            try {
                fs.writeSync(this.fd, ev_buffer, 0, ev_buffer.length);
                fs.writeSync(this.fd, ev_end_buffer, 0, ev_end_buffer.length);
            } catch (err) {
                console.error('Error writing to file descriptor:', err);
            }

            return null;
        }
    }

}

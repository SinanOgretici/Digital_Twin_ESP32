const EventEmitter = require('events');

class AdjustableLED extends EventEmitter {
  constructor() {
    super();
    this.brightness = 0; // 0 to 100%
    this.current = 0; // Current in mA
  }

  setBrightness(brightness) {
    this.brightness = brightness;
    this.updateCurrent();
  }

  updateCurrent() {
    // Akım hesaplama (1mA ile 20mA arasında değişecek)
    this.current = 1 + (this.brightness / 100) * 19;
    this.emit('currentChanged', this.current);
  }

  start() {
    setInterval(() => {
      this.emit('data', {
        current: this.current,
        brightness: this.brightness
      });
    }, 500);
  }
}

module.exports = AdjustableLED;
const EventEmitter = require('events');

class Motor extends EventEmitter {
  constructor() {
    super();
    this.voltage = 10; // V
    this.load = 1; // kg or Nm
    this.speed = 1000; // RPM
    this.ambientTemperature = 25; // °C
    this.efficiency = 85; // %
    this.torque = 4; // Nm
    this.frequency = 50; // Hz
    this.current = 0; // mA
    this.intervalId = null;
  }

  // Parametreleri güncelle
  updateParameters(voltage, load, speed, ambientTemperature, efficiency, torque, frequency) {
    this.voltage = voltage || 10;
    this.load = load || 1;
    this.speed = speed || 1000;
    this.ambientTemperature = ambientTemperature || 25;
    this.efficiency = efficiency || 85;
    this.torque = torque || 4;
    this.frequency = frequency || 50;
  }

  // Çekilen akımı hesapla
  calculateCurrent() {
    if (this.voltage === 0 || this.efficiency === 0) {
      this.current = 0;
    } else {
      const power = this.voltage * this.load * this.speed / 1000; // Basit bir örnek hesaplama, W
      const adjustedPower = power / (this.efficiency / 100); // W
      const tempFactor = 1 + (this.ambientTemperature - 25) / 100; // % artış
      this.current = (adjustedPower / this.voltage) * tempFactor; // A
    }
    this.emit('currentChanged', this.current);
  }

  // Motoru başlat
  start(interval = 1000) {
    this.calculateCurrent();
    this.intervalId = setInterval(() => {
      this.calculateCurrent();
    }, interval);
  }

  // Motoru durdur
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

module.exports = Motor;
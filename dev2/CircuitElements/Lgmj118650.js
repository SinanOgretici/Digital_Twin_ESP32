const EventEmitter = require('events');

class LithiumIonBattery extends EventEmitter {
  constructor(maxCapacity) {
    super();
    this.maxCapacity = maxCapacity; // mAh
    this.currentCapacity = 0; // mAh
  }

  // Mevcut kapasiteyi ayarla
  setCurrentCapacity(capacity) {
    this.currentCapacity = Math.min(this.maxCapacity, Math.max(0, capacity));
    this.emit('capacityChanged', this.currentCapacity);
  }

  // Akımı bataryaya ekle
  addCurrent(current, time) {
    const currentAdded = current * time; // Akım (mA) x zaman (saniye) = kapasite (mAh)
    this.currentCapacity = Math.min(this.maxCapacity, this.currentCapacity + currentAdded);
    this.emit('capacityChanged', this.currentCapacity);
  }

  // Akımı bataryadan çıkar
  removeCurrent(current, time) {
    const currentRemoved = current * time; // Akım (mA) x zaman (saniye) = kapasite (mAh)
    this.currentCapacity = Math.max(0, this.currentCapacity - currentRemoved);
    this.emit('capacityChanged', this.currentCapacity);
  }
}

module.exports = LithiumIonBattery;
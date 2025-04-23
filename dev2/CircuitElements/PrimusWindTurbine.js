const EventEmitter = require('events');
const axios = require('axios');

class PrimusWindTurbine extends EventEmitter {
  constructor() {
    super();
    this.productCode = 'AIR-40';
    this.area = 0.0725; // m^2 (örnek - rotor çapı 0.3m, A = πr^2)
    this.efficiency = 0.3; // %30 verimlilik
    this.voltage = 12; // V
    this.windSpeed = 0; // m/s
    this.current = 0; // A
    this.lat = null; // Enlem
    this.lon = null; // Boylam
  }

  // Enlem ve boylamı ayarla
  setCoordinates(lat, lon) {
    this.lat = lat;
    this.lon = lon;
  }

  // Rüzgar hızını API'den al
  async generateWindSpeed() {
    if (this.lat === null || this.lon === null) {
      console.log('Latitude and Longitude must be set before generating wind speed.');
      return;
    }
    try {
      const response = await axios.get(`http://api.weatherapi.com/v1/current.json?key=d6f209f39a7641d5b05120525240705&q=${this.lat},${this.lon}`);
      const windSpeedKph = response.data.current.wind_kph;
      this.windSpeed = (windSpeedKph / 3.6).toFixed(2); // m/s cinsine çevir
    } catch (error) {
      console.error('Error fetching weather data:', error);
      this.windSpeed = 0; // Varsayılan olarak rüzgar hızını 0 yap
    }
  }

  // Üretilen akımı hesapla
  calculateCurrent() {
    const rho = 1.225; // Havanın yoğunluğu (kg/m^3)
    const v = this.windSpeed; // Rüzgar hızı (m/s)
    const P = 0.5 * rho * this.area * Math.pow(v, 3) * this.efficiency; // Güç (W)
    this.current = (P / this.voltage).toFixed(4); // Akım (A)
  }

  // Sensör ölçümünü güncelle
  async updateMeasurement() {
    await this.generateWindSpeed();
    this.calculateCurrent();
    this.emit('data', { windSpeed: this.windSpeed, current: this.current, productCode: this.productCode });
  }

  // Başlatıcı fonksiyon
  start(interval = 1000) {
    this.updateMeasurement();
    setInterval(() => {
      this.updateMeasurement();
    }, interval);
  }
}

module.exports = PrimusWindTurbine;
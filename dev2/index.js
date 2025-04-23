////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//DEVRE NESNELERI ISLEMLERI

const PrimusWindTurbine = require('./CircuitElements/PrimusWindTurbine');
const LithiumIonBattery = require('./CircuitElements/LithiumIonBattery');
const Motor = require('./CircuitElements/12VMotor');
const AdjustableLED = require('./CircuitElements/AdjustableLED');

const windTurbineSensor = new PrimusWindTurbine();
const battery = new LithiumIonBattery(100000);
const motor = new Motor();
const led = new AdjustableLED();


motor.start();
led.start();

windTurbineSensor.on('data', (data) => {
   console.log(`Ürün Kodu: ${data.productCode}, Rüzgar Hızı: ${data.windSpeed} m/s, Üretilen Akım: ${data.current} A`);
   battery.addCurrent(parseFloat(data.current), 1); // mA cinsinden akım ekle, 0.5 saniye
});

motor.on('currentChanged', (current) => {
  console.log(`Motor Akımı: ${current} mA`);
  battery.removeCurrent(current, 1); // Motorun çektiği akımı pil kapasitesinden çıkar, 0.1 saniye boyunca
});

led.on('currentChanged', (current) => {
  console.log(`Led Akımı: ${current} mA`);
  //battery.removeCurrent(current, 1); // LED'in çektiği akımı pil kapasitesinden çıkar, 0.1 saniye boyunca
});

battery.on('capacityChanged', (currentCapacity) => {
  //console.log(`Pil Kapasitesi Güncellendi: ${currentCapacity} mAh`);
  
  		db.run(`UPDATE DEVICES SET BATTERY_STATUS = ?`, 
		[currentCapacity], 
		function(err) {
			if (err) {
				console.error('Batarya durumu güncellenemedi:', err.message);

			} else {
				//console.log('Batarya durumu güncellendi');
			}
		});
  
});



function setMotorParametersBasedOnTime() {
  const currentSecond = new Date().getSeconds();

  let voltage, load, speed, ambientTemperature, efficiency, torque, frequency;

  if (currentSecond >= 0 && currentSecond < 8) {
    voltage = Math.random() * (12 - 10) + 10; // 10 ile 12 V arası
    load = Math.random() * (1.5 - 1) + 1; // 1 ile 1.5 kg arası
    speed = Math.random() * (1500 - 1000) + 1000; // 1000 ile 1500 RPM arası
    ambientTemperature = Math.random() * (30 - 25) + 25; // 25 ile 30 °C arası
    efficiency = Math.random() * (90 - 85) + 85; // %85 ile %90 arası
    torque = Math.random() * (5 - 4) + 4; // 4 ile 5 Nm arası
    frequency = Math.random() * (60 - 50) + 50; // 50 ile 60 Hz arası
  } else if (currentSecond >= 8 && currentSecond < 35) {
    voltage = Math.random() * (10 - 8) + 8; // 8 ile 10 V arası
    load = Math.random() * (0.7 - 0.3) + 0.3; // 0.3 ile 0.7 kg arası
    speed = Math.random() * (1000 - 500) + 500; // 500 ile 1000 RPM arası
    ambientTemperature = Math.random() * (25 - 20) + 20; // 20 ile 25 °C arası
    efficiency = Math.random() * (80 - 70) + 70; // %70 ile %80 arası
    torque = Math.random() * (4 - 3) + 3; // 3 ile 4 Nm arası
    frequency = Math.random() * (50 - 40) + 40; // 40 ile 50 Hz arası
  } else if (currentSecond >= 35 && currentSecond < 50) {
    voltage = Math.random() * (14 - 12) + 12; // 12 ile 14 V arası
    load = Math.random() * (2.6 - 2) + 2; // 2 ile 2.6 kg arası
    speed = Math.random() * (2000 - 1500) + 1500; // 1500 ile 2000 RPM arası
    ambientTemperature = Math.random() * (35 - 30) + 30; // 30 ile 35 °C arası
    efficiency = Math.random() * (95 - 90) + 90; // %90 ile %95 arası
    torque = Math.random() * (6 - 5) + 5; // 5 ile 6 Nm arası
    frequency = Math.random() * (70 - 60) + 60; // 60 ile 70 Hz arası
  } else if (currentSecond >= 50 && currentSecond < 60) {
    voltage = Math.random() * (11 - 9) + 9; // 9 ile 11 V arası
    load = Math.random() * (1.3 - 0.7) + 0.7; // 0.7 ile 1.3 kg arası
    speed = Math.random() * (1300 - 1000) + 1000; // 1000 ile 1300 RPM arası
    ambientTemperature = Math.random() * (30 - 25) + 25; // 25 ile 30 °C arası
    efficiency = Math.random() * (85 - 75) + 75; // %75 ile %85 arası
    torque = Math.random().toFixed(2) * (4.5 - 3.5) + 3.5; // 3.5 ile 4.5 Nm arası
    frequency = Math.random() * (55 - 45) + 45; // 45 ile 55 Hz arası
  }

  motor.updateParameters(voltage, load, speed, ambientTemperature, efficiency, torque, frequency);
}


function setLEDBrightnessBasedOnTime() {
  const currentSecond = new Date().getSeconds();

  let brightness;

  if (currentSecond >= 0 && currentSecond < 15) {
    brightness = Math.random() * 25; // 0 ile 25% arası
  } else if (currentSecond >= 15 && currentSecond < 30) {
    brightness = Math.random() * 50 + 25; // 25 ile 75% arası
  } else if (currentSecond >= 30 && currentSecond < 45) {
    brightness = Math.random() * 25 + 75; // 75 ile 100% arası
  } else if (currentSecond >= 45 && currentSecond < 60) {
    brightness = Math.random() * 50 + 50; // 50 ile 100% arası
  }

  led.setBrightness(brightness);
}


setInterval(setMotorParametersBasedOnTime, 500);
setInterval(setLEDBrightnessBasedOnTime, 500);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7
/////////GELEN API

const express = require('express');
const app = express();
app.use(express.json());


function startClientServer(port) {
	
        app.listen(port, () => {
        console.log(`Client API listening on port ${port}`);
    });
}


app.post('/updateMyPrediction', async (req, res) => {
  const data = req.body.data;

  try {
	  
	 predictionData = Object.entries(data).map(([value, category]) => [parseInt(value), category]);

	  
    await Promise.all(
      Object.entries(data).map(async ([value, category]) => {
        const intValue = parseInt(value);

        const row = await new Promise((resolve, reject) => {
          db.get(`SELECT * FROM POWER_PREDICTION WHERE VALUE = ?`, [intValue], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        });

        if (row) {
          // Eğer kayıt zaten varsa, güncelle
          await new Promise((resolve, reject) => {
            db.run(`UPDATE POWER_PREDICTION SET CATEGORY = ? WHERE VALUE = ?`, [category, intValue], function (err) {
              if (err) {
                reject(err);
              } else {
                console.log(`Güncellendi: VALUE=${intValue}, CATEGORY=${category}`);
                resolve();
              }
            });
          });
        } else {
          // Eğer kayıt yoksa, ekle
          await new Promise((resolve, reject) => {
            db.run(`INSERT INTO POWER_PREDICTION (VALUE, CATEGORY) VALUES (?, ?)`, [intValue, category], function (err) {
              if (err) {
                reject(err);
              } else {
                console.log(`Eklendi: VALUE=${intValue}, CATEGORY=${category}`);
                resolve();
              }
            });
          });
        }
      })
    );

    res.send('Data received and processed successfully');
  } catch (error) {
    console.error('POWER_PREDICTION tablosunu güncelleme sırasında hata oluştu:', error);
    res.status(500).send('An error occurred while processing the data');
  }
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7
/////////GIDEN API
const axios = require('axios');
const cron = require('node-cron');
let cron_interval = 5;


function cronTasks() {
	
	 //sendDeviceInfo();
	 sendBatchHistory();	 
}


let task = cron.schedule(`*/${cron_interval} * * * * *`, () => {
    cronTasks();
});


function changeInterval(newInterval) {
    // Eski görevi durdur
    task.stop();
    // Yeni interval değerini ayarla
    cron_interval = newInterval;
    // Yeni cron işlevini oluştur
    task = cron.schedule(`*/${cron_interval} * * * * *`, () => {
        cronTasks();
    });
    console.log(`Interval ${cron_interval} saniyeye değiştirildi.`);
}



async function sendBatchHistory() {
  const startId = device.LAST_SENT_HISTORY_ID;

  try {
    // DEVICE_HISTORY tablosundaki maksimum ID değerini al
    const maxIdRow = await new Promise((resolve, reject) => {
      db.get(`SELECT MAX(ID) as maxId FROM DEVICE_HISTORY`, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    const maxId = maxIdRow.maxId;
    const endId = Math.min(startId + 200, maxId);
	
	console.log(startId);console.log(endId);

    // Veritabanından verileri çek
    const rows = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM DEVICE_HISTORY WHERE ID > ? and ID <= ?`, [startId, endId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    if (rows.length === 0) {
      console.log('Gönderilecek veri yok.');
      return;
    }

    // Cihazın anlık durumunu ekle
    const deviceSnapshot = {
      LATITUDE: device.LATITUDE,
      LONGITUDE: device.LONGITUDE,
      SENSOR1: device.SENSOR1,
      SENSOR2: device.SENSOR2,
      SENSOR3: device.SENSOR3,
      PORT: device.PORT,
      BATTERY_STATUS: device.BATTERY_STATUS,
      PING_INTERVAL: device.PING_INTERVAL,
      GTW_IP_PORT: device.GTW_IP_PORT,
      AVG_POWER_CONSUMPTION_PER_SEC: device.AVG_POWER_CONSUMPTION_PER_SEC,
      SOLAR_POWER: device.SOLAR_POWER,
      WIND_POWER: device.WIND_POWER,
      POWER_MODE: device.POWER_MODE,
	  ID: device.ID
    };

    // JSON olarak POST et
    const response = await axios.post('http://' + device.GTW_IP_PORT + '/updateDeviceInfoBatch/', {
      data: rows,
      deviceSnapshot: deviceSnapshot
    }, { timeout: 2000 });

    if (response.status === 200) {
      console.log('Veriler başarıyla gönderildi.');

      // device.LAST_SENT_HISTORY_ID değerini endId olarak güncelle
      device.LAST_SENT_HISTORY_ID = endId;

      // DEVICES tablosundaki LAST_SENT_HISTORY_ID değerini güncelle
      await new Promise((resolve, reject) => {
        db.run(`UPDATE DEVICES SET LAST_SENT_HISTORY_ID = ? WHERE ID = ?`, [device.LAST_SENT_HISTORY_ID, device.ID], function(err) {
          if (err) {
            reject(err);
          } else {
            console.log('DEVICES tablosundaki LAST_SENT_HISTORY_ID başarıyla güncellendi.');
            resolve();
          }
        });
      });
    } else {
      console.log('Veriler gönderilemedi:', response.status);
    }
  } catch (error) {
    console.error('Batch verilerini gönderirken hata oluştu:', error.message);
  }
}





////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7
/////////ANA ISLER




const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db'); 



let predictionData = [];
let prev_category = null;



let device = null;


async function loadDevice() {
    await db.get('SELECT * FROM DEVICES LIMIT 1', (err, row) => {
        if (err) {
            console.error('Cihaz bilgilerini alma hatası:', err.message);
        } else {
            device = row;
            console.log('Cihaz bilgileri başarıyla yüklendi:', device);
			changeInterval(device.PING_INTERVAL);
			
			windTurbineSensor.setCoordinates(device.LATITUDE, device.LONGITUDE);
			battery.setCurrentCapacity(device.BATTERY_STATUS);
			
			windTurbineSensor.start();
			
			if (device && device.PORT) {
                startClientServer(3001); // Yeni sunucu başlatma fonksiyonunu çağır
            }
			
        }
    });
	
}




async function takeSampleofDeviceMetrics() {
	
	
    if (device && device.BATTERY_STATUS > 0) {
		

		 if (predictionData.length > 0) {
		  const currentTime = new Date().getSeconds(); // İçinde bulunulan saniye
		  let closestTime = predictionData[0][0];
		  let closestCategory = predictionData[0][1];
		  let minDiff = Math.abs(currentTime - closestTime);
		  
		  predictionData.forEach(([time, category]) => {
			const diff = Math.abs(currentTime - time);
			if (diff < minDiff) {
			  closestTime = time;
			  closestCategory = category;
			  minDiff = diff;
			}
		  });
		  
		if(closestCategory !== prev_category ){
			
			
			
			if (closestCategory === 'HAFİF') {
				changeInterval(5); device.PING_INTERVAL = 5; device.POWER_MODE = "PERFORMANS";
			  } else if (closestCategory === 'ORTA') {
				changeInterval(10); device.PING_INTERVAL = 10; device.POWER_MODE = "NORMAL";
			  } else if (closestCategory === 'YOĞUN') {
				changeInterval(15); device.PING_INTERVAL = 15; device.POWER_MODE = "TASARRUF";
			  }
			
			
		}
		  
			   
		  
		  prev_category = closestCategory;
		  
		  
		  

		}
		
		console.log(device.POWER_MODE);
				 			
        device.SENSOR1 = motor.current;
        device.SENSOR2 = 0;
        device.SENSOR3 = 0;
		
		device.WIND_POWER = windTurbineSensor.current;
					
		device.BATTERY_STATUS = battery.currentCapacity;
		
		
		db.run(`INSERT INTO DEVICE_HISTORY (DEVICE_ID, TIMESTAMP, SENSOR1, SENSOR2, SENSOR3, BATTERY_STATUS, WEATHER_COND, LATITUDE, LONGITUDE, PORT, PING_INTERVAL, GTW_IP_PORT, 			AVG_POWER_CONSUMPTION_PER_SEC, SOLAR_POWER, WIND_POWER, POWER_MODE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
			  [device.ID, new Date().toISOString(), device.SENSOR1, device.SENSOR2, device.SENSOR3, device.BATTERY_STATUS, null, device.LATITUDE, device.LONGITUDE, device.PORT, device.PING_INTERVAL, device.GTW_IP_PORT, device.AVG_POWER_CONSUMPTION_PER_SEC, device.SOLAR_POWER, device.WIND_POWER, device.POWER_MODE], 
				function(err) {
					if (err) {
					console.error('DEVICE_HISTORY tablosuna eklenirken hata oluştu:', err.message);
					} else {
					//console.log('Anlık durum DEVICE_HISTORY tablosuna eklendi.');
					}
			  }
			);
				
		
    }
}



loadDevice();
setInterval(takeSampleofDeviceMetrics,1000);





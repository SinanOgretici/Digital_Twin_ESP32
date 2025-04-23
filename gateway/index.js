const fs = require('fs');
const path = require('path');

const express = require('express');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const axios = require('axios');


app.use(express.json({ limit: '50mb' }))

// SQLite veritabanı bağlantısı
const db = new sqlite3.Database('database.db'); // Kök dizindeki database.db dosyasına bağlan

// WebSocket bağlantısı
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Her saniye cihaz verilerini istemciye gönderme
    setInterval(() => {
        db.all('SELECT * FROM devices', (err, rows) => {
            if (err) {
                console.error(err.message);
                return;
            }
            // Veritabanından alınan cihaz verilerini istemciye yayınlama
            const devicesMessage = {
            type: "devices",
            data: rows
        };
        ws.send(JSON.stringify(devicesMessage));
        });
    }, 1000);
	
	
       
	// WebSocket mesajları için olay dinleyicisi
	ws.on('message', (message) => {
		try {
			const data = JSON.parse(message);
			
			
			if(data.type == 'getLast20'){
							
			
				db.all(`SELECT
							HS.*
							,CASE
								WHEN (SENSOR1 + SENSOR2 + SENSOR3) >= 0 AND (SENSOR1 + SENSOR2 + SENSOR3) < 2.5 THEN 'HAFİF'
								WHEN (SENSOR1 + SENSOR2 + SENSOR3) >= 2.5 AND (SENSOR1 + SENSOR2 + SENSOR3) <= 5 THEN 'ORTA'
								WHEN (SENSOR1 + SENSOR2 + SENSOR3) > 5 THEN 'YOĞUN'
								ELSE 'BELİRSİZ'
							END AS CATEGORY
						FROM DEVICE_HISTORY HS
						WHERE DEVICE_ID = ?

						AND datetime(TIMESTAMP, 'localtime') > datetime(CURRENT_TIMESTAMP, '-3 minutes', 'localtime')

						ORDER BY TIMESTAMP DESC
													`
													, [data.deviceId], (err, rows) => {
				if (err) {
					console.error('Cihaz geçmiş verilerini alma hatası:', err.message);
				} else {
					
					  const historyMessage = {
							type: "device_history",
							data: rows
						};
						ws.send(JSON.stringify(historyMessage));
					
				}
				});
				
				
				
			}
			
			
			
			
			
		} catch (error) {
			console.error('Mesajı parse etme hatası:', error);
		}
	});
		
	
	
});

// Ana sayfayı sunma
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


app.get('/images/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, 'images', imageName);

    fs.readFile(imagePath, (err, data) => {
        if (err) {
            res.status(404).send('File not found');
            return;
        }

        res.contentType('image/png');
        res.send(data);
    });
});


app.get('/scripts/:scriptName', (req, res) => {
    const scriptName = req.params.scriptName;
    const scriptPath = path.join(__dirname, 'scripts', scriptName);

    fs.readFile(scriptPath, (err, data) => {
        if (err) {
            res.status(404).send('File not found');
            return;
        }

        res.contentType('application/javascript');
        res.send(data);
    });
});


app.get('/css/:cssName', (req, res) => {
    const cssName = req.params.cssName;
    const cssPath = path.join(__dirname, 'css', cssName);

    fs.readFile(cssPath, (err, data) => {
        if (err) {
            res.status(404).send('File not found');
            return;
        }

        res.contentType('text/css');
        res.send(data);
    });
});




// Sunucuyu başlatma
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});



app.post('/updateDeviceInfoBatch', async (req, res) => {
  const data = req.body.data;
  const deviceSnapshot = req.body.deviceSnapshot;
  
  const timestamp = new Date().toISOString();
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return res.status(400).send('Invalid data format or empty data array');
  }

  if (!deviceSnapshot) {
    return res.status(400).send('Invalid device snapshot');
  }

  try {
    // Veritabanı işlemleri için transaction başlat
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) return reject(err);

          // DEVICE_HISTORY tablosuna veri ekleme
          const stmt = db.prepare(`INSERT OR IGNORE INTO DEVICE_HISTORY (ID, DEVICE_ID, TIMESTAMP, SENSOR1, SENSOR2, SENSOR3, BATTERY_STATUS, WEATHER_COND, LATITUDE, LONGITUDE, PORT, PING_INTERVAL, GTW_IP_PORT, AVG_POWER_CONSUMPTION_PER_SEC, SOLAR_POWER, WIND_POWER, POWER_MODE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

          data.forEach(record => {
            stmt.run([record.ID, record.DEVICE_ID, record.TIMESTAMP, record.SENSOR1, record.SENSOR2, record.SENSOR3, record.BATTERY_STATUS, record.WEATHER_COND, record.LATITUDE, record.LONGITUDE, record.PORT, record.PING_INTERVAL, record.GTW_IP_PORT, record.AVG_POWER_CONSUMPTION_PER_SEC, record.SOLAR_POWER, record.WIND_POWER, record.POWER_MODE], (err) => {
              if (err) console.error('Error inserting record:', err.message);
            });
          });

          stmt.finalize(async (err) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }

            // DEVICE tablosunu güncelleme
            db.run(`UPDATE DEVICES SET LATITUDE = ?, LONGITUDE = ?, SENSOR1 = ?, SENSOR2 = ?, SENSOR3 = ?, PORT = ?, BATTERY_STATUS = ?, PING_INTERVAL = ?, GTW_IP_PORT = ?, AVG_POWER_CONSUMPTION_PER_SEC = ?, SOLAR_POWER = ?, WIND_POWER = ?, POWER_MODE = ?, TIMESTAMP = ? WHERE ID = ?`, 
              [deviceSnapshot.LATITUDE, deviceSnapshot.LONGITUDE, deviceSnapshot.SENSOR1, deviceSnapshot.SENSOR2, deviceSnapshot.SENSOR3, deviceSnapshot.PORT, deviceSnapshot.BATTERY_STATUS, deviceSnapshot.PING_INTERVAL, deviceSnapshot.GTW_IP_PORT, deviceSnapshot.AVG_POWER_CONSUMPTION_PER_SEC, deviceSnapshot.SOLAR_POWER, deviceSnapshot.WIND_POWER, deviceSnapshot.POWER_MODE, timestamp, deviceSnapshot.ID], (err) => {
                if (err) {
                  db.run('ROLLBACK');
				  console.log(err);
                  return reject(err);
                }

                db.run('COMMIT', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(err);
                  }
                  resolve();
                });
              });
          });
        });
      });
    });

    res.status(200).send('Data successfully inserted into DEVICE_HISTORY and device snapshot updated');
  } catch (error) {
    console.error('Error inserting data into DEVICE_HISTORY or updating device snapshot:', error.message);
    db.run('ROLLBACK', (err) => {
      if (err) console.error('Error rolling back transaction:', err.message);
    });
    res.status(500).send('An error occurred while inserting data into DEVICE_HISTORY or updating device snapshot');
  }
});

setInterval(calculateWithPython,30000);


function getDeviceIds() {
  return new Promise((resolve, reject) => {
    db.all('SELECT ID, PORT FROM DEVICES', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// calculateWithPython fonksiyonu
async function calculateWithPython() {
  try {
    const deviceIds = await getDeviceIds();
    console.log(deviceIds);

    for (const { ID: deviceId, PORT: devicePort} of deviceIds) {
      const deviceData = await getDeviceData(db, deviceId);

      if (deviceData.length > 0) {
        const predictionData = await fetchPredictionData(deviceData, 'decision_tree');

        if (predictionData) {
          await updatePowerPredictionTable(db, deviceId, predictionData, devicePort);
        }
      }
    }
  } catch (error) {
    console.error('Error during processing:', error);
  }
}

// Belirli bir device_id için veriyi sorgulayan fonksiyon
function getDeviceData(db, deviceId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        LOCALSECOND, CATEGORY
      FROM
      (SELECT
          DEVICE_ID,
          datetime(TIMESTAMP, 'localtime') AS LOCALTIME,
          strftime('%S', datetime(TIMESTAMP, 'localtime')) AS LOCALSECOND,
          (SENSOR1 + SENSOR2 + SENSOR3) AS TOTAL,
          CASE
              WHEN (SENSOR1 + SENSOR2 + SENSOR3) >= 0 AND (SENSOR1 + SENSOR2 + SENSOR3) < 2.5 THEN 'HAFİF'
              WHEN (SENSOR1 + SENSOR2 + SENSOR3) >= 2.5 AND (SENSOR1 + SENSOR2 + SENSOR3) <= 5 THEN 'ORTA'
              WHEN (SENSOR1 + SENSOR2 + SENSOR3) > 5 THEN 'YOĞUN'
              ELSE 'BELİRSİZ'
          END AS CATEGORY
      FROM DEVICE_HISTORY HS
      WHERE DEVICE_ID = ?
      AND datetime(TIMESTAMP, 'localtime') > datetime(CURRENT_TIMESTAMP, '-3 minutes', 'localtime')
      ORDER BY TIMESTAMP DESC)
      ORDER BY LOCALSECOND DESC
    ;
    db.all(query, [deviceId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
		  //console.log(rows);
        resolve(rows);
      }
    });
  });
}

// Python metoduna HTTP POST isteği gönderen fonksiyon
async function fetchPredictionData(data, algorithm) {
  try {
    const endpointMap = {
      'decision_tree': 'predict_decision_tree',
      'knn': 'predict_knn',
      'svm': 'predict_svm',
      'random_forest': 'predict_random_forest',
      'naive_bayes': 'predict_naive_bayes'
    };

    const endpoint = endpointMap[algorithm];
    if (!endpoint) {
      throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    const response = await axios.post(`http://127.0.0.1:5000/${endpoint}`, {
      data: data.map(d => [d.LOCALSECOND, d.CATEGORY])
    });
    return response.data; // Gelen JSON verisi
  } catch (error) {
    console.error('Error fetching prediction data:', error);
    return null;
  }
}

async function updatePowerPredictionTable(db, deviceId, data, devicePort) {
  try {
    await Promise.all(
      Object.entries(data).map(async ([value, category]) => {
        const intValue = parseInt(value);

        const row = await new Promise((resolve, reject) => {
          db.get(`SELECT * FROM POWER_PREDICTION WHERE DEVICE_ID = ? AND VALUE = ?`, [deviceId, intValue], (err, row) => {
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
            db.run(`UPDATE POWER_PREDICTION SET CATEGORY = ? WHERE DEVICE_ID = ? AND VALUE = ?`, [category, deviceId, intValue], function (err) {
              if (err) {
                reject(err);
              } else {
                //console.log(`Güncellendi: DEVICE_ID=${deviceId}, VALUE=${intValue}, KATEGORİ=${category}`);
                resolve();
              }
            });
          });
        } else {
          // Eğer kayıt yoksa, ekle
          await new Promise((resolve, reject) => {
            db.run(`INSERT INTO POWER_PREDICTION (DEVICE_ID, VALUE, CATEGORY) VALUES (?, ?, ?)`, [deviceId, intValue, category], function (err) {
              if (err) {
                reject(err);
              } else {
                //console.log(`Eklendi: DEVICE_ID=${deviceId}, VALUE=${intValue}, KATEGORİ=${category}`);
                resolve();
              }
            });
          });
        }
      })
    );

    sendDataToUpdateMyPrediction(devicePort, data);
  } catch (error) {
    console.error('Güç tahmini tablosunu güncelleme sırasında hata oluştu:', error);
  }
}


async function sendDataToUpdateMyPrediction(devicePort, data) {
  try {
    const response = await axios.post(`http://${devicePort}/updateMyPrediction`, {
      data: data
    });
    console.log('Data sent to updateMyPrediction:', response.data);
  } catch (error) {
    console.error('Error sending data to updateMyPrediction:', error);
  }
}



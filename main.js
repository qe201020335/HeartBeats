const express = require('express');
const Ant = require('ant-plus');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, { origins: '*:*'});
const PORT = process.env.PORT || 1242;

const timeout = 10;
let deviceId = 0;
let deviceCounts = {};
let deviceBeat = {};
let timeoutCount = timeout;
let stick = new Ant.GarminStick2;
let sensor = new Ant.HeartRateSensor(stick);

let heartrate = {bpm: 0, measured_at: Date.now()};

app.get('/', (req, res) => { res.sendFile(__dirname + '/html/index.html') });
app.use('/', express.static('html'))
app.get('/hr', (req, res) => {res.send(heartrate)})

http.listen(PORT, () => { console.log('server listening. Port:' + PORT) });

io.on('connection', (socket) => {
    socket.on('start', (id) => {
        // 
    });
});

let onHR = (data) => {
    let did = 'id' + data.DeviceID;
    if (!deviceCounts[did]) deviceCounts[did] = data.BeatCount;
    else if (deviceCounts[did] !== data.BeatCount) {
        deviceCounts[did] = data.BeatCount;
        io.emit('beats', data.DeviceID, data.ComputedHeartRate);
        deviceBeat[did] = data.ComputedHeartRate;
        heartrate = {bpm: data.ComputedHeartRate, measured_at: Date.now()};
    }
    timeoutCount = timeout;
}

sensor.on('hbData', onHR);

// let count = 0;
//
// let randomHRLoop = setInterval(() => {
//     let data = {
//         DeviceID: "1231321",
//         BeatCount: count++,
//         ComputedHeartRate: Math.floor(60 + Math.random()*150)
//     }
//     onHR(data)
// }, 567);


stick.on('startup', () => {
    console.log('Stick startup');
    sensor.attach(0, deviceId);
});

stick.on('shutdown', () => {
    console.log('Stick shutdown');
});

sensor.on('attached', () => {
    timeoutCount = timeout;
});

sensor.on('detached', () => {
    timeoutCount = timeout;
    
    try {
        sensor.attach(0, deviceId);
        
    } catch(e) {
        console.log(e);
        
    }
});

if(!stick.is_present()) console.log('Stick not found!');
if(!stick.open()) console.log('Stick open failed!');

let timeoutCheckLoop = setInterval(() => {

    console.clear();
    console.log('count:', JSON.stringify(deviceCounts));
    console.log('beat:', JSON.stringify(deviceBeat));
    console.log('timeout:', timeoutCount);
    if (timeoutCount <= 0) {
        process.exit();
    }
    timeoutCount--;

}, 1000);
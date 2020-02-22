'use strict';

//
// WebSockets
//

const WebSocks = require('ws');
const wsConnections = [];

console.log('Starting websocket server on port 8081');
const wss = new WebSocks.Server({ port: 8081 /*clientTracking: false, noServer: true*/ });

wss.on('connection', function(ws, request) {
  console.log(`connection`);

  wsConnections.push(ws);

  ws.on('message', function(message) {
    //
    // Here we can now use session parameters.
    //
    console.log(`Received message ${message}`);
  });

  ws.on('close', function() {
    console.log(`closed`);
    wsConnections.splice(wsConnections.indexOf(ws), 1);
  });
});


//
// HTTP
//

const express = require('express');
const http = require('http');

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);

server.listen(8080, function() {
  console.log('Listening on http://localhost:8080');
  startArtNet();
});



//
// DMX
//

function startArtNet() {
  const dmxlib = require('dmxnet');

  var nextTime = null
  const dmxconsumer = (universe, data) => {

    // if (nextTime && Date.now() < nextTime) return;
    nextTime = Date.now() + 10;

    // console.log(`dmxconsumer: u=${universe}`);
    wsConnections.forEach(ws => {
      // console.log(`dmxconsumer: u=${universe}, conn`);
      ws.send(`dmx/u/${universe}/d/${data.join(';')}`);
    })
  }


  // Create new dmxnet instance
  const dmxnet = new dmxlib.dmxnet({});
  // const receivers = [];
  const universes = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

  universes.forEach((universeIdx) => {
    console.log(`Registering receiver for DMX universe: ${universeIdx}`);

    // Create a new receiver instance, listening for universe 5 on net 0 subnet 0
    const receiver = dmxnet.newReceiver({
      subnet: 0,
      universe: universeIdx,
      net: 0,
    });

    // Dump data if DMX Data is received
    receiver.on('data', function(data) {
      // console.log('DMX data:', data);//.slice(0,5)); // eslint-disable-line no-console
      // console.log('DMX: U='+universeIdx.toString()); //+' '+data.join(';'));
      dmxconsumer(universeIdx, data)
    });

    // receivers.push(receiver)
  });



  //
  // Fake data
  //
  const fakeWhite = [];
  for (var i=0; i<511; i++) fakeWhite.push(255);
  const fakeBlack = [];
  for (var i=0; i<511; i++) fakeBlack.push(0);

  const intervalFunc = () => {
    const curUniverse = Math.floor((Date.now() / 1000.0) % universes.length);

    universes.forEach(u => {
      dmxconsumer(u, u === curUniverse ? fakeWhite : fakeBlack);  
    });
  };

  // setInterval(intervalFunc, 200);


}


//
// Signals
//
// process.on('SIGINT', function() {
//     console.log("Caught interrupt signal");

//     // if (i_should_exit)
//     //     process.exit();
//     // receivers.forEach(r => {
//     //   r.stop();
//     // });
//     wss.stop();
// });

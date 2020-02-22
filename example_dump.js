'use strict';
// Load dmxnet as libary
var dmxlib = require('dmxnet');
// Create new dmxnet instance
var dmxnet = new dmxlib.dmxnet({});


// [3,2,1,0].forEach(net => {
  // [3,2,1,0].forEach(snet => {
[8,7,6,5,4,3,2,1,0].forEach((i) => {

  // Create a new receiver instance, listening for universe 5 on net 0 subnet 0
  var receiver = dmxnet.newReceiver({
    subnet: 0, //snet,
    universe: i,
    net: 0, //net,
  });

  console.log(`Registering receiver for DMX universe: ${i}`);
  // Dump data if DMX Data is received
  receiver.on('data', function(data) {
    console.log('DMX data:', data.slice(0,5)); // eslint-disable-line no-console
    // console.log('DMX: U='+i.toString()+' '+data.join(';'));
  });

});
// });});
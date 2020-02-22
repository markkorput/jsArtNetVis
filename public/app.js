'use strict';
// https://raw.githubusercontent.com/websockets/ws/master/examples/express-session-parse/public/app.js
(function() {

  function onDmx(universe, data) {
    // log(`onDmx u=${universe}`);
    if (window.dmxconsumer) window.dmxconsumer(universe, data);
  }

  function parseDmxString(str) {
    let parts = str.split('/');
    if (
      parts.length !== 5 
      || parts[0] !== 'dmx' 
      || parts[1] !== 'u' 
      || parts[3] !== 'd') return null;

    // log(`parse, parts[1]=${parts[1]} parts[2]=${parts[2]}`);
    return [parseInt(parts[2]), parts[4].split(';')];
  }

  //
  // WebSockets
  //

  const logEl = document.getElementById('messages');
  const maxLog = 20;
  const _log = [];

  function log(message) {
    // _log.push(message);
    _log.unshift(message);
    while (_log.length > maxLog) _log.pop(); //_log.shift();
    if (logEl) {
      logEl.textContent = _log.join('\n');
      // logEl.scrollTop = logEl.scrollHeight;
    } else {
      console.log(message);
    }
  }

  window.logfunc = log;

  let ws = null;

  let disconnect = function(){
    if (ws) {
      ws.onerror = ws.onopen = ws.onclose = null;
      ws.close();
    }

    ws = null;
  };

  let connect = function() {
    disconnect();

    const addr = `ws://127.0.0.1:8081`; //${location.host}
    ws = new WebSocket(addr);

    ws.onerror = function() { log('WebSocket error'); };
    ws.onopen = function() { log('WebSocket connection established'); };
    ws.onclose = function() { log('WebSocket connection closed'); ws = null; }

    // ws.on('message', function(obj){
    ws.onmessage = function(obj) {
      // obj.isTrusted === true?
      // obj.origin
      const data = obj.data;
      
      let res = parseDmxString(data);

      if (res) {
        // log(`Got DMX data for universe: ${res[0]} with ${res[1].length} values`);
        onDmx(res[0], res[1]);
      }
    };

    ws.onerror('')
  };

  connect();
})();
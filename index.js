const os = require( 'os' );
const WebSocketServer = require('websocket').server;
const http = require('http');
const qrcode = require('qrcode-terminal');
const staticServer = require('./static-server');
const Mouse = require('./mouse');

const port = 8080;
const server = http.createServer(staticServer('phone_client'));
server.listen(port);

const wsHttpServer = http.createServer().listen(1337, function() {});
const wsServer = new WebSocketServer({
  httpServer: wsHttpServer
});

const connections = [];
let lastConn = null;

wsServer.on('request', function(request) {
  const conn = request.accept(null, request.origin);
  console.log(`[${conn.remoteAddress}] Connection opened`);

  lastConn = conn;

  conn.on('message', function(message) {
    if (message.type === 'utf8') {
      const data = JSON.parse(message.utf8Data);
      if (lastConn && conn.remoteAddress === lastConn.remoteAddress) {
        processMessage(conn, data);
      }
    }
  });

  conn.on('close', function(connection, reason) {
    console.log(`[${conn.remoteAddress}] Connection closed: ${reason}`);
  });
});

const processMessage = (conn, data) => {
  const sendData = {
    from: conn.remoteAddress,
    data: data,
  };
  switch(data.type) {
    case 'move':
      Mouse.processMove(data.data);
      break;
    case 'mousedown':
      Mouse.processButtonPress('down', data.data);
      break;
    case 'mouseup':
      Mouse.processButtonPress('up', data.data);
      break;
    case 'scroll':
      Mouse.processScroll(data.data);
      break;
    default:
      console.log(`[${conn.remoteAddress}] Unknown WS message:`, data);
      break;
  }
};


// Render the access QR code(s)
const ifaces = os.networkInterfaces( );
Object.keys(ifaces).forEach(function (dev) {
  ifaces[dev]
  .filter(item => item.family === 'IPv4' && ['192', '10'].includes(item.address.split('.')[0]))
  .forEach(function (details) {
    const url = `http://${details.address}:${port}`;

    console.log('');
    console.log('Please scan the following QR code to access the controller:');
    console.log(`(Or visit ${url})`);
    console.log('');

    qrcode.generate(url);

    console.log('');
  });
});

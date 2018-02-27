const os = require( 'os' );
const fs = require('fs');
const WebSocketServer = require('websocket').server;
const http = require('http');
const qrcode = require('qrcode-terminal');
const Mouse = require('./mouse');

const port = 8080;
const server = http.createServer((req, res) => {
  // Serve the phone client file
  fs.readFile('./phone_client/index.html', (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.end(`Error getting the file: ${err}.`);
    } else {
      res.setHeader('Content-type', 'text/html' );
      res.end(data);
    }
  });
});
server.listen(port);

const wsHttpServer = http.createServer().listen(1337, function() {});
const wsServer = new WebSocketServer({
  httpServer: wsHttpServer
});

const connections = [];
let lastConn = null;
let client = null;

wsServer.on('request', function(request) {
  const conn = request.accept(null, request.origin);
  connections.push(conn);
  lastConn = conn;
  console.log('new conn', conn.remoteAddress);
  if (conn.remoteAddress.indexOf('127.0.0.1') > -1) {
    client = conn;
    console.log('client app connected');
  }

  conn.on('message', function(message) {
    if (message.type === 'utf8') {
      const data = JSON.parse(message.utf8Data);
      if (lastConn && conn.remoteAddress === lastConn.remoteAddress) {
        processMessage(conn, data);
      }
    }
  });

  conn.on('close', function(connection, reason) {
    const connIndex = connections.findIndex(item => item.remoteAddress === conn.remoteAddress);
    if (connIndex > -1) {
      connections.splice(connIndex, 1);
    }
    console.log('conn close', conn.remoteAddress);
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
      console.log(`Unknown WS message from ${conn.remoteAddress}:`, data);
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
  });
});
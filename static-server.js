const fs = require('fs');
const url = require('url');
const path = require('path');

module.exports = (serveFolder = '') => (req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = `./${serveFolder}${parsedUrl.pathname}`;
  
  const ext = path.parse(pathname).ext || '.html';
  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
  };

  fs.exists(pathname, (exist) => {
    if (!exist) {
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }
    
    if (fs.statSync(pathname).isDirectory()) {
      pathname += '/index' + ext;
    }

    fs.readFile(pathname, (err, data) => {
      if (err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        res.setHeader('Content-type', map[ext] || 'text/plain' );
        res.end(data);
      }
    });
  });
};

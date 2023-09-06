const http = require('http');
const https = require('https');
const fs = require('fs');
const express = require('express');
require('dotenv').config();

const is_secured = fs.existsSync(process.env.SSL_CERTIFICATE) && fs.existsSync(process.env.SSL_PRIVATE_KEY) && fs.existsSync(process.env.SSL_CHAIN);

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

const app = express();
app.set('port', port);

app.use(express.static('./'));

let server;
if (is_secured) {
    const privateKey = fs.readFileSync(process.env.SSL_PRIVATE_KEY, 'utf8');
    const certificate = fs.readFileSync(process.env.SSL_CERTIFICATE, 'utf8');
    const ca = fs.readFileSync(process.env.SSL_CHAIN, 'utf8');

    server = https.createServer({key: privateKey, cert: certificate, ca: ca}, app);
    console.info(`Start secured server on port ${port}`)
} else {
    server = http.createServer(app);
    console.warn(`Start unsecured server on port ${port}`)
}

server.listen(port);
server.on('listening', () => {
    let addr = server.address();
    let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.info('Listening on ' + bind);
});
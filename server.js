const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { registerRoomHandlers } = require('./lib/socket/RoomManager');
const { registerSignalingHandlers } = require('./lib/socket/SignalingRelay');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Ensure Host header is set so Next.js middleware can resolve the origin
    if (!req.headers.host) {
      req.headers.host = `${hostname}:${port}`;
    }
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Attach io to global so API routes can access it if needed
  global._io = io;

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket);
    registerSignalingHandlers(io, socket);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

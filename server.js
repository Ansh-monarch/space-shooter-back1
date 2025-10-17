const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Game = require('./game');

const app = express();
const server = http.createServer(app);

// Configure CORS for your frontend domain
const io = socketIo(server, {
  cors: {
    origin: ["https://your-frontend-url.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Space Shooter Backend' });
});

const game = new Game();

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  
  game.addPlayer(socket.id);
  socket.emit('gameState', game.getState());
  socket.emit('playerId', socket.id);
  
  socket.on('playerMove', (data) => {
    game.updatePlayer(socket.id, data);
    io.emit('gameState', game.getState());
  });
  
  socket.on('playerShoot', () => {
    game.playerShoot(socket.id);
    io.emit('gameState', game.getState());
  });
  
  socket.on('chatMessage', (message) => {
    io.emit('chatMessage', {
      playerId: socket.id,
      message: message
    });
  });
  
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    game.removePlayer(socket.id);
    io.emit('gameState', game.getState());
  });
});

setInterval(() => {
  game.update();
  io.emit('gameState', game.getState());
}, 1000 / 60);

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Backend Server running on port ${PORT}`);
});

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from client directory (FIXED PATH)
app.use(express.static(path.join(__dirname, '../client')));

// Serve the main page (FIXED PATH)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// API health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', players: Object.keys(game.players).length });
});

const game = new Game();

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  
  // Add player to game
  game.addPlayer(socket.id);
  
  // Send current game state to new player
  socket.emit('gameState', game.getState());
  socket.emit('playerId', socket.id);
  
  // Notify other players
  socket.broadcast.emit('playerJoined', socket.id);
  
  // Handle player movement
  socket.on('playerMove', (data) => {
    game.updatePlayer(socket.id, data);
    io.emit('gameState', game.getState());
  });
  
  // Handle player shooting
  socket.on('playerShoot', () => {
    game.playerShoot(socket.id);
    io.emit('gameState', game.getState());
  });
  
  // Handle chat messages
  socket.on('chatMessage', (message) => {
    io.emit('chatMessage', {
      playerId: socket.id,
      message: message
    });
  });
  
  // Handle ping
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    game.removePlayer(socket.id);
    io.emit('gameState', game.getState());
    io.emit('playerLeft', socket.id);
  });
});

// Game loop
setInterval(() => {
  game.update();
  io.emit('gameState', game.getState());
}, 1000 / 60); // 60 FPS

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Space Shooter Server running on port ${PORT}`);
  console.log(`📊 Game dimensions: ${game.gameWidth}x${game.gameHeight}`);
});

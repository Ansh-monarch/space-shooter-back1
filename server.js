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

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const game = new Game();

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  
  // Add player to game
  game.addPlayer(socket.id);
  
  // Send current game state to new player
  socket.emit('gameState', game.getState());
  
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
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    game.removePlayer(socket.id);
    io.emit('gameState', game.getState());
  });
});

// Game loop
setInterval(() => {
  game.update();
  io.emit('gameState', game.getState());
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

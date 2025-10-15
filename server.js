const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins - change this in production
    methods: ["GET", "POST"]
  }
});

// Enable CORS
app.use(cors());

// Serve static files (for frontend if you want to serve it from here too)
app.use(express.static(path.join(__dirname, 'public')));

// Store game state
const gameState = {
  players: {},
  totalClicks: 0
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔗 New player connected:', socket.id);

  // Add new player to game
  gameState.players[socket.id] = {
    id: socket.id,
    score: 0,
    connectedAt: new Date()
  };

  // Send current game state to the new player
  socket.emit('gameState', {
    players: gameState.players,
    totalClicks: gameState.totalClicks
  });

  // Notify all other players about the new player
  socket.broadcast.emit('playerJoined', gameState.players[socket.id]);

  // Update everyone about player count
  updatePlayerCount();

  // Handle player clicks
  socket.on('playerClick', (data) => {
    console.log(`🎯 Player ${socket.id} clicked! Score:`, data.score);

    // Update player score
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].score = data.score;
      gameState.totalClicks++;
    }

    // Broadcast the click to all other players
    socket.broadcast.emit('playerClicked', {
      playerId: socket.id,
      newScore: data.score,
      totalClicks: gameState.totalClicks
    });

    // Log game state
    console.log('📊 Current game state:', {
      totalPlayers: Object.keys(gameState.players).length,
      totalClicks: gameState.totalClicks
    });
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('👋 Player disconnected:', socket.id);
    
    // Remove player from game state
    delete gameState.players[socket.id];
    
    // Notify all other players
    socket.broadcast.emit('playerLeft', socket.id);
    
    // Update player count
    updatePlayerCount();
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// Helper function to update player count for everyone
function updatePlayerCount() {
  const playerCount = Object.keys(gameState.players).length;
  console.log(`👥 Current players: ${playerCount}`);
  io.emit('playerCountUpdate', playerCount);
}

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'Multiplayer Clicker Game Server',
    status: 'running',
    players: Object.keys(gameState.players).length,
    totalClicks: gameState.totalClicks,
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/game-state', (req, res) => {
  res.json({
    totalPlayers: Object.keys(gameState.players).length,
    players: gameState.players,
    totalClicks: gameState.totalClicks
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🎮 Multiplayer Clicker Game Backend Ready!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

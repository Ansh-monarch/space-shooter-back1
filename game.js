class Game {
  constructor() {
    this.players = {};
    this.bullets = [];
    this.asteroids = [];
    this.gameWidth = 800;
    this.gameHeight = 600;
    
    // Create initial asteroids
    for (let i = 0; i < 5; i++) {
      this.createAsteroid();
    }
    
    console.log('🎮 Game instance created with 5 asteroids');
  }
  
  addPlayer(socketId) {
    this.players[socketId] = {
      id: socketId,
      x: Math.random() * this.gameWidth,
      y: Math.random() * this.gameHeight,
      rotation: 0,
      velocity: { x: 0, y: 0 },
      health: 100,
      score: 0,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      name: `Player${Object.keys(this.players).length + 1}`
    };
    console.log(`👾 Player ${socketId} joined. Total players: ${Object.keys(this.players).length}`);
  }
  
  removePlayer(socketId) {
    if (this.players[socketId]) {
      console.log(`👋 Player ${socketId} left. Total players: ${Object.keys(this.players).length - 1}`);
      delete this.players[socketId];
    }
  }
  
  updatePlayer(socketId, data) {
    const player = this.players[socketId];
    if (player) {
      player.rotation = data.rotation;
      
      // Apply thrust based on rotation
      const thrust = 0.1;
      player.velocity.x += Math.sin(player.rotation) * thrust;
      player.velocity.y -= Math.cos(player.rotation) * thrust;
      
      // Apply friction
      player.velocity.x *= 0.98;
      player.velocity.y *= 0.98;
      
      // Update position
      player.x += player.velocity.x;
      player.y += player.velocity.y;
      
      // Wrap around screen
      if (player.x < 0) player.x = this.gameWidth;
      if (player.x > this.gameWidth) player.x = 0;
      if (player.y < 0) player.y = this.gameHeight;
      if (player.y > this.gameHeight) player.y = 0;
    }
  }
  
  playerShoot(socketId) {
    const player = this.players[socketId];
    if (player) {
      const bulletSpeed = 5;
      this.bullets.push({
        x: player.x,
        y: player.y,
        velocity: {
          x: Math.sin(player.rotation) * bulletSpeed,
          y: -Math.cos(player.rotation) * bulletSpeed
        },
        playerId: socketId,
        ttl: 100 // Time to live in frames
      });
    }
  }
  
  createAsteroid() {
    const asteroid = {
      x: Math.random() * this.gameWidth,
      y: Math.random() * this.gameHeight,
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
      },
      size: 30 + Math.random() * 20,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    };
    this.asteroids.push(asteroid);
    return asteroid;
  }
  
  update() {
    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.velocity.x;
      bullet.y += bullet.velocity.y;
      bullet.ttl--;
      
      // Wrap around screen
      if (bullet.x < 0) bullet.x = this.gameWidth;
      if (bullet.x > this.gameWidth) bullet.x = 0;
      if (bullet.y < 0) bullet.y = this.gameHeight;
      if (bullet.y > this.gameHeight) bullet.y = 0;
      
      // Remove old bullets
      if (bullet.ttl <= 0) {
        this.bullets.splice(i, 1);
      }
    }
    
    // Update asteroids
    this.asteroids.forEach((asteroid) => {
      asteroid.x += asteroid.velocity.x;
      asteroid.y += asteroid.velocity.y;
      asteroid.rotation += asteroid.rotationSpeed;
      
      // Wrap around screen
      if (asteroid.x < -asteroid.size) asteroid.x = this.gameWidth + asteroid.size;
      if (asteroid.x > this.gameWidth + asteroid.size) asteroid.x = -asteroid.size;
      if (asteroid.y < -asteroid.size) asteroid.y = this.gameHeight + asteroid.size;
      if (asteroid.y > this.gameHeight + asteroid.size) asteroid.y = -asteroid.size;
    });
    
    // Check collisions
    this.checkCollisions();
  }
  
  checkCollisions() {
    // Bullet-asteroid collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j];
        const dx = bullet.x - asteroid.x;
        const dy = bullet.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < asteroid.size) {
          // Remove bullet and asteroid
          this.bullets.splice(i, 1);
          this.asteroids.splice(j, 1);
          
          // Add score to player
          if (this.players[bullet.playerId]) {
            this.players[bullet.playerId].score += 10;
          }
          
          // Create new asteroids if needed
          if (this.asteroids.length < 8) {
            this.createAsteroid();
          }
          break;
        }
      }
    }
    
    // Player-asteroid collisions
    Object.keys(this.players).forEach(playerId => {
      const player = this.players[playerId];
      this.asteroids.forEach((asteroid) => {
        const dx = player.x - asteroid.x;
        const dy = player.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < asteroid.size + 15) {
          player.health -= 5;
          if (player.health <= 0) {
            player.health = 100;
            player.x = Math.random() * this.gameWidth;
            player.y = Math.random() * this.gameHeight;
            player.velocity = { x: 0, y: 0 };
            player.score = Math.max(0, player.score - 50);
          }
        }
      });
    });
  }
  
  getState() {
    return {
      players: this.players,
      bullets: this.bullets,
      asteroids: this.asteroids,
      gameWidth: this.gameWidth,
      gameHeight: this.gameHeight
    };
  }
}

module.exports = Game;

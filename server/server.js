const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Use environment variable for port or default to 3001
const PORT = process.env.PORT || 3001;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Game state
let connectedPlayers = 0;
let gameInProgress = false;
let obstacles = [];
let playerRoles = {}; // Track which player is player1 vs player2

// Socket.IO connection handling
io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);
    
    // Increment player count
    connectedPlayers++;
    
    // Assign player role (player1 or player2)
    if (Object.keys(playerRoles).length === 0) {
        playerRoles[socket.id] = 'player1';
    } else {
        let isPlayer1Assigned = false;
        for (const id in playerRoles) {
            if (playerRoles[id] === 'player1') {
                isPlayer1Assigned = true;
                break;
            }
        }
        playerRoles[socket.id] = isPlayer1Assigned ? 'player2' : 'player1';
    }
    
    console.log(`Player roles: ${JSON.stringify(playerRoles)}`);
    
    // Send player role to the client
    socket.emit('playerRole', { role: playerRoles[socket.id] });
    
    // Notify all clients about new player
    io.emit('playerJoined', { count: connectedPlayers });
    
    // Handle player movement
    socket.on('move', data => {
        // Add player role to movement data
        data.role = playerRoles[socket.id];
        // Broadcast movement to all other clients
        socket.broadcast.emit('move', data);
    });
    
    // Handle obstacle creation/update
    socket.on('syncObstacles', data => {
        // Only allow player1 to be the source of truth for obstacles
        if (playerRoles[socket.id] === 'player1') {
            obstacles = data.obstacles;
            socket.broadcast.emit('obstaclesUpdate', { obstacles: obstacles });
        }
    });
    
    // Handle player collision
    socket.on('collision', data => {
        data.role = playerRoles[socket.id];
        io.emit('playerHit', data);
        gameInProgress = false;
    });
    
    // Handle game reset
    socket.on('reset', () => {
        gameInProgress = true;
        obstacles = [];
        io.emit('gameReset');
    });
    
    // Handle client requesting current obstacle state
    socket.on('requestObstacles', () => {
        socket.emit('obstaclesUpdate', { obstacles: obstacles });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Remove player from roles
        delete playerRoles[socket.id];
        
        // Decrement player count
        connectedPlayers--;
        
        // Notify remaining clients
        io.emit('playerLeft', { count: connectedPlayers });
        
        // If game was in progress, pause it
        if (gameInProgress && connectedPlayers < 2) {
            gameInProgress = false;
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

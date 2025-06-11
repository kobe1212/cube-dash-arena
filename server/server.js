const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Game state
let connectedPlayers = 0;
let gameInProgress = false;

// Socket.IO connection handling
io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);
    
    // Increment player count
    connectedPlayers++;
    
    // Notify all clients about new player
    io.emit('playerJoined', { count: connectedPlayers });
    
    // Handle player movement
    socket.on('move', data => {
        // Broadcast movement to all other clients
        socket.broadcast.emit('move', data);
    });
    
    // Handle player collision
    socket.on('collision', data => {
        // Broadcast collision to all clients
        io.emit('playerHit', data);
        gameInProgress = false;
    });
    
    // Handle game reset
    socket.on('reset', () => {
        console.log('Game reset requested');
        gameInProgress = true;
        io.emit('gameReset');
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
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

// Define port (use environment variable if available for deployment)
const PORT = process.env.PORT || 3000;

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Use environment variable for port or default to 3001
const PORT = process.env.PORT || 3001;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Redirect root to lobby
app.get('/', (req, res) => {
    res.redirect('/lobby.html');
});

// Game state
let connectedPlayers = 0;
let gameInProgress = false;
let obstacles = [];
let playerRoles = {}; // Track which player is player1 vs player2

// Lobby state
let lobbyPlayers = [];
let leaderboard = [];

// Load leaderboard from file if exists
const leaderboardPath = path.join(__dirname, 'leaderboard.json');
try {
    if (fs.existsSync(leaderboardPath)) {
        const data = fs.readFileSync(leaderboardPath, 'utf8');
        leaderboard = JSON.parse(data);
        console.log('Leaderboard loaded:', leaderboard.length, 'entries');
    }
} catch (err) {
    console.error('Error loading leaderboard:', err);
    leaderboard = [];
}

// Save leaderboard to file
function saveLeaderboard() {
    try {
        fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard), 'utf8');
        console.log('Leaderboard saved');
    } catch (err) {
        console.error('Error saving leaderboard:', err);
    }
}

// Update player score in leaderboard
function updateLeaderboard(playerName, score) {
    // Find existing player or create new entry
    let player = leaderboard.find(p => p.name === playerName);
    
    if (!player) {
        player = {
            name: playerName,
            score: 0,
            highScore: 0,
            games: 0
        };
        leaderboard.push(player);
    }
    
    // Update stats
    player.games++;
    player.score += score;
    player.highScore = Math.max(player.highScore, score);
    
    // Sort leaderboard by high score
    leaderboard.sort((a, b) => b.highScore - a.highScore);
    
    // Save to file
    saveLeaderboard();
    
    // Emit updated leaderboard to all clients
    io.emit('leaderboardUpdate', leaderboard);
}

// Socket.IO connection handling
io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);
    
    // Send current leaderboard to new connection
    socket.emit('leaderboardUpdate', leaderboard);
    
    // Handle player joining lobby
    socket.on('joinLobby', data => {
        const playerName = data.name || 'Anonymous';
        
        // Add player to lobby
        const player = {
            id: socket.id,
            name: playerName,
            isReady: false,
            role: lobbyPlayers.length === 0 ? 'player1' : 'player2' // First player is player1, others are player2
        };
        
        lobbyPlayers.push(player);
        
        // Notify player they've joined and their role
        socket.emit('playerJoined', { 
            id: socket.id, 
            name: playerName,
            role: player.role,
            isPlayer1: player.role === 'player1'
        });
        
        // Update all clients with new lobby state
        io.emit('lobbyUpdate', { players: lobbyPlayers });
        
        console.log(`${playerName} joined the lobby as ${player.role}. Total players: ${lobbyPlayers.length}`);
    });
    
    // Handle player ready status
    socket.on('playerReady', data => {
        const player = lobbyPlayers.find(p => p.id === socket.id);
        if (player) {
            player.isReady = data.ready;
            io.emit('lobbyUpdate', { players: lobbyPlayers });
        }
    });
    
    // Handle game start request
    socket.on('startGame', () => {
        // Check if this player is the host (first player in the lobby)
        if (lobbyPlayers.length > 0 && lobbyPlayers[0].id === socket.id) {
            // Check if enough players are ready
            const readyPlayers = lobbyPlayers.filter(p => p.isReady).length;
            if (readyPlayers >= 1) { // Allow starting with at least 1 ready player (for testing)
                console.log('Game starting...');
                io.emit('gameStarting');
                
                // Assign player roles for the game
                playerRoles = {};
                lobbyPlayers.forEach((player, index) => {
                    const role = index === 0 ? 'player1' : 'player2';
                    playerRoles[player.id] = role;
                    
                    // Send role information to each player
                    io.to(player.id).emit('playerRole', {
                        role: role,
                        playerId: player.id,
                        isPlayer1: role === 'player1'
                    });
                    
                    console.log(`Assigned ${player.name} as ${role}`);
                });
                
                gameInProgress = true;
                obstacles = [];
            }
        }
    });
    
    // Game-specific events
    
    // Handle player movement
    socket.on('move', data => {
        // Add player role and name to movement data
        const player = lobbyPlayers.find(p => p.id === socket.id);
        if (player) {
            data.role = playerRoles[socket.id];
            data.name = player.name;
            // Broadcast movement to all other clients
            socket.broadcast.emit('move', data);
        }
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
        const player = lobbyPlayers.find(p => p.id === socket.id);
        if (player) {
            data.role = playerRoles[socket.id];
            data.name = player.name;
            io.emit('playerHit', data);
            gameInProgress = false;
            
            // Update leaderboard with player's score
            updateLeaderboard(player.name, data.score || 0);
        }
    });
    
    // Handle player hit event
    socket.on('playerHit', data => {
        console.log('Player hit event received:', data);
        
        // Broadcast the hit to all clients
        socket.broadcast.emit('playerHit', data);
        
        // If this is player1 (host), mark the game as potentially ending
        if (playerRoles[socket.id] === 'player1') {
            console.log('Player 1 was hit, game may be ending soon');
        }
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
        
        // Remove player from lobby
        const playerIndex = lobbyPlayers.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
            lobbyPlayers.splice(playerIndex, 1);
            io.emit('lobbyUpdate', { players: lobbyPlayers });
        }
        
        // Remove player from roles
        delete playerRoles[socket.id];
        
        // Decrement player count
        connectedPlayers--;
        
        // Notify remaining clients
        io.emit('playerLeft', { count: connectedPlayers });
        
        // If game was in progress, pause it
        if (gameInProgress) {
            gameInProgress = false;
            io.emit('gamePaused', { reason: 'Player disconnected' });
        }
    });
});

// Error handling to prevent crashes
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep the process alive
process.stdin.resume();

// Start the server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});

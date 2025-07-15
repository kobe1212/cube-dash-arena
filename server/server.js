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
let playerRoles = {}; // Track which player is player1 vs player2

// Arena state
let arenas = {}; // Store arena-specific data

// Obstacle management
let obstacles = {}; // Store active obstacles per arena

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
    
    // Handle joining an arena
    socket.on('join-arena', (data) => {
        const arenaName = data.arena || 'main-arena';
        const playerName = data.name || 'Anonymous';
        
        // Leave any previous arenas
        Object.keys(socket.rooms).forEach(room => {
            if (room !== socket.id && room.startsWith('arena:')) {
                socket.leave(room);
            }
        });
        
        // Join the new arena
        const arenaRoom = `arena:${arenaName}`;
        socket.join(arenaRoom);
        
        // Initialize arena if it doesn't exist
        if (!arenas[arenaName]) {
            arenas[arenaName] = {
                players: [],
                obstacles: [],
                gameInProgress: false,
                obstacleSpawningActive: false
            };
        }
        
        // Add player to arena
        const arenaPlayer = {
            id: socket.id,
            name: playerName,
            role: arenas[arenaName].players.length === 0 ? 'player1' : 'player2'
        };
        
        arenas[arenaName].players.push(arenaPlayer);
        
        console.log(`Player ${socket.id} (${playerName}) joined arena: ${arenaName} as ${arenaPlayer.role}`);
        
        // Notify other players in the arena
        socket.to(arenaRoom).emit('player-joined', { 
            id: socket.id,
            name: playerName,
            role: arenaPlayer.role
        });
        
        // Send arena info to the player
        socket.emit('arena-joined', {
            arena: arenaName,
            players: arenas[arenaName].players,
            role: arenaPlayer.role,
            isPlayer1: arenaPlayer.role === 'player1'
        });
    });
    
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
        // Check if this is an arena-based movement
        if (data.arena) {
            const arenaRoom = `arena:${data.arena}`;
            // Only broadcast to players in the same arena
            socket.to(arenaRoom).emit('move', data);
            return;
        }
        
        // Legacy handling for non-arena movement
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
        // Check if this is an arena-based sync
        if (data.arena) {
            const arenaName = data.arena;
            const arenaRoom = `arena:${arenaName}`;
            
            // Check if arena exists
            if (!arenas[arenaName]) {
                return;
            }
            
            // Find player in arena
            const arenaPlayers = arenas[arenaName].players;
            const player = arenaPlayers.find(p => p.id === socket.id);
            
            // Only allow player1 to be the source of truth for obstacles
            if (player && player.role === 'player1') {
                arenas[arenaName].obstacles = data.obstacles;
                socket.to(arenaRoom).emit('syncObstacles', data);
            }
            return;
        }
        
        // Legacy handling for non-arena sync
        if (playerRoles[socket.id] === 'player1') {
            obstacles = data.obstacles;
            socket.broadcast.emit('obstaclesUpdate', { obstacles: obstacles });
        }
    });
    
    // Handle obstacle creation
    socket.on('obstacleCreated', data => {
        // Check if this is an arena-based obstacle
        if (data.arena) {
            const arenaName = data.arena;
            const arenaRoom = `arena:${arenaName}`;
            
            // Find player in arena
            if (arenas[arenaName]) {
                const player = arenas[arenaName].players.find(p => p.id === socket.id);
                
                // Only allow player1 to create obstacles
                if (player && player.role === 'player1') {
                    socket.to(arenaRoom).emit('obstacleCreated', data);
                }
            }
            return;
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
    
    // Handle game state update
    socket.on('gameState', data => {
    // Check if this is an arena-based game state update
    if (data.arena) {
        const arenaName = data.arena;
        const arenaRoom = `arena:${arenaName}`;
        
        // Update arena game state
        if (arenas[arenaName]) {
            arenas[arenaName].gameInProgress = data.gameStarted || false;
            
            // Start or stop obstacle spawning based on game state
            if (data.gameStarted && !arenas[arenaName].obstacleSpawningActive) {
                arenas[arenaName].obstacleSpawningActive = true;
                console.log(`Starting obstacle spawning for arena: ${arenaName}`);
            } else if (!data.gameStarted && arenas[arenaName].obstacleSpawningActive) {
                arenas[arenaName].obstacleSpawningActive = false;
                console.log(`Stopping obstacle spawning for arena: ${arenaName}`);
            }
        }
        
        // Broadcast to players in the same arena
        socket.to(arenaRoom).emit('gameState', data);
        return;
    }
    
    // Legacy handling for non-arena game state
    socket.broadcast.emit('gameState', data);
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
        io.emit('gameReset');
    });
    
    // Handle client requesting current obstacle state
    socket.on('requestObstacles', () => {
        // Send arena-specific obstacles if available
        const playerArena = Object.keys(socket.rooms).find(room => room.startsWith('arena:'));
        if (playerArena) {
            const arenaName = playerArena.replace('arena:', '');
            socket.emit('obstaclesUpdate', { obstacles: obstacles[arenaName] || [] });
        } else {
            socket.emit('obstaclesUpdate', { obstacles: [] });
        }
    });

// Keep the process alive
process.stdin.resume();

// Function to spawn obstacles in arenas
function spawnObstacle(arenaName) {
    if (!arenas[arenaName] || !arenas[arenaName].obstacleSpawningActive) {
        return; // Don't spawn if arena doesn't exist or spawning is inactive
    }
    
    const obstacleId = Date.now().toString() + Math.random().toString(36).substr(2, 5); // unique id
    
    // Create random obstacle data
    const obstacleData = {
        id: obstacleId,
        position: {
            x: (Math.random() - 0.5) * 20, // Random x position
            y: 20 + (Math.random() * 5),   // Start high above
            z: (Math.random() - 0.5) * 20  // Random z position
        },
        rotation: {
            x: Math.random() * Math.PI,
            y: Math.random() * Math.PI,
            z: Math.random() * Math.PI
        },
        userData: {
            baseSpeed: 0.05 + (Math.random() * 0.03), // Random fall speed
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.05,
                y: (Math.random() - 0.5) * 0.05,
                z: (Math.random() - 0.5) * 0.05
            }
        },
        // Random shape type (0-3 for different shapes)
        shapeType: Math.floor(Math.random() * 4),
        // Random color in HSL
        color: {
            h: Math.random(),
            s: 0.7 + Math.random() * 0.3,
            l: 0.4 + Math.random() * 0.3
        }
    };
    
    // Save obstacle in server memory
    if (!obstacles[arenaName]) obstacles[arenaName] = [];
    obstacles[arenaName].push(obstacleData);
    
    // Send to all players in the arena
    const arenaRoom = `arena:${arenaName}`;
    io.to(arenaRoom).emit('spawn-obstacle', obstacleData);
    
    // Log occasionally to avoid console spam
    if (Math.random() < 0.1) { // 10% chance to log
        console.log(`Obstacle ${obstacleId.substr(0, 8)}... spawned in ${arenaName}`);
    }
}

// Periodically spawn obstacles in active arenas
setInterval(() => {
    for (const arenaName in arenas) {
        if (arenas[arenaName].obstacleSpawningActive && arenas[arenaName].players.length > 0) {
            spawnObstacle(arenaName);
        }
    }
}, 2000); // Spawn every 2 seconds

    // Handle obstacle collision reporting
    socket.on('obstacle-collision', (data) => {
    if (data.arena && data.obstacleId) {
        const arenaName = data.arena;
        const arenaRoom = `arena:${arenaName}`;
        
        // Broadcast collision to all players in the arena
        socket.to(arenaRoom).emit('obstacle-collision', {
            obstacleId: data.obstacleId,
            playerId: data.playerId,
            playerRole: data.playerRole
        });
        
        // Remove obstacle from server memory
        if (obstacles[arenaName]) {
            const index = obstacles[arenaName].findIndex(o => o.id === data.obstacleId);
            if (index !== -1) {
                obstacles[arenaName].splice(index, 1);
            }
        }
    }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Remove player from all arenas
        Object.keys(arenas).forEach(arenaName => {
            const arena = arenas[arenaName];
            const playerIndex = arena.players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                const player = arena.players[playerIndex];
                arena.players.splice(playerIndex, 1);
                
                // Notify other players in the arena
                const arenaRoom = `arena:${arenaName}`;
                io.to(arenaRoom).emit('player-left', { 
                    id: socket.id,
                    name: player.name,
                    role: player.role
                });
                
                console.log(`Player ${socket.id} left arena: ${arenaName}`);
                
                // If arena is empty, clean it up
                if (arena.players.length === 0) {
                    delete arenas[arenaName];
                    console.log(`Arena ${arenaName} deleted (empty)`);
                }
            }
        });
        
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

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

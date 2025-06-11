// Socket.IO client setup
let socket;
let playerId;
let playerRole = null; // 'player1' or 'player2'
let gameStarted = false;

// Initialize socket connection when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Connect to the server
    connectToServer();
});

// Connect to the server
function connectToServer() {
    // Connect to the server (use the current host in production)
    const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
    socket = io(serverUrl);
    
    // Handle connection event
    socket.on('connect', () => {
        console.log('Connected to server');
        playerId = socket.id;
        
        // Create UI for game status
        createGameUI();
    });
    
    // Handle player role assignment
    socket.on('playerRole', (data) => {
        console.log('Assigned role:', data.role);
        playerRole = data.role;
        
        // If we're player2, request current obstacle state
        if (playerRole === 'player2') {
            socket.emit('requestObstacles');
        }
    });
    
    // Handle opponent movement
    socket.on('move', (data) => {
        if (window.gameModule) {
            window.gameModule.setOpponentPosition(data);
        }
    });
    
    // Handle obstacle updates from server
    socket.on('obstaclesUpdate', (data) => {
        console.log('Received obstacle update from server');
        if (window.gameModule && playerRole === 'player2') {
            window.gameModule.updateObstaclesFromServer(data.obstacles);
        }
    });
    
    // Handle player hit event
    socket.on('playerHit', (data) => {
        console.log('Player hit event received:', data);
        
        // Play game over sound
        if (window.soundManager) {
            window.soundManager.play('gameOver');
        }
        
        // Stop the game
        gameActive = false;
        
        if (window.gameModule) {
            window.gameModule.handlePlayerHit(data);
            
            // If this player was hit, show game over
            if (data.player === 'player1' && socket.id === playerId) {
                showGameOverMessage();
            }
        }
    });
    
    // Handle game reset
    socket.on('gameReset', () => {
        if (window.gameModule) {
            window.gameModule.resetGame();
            hideGameOver();
        }
    });
    
    // Handle new player joined
    socket.on('playerJoined', (data) => {
        updatePlayerCount(data.count);
        
        // Start game if we have 2 players
        if (data.count === 2 && !gameStarted) {
            startGame();
        }
    });
    
    // Handle player left
    socket.on('playerLeft', (data) => {
        updatePlayerCount(data.count);
        
        // If we're the only player left, wait for another player
        if (data.count === 1 && gameStarted) {
            pauseGame();
        }
    });
}

// Create game UI elements
function createGameUI() {
    // Create player count display
    const playerCountDiv = document.createElement('div');
    playerCountDiv.id = 'player-count';
    playerCountDiv.style.position = 'absolute';
    playerCountDiv.style.top = '10px';
    playerCountDiv.style.left = '10px';
    playerCountDiv.style.color = 'white';
    playerCountDiv.style.fontFamily = 'Arial, sans-serif';
    playerCountDiv.style.fontSize = '16px';
    playerCountDiv.style.padding = '5px';
    playerCountDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    playerCountDiv.style.borderRadius = '5px';
    playerCountDiv.textContent = 'Players: 1/2';
    document.body.appendChild(playerCountDiv);
    
    // Create waiting message
    const waitingDiv = document.createElement('div');
    waitingDiv.id = 'waiting-message';
    waitingDiv.style.position = 'absolute';
    waitingDiv.style.top = '50%';
    waitingDiv.style.left = '50%';
    waitingDiv.style.transform = 'translate(-50%, -50%)';
    waitingDiv.style.color = 'white';
    waitingDiv.style.fontFamily = 'Arial, sans-serif';
    waitingDiv.style.fontSize = '24px';
    waitingDiv.style.padding = '20px';
    waitingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    waitingDiv.style.borderRadius = '10px';
    waitingDiv.style.textAlign = 'center';
    waitingDiv.textContent = 'Waiting for another player...';
    document.body.appendChild(waitingDiv);
    
    // Create game over message (hidden initially)
    const gameOverDiv = document.createElement('div');
    gameOverDiv.id = 'game-over';
    gameOverDiv.style.position = 'absolute';
    gameOverDiv.style.top = '50%';
    gameOverDiv.style.left = '50%';
    gameOverDiv.style.transform = 'translate(-50%, -50%)';
    gameOverDiv.style.color = 'white';
    gameOverDiv.style.fontFamily = 'Arial, sans-serif';
    gameOverDiv.style.fontSize = '32px';
    gameOverDiv.style.padding = '20px';
    gameOverDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    gameOverDiv.style.borderRadius = '10px';
    gameOverDiv.style.textAlign = 'center';
    gameOverDiv.style.display = 'none';
    gameOverDiv.innerHTML = 'Game Over!<br><button id="restart-button">Play Again</button>';
    document.body.appendChild(gameOverDiv);
    
    // Add event listener to restart button
    document.getElementById('restart-button').addEventListener('click', () => {
        socket.emit('reset');
    });
}

// Update player count display
function updatePlayerCount(count) {
    const playerCountDiv = document.getElementById('player-count');
    if (playerCountDiv) {
        playerCountDiv.textContent = `Players: ${count}/2`;
    }
    
    // Show/hide waiting message based on player count
    const waitingDiv = document.getElementById('waiting-message');
    if (waitingDiv) {
        waitingDiv.style.display = count < 2 ? 'block' : 'none';
    }
}

// Start the game
function startGame() {
    gameStarted = true;
    
    if (window.gameModule) {
        window.gameModule.startGame();
    }
    
    // Hide waiting message
    const waitingDiv = document.getElementById('waiting-message');
    if (waitingDiv) {
        waitingDiv.style.display = 'none';
    }
}

// Pause the game
function pauseGame() {
    gameStarted = false;
    
    // Show waiting message
    const waitingDiv = document.getElementById('waiting-message');
    if (waitingDiv) {
        waitingDiv.style.display = 'block';
        waitingDiv.textContent = 'Other player left. Waiting for a new player...';
    }
}

// Show game over message
function showGameOver() {
    const gameOverDiv = document.getElementById('game-over');
    if (gameOverDiv) {
        gameOverDiv.style.display = 'block';
    }
}

// Hide game over message
function hideGameOver() {
    const gameOverDiv = document.getElementById('game-over');
    if (gameOverDiv) {
        gameOverDiv.style.display = 'none';
    }
}
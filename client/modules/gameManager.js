// THREE.js is loaded from CDN in the HTML file
const THREE = window.THREE;
import { OBSTACLE_SPAWN_INTERVAL } from './constants.js';

export class GameManager {
    constructor(sceneManager, arena, player, opponent, obstacleManager, soundManager, difficultyManager, playerName = 'Player') {
        this.sceneManager = sceneManager;
        this.arena = arena;
        this.player = player;
        this.opponent = opponent;
        this.obstacleManager = obstacleManager;
        this.soundManager = soundManager;
        this.difficultyManager = difficultyManager;
        
        this.isGameOver = false;
        this.isPlayer1 = false;
        this.isGameStarted = false;
        this.obstacleSpawnTimer = null;
        this.animationFrameId = null;
        this.scoreElement = document.getElementById('score');
        this.playerNameElement = document.getElementById('playerName');
        this.score = 0;
        this.socketManager = null; // Will be set after initialization
        
        // Position sync variables
        this.lastPositionSync = 0;
        this.positionSyncInterval = 33; // Sync position every 33ms (approximately 30 times per second)
        
        // Ensure playerName is a string, not an HTML element
        if (playerName && typeof playerName === 'object' && playerName.textContent) {
            this.playerName = playerName.textContent;
        } else {
            this.playerName = String(playerName || 'Player');
        }
        
        // Update player name in UI if element exists
        if (this.playerNameElement) {
            // Check if playerName already contains 'Player:' prefix to avoid duplication
            if (this.playerName.startsWith('Player:')) {
                this.playerNameElement.textContent = this.playerName;
            } else {
                this.playerNameElement.textContent = 'Player: ' + this.playerName;
            }
        }
        
        // FPS counter variables
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.startGame = this.startGame.bind(this);
        this.endGame = this.endGame.bind(this);
        this.resetGame = this.resetGame.bind(this);
        this.syncPlayerPosition = this.syncPlayerPosition.bind(this);
    }
    
    startGame(isPlayer1) {
        console.log('GameManager.startGame called with isPlayer1:', isPlayer1);
        try {
            this.isPlayer1 = isPlayer1;
            this.isGameOver = false;
            this.isGameStarted = true;
            this.score = 0;
            
            // Ensure scene is properly initialized for both Player 1 and Player 2
            if (this.sceneManager && this.sceneManager.scene) {
                console.log('Ensuring scene background is set to sky blue');
                this.sceneManager.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
                
                if (this.sceneManager.renderer) {
                    console.log('Ensuring renderer clear color is set to sky blue');
                    this.sceneManager.renderer.setClearColor(0x87CEEB, 1); // Sky blue with full opacity
                }
            }
            
            if (this.scoreElement) {
                this.scoreElement.textContent = this.score;
            }
            
            // Display role information to the player
            const roleInfo = document.getElementById('roleInfo');
            if (roleInfo) {
                if (isPlayer1) {
                    roleInfo.textContent = 'You are Player 1 (Host) - Blue Cube';
                    roleInfo.style.color = '#3498db'; // Blue text
                } else {
                    roleInfo.textContent = 'You are Player 2 - Red Cube';
                    roleInfo.style.color = '#e74c3c'; // Red text
                }
            }
            
            // Clear any existing obstacles
            if (this.obstacleManager) {
                this.obstacleManager.clearObstacles();
            } else {
                console.error('obstacleManager is not initialized');
            }
            
            // Reset player positions
            if (this.player) {
                this.player.reset();
            } else {
                console.error('player is not initialized');
            }
            
            if (this.opponent) {
                this.opponent.reset();
            } else {
                console.log('opponent is not initialized (may be single player mode)');
            }
            
            // Start obstacle spawning if we're player 1
            if (this.isPlayer1) {
                this.startObstacleSpawning();
            }
            
            // Cancel any existing animation frame
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            
            // Force animation to start immediately
            console.log('Starting animation loop');
            this.animate();
            
            // Update debug info
            const animStatus = document.getElementById('animStatus');
            if (animStatus) {
                animStatus.textContent = 'Starting...';
                animStatus.style.color = 'orange';
            }
            
            // Start difficulty progression
            if (this.difficultyManager) {
                this.difficultyManager.start();
            } else {
                console.error('difficultyManager is not initialized');
            }
            
            // Play start sound
            if (this.soundManager) {
                this.soundManager.playGameStartSound();
            } else {
                console.error('soundManager is not initialized');
            }
            
            console.log('Game started successfully');
        } catch (error) {
            console.error('Error in startGame:', error);
        }
    }
    
    startObstacleSpawning() {
        // Clear any existing timer
        if (this.obstacleSpawnTimer) {
            clearInterval(this.obstacleSpawnTimer);
            this.obstacleSpawnTimer = null;
        }
        
        // Notify server to start spawning obstacles for this arena
        if (this.socketManager) {
            console.log('Notifying server to start obstacle spawning');
            this.socketManager.emitGameState({
                gameStarted: true,
                arena: this.socketManager.arenaName
            });
        }
        
        // Client-side obstacle spawning is disabled since the server now handles it
        console.log('Using server-controlled obstacle spawning');
        
        // Note: We no longer need the old client-side obstacle spawning code
        // since the server is now responsible for spawning obstacles
    }
    
    // Sync all obstacles from Player 1 to Player 2
    syncAllObstacles() {
        if (this.isPlayer1 && this.socketManager && this.obstacleManager) {
            const allObstacles = this.obstacleManager.getAllObstacles();
            if (allObstacles && allObstacles.length > 0) {
                console.log('Syncing all obstacles to Player 2:', allObstacles.length);
                this.socketManager.emitSyncObstacles(allObstacles);
            }
        }
    }
    
    // Sync player position with other clients
    syncPlayerPosition() {
        if (this.player && this.socketManager && !this.isGameOver) {
            // Get current position
            const position = this.player.getPosition();
            
            // Add additional data to help with synchronization
            const positionData = {
                ...position,
                timestamp: Date.now(),
                isJumping: this.player.isJumping,
                velocityY: this.player.velocity ? this.player.velocity.y : 0
            };
            
            // Send position update to server
            this.socketManager.emitPlayerMove(positionData);
            
            // Debug log every 30 position updates (approximately once per second)
            if (Math.random() < 0.03) {
                console.log('Sending position update:', positionData);
            }
        }
    }
    
    animate(timestamp) {
        try {
            // Request next frame first to ensure smooth animation
            this.animationFrameId = requestAnimationFrame(this.animate);
            
            // Calculate FPS
            this.frameCount++;
            const now = performance.now();
            if (now - this.lastTime >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastTime = now;
                
                // Update FPS counter if element exists
                const fpsCounter = document.getElementById('fpsCounter');
                if (fpsCounter) {
                    fpsCounter.textContent = `FPS: ${this.fps}`;
                }
            }
            
            // Sync player position periodically
            if (now - this.lastPositionSync >= this.positionSyncInterval) {
                this.syncPlayerPosition();
                this.lastPositionSync = now;
            }
            
            // Update animation status in debug panel
            const animStatus = document.getElementById('animStatus');
            if (animStatus) {
                animStatus.textContent = 'Running';
                animStatus.style.color = 'green';
            }
            
            // Update renderer status
            const rendererStatus = document.getElementById('rendererStatus');
            if (rendererStatus && this.sceneManager && this.sceneManager.renderer) {
                rendererStatus.textContent = 'Active';
                rendererStatus.style.color = 'green';
            }
            
            // Update player and opponent positions
            if (this.player) {
                this.player.update();
            }
            
            if (this.opponent) {
                this.opponent.update();
            }
            
            // Get current obstacle speed from difficulty manager
            let speedMultiplier = 1;
            try {
                if (this.difficultyManager && typeof this.difficultyManager.getObstacleSpeed === 'function') {
                    // Convert obstacle speed to a multiplier (relative to base speed)
                    const baseSpeed = 0.05; // Should match DifficultyManager.baseObstacleSpeed
                    const currentSpeed = this.difficultyManager.getObstacleSpeed();
                    speedMultiplier = currentSpeed / baseSpeed;
                }
            } catch (error) {
                console.warn('Error getting obstacle speed:', error);
                // Use default multiplier of 1
            }
            
            // Update obstacles
            if (this.obstacleManager) {
                const obstacleData = this.obstacleManager.updateObstacles(speedMultiplier);
                
                // Sync obstacles if we're player 1
                if (this.isPlayer1 && this.socketManager && obstacleData && obstacleData.length > 0) {
                    this.socketManager.emitObstacleCreated(obstacleData);
                }
            }
            
            // Force render the scene with additional checks
            if (this.sceneManager) {
                // Check if the renderer is properly initialized
                if (this.sceneManager.renderer && typeof this.sceneManager.renderer.render === 'function') {
                    this.sceneManager.render();
                } else {
                    console.warn('Renderer not properly initialized in GameManager.animate()');
                    
                    // Update error log
                    const errorLog = document.getElementById('errorLog');
                    if (errorLog && !errorLog.textContent.includes('renderer')) {
                        errorLog.textContent = 'Warning: Renderer not fully initialized';
                        errorLog.style.color = 'orange';
                    }
                }
            }
            
            // Check for collisions - only if player exists
            if (this.player) {
                try {
                    // Only check opponent collisions if opponent exists and has a cube
                    const validOpponent = this.opponent && this.opponent.cube ? this.opponent : null;
                    const collisionResult = this.obstacleManager.checkCollisions(this.player, validOpponent);
                    
                    if (collisionResult) {
                        // Handle player collision
                        if (collisionResult.player && !this.player.isHit) {
                            this.player.markAsHit();
                            
                            // Report obstacle collision to server if we have an obstacle ID
                            if (this.socketManager && collisionResult.obstacleId) {
                                this.socketManager.reportObstacleCollision(collisionResult.obstacleId);
                            }
                            
                            // Emit player hit event
                            if (this.socketManager) {
                                this.socketManager.emitPlayerHit();
                            }
                            
                            // Play collision sound
                            if (this.soundManager) {
                                this.soundManager.playCollisionSound();
                            }
                            
                            this.checkGameOver();
                        }
                        
                        // Only process opponent collisions if opponent exists
                        if (this.opponent && collisionResult.opponent && !this.opponent.isHit) {
                            this.opponent.markAsHit();
                            
                            // Play opponent hit sound
                            if (this.soundManager) {
                                this.soundManager.playOpponentHitSound();
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error in collision detection:', error);
                }
            }
            
            // Update score if game is still active
            if (!this.isGameOver) {
                this.score += 1;
                if (this.scoreElement) {
                    this.scoreElement.textContent = Math.floor(this.score / 60);
                }
                
                // Position sync is already handled earlier in the animate method
            }
        } catch (error) {
            // Enhanced error logging with detailed information
            const errorDetails = {
                message: error.message || 'Unknown error',
                stack: error.stack || 'No stack trace available',
                name: error.name || 'Error'
            };
            
            console.error('Error in animate loop:', errorDetails);
            
            // Update error log in UI
            const errorLog = document.getElementById('errorLog');
            if (errorLog) {
                errorLog.textContent = 'Animation error: ' + errorDetails.message;
                errorLog.style.color = 'red';
                // Add tooltip with stack trace
                errorLog.title = errorDetails.stack;
            }
            
            // Don't stop the animation loop on error
            this.animationFrameId = requestAnimationFrame(this.animate);
        }
    }
    
    // Sync all obstacles from Player 1 to Player 2
    syncAllObstacles() {
        if (this.isPlayer1 && this.socketManager && this.obstacleManager) {
            // Get all current obstacles with their positions and rotations
            const allObstacles = this.obstacleManager.getAllObstacles();
            
            // Only send if there are obstacles to sync
            if (allObstacles && allObstacles.length > 0) {
                console.log('Syncing all obstacles to Player 2:', allObstacles.length, 'obstacles');
                this.socketManager.emitSyncObstacles(allObstacles);
            }
        }
    }
    
    checkGameOver() {
        // Handle single player mode (no opponent)
        if (!this.opponent) {
            if (this.player.isHit) {
                this.endGame('lose');
            }
            return;
        }
        
        // Handle multiplayer mode
        if (this.player.isHit && this.opponent.isHit) {
            this.endGame('draw');
        } else if (this.player.isHit) {
            this.endGame('lose');
        } else if (this.opponent.isHit) {
            this.endGame('win');
        }
    }
    
    endGame(result) {
        this.isGameOver = true;
        
        // Stop obstacle spawning
        if (this.obstacleSpawnTimer) {
            clearInterval(this.obstacleSpawnTimer);
            this.obstacleSpawnTimer = null;
        }
        
        // Notify server to stop spawning obstacles for this arena
        if (this.socketManager) {
            console.log('Notifying server to stop obstacle spawning');
            this.socketManager.emitGameState({
                gameStarted: false,
                arena: this.socketManager.arenaName
            });
        }
        
        // Play game over sound
        if (this.soundManager) {
            this.soundManager.playGameOverSound();
        }
        
        // Send final score to server for leaderboard
        if (this.socketManager && this.playerName) {
            const finalScore = Math.floor(this.score / 60);
            this.socketManager.socket.emit('updateScore', {
                name: this.playerName,
                score: finalScore
            });
            console.log(`Sending final score: ${finalScore} for player: ${this.playerName}`);
        }
        
        // Stop difficulty progression
        if (this.difficultyManager) {
            this.difficultyManager.stop();
        }
        
        // Show game over message
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            let message = '';
            
            if (result === 'win') {
                message = 'You Win!';
            } else if (result === 'lose') {
                message = 'You Lose!';
            } else {
                message = 'Draw!';
            }
            
            gameOverElement.textContent = message;
            gameOverElement.style.display = 'block';
        }
        
        // Show restart button
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.style.display = 'block';
        }
    }
    
    resetGame() {
        // Hide game over message and restart button
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.style.display = 'none';
        }
        
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.style.display = 'none';
        }
        
        // Reset game state
        this.isGameOver = false;
        this.isGameStarted = false;
        this.score = 0;
        
        // Reset player
        if (this.player) {
            this.player.reset();
        }
        
        // Reset opponent if exists
        if (this.opponent) {
            this.opponent.reset();
        }
        
        // Clear obstacles
        this.obstacleManager.clearObstacles();
        
        // Reset score display
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
        
        // Emit reset game event
        if (this.socketManager) {
            this.socketManager.emitResetGame();
        }
        
        // Play game start sound
        if (this.soundManager) {
            this.soundManager.playGameStartSound();
        }
        
        // Start a new game
        this.startGame(this.isPlayer1);
    }
    
    stop() {
        // Stop animation loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Stop obstacle spawning
        if (this.obstacleSpawnTimer) {
            clearInterval(this.obstacleSpawnTimer);
            this.obstacleSpawnTimer = null;
        }
    }
}

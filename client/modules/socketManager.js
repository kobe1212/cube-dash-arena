// Socket.io is loaded from CDN in the HTML file
const io = window.io;

// Import constants for player positioning and THREE.js for color handling
import { GROUND_LEVEL, PLAYER_SIZE } from './constants.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

// Default arena name - can be changed to support multiple arenas
const DEFAULT_ARENA = 'main-arena';

export class SocketManager {
    constructor(playerName = 'Player') {
        this.socket = null;
        this.isConnected = false;
        this.gameManager = null;
        this.isPlayer1 = false; // Whether this client is player 1 (host)
        this.playerId = null;  // Unique ID for this player
        this.playerCount = 0;  // Initialize player count to 0
        this.arenaName = DEFAULT_ARENA; // Current arena name
        
        // Ensure playerName is a string, not an HTML element
        if (playerName && typeof playerName === 'object' && playerName.textContent) {
            this.playerName = playerName.textContent;
        } else {
            this.playerName = String(playerName || 'Player');
        }
        
        this.playerCountElement = document.getElementById('playerCount');
        this.waitingMessageElement = document.getElementById('waitingMessage');
        this.playerNameElement = document.getElementById('playerName');
        
        // Make playerCount accessible globally for other components
        if (window) {
            window.currentPlayerCount = 0;
        }
        
        console.log('SocketManager initialized with player name:', this.playerName);
    }
    
    connect() {
        // Connect to the server
        this.socket = io();
        
        // Setup socket event handlers
        this.setupSocketEvents();
        
        console.log('Socket connection initiated');
    }
    
    // Join a specific arena
    joinArena(arenaName = DEFAULT_ARENA) {
        if (!this.socket || !this.isConnected) {
            console.error('Cannot join arena: socket not connected');
            return;
        }
        
        this.arenaName = arenaName;
        this.socket.emit('join-arena', {
            arena: this.arenaName,
            name: this.playerName
        });
        
        console.log(`Joining arena: ${this.arenaName}`);
    }
    
    setGameManager(gameManager) {
        this.gameManager = gameManager;
        console.log('Game manager set in SocketManager');
    }
    
    // Update player count and waiting message in UI
    updatePlayerCountDisplay(count) {
        // Store the player count both locally and globally
        this.playerCount = count;
        if (window) {
            window.currentPlayerCount = count;
        }
        
        // Update player count display
        if (this.playerCountElement) {
            this.playerCountElement.textContent = `Players: ${count}/2`;
        }
        
        // Show/hide waiting message based on player count
        if (this.waitingMessageElement) {
            if (count < 2) {
                this.waitingMessageElement.textContent = 'Waiting for another player to join...';
                this.waitingMessageElement.style.display = 'block';
            } else {
                this.waitingMessageElement.style.display = 'none';
            }
        }
    }
    
    // Create opponent player with proper color and position
    createOpponentPlayer(initialPosition = null) {
        try {
            if (!this.gameManager) {
                console.error('Cannot create opponent: gameManager not initialized');
                return null;
            }
            
            if (!this.gameManager.sceneManager || !this.gameManager.sceneManager.scene) {
                console.error('Cannot create opponent: scene not initialized');
                return null;
            }
            
            // CRITICAL FIX: Import Player class directly from the module
            // This ensures we have access to the Player class even if window.Player is not set
            let Player;
            try {
                // Try to get Player from window first (set in main.js)
                Player = window.Player;
                console.log('Using Player class from window.Player');
                
                if (!Player) {
                    // If not available, try to import it dynamically
                    console.log('Player class not found in window, attempting to import directly');
                    throw new Error('Need to import Player directly');
                }
            } catch (e) {
                console.error('Failed to get Player class:', e);
                console.error('Cannot create opponent without Player class');
                return null;
            }
            
            console.log('Creating opponent player...');
            
            // FIRST: Clean up any existing opponent cubes to avoid duplicates
            // 1. Remove opponent from game manager if it exists
            if (this.gameManager.opponent) {
                if (this.gameManager.opponent.cube) {
                    console.log('Removing existing opponent cube from scene');
                    this.gameManager.sceneManager.scene.remove(this.gameManager.opponent.cube);
                }
                this.gameManager.opponent = null;
            }
            
            // 2. Check for any stray opponent cubes in the scene and remove them
            const existingOpponentCubes = this.gameManager.sceneManager.scene.children.filter(obj => obj.name === 'OpponentCube');
            existingOpponentCubes.forEach(cube => {
                console.log('Removing stray opponent cube from scene');
                this.gameManager.sceneManager.scene.remove(cube);
            });
            
            // 3. Create the opponent player with the correct color based on role
            const isOpponent = true;
            
            // IMPORTANT: Opponent role is the OPPOSITE of the local player's role
            const opponentRole = this.isPlayer1 ? 'player2' : 'player1';
            console.log(`Creating opponent with role: ${opponentRole}, local player is: ${this.isPlayer1 ? 'player1' : 'player2'}`);
            
            // First check if Player class is available
            if (typeof Player !== 'function') {
                console.error('Player class is not a constructor function:', Player);
                return null;
            }
            
            let opponent;
            try {
                opponent = new Player(
                    this.gameManager.sceneManager.scene,
                    isOpponent,
                    this.gameManager.sceneManager.textureUtils,
                    this.gameManager.soundManager,
                    opponentRole
                );
                
                // Make sure the opponent cube was created
                if (!opponent.cube) {
                    console.log('Opponent cube not created during construction, creating it now');
                    opponent.createCube();
                }
                
                // 4. Set opponent position if provided
                if (initialPosition) {
                    opponent.setPosition(initialPosition);
                } else {
                    // Default position for opponent (opposite side of arena)
                    opponent.position.x = -5;
                    opponent.position.y = GROUND_LEVEL + PLAYER_SIZE/2;
                    opponent.position.z = 0;
                }
                
                // 5. Force opponent cube color based on role
                if (opponent.cube && opponent.cube.material) {
                    // Player1 is ALWAYS blue, Player2 is ALWAYS red
                    const color = opponentRole === 'player1' ? 0x0000ff : 0xff0000;
                    opponent.cube.material.color.setHex(color);
                    console.log(`Set opponent cube color to ${color === 0x0000ff ? 'BLUE' : 'RED'} for role ${opponentRole}`);
                }
                
                // 6. Assign opponent to game manager
                this.gameManager.opponent = opponent;
                
                console.log('Opponent player created successfully');
                return opponent;
            } catch (e) {
                console.error('Error constructing opponent player:', e);
                return null;
            }
        } catch (error) {
            // More detailed error logging
            console.error('Error creating opponent player. Error details:');
            console.error('Error message:', error.message || 'No message');
            console.error('Error name:', error.name || 'No name');
            console.error('Error stack:', error.stack || 'No stack');
            
            // Log the state of important variables
            console.log('Debug state:', {
                'gameManager exists': !!this.gameManager,
                'sceneManager exists': !!(this.gameManager && this.gameManager.sceneManager),
                'scene exists': !!(this.gameManager && this.gameManager.sceneManager && this.gameManager.sceneManager.scene),
                'Player class exists': !!window.Player,
                'isPlayer1': this.isPlayer1,
                'initialPosition provided': !!initialPosition
            });
            
            return null;
        }
    }
    
    setupSocketEvents() {
        // Connection established
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('Connected to server');
            
            // Join the lobby with player name after connection
            setTimeout(() => {
                this.socket.emit('joinLobby', { name: this.playerName });
                console.log('Joined lobby as:', this.playerName);
                
                // Also join the default arena
                this.joinArena(this.arenaName);
            }, 500);
        });
        
        // Disconnection
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            console.log('Disconnected from server');
        });
        
        // Listen for player-joined event (new arena-based event)
        this.socket.on('player-joined', (data) => {
            console.log(`Player ${data.id} joined the arena`);
            
            // If we have a game manager, we might want to create a visual representation
            // of the new player in the game world
            if (this.gameManager && this.gameManager.opponent === null) {
                console.log('Creating opponent for newly joined player');
                this.createOpponentPlayer();
            }
        });
        
        // Player joined event - contains player info including role
        this.socket.on('playerJoined', (data) => {
            console.log('Player joined event received:', data);
            
            // Update player role
            if (data.id === this.socket.id) {
                this.isPlayer1 = data.isPlayer1 || data.role === 'player1';
                this.playerId = data.id;
                
                // Update player name in UI to include role
                if (this.playerNameElement) {
                    const roleText = this.isPlayer1 ? 'Player 1 (Host)' : 'Player 2';
                    
                    // Clean up the display name - remove any 'Player:' prefix
                    let displayName = this.playerName;
                    if (displayName.includes('Player:')) {
                        displayName = displayName.split('Player:')[1].trim();
                    }
                    
                    // Update UI with player name and role
                    this.playerNameElement.textContent = `${roleText}: ${displayName}`;
                }
                
                console.log(`You joined as: ${this.isPlayer1 ? 'Player 1 (Host)' : 'Player 2'}`);
                
                // CRITICAL: Set player role and color based on isPlayer1
                if (this.gameManager && this.gameManager.player) {
                    const playerRole = this.isPlayer1 ? 'player1' : 'player2';
                    this.gameManager.player.playerRole = playerRole;
                    
                    // Store the player role globally for reference
                    window.myPlayerRole = playerRole;
                    
                    console.log(`Setting local player role to ${playerRole}`);
                    
                    // Force the player cube color based on role
                    if (this.gameManager.player.cube && this.gameManager.player.cube.material) {
                        // Player1 is ALWAYS blue, Player2 is ALWAYS red
                        const color = this.isPlayer1 ? 0x0000ff : 0xff0000;
                        this.gameManager.player.cube.material.color.setHex(color);
                        console.log(`Set local player cube color to ${this.isPlayer1 ? 'BLUE' : 'RED'}`);
                    }
                }
                
                // No need to update player count here as it will be handled by the playerCount event
            }
        });
        
        // Add explicit playerRole event handler
        this.socket.on('playerRole', (data) => {
            console.log('Received explicit player role assignment:', data);
            
            // Store whether this client is player 1 (host)
            this.isPlayer1 = data.isPlayer1;
            
            // Store the player role globally for reference
            const playerRole = this.isPlayer1 ? 'player1' : 'player2';
            window.myPlayerRole = playerRole;
            
            console.log(`ROLE ASSIGNMENT: This client is ${playerRole} (isPlayer1: ${this.isPlayer1})`);
            
            // Update the local player's role and color
            if (this.gameManager && this.gameManager.player) {
                // Set the player role
                this.gameManager.player.playerRole = playerRole;
                
                console.log(`Setting local player role to ${playerRole}`);
                
                // Force the player cube color based on role
                if (this.gameManager.player.cube && this.gameManager.player.cube.material) {
                    // Player1 is ALWAYS blue, Player2 is ALWAYS red
                    const color = this.isPlayer1 ? 0x0000ff : 0xff0000;
                    this.gameManager.player.cube.material.color.setHex(color);
                    console.log(`Set local player cube color to ${this.isPlayer1 ? 'BLUE' : 'RED'}`);
                }
                
                // Remove any existing opponent before creating a new one
                if (this.gameManager.opponent) {
                    if (this.gameManager.opponent.cube) {
                        console.log('Removing existing opponent cube from scene before role-based recreation');
                        this.gameManager.sceneManager.scene.remove(this.gameManager.opponent.cube);
                    }
                    this.gameManager.opponent = null;
                }
                
                // Create opponent player with opposite role
                console.log('Creating opponent after role assignment');
                const opponent = this.createOpponentPlayer();
                
                if (opponent) {
                    console.log('Opponent created successfully after role assignment');
                } else {
                    console.error('Failed to create opponent after role assignment');
                }
            }
        });
        
        // Player count update (legacy event)
        this.socket.on('playerCount', (count) => {
            console.log('Player count update received:', count);
            
            // Use the centralized method to update player count display
            this.updatePlayerCountDisplay(count);
            
            // Create opponent player ONLY when a second player connects
            if (count >= 2 && this.gameManager) {
                try {
                    // Only create opponent if it doesn't exist yet
                    if (!this.gameManager.opponent) {
                        console.log('Creating opponent player - second player connected');
                        this.createOpponentPlayer();
                        console.log('Opponent created successfully, player count:', count);
                    }
                    
                    // Start the game if it's not already started and we have two players
                    if (!this.gameManager.isGameStarted) {
                        console.log('Two players connected, starting game...');
                        // Add a small delay to ensure everything is initialized
                        setTimeout(() => {
                            this.gameManager.startGame();
                        }, 1000);
                    }
                } catch (error) {
                    console.error('Error in player count handler:', error);
                }
            } else if (count < 2 && this.gameManager && this.gameManager.opponent) {
                try {
                    // Remove opponent when player count drops below 2
                    console.log('Removing opponent player - player disconnected');
                    if (this.gameManager.opponent.cube) {
                        this.gameManager.sceneManager.scene.remove(this.gameManager.opponent.cube);
                    }
                    this.gameManager.opponent = null;
                    console.log('Opponent removed successfully, player count:', count);
                } catch (error) {
                    console.error('Error removing opponent player:', error);
                }
            } else {
                console.log('No action needed for player count update, count:', count, 
                           'opponent exists:', Boolean(this.gameManager && this.gameManager.opponent));
            }
        });
        
        // Lobby update event - contains the full list of players
        this.socket.on('lobbyUpdate', (data) => {
            console.log('Lobby update received:', data);
            
            // Update player count from lobby data using centralized method
            if (data.players) {
                this.updatePlayerCountDisplay(data.players.length);
            }
            
            // Start the game when both players are present
            if (data.players && data.players.length >= 2 && this.gameManager && !this.gameManager.isGameStarted) {
                console.log('Both players present, starting game...');
                
                // Create opponent player if needed
                if (!this.gameManager.opponent) {
                    console.log('Creating opponent player from lobby update');
                    this.createOpponentPlayer();
                }
                
                // Start the game with a short delay to ensure opponent is created
                setTimeout(() => {
                    this.gameManager.startGame(true);
                    
                    // Update UI elements
                    const animStatus = document.getElementById('animStatus');
                    if (animStatus) {
                        animStatus.textContent = 'Game Started!';
                        animStatus.style.color = 'green';
                    }
                    
                    // Update player role display
                    this.updatePlayerRoleDisplay();
                }, 1500);
            }
        });
        
        // Obstacle synchronization events
        // Handle obstacle created by Player 1
        this.socket.on('obstacleCreated', (obstacleData) => {
            // Only process obstacles from the same arena
            const isFromSameArena = !obstacleData.arena || obstacleData.arena === this.arenaName;
            
            if (!this.isPlayer1 && isFromSameArena && this.gameManager && this.gameManager.obstacleManager) {
                console.log('Received obstacle data from Player 1:', obstacleData);
                // Create the obstacle in Player 2's game
                this.gameManager.obstacleManager.createObstacleFromData(obstacleData);
            }
        });
        
        // Handle full obstacle sync from Player 1
        this.socket.on('syncObstacles', (data) => {
            // Only process obstacles from the same arena
            const isFromSameArena = !data.arena || data.arena === this.arenaName;
            const allObstacles = data.obstacles || data; // Handle both formats for backward compatibility
            
            if (!this.isPlayer1 && isFromSameArena && this.gameManager && this.gameManager.obstacleManager) {
                console.log('Received full obstacle sync from Player 1:', 
                          Array.isArray(allObstacles) ? allObstacles.length : 'unknown', 'obstacles');
                // Sync all obstacles in Player 2's game
                this.gameManager.obstacleManager.syncObstaclesFromData(allObstacles);
            }
        });
        
        // Listen for server-spawned obstacles
        this.socket.on('spawn-obstacle', (data) => {
            console.log('Server spawned obstacle:', data.id);
            
            if (this.gameManager && this.gameManager.obstacleManager) {
                // Create the obstacle using the data from the server
                this.gameManager.obstacleManager.createServerObstacle(data);
            }
        });
        
        // Listen for obstacle collisions reported by other players
        this.socket.on('obstacle-collision', (data) => {
            if (this.gameManager && this.gameManager.obstacleManager) {
                // Remove the obstacle that collided with another player
                this.gameManager.obstacleManager.removeObstacle(data.obstacleId);
            }
        });
        
        // Player role assignment event
        this.socket.on('playerRole', (data) => {
            // Handle both formats of role data (for compatibility)
            if (data.role !== undefined) {
                this.isPlayer1 = data.role === 'player1';
            } else if (data.isPlayer1 !== undefined) {
                this.isPlayer1 = data.isPlayer1;
            }
            
            this.playerId = data.playerId || this.socket.id;
            const roleText = this.isPlayer1 ? 'Player 1 (Host)' : 'Player 2';
            console.log(`Assigned role: ${roleText}`);
            
            // Update player name in UI to include role
            if (this.playerNameElement) {
                // Get current player name without any role prefix
                let displayName = this.playerName;
                if (displayName.includes('Player:')) {
                    displayName = displayName.split('Player:')[1].trim();
                }
                
                // Update UI with player name and role
                this.playerNameElement.textContent = `${roleText}: ${displayName}`;
            }
            
            // Update player role display in UI
            this.updatePlayerRoleDisplay();
            
            // Start the game with the assigned role
            if (this.gameManager) {
                try {
                    // Make sure all required components are initialized
                    if (!this.gameManager.sceneManager || !this.gameManager.player) {
                        console.warn('Cannot start game: required components not initialized');
                        return;
                    }
                    
                    // FIRST: Clean up any existing opponent cubes to avoid duplicates
                    // 1. Remove opponent from game manager if it exists
                    if (this.gameManager.opponent) {
                        if (this.gameManager.opponent.cube) {
                            console.log('Removing existing opponent cube from scene');
                            this.gameManager.sceneManager.scene.remove(this.gameManager.opponent.cube);
                        }
                        
                        // Determine opponent role (opposite of local player)
                        const opponentRole = this.isPlayer1 ? 'player2' : 'player1';
                        console.log(`Local player is ${this.isPlayer1 ? 'player1' : 'player2'}, so opponent should be ${opponentRole}`);
                        
                        // Create opponent with the correct role
                        const opponent = this.createOpponentPlayer();
                        
                        // Double-check the opponent color based on its role
                        if (opponent && opponent.cube && opponent.cube.material) {
                            // Player1 is ALWAYS blue, Player2 is ALWAYS red
                            const opponentColor = opponentRole === 'player1' ? 0x0000ff : 0xff0000;
                            opponent.cube.material.color.setHex(opponentColor);
                            opponent.cube.name = 'OpponentCube'; // Ensure the cube has the correct name
                            console.log(`Opponent created with role ${opponentRole} and color ${opponentColor === 0x0000ff ? 'BLUE' : 'RED'}`);
                            
                            // Make sure the opponent is added to the scene
                            if (!this.gameManager.sceneManager.scene.children.includes(opponent.cube)) {
                                console.log('Adding opponent cube to scene');
                                this.gameManager.sceneManager.scene.add(opponent.cube);
                            }
                        } else {
                            console.error('Failed to create opponent properly');
                        }
                    }
                    
                    // Force scene background color
                    if (this.gameManager.sceneManager && this.gameManager.sceneManager.scene) {
                        this.gameManager.sceneManager.scene.background = new THREE.Color(0x87CEEB); // Sky blue
                    }
                    
                    // Force renderer clear color
                    if (this.gameManager.sceneManager && this.gameManager.sceneManager.renderer) {
                        this.gameManager.sceneManager.renderer.setClearColor(0x87CEEB); // Sky blue
                    }
                    
                    // Start the game with appropriate delay based on player role
                    if (this.playerCount >= 2) {
                        const startDelay = this.isPlayer1 ? 1000 : 1500; // Player 1 starts slightly earlier
                        console.log(`Starting game as ${roleText} in ${startDelay}ms`);
                        
                        setTimeout(() => {
                            this.gameManager.startGame(true);
                            console.log(`Game started as ${roleText}`);
                            
                            // Force a render to ensure visual updates appear
                            if (this.gameManager.sceneManager && this.gameManager.sceneManager.renderer) {
                                this.gameManager.sceneManager.renderer.render(
                                    this.gameManager.sceneManager.scene, 
                                    this.gameManager.sceneManager.camera
                                );
                            }
                        }, startDelay);
                    } else {
                        console.log('Waiting for second player before starting game');
                    }
                } catch (error) {
                    console.error('Error in playerRole handler:', error);
                }
            }
        });
        
        // Player movement events
        this.socket.on('move', (data) => {
            // Only process movement from the other player and from the same arena
            const isFromOpponent = (this.isPlayer1 && data.role === 'player2') || 
                                (!this.isPlayer1 && data.role === 'player1');
            const isFromSameArena = !data.arena || data.arena === this.arenaName;
            
            if (isFromOpponent && isFromSameArena && this.gameManager) {
                try {
                    // Determine opponent role based on the data
                    const opponentRole = data.role; // Use the role from the move data
                    
                    console.log(`Received move from ${opponentRole}, local player is ${this.isPlayer1 ? 'player1' : 'player2'}`);
                    
                    // CRITICAL FIX: Ensure we have a valid opponent player
                    if (!this.gameManager.opponent || !this.gameManager.opponent.cube) {
                        console.log('Creating or recreating opponent player from move event with role:', opponentRole);
                        
                        // Create opponent with the correct role
                        const opponent = this.createOpponentPlayer(data);
                        
                        if (opponent && opponent.cube && opponent.cube.material) {
                            // Force the correct color based on role
                            const expectedColor = opponentRole === 'player1' ? 0x0000ff : 0xff0000;
                            opponent.cube.material.color.setHex(expectedColor);
                            opponent.cube.name = 'OpponentCube'; // Ensure the cube has the correct name
                            console.log(`Opponent created with role ${opponentRole} and color ${expectedColor === 0x0000ff ? 'BLUE' : 'RED'}`);
                            
                            // Make sure the opponent is added to the scene
                            if (!this.gameManager.sceneManager.scene.children.includes(opponent.cube)) {
                                console.log('Adding opponent cube to scene');
                                this.gameManager.sceneManager.scene.add(opponent.cube);
                            }
                        } else {
                            console.error('Failed to create opponent properly');
                        }
                    } else {
                        // Update existing opponent
                        // Update position
                        this.gameManager.opponent.setPosition(data);
                        
                        // Update opponent role if needed
                        if (this.gameManager.opponent.playerRole !== opponentRole) {
                            console.log(`Updating opponent role from ${this.gameManager.opponent.playerRole} to ${opponentRole}`);
                            this.gameManager.opponent.playerRole = opponentRole;
                        }
                        
                        // FORCE opponent cube color based on role - this is critical
                        if (this.gameManager.opponent.cube.material) {
                            // Player1 is ALWAYS blue, Player2 is ALWAYS red
                            const color = opponentRole === 'player1' ? 0x0000ff : 0xff0000;
                            this.gameManager.opponent.cube.material.color.setHex(color);
                            
                            // Log color updates occasionally
                            if (Math.random() < 0.05) {
                                console.log(`Enforcing ${opponentRole} color: ${color === 0x0000ff ? 'BLUE' : 'RED'}`);
                            }
                        }
                        
                        // Log position updates occasionally for debugging
                        if (Math.random() < 0.02) { // ~2% chance to log
                            console.log('Opponent position updated:', data);
                        }
                    }
                } catch (error) {
                    console.error('Error processing opponent movement:', error);
                }
            }
        });
        
        // Game state events
        this.socket.on('gameState', (state) => {
            console.log('Game state update received:', state);
            
            if (this.gameManager) {
                // Update game state
                if (state.gameStarted !== undefined) {
                    this.gameManager.isGameStarted = state.gameStarted;
                }
                
                // Update score if provided
                if (state.score !== undefined && this.gameManager.updateScore) {
                    this.gameManager.updateScore(state.score);
                }
            }
        });
        
        // Game over event
        this.socket.on('gameOver', (data) => {
            console.log('Game over event received:', data);
            
            if (this.gameManager && this.gameManager.endGame) {
                this.gameManager.endGame(data.winner, data.score);
            }
        });
    }
    
    // Send player position to server
    emitPlayerMove(position) {
        if (this.socket && this.isConnected) {
            // Add player identification to position data
            const moveData = {
                ...position,
                playerId: this.playerId,
                role: this.isPlayer1 ? 'player1' : 'player2',
                arena: this.arenaName // Include arena information
            };
            console.log('[emit] Sending move:', moveData);
            this.socket.emit('move', moveData);
        }
    }
    
    // Send obstacle creation to server (Player 1 only)
    emitObstacleCreated(obstacleData) {
        if (this.socket && this.isConnected && this.isPlayer1) {
            // Include arena information in obstacle data
            const data = {
                ...obstacleData,
                arena: this.arenaName
            };
            this.socket.emit('obstacleCreated', data);
        }
    }
    
    reportObstacleCollision(obstacleId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('obstacle-collision', {
                obstacleId: obstacleId,
                playerId: this.playerId,
                playerRole: this.isPlayer1 ? 'player1' : 'player2',
                arena: this.arenaName
            });
        }
    }
    
    // Send full obstacle sync to server (Player 1 only)
    emitSyncObstacles(allObstacles) {
        if (this.socket && this.isConnected && this.isPlayer1) {
            this.socket.emit('syncObstacles', {
                obstacles: allObstacles,
                arena: this.arenaName // Include arena information
            });
        }
    }
    
    // Send game state update to server
    emitGameState(state) {
        if (this.socket && this.isConnected) {
            const gameStateData = {
                ...state,
                arena: this.arenaName // Include arena information
            };
            this.socket.emit('gameState', gameStateData);
        }
    }
    
    // Send game over event to server
    emitGameOver(data) {
        if (this.socket && this.isConnected) {
            const gameOverData = {
                ...data,
                arena: this.arenaName // Include arena information
            };
            this.socket.emit('gameOver', gameOverData);
        }
    }
}

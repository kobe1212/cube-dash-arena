// Main entry point for ES modules version
console.log('Loading ES modules version...');

// Export initGame function for external use
export function initGame(playerName) {
    console.log('initGame called with player name:', playerName);
    // Store player name for use in initialization
    window.playerName = playerName;
    // Initialize the game
    waitForThreeJs()
        .then(threeJs => {
            THREE = threeJs;
            initializeGame();
        })
        .catch(error => {
            console.error('Failed to initialize game:', error);
        });
}

// Get player name from URL parameters or from window.playerName
function getPlayerNameFromUrl() {
    // First check if we have a player name set by initGame
    if (window.playerName) {
        // Ensure it's a string, not an HTML element
        if (typeof window.playerName === 'object' && window.playerName.textContent) {
            return window.playerName.textContent;
        }
        return String(window.playerName);
    }
    
    // Otherwise get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('name') || 'Player';
}

// Wait for THREE.js to be available
function waitForThreeJs() {
    return new Promise((resolve, reject) => {
        // If THREE is already available, resolve immediately
        if (typeof window.THREE !== 'undefined') {
            console.log('THREE.js is already available:', window.THREE.REVISION);
            resolve(window.THREE);
            return;
        }
        
        // Otherwise wait for it to become available
        console.log('Waiting for THREE.js to load...');
        const maxAttempts = 50;
        let attempts = 0;
        
        const checkInterval = setInterval(() => {
            attempts++;
            if (typeof window.THREE !== 'undefined') {
                clearInterval(checkInterval);
                console.log('THREE.js is now available:', window.THREE.REVISION);
                resolve(window.THREE);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                const error = new Error('THREE.js failed to load after multiple attempts');
                console.error(error);
                document.getElementById('errorLog').textContent = error.message;
                document.getElementById('errorLog').style.color = 'red';
                reject(error);
            }
        }, 100);
    });
}

// Get THREE.js reference
let THREE;
waitForThreeJs()
    .then(threeJs => {
        THREE = threeJs;
        initializeGame();
    })
    .catch(error => {
        console.error('Failed to initialize game:', error);
    });

// Define THREE globally for modules that expect it
if (typeof window.THREE !== 'undefined') {
    THREE = window.THREE;
}

// Import modules - these will be used after THREE.js is loaded
import { SceneManager } from './scene.js';
import { Arena } from './arena.js';
import { Player } from './player.js';

// Import other modules
import { ObstacleManager } from './obstacles.js';
import { GameManager } from './gameManager.js';
import { SocketManager } from './socketManager.js';
import { TextureUtils } from './textures.js';
import { SoundManager } from '../sounds.js'; // Import from root directory
import { DifficultyManager } from './difficulty.js';

// Make Player class available globally for opponent creation
window.Player = Player;
console.log('Player class made available globally for multiplayer');

// Track initialization state
let gameInitialized = false;

// Main game initialization function
function initializeGame() {
    try {
        // Prevent multiple initializations
        if (gameInitialized) {
            console.warn('Game already initialized, skipping');
            return;
        }
        
        console.log('Cube Dash Arena - ES Modules version initializing...');
        gameInitialized = true;
        
        // Verify THREE.js is available
        if (!THREE || typeof THREE.REVISION === 'undefined') {
            throw new Error('THREE.js not properly loaded');
        }
        
        console.log('Initializing with THREE.js version:', THREE.REVISION);
        
        // Update loading status
        const errorLog = document.getElementById('errorLog');
        if (errorLog) {
            errorLog.textContent = 'Initializing game components...';
            errorLog.style.color = 'green';
        }
        
        // Initialize utility classes with error handling
        let textureUtils, soundManager, difficultyManager, sceneManager, arena, player, opponent, obstacleManager;
        
        try {
            console.log('Creating texture utils...');
            textureUtils = new TextureUtils();
        } catch (error) {
            console.error('Failed to initialize TextureUtils:', error);
            throw new Error('TextureUtils initialization failed: ' + error.message);
        }
        
        try {
            console.log('Creating sound manager...');
            soundManager = new SoundManager();
        } catch (error) {
            console.error('Failed to initialize SoundManager:', error);
            throw new Error('SoundManager initialization failed: ' + error.message);
        }
        
        try {
            console.log('Creating difficulty manager...');
            difficultyManager = new DifficultyManager();
        } catch (error) {
            console.error('Failed to initialize DifficultyManager:', error);
            throw new Error('DifficultyManager initialization failed: ' + error.message);
        }
        
        // Initialize scene
        try {
            console.log('Creating scene manager...');
            sceneManager = new SceneManager();
        } catch (error) {
            console.error('Failed to initialize SceneManager:', error);
            throw new Error('SceneManager initialization failed: ' + error.message);
        }
        
        // Initialize arena
        try {
            console.log('Creating arena...');
            arena = new Arena(sceneManager.scene, textureUtils, sceneManager.renderer);
        } catch (error) {
            console.error('Failed to initialize Arena:', error);
            throw new Error('Arena initialization failed: ' + error.message);
        }
        
        // Initialize player only (opponent will be created when needed)
        try {
            console.log('Creating player...');
            // Create player with isOpponent=false and null role (will be set later by socketManager)
            player = new Player(sceneManager.scene, false, textureUtils, soundManager, null);
            // Initialize opponent as null - will be created ONLY when a second player connects via socketManager
            opponent = null;
            
            // Log to confirm opponent is null at initialization
            console.log('Opponent initialized as null - will be created only when a second player connects');
        } catch (error) {
            console.error('Failed to initialize Player:', error);
            throw new Error('Player initialization failed: ' + error.message);
        }
        
        // Initialize obstacle manager
        try {
            console.log('Creating obstacle manager...');
            obstacleManager = new ObstacleManager(sceneManager.scene, textureUtils, difficultyManager);
        } catch (error) {
            console.error('Failed to initialize ObstacleManager:', error);
            throw new Error('ObstacleManager initialization failed: ' + error.message);
        }
        
        // Get player name from URL or use default
        const playerName = getPlayerNameFromUrl();
        console.log('Player name:', playerName);
        
        // Don't update player name in UI here - GameManager will handle it
        // This prevents duplicate 'Player:' prefix
        const playerNameElement = document.getElementById('playerName');
        if (playerNameElement) {
            // Clear any existing content, GameManager will set it properly
            playerNameElement.textContent = '';
        }
        
        // Initialize game manager with player name
        let gameManager, socketManager;
        try {
            console.log('Creating game manager...');
            gameManager = new GameManager(
                sceneManager,
                arena,
                player,
                opponent,
                obstacleManager,
                soundManager,
                difficultyManager,
                playerName
            );
            
            // Make gameManager available globally for debugging
            window.gameManager = gameManager;
            
            // Update status
            const errorLog = document.getElementById('errorLog');
            if (errorLog) {
                errorLog.textContent = 'Game manager initialized successfully';
                errorLog.style.color = 'green';
            }
        } catch (error) {
            console.error('Failed to initialize GameManager:', error);
            throw new Error('GameManager initialization failed: ' + error.message);
        }
        
        // Initialize socket manager with player name
        try {
            console.log('Creating socket manager...');
            socketManager = new SocketManager(playerName);
            
            // Set socket manager on game manager after initialization
            gameManager.socketManager = socketManager;
            
            // Set game manager on socket manager after initialization
            socketManager.gameManager = gameManager;
        } catch (error) {
            console.error('Failed to initialize SocketManager:', error);
            throw new Error('SocketManager initialization failed: ' + error.message);
        }
        
        // Setup restart button
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                gameManager.resetGame();
            });
        }
        
        // Setup mute button
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.addEventListener('click', () => {
                soundManager.toggleMute();
                muteButton.textContent = soundManager.isMuted ? '🔇' : '🔊';
            });
        }
        
        // Initialize socket connection after game setup
        socketManager.connect();
        
        // Debug info
        console.log('Socket manager initialized');
        
        // In multiplayer mode, wait for socket events to start the game
        // Only hide the loading overlay, but don't start the game yet
        console.log('Waiting for players to join before starting game...');
        
        // Update waiting message
        const waitingMessageElement = document.getElementById('waitingMessage');
        if (waitingMessageElement) {
            waitingMessageElement.style.display = 'block';
            waitingMessageElement.textContent = 'Waiting for another player to join...';
        }
        
        // Update debug info
        const animStatus = document.getElementById('animStatus');
        if (animStatus) {
            animStatus.textContent = 'Waiting for players...';
            animStatus.style.color = 'orange';
        }
        
        // Hide loading overlay if it exists
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }
        
        // Store references in window for debugging
        window.gameManager = gameManager;
        window.sceneManager = sceneManager;
        
        console.log('Game initialization complete');
    } catch (error) {
        console.error('Error initializing game:', error);
        
        // Provide detailed error information
        const errorLog = document.getElementById('errorLog');
        if (errorLog) {
            errorLog.textContent = 'Initialization error: ' + error.message;
            errorLog.style.color = 'red';
        }
        
        // Update animation status
        const animStatus = document.getElementById('animStatus');
        if (animStatus) {
            animStatus.textContent = 'Initialization Failed';
            animStatus.style.color = 'red';
        }
        
        // Update renderer status
        const rendererStatus = document.getElementById('rendererStatus');
        if (rendererStatus) {
            rendererStatus.textContent = 'Renderer Error';
            rendererStatus.style.color = 'red';
        }
        
        // Try to recover by making a second attempt with a delay
        console.log('Attempting recovery in 2 seconds...');
        setTimeout(() => {
            try {
                if (!gameInitialized) {
                    console.log('Making second attempt to initialize game...');
                    gameInitialized = false; // Reset flag to allow another attempt
                    initializeGame();
                }
            } catch (recoveryError) {
                console.error('Recovery attempt failed:', recoveryError);
            }
        }, 2000);
    }
}

// Initialize the game when the window loads - this is a backup in case the async loading fails
window.addEventListener('load', () => {
    // If THREE.js is available and game hasn't been initialized yet, initialize it
    if (typeof window.THREE !== 'undefined' && !gameInitialized) {
        console.log('Window loaded, THREE.js available, initializing game...');
        THREE = window.THREE;
        initializeGame();
    } else if (!gameInitialized) {
        console.log('Window loaded but waiting for THREE.js to load...');
    }
});

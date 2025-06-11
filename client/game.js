// Main game variables
let scene, camera, renderer;
let playerCube, opponentCube;
let arena;
let obstacles = [];
let gameActive = false;
let playerControls = { left: false, right: false, jump: false };
let playerVelocity = { x: 0, y: 0, z: 0 };
let gravity = 0.005;

// Time tracking for smooth animations
let clock = null;
let deltaTime = 0;
let lastTime = 0;
let syncTimer = 0;
const SYNC_INTERVAL = 100; // Sync obstacles every 100ms instead of every frame

// Scoring system
let gameStartTime = 0;
let currentScore = 0;
let highScore = 0;
let scoreInterval = null;

// Game constants
const ARENA_SIZE = 10;
const CUBE_SIZE = 0.5;
const NUM_OBSTACLES = 20;
const OBSTACLE_SIZE = 0.7;
const OBSTACLE_SPAWN_HEIGHT = 15;
const JUMP_FORCE = 0.15;
const MOVE_SPEED = 0.1;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Create arena
    createArena();
    
    // Create player cube
    createPlayerCube();
    
    // Create opponent cube (initially hidden)
    createOpponentCube();
    
    // Create obstacles
    createObstacles();
    
    // Add event listeners for controls
    setupControls();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    clock = new THREE.Clock();
    animate();
}

// Create the arena floor and walls
function createArena() {
    // Floor with grid texture
    const floorGeometry = new THREE.BoxGeometry(ARENA_SIZE, 0.5, ARENA_SIZE);
    const floorTexture = window.textureUtils.createGridTexture();
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.7,
        map: floorTexture
    });
    arena = new THREE.Mesh(floorGeometry, floorMaterial);
    arena.position.y = -0.25;
    arena.receiveShadow = true;
    scene.add(arena);
    
    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x505050,
        transparent: true,
        opacity: 0.3
    });
    
    // North wall
    const northWall = new THREE.Mesh(
        new THREE.BoxGeometry(ARENA_SIZE, 2, 0.1),
        wallMaterial
    );
    northWall.position.set(0, 1, -ARENA_SIZE/2);
    scene.add(northWall);
    
    // South wall
    const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(ARENA_SIZE, 2, 0.1),
        wallMaterial
    );
    southWall.position.set(0, 1, ARENA_SIZE/2);
    scene.add(southWall);
    
    // East wall
    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 2, ARENA_SIZE),
        wallMaterial
    );
    eastWall.position.set(ARENA_SIZE/2, 1, 0);
    scene.add(eastWall);
    
    // West wall
    const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 2, ARENA_SIZE),
        wallMaterial
    );
    westWall.position.set(-ARENA_SIZE/2, 1, 0);
    scene.add(westWall);
}

// Create the player's cube
function createPlayerCube() {
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    
    // Use green for player1 and red for player2
    const playerColor = (typeof playerRole !== 'undefined' && playerRole === 'player2') ? '#ff0000' : '#00ff00';
    const playerHexColor = (typeof playerRole !== 'undefined' && playerRole === 'player2') ? 0xff0000 : 0x00ff00;
    
    console.log('Creating player cube with color:', playerColor, 'for role:', playerRole);
    
    const playerTexture = window.textureUtils.createCubeTexture(playerColor);
    const material = new THREE.MeshStandardMaterial({ 
        color: playerHexColor,
        map: playerTexture,
        roughness: 0.5,
        metalness: 0.2
    });
    playerCube = new THREE.Mesh(geometry, material);
    playerCube.position.set(-2, 0.25, 0);
    playerCube.castShadow = true;
    playerCube.receiveShadow = true;
    scene.add(playerCube);
}

// Create the opponent's cube
function createOpponentCube() {
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    
    // Use opposite color of player (red for player1's opponent, green for player2's opponent)
    const opponentColor = (typeof playerRole !== 'undefined' && playerRole === 'player2') ? '#00ff00' : '#ff0000';
    const opponentHexColor = (typeof playerRole !== 'undefined' && playerRole === 'player2') ? 0x00ff00 : 0xff0000;
    
    console.log('Creating opponent cube with color:', opponentColor, 'for player role:', playerRole);
    
    const opponentTexture = window.textureUtils.createCubeTexture(opponentColor);
    const material = new THREE.MeshStandardMaterial({ 
        color: opponentHexColor,
        map: opponentTexture,
        roughness: 0.5,
        metalness: 0.2
    });
    opponentCube = new THREE.Mesh(geometry, material);
    opponentCube.position.set(2, 0.25, 0);
    opponentCube.castShadow = true;
    opponentCube.receiveShadow = true;
    opponentCube.visible = false; // Initially hidden until another player joins
    scene.add(opponentCube);
}

// Create obstacles
function createObstacles() {
    for (let i = 0; i < NUM_OBSTACLES; i++) {
        createObstacle();
    }
    
    // Start with base obstacle speed
    if (window.difficultyManager) {
        window.difficultyManager.reset();
    }
}

// Create a single obstacle
function createObstacle() {
    const geometry = new THREE.BoxGeometry(OBSTACLE_SIZE, OBSTACLE_SIZE, OBSTACLE_SIZE);
    // Generate a random color for the obstacle
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const hexColor = '#' + color.getHexString();
    const obstacleTexture = window.textureUtils.createCubeTexture(hexColor);
    const material = new THREE.MeshStandardMaterial({ 
        color: color,
        map: obstacleTexture,
        roughness: 0.5,
        metalness: 0.3
    });
    const obstacle = new THREE.Mesh(geometry, material);
    
    // Set initial position
    obstacle.position.x = (Math.random() - 0.5) * (ARENA_SIZE - OBSTACLE_SIZE);
    obstacle.position.y = OBSTACLE_SPAWN_HEIGHT + (Math.random() * 10); // Stagger heights
    obstacle.position.z = (Math.random() - 0.5) * (ARENA_SIZE - OBSTACLE_SIZE);
    
    // Base speed that will be modified by difficulty manager
    const baseSpeed = 0.05 + (Math.random() * 0.03); // Random base speed
    
    // Add custom properties
    obstacle.userData = {
        baseSpeed: baseSpeed,
        velocity: baseSpeed, // Will be updated by difficulty manager
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.05,
            z: (Math.random() - 0.5) * 0.05
        }
    };
    
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Handle keyboard controls
function handleKeyDown(event) {
    if (!gameActive) return;
    
    switch(event.key) {
        case 'ArrowLeft':
        case 'a':
            playerControls.left = true;
            break;
        case 'ArrowRight':
        case 'd':
            playerControls.right = true;
            break;
        case 'ArrowUp':
        case 'w':
        case ' ':
            if (!playerControls.jump && playerCube.position.y <= 0.25) {
                playerVelocity.y = JUMP_FORCE;
                playerControls.jump = true;
                
                // Play jump sound
                if (window.soundManager) {
                    window.soundManager.play('jump');
                }
            }
            break;
    }
}

// Handle keyboard controls release
function handleKeyUp(event) {
    switch(event.key) {
        case 'ArrowLeft':
        case 'a':
            playerControls.left = false;
            break;
        case 'ArrowRight':
        case 'd':
            playerControls.right = false;
            break;
    }
}

// Set up keyboard controls
function setupControls() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update player position based on controls
function updatePlayerPosition() {
    // Apply gravity
    playerVelocity.y -= gravity;
    
    // Handle left/right movement
    playerVelocity.x = 0;
    if (playerControls.left) {
        playerVelocity.x = -MOVE_SPEED;
    }
    if (playerControls.right) {
        playerVelocity.x = MOVE_SPEED;
    }
    
    // Handle jumping
    if (playerControls.jump && playerCube.position.y <= 0.25) {
        playerVelocity.y = JUMP_FORCE;
        playerControls.jump = false; // Reset jump to prevent continuous jumping
        
        // Play jump sound
        if (window.soundManager) {
            window.soundManager.play('jump');
        }
    }
    
    // Update position
    playerCube.position.x += playerVelocity.x;
    playerCube.position.y += playerVelocity.y;
    
    // Keep player within arena bounds
    const halfArena = ARENA_SIZE / 2;
    playerCube.position.x = Math.max(-halfArena, Math.min(halfArena, playerCube.position.x));
    
    // Floor collision
    if (playerCube.position.y < 0.25) {
        playerCube.position.y = 0.25;
        playerVelocity.y = 0;
    }
    
    // Send position update to server if position changed
    if (typeof socket !== 'undefined' && (playerVelocity.x !== 0 || playerVelocity.y !== 0)) {
        socket.emit('move', {
            x: playerCube.position.x,
            y: playerCube.position.y,
            z: playerCube.position.z
        });
    }
}

// Update obstacles
function updateObstacles() {
    // Only player1 should update obstacle positions and sync them
    // player2 will receive updates from the server
    if (typeof playerRole !== 'undefined' && playerRole === 'player2') {
        // Player 2 only checks for collisions but doesn't update positions
        checkObstacleCollisions();
        return;
    }
    
    // Get current difficulty speed multiplier
    let speedMultiplier = 1.0;
    if (window.difficultyManager) {
        const difficultySpeed = window.difficultyManager.getObstacleSpeed();
        speedMultiplier = difficultySpeed / 0.05; // Normalize to base speed
    }
    
    // Update obstacle positions (only player1 does this)
    obstacles.forEach(obstacle => {
        // Update velocity based on difficulty
        obstacle.userData.velocity = obstacle.userData.baseSpeed * speedMultiplier;
        
        // Move obstacle down
        obstacle.position.y -= obstacle.userData.velocity;
        
        // Rotate obstacle
        obstacle.rotation.x += obstacle.userData.rotationSpeed.x;
        obstacle.rotation.y += obstacle.userData.rotationSpeed.y;
        obstacle.rotation.z += obstacle.userData.rotationSpeed.z;
        
        // Reset if below arena
        if (obstacle.position.y < -5) {
            obstacle.position.x = (Math.random() - 0.5) * (ARENA_SIZE - OBSTACLE_SIZE);
            obstacle.position.y = OBSTACLE_SPAWN_HEIGHT;
            obstacle.position.z = (Math.random() - 0.5) * (ARENA_SIZE - OBSTACLE_SIZE);
        }
    });
    
    // Check for collisions
    checkObstacleCollisions();
    
    // Sync obstacles with other players (only if we're player1)
    if (typeof socket !== 'undefined' && typeof playerRole !== 'undefined' && playerRole === 'player1') {
        syncTimer++;
        if (syncTimer >= 6) { // Sync approximately every 6 frames (at 60fps = ~100ms)
            syncTimer = 0;
            
            // Prepare obstacle data for syncing
            const obstacleData = obstacles.map(obstacle => ({
                position: {
                    x: obstacle.position.x,
                    y: obstacle.position.y,
                    z: obstacle.position.z
                },
                rotation: {
                    x: obstacle.rotation.x,
                    y: obstacle.rotation.y,
                    z: obstacle.rotation.z
                },
                userData: obstacle.userData
            }));
            
            // Send obstacle data to server
            socket.emit('syncObstacles', { obstacles: obstacleData });
        }
    }
}

// Check for collisions with obstacles
function checkObstacleCollisions() {
    obstacles.forEach(obstacle => {
        // Check collision with player
        if (checkCollision(playerCube, obstacle)) {
            if (typeof socket !== 'undefined') {
                socket.emit('collision', { player: playerRole || 'player1' });
            }
            console.log('Player hit by obstacle!');
            
            // Play collision sound
            if (window.soundManager) {
                window.soundManager.play('collision');
            }
            
            // Stop scoring and update high score
            stopScoring();
            
            // Update high score if current score is higher
            if (currentScore > highScore) {
                highScore = currentScore;
                updateHighScoreDisplay();
            }
        }
        
        // Check collision with opponent
        if (opponentCube.visible && checkCollision(opponentCube, obstacle)) {
            console.log('Opponent hit by obstacle!');
        }
    });
}

// Simple AABB collision detection
function checkCollision(cube, obstacle) {
    return (
        Math.abs(cube.position.x - obstacle.position.x) < (CUBE_SIZE + OBSTACLE_SIZE) / 2 &&
        Math.abs(cube.position.y - obstacle.position.y) < (CUBE_SIZE + OBSTACLE_SIZE) / 2 &&
        Math.abs(cube.position.z - obstacle.position.z) < (CUBE_SIZE + OBSTACLE_SIZE) / 2
    );
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    deltaTime = clock.getDelta();
    lastTime = clock.elapsedTime;
    
    if (gameActive) {
        updatePlayerPosition();
        updateObstacles();
    }
    
    renderer.render(scene, camera);
}

// Start the game
function startGame() {
    gameActive = true;
    
    // Reset and start the score counter
    gameStartTime = Date.now();
    currentScore = 0;
    
    // Create or update score display
    createScoreDisplay();
    
    // Start score interval
    if (scoreInterval) clearInterval(scoreInterval);
    scoreInterval = setInterval(updateScore, 100);
    
    // Start difficulty progression
    if (window.difficultyManager) {
        window.difficultyManager.start();
    }
    
    // Play game start sound
    if (window.soundManager) {
        window.soundManager.play('gameStart');
    }
}

// Reset the game
function resetGame() {
    // Reset player position
    playerCube.position.set(-2, 0.25, 0);
    playerVelocity = { x: 0, y: 0, z: 0 };
    
    // Reset obstacles
    obstacles.forEach(obstacle => {
        obstacle.position.x = (Math.random() - 0.5) * (ARENA_SIZE - OBSTACLE_SIZE);
        obstacle.position.y = OBSTACLE_SPAWN_HEIGHT + Math.random() * 10;
        obstacle.position.z = (Math.random() - 0.5) * (ARENA_SIZE - OBSTACLE_SIZE);
    });
    
    // Reset and restart scoring
    gameStartTime = Date.now();
    currentScore = 0;
    updateScoreDisplay();
    
    // Start score interval if not already running
    if (!scoreInterval) {
        scoreInterval = setInterval(updateScore, 100);
    }
    
    gameActive = true;
}

// Create or update score display
function createScoreDisplay() {
    // Remove existing score display if it exists
    const existingScore = document.getElementById('score-display');
    if (existingScore) {
        existingScore.remove();
    }
    
    // Create score container
    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'score-display';
    scoreContainer.className = 'game-ui';
    scoreContainer.style.position = 'absolute';
    scoreContainer.style.top = '15px';
    scoreContainer.style.right = '15px';
    scoreContainer.style.padding = '10px';
    scoreContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    scoreContainer.style.color = '#fff';
    scoreContainer.style.borderRadius = '5px';
    scoreContainer.style.fontFamily = 'Arial, sans-serif';
    scoreContainer.style.fontSize = '16px';
    scoreContainer.style.textAlign = 'right';
    
    // Current score
    const currentScoreElement = document.createElement('div');
    currentScoreElement.id = 'current-score';
    currentScoreElement.textContent = 'Score: 0';
    scoreContainer.appendChild(currentScoreElement);
    
    // High score
    const highScoreElement = document.createElement('div');
    highScoreElement.id = 'high-score';
    highScoreElement.textContent = `High Score: ${highScore}`;
    scoreContainer.appendChild(highScoreElement);
    
    document.body.appendChild(scoreContainer);
}

// Update the score based on survival time
function updateScore() {
    if (!gameActive) return;
    
    // Calculate score based on time survived (in seconds)
    const elapsedTime = (Date.now() - gameStartTime) / 1000;
    currentScore = Math.floor(elapsedTime * 10); // 10 points per second
    
    updateScoreDisplay();
}

// Update the score display
function updateScoreDisplay() {
    const currentScoreElement = document.getElementById('current-score');
    if (currentScoreElement) {
        currentScoreElement.textContent = `Score: ${currentScore}`;
    }
}

// Update the high score display
function updateHighScoreDisplay() {
    const highScoreElement = document.getElementById('high-score');
    if (highScoreElement) {
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
}

// Stop the scoring interval
function stopScoring() {
    if (scoreInterval) {
        clearInterval(scoreInterval);
        scoreInterval = null;
    }
}

// Export functions for socket.js to use
window.gameModule = {
    init,
    startGame,
    resetGame,
    setOpponentPosition: (position) => {
        if (opponentCube) {
            opponentCube.position.set(position.x, position.y, position.z);
            opponentCube.visible = true;
        }
    },
    handlePlayerHit: (data) => {
        gameActive = false;
        stopScoring();
        
        // Update high score if current score is higher
        if (currentScore > highScore) {
            highScore = currentScore;
            updateHighScoreDisplay();
        }
    },
    // Update obstacles from server data (for player2)
    updateObstaclesFromServer: (obstacleData) => {
        if (!obstacleData || obstacleData.length === 0 || obstacles.length === 0) {
            console.log('Invalid obstacle data or no obstacles to update');
            return;
        }
        
        console.log('Updating obstacles from server data');
        
        // Update each obstacle position and rotation
        for (let i = 0; i < Math.min(obstacleData.length, obstacles.length); i++) {
            const serverObstacle = obstacleData[i];
            const clientObstacle = obstacles[i];
            
            // Update position
            clientObstacle.position.x = serverObstacle.position.x;
            clientObstacle.position.y = serverObstacle.position.y;
            clientObstacle.position.z = serverObstacle.position.z;
            
            // Update rotation
            clientObstacle.rotation.x = serverObstacle.rotation.x;
            clientObstacle.rotation.y = serverObstacle.rotation.y;
            clientObstacle.rotation.z = serverObstacle.rotation.z;
            
            // Update userData if available
            if (serverObstacle.userData) {
                clientObstacle.userData = serverObstacle.userData;
            }
        }
    }
};

// Initialize the game when the page loads
window.addEventListener('load', init);
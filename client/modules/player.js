// THREE.js is loaded from CDN in the HTML file
const THREE = window.THREE;
import { PLAYER_SIZE, JUMP_FORCE, GRAVITY, MOVE_SPEED, FRICTION, GROUND_LEVEL, ARENA_SIZE, BOUNDARY } from './constants.js';

export class Player {
    constructor(scene, isOpponent = false, textureUtils, soundManager, playerRole = null) {
        this.scene = scene;
        this.isOpponent = isOpponent;
        this.playerRole = playerRole; // 'player1' or 'player2'
        this.cube = null;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isJumping = false;
        this.isHit = false;
        this.textureUtils = textureUtils;
        this.soundManager = soundManager;
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        
        console.log('Creating player cube, isOpponent:', isOpponent, 'playerRole:', playerRole);
        // Always create the cube regardless of player type
        this.createCube();
        
        // Only set up controls for local player
        if (!isOpponent) {
            this.setupControls();
        }
    }
    
    createCube() {
        // First, check if we already have a cube in the scene and remove it
        if (this.cube && this.scene) {
            console.log(`Removing existing ${this.isOpponent ? 'opponent' : 'player'} cube before creating a new one`);
            this.scene.remove(this.cube);
            this.cube = null;
        }
        
        if (!this.scene) {
            console.error('Cannot create cube: scene is not defined');
            return;
        }
        
        const geometry = new THREE.BoxGeometry(PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
        
        // FINAL COLOR LOGIC: Consistent colors across all clients
        // Player1 is ALWAYS blue, Player2 is ALWAYS red
        let color;
        
        // Simplified color logic: strictly based on role
        if (this.playerRole === 'player1') {
            color = 0x0000ff; // Blue for player1
            console.log(`Setting ${this.isOpponent ? 'opponent' : 'local'} player1 cube to BLUE`);
        } else if (this.playerRole === 'player2') {
            color = 0xff0000; // Red for player2
            console.log(`Setting ${this.isOpponent ? 'opponent' : 'local'} player2 cube to RED`);
        } else {
            // Default color if role not set yet
            color = this.isOpponent ? 0xff0000 : 0x0000ff; // Default: red for opponent, blue for local
            console.log(`No role specified, using default color for ${this.isOpponent ? 'opponent' : 'local'} player`);
        }
        
        console.log('Creating cube with color:', color.toString(16), 'isOpponent:', this.isOpponent, 'playerRole:', this.playerRole);
        
        // Create a simple material with bright color for better visibility - NO TEXTURES
        const material = new THREE.MeshBasicMaterial({ 
            color: color
        });
        
        this.cube = new THREE.Mesh(geometry, material);
        this.cube.position.y = GROUND_LEVEL + (PLAYER_SIZE / 2);
        
        // Add a debug name to the cube for easier identification
        this.cube.name = this.isOpponent ? 'OpponentCube' : 'PlayerCube';
        
        // Position both players in the same arena but at different x positions
        // This allows both players to see each other in the same scene
        if (this.isOpponent) {
            this.cube.position.x = 2; // Opponent positioned to the right
            this.cube.position.z = 0; // Same z-position (depth) in the arena
            
            // Add interpolation properties for opponent
            this.targetPosition = new THREE.Vector3(
                this.cube.position.x,
                this.cube.position.y,
                this.cube.position.z
            );
            this.lastUpdateTime = Date.now();
            this.interpolationSpeed = 0.15; // Adjust for smoother movement (0-1)
        } else {
            this.cube.position.x = -2; // Local player positioned to the left
            this.cube.position.z = 0; // Same z-position (depth) in the arena
        }
        
        this.cube.castShadow = true;
        this.cube.receiveShadow = true;
        
        // Add the cube to the scene
        if (this.scene) {
            this.scene.add(this.cube);
            console.log(`Added ${this.cube.name} to scene with color ${color.toString(16)}`);
        } else {
            console.error('Cannot add cube to scene: scene is not defined');
        }
        
        // Position both players in the same arena but at different x positions
        // This allows both players to see each other in the same scene
        if (this.isOpponent) {
            this.cube.position.x = 2; // Opponent positioned to the right
            this.cube.position.z = 0; // Same z-position (depth) in the arena
            
            // Add interpolation properties for opponent
            this.targetPosition = new THREE.Vector3(
                this.cube.position.x,
                this.cube.position.y,
                this.cube.position.z
            );
            this.lastUpdateTime = Date.now();
            this.interpolationSpeed = 0.15; // Adjust for smoother movement (0-1)
        } else {
            this.cube.position.x = -2; // Local player positioned to the left
            this.cube.position.z = 0; // Same z-position (depth) in the arena
        }
        
        this.cube.castShadow = true;
        this.cube.receiveShadow = true;
        
        this.scene.add(this.cube);
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'w':
                case 'ArrowUp':
                    this.controls.forward = true;
                    break;
                case 's':
                case 'ArrowDown':
                    this.controls.backward = true;
                    break;
                case 'a':
                case 'ArrowLeft':
                    this.controls.left = true;
                    break;
                case 'd':
                case 'ArrowRight':
                    this.controls.right = true;
                    break;
                case ' ':
                    this.controls.jump = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch(event.key) {
                case 'w':
                case 'ArrowUp':
                    this.controls.forward = false;
                    break;
                case 's':
                case 'ArrowDown':
                    this.controls.backward = false;
                    break;
                case 'a':
                case 'ArrowLeft':
                    this.controls.left = false;
                    break;
                case 'd':
                case 'ArrowRight':
                    this.controls.right = false;
                    break;
                case ' ':
                    this.controls.jump = false;
                    break;
            }
        });
    }
    
    update() {
        if (this.isHit) return;
        
        // For opponent, use interpolation for smoother movement
        if (this.isOpponent && this.cube && this.targetPosition) {
            // Interpolate position for smoother movement
            this.cube.position.lerp(this.targetPosition, this.interpolationSpeed);
            
            // Apply gravity for jumping if needed
            if (this.isJumping) {
                this.velocity.y -= GRAVITY;
                this.cube.position.y += this.velocity.y;
                
                // Check if on ground
                if (this.cube.position.y <= GROUND_LEVEL + PLAYER_SIZE / 2) {
                    this.cube.position.y = GROUND_LEVEL + PLAYER_SIZE / 2;
                    this.velocity.y = 0;
                    this.isJumping = false;
                }
            }
            return;
        }
        
        // Apply controls for local player only
        if (!this.isOpponent) {
            // Apply movement based on controls
            if (this.controls.forward) {
                this.velocity.z -= MOVE_SPEED;
            }
            if (this.controls.backward) {
                this.velocity.z += MOVE_SPEED;
            }
            if (this.controls.left) {
                this.velocity.x -= MOVE_SPEED;
            }
            if (this.controls.right) {
                this.velocity.x += MOVE_SPEED;
            }
            
            // Handle jumping
            if (this.controls.jump && !this.isJumping) {
                this.velocity.y = JUMP_FORCE;
                this.isJumping = true;
                
                // Play jump sound
                if (this.soundManager) {
                    this.soundManager.playJumpSound();
                }
            }
        }
        
        // Apply physics for local player
        this.velocity.y -= GRAVITY;
        
        // Apply velocity to position
        this.cube.position.x += this.velocity.x;
        this.cube.position.y += this.velocity.y;
        this.cube.position.z += this.velocity.z;
        
        // Apply friction
        this.velocity.x *= FRICTION;
        this.velocity.z *= FRICTION;
        
        // Check if on ground
        if (this.cube.position.y <= 0) {
            this.cube.position.y = 0;
            this.velocity.y = 0;
            this.isJumping = false;
        }
        
        // Boundary checks
        if (this.cube.position.x < -BOUNDARY) {
            this.cube.position.x = -BOUNDARY;
            this.velocity.x = 0;
        }
        if (this.cube.position.x > BOUNDARY) {
            this.cube.position.x = BOUNDARY;
            this.velocity.x = 0;
        }
        if (this.cube.position.z < -BOUNDARY) {
            this.cube.position.z = -BOUNDARY;
            this.velocity.z = 0;
        }
        if (this.cube.position.z > BOUNDARY) {
            this.cube.position.z = BOUNDARY;
            this.velocity.z = 0;
        }
    }
    
    getPosition() {
        if (!this.cube) {
            return { x: 0, y: GROUND_LEVEL + PLAYER_SIZE / 2, z: 0 };
        }
        
        return {
            x: this.cube.position.x,
            y: this.cube.position.y,
            z: this.cube.position.z,
            isJumping: this.isJumping,
            velocityY: this.velocity.y,
            isHit: this.isHit
        };
    }
    
    setPosition(position) {
        // Only update position if we have valid coordinates and cube exists
        if (!this.cube) {
            console.error('Cannot set position: cube does not exist');
            return;
        }
        
        if (position && typeof position.x === 'number' && 
            typeof position.y === 'number' && 
            typeof position.z === 'number') {
            
            // For opponent, update target position for interpolation
            if (this.isOpponent && this.targetPosition) {
                // Update the target position for interpolation
                this.targetPosition.set(position.x, position.y, position.z);
                this.lastUpdateTime = Date.now();
                
                // Update jumping state if provided
                if (position.isJumping !== undefined) {
                    this.isJumping = position.isJumping;
                }
                
                // Update velocity if provided
                if (position.velocityY !== undefined) {
                    this.velocity.y = position.velocityY;
                }
                
                // Log position updates occasionally for debugging
                if (Math.random() < 0.01) { // Log ~1% of updates
                    console.log('Opponent target position updated:', position);
                }
            } else {
                // For local player, just update position normally
                this.cube.position.x = position.x;
                this.cube.position.y = position.y;
                this.cube.position.z = position.z;
            }
            
            // Update additional state if provided
            if (typeof position.isJumping === 'boolean') {
                this.isJumping = position.isJumping;
            }
            
            // Update velocity if provided
            if (typeof position.velocityY === 'number') {
                this.velocity.y = position.velocityY;
            } else if (this.isOpponent) {
                // For opponent, calculate velocity based on position change if not provided
                // This helps with smoother movement
                this.velocity.set(0, 0, 0);
            }
            
            // Update hit state if provided
            if (typeof position.isHit === 'boolean' && position.isHit) {
                this.markAsHit();
            }
        } else {
            console.warn('Invalid position data received:', position);
        }
    }
    
    markAsHit() {
        this.isHit = true;
        this.cube.material.color.set(0x333333);
        this.cube.material.opacity = 0.5;
        this.cube.material.transparent = true;
    }
    
    reset() {
        this.isHit = false;
        this.isJumping = false;
        this.velocity.set(0, 0, 0);
        this.cube.position.y = GROUND_LEVEL + (PLAYER_SIZE / 2);
        
        if (this.isOpponent) {
            this.cube.position.z = -4;
            this.cube.material.color.set(0xff4444);
        } else {
            this.cube.position.z = 4;
            this.cube.material.color.set(0x4444ff);
        }
        
        this.cube.position.x = 0;
        this.cube.material.opacity = 1;
        this.cube.material.transparent = false;
    }
}

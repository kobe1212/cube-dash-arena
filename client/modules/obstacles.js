// THREE.js is loaded from CDN in the HTML file
const THREE = window.THREE;
import { OBSTACLE_SIZE, OBSTACLE_SPAWN_HEIGHT, ARENA_SIZE } from './constants.js';

export class ObstacleManager {
    constructor(scene, textureUtils, difficultyManager) {
        this.scene = scene;
        this.obstacles = [];
        this.raycaster = new THREE.Raycaster();
        this.textureUtils = textureUtils;
        this.difficultyManager = difficultyManager;
    }
    
    createObstacle() {
        // Randomly choose between different geometric shapes for variety
        let geometry;
        const shapeType = Math.floor(Math.random() * 4);
        
        switch (shapeType) {
            case 0: // Standard cube
                geometry = new THREE.BoxGeometry(OBSTACLE_SIZE, OBSTACLE_SIZE, OBSTACLE_SIZE);
                break;
            case 1: // Tetrahedron (pyramid)
                geometry = new THREE.TetrahedronGeometry(OBSTACLE_SIZE * 0.7);
                break;
            case 2: // Octahedron (diamond)
                geometry = new THREE.OctahedronGeometry(OBSTACLE_SIZE * 0.6);
                break;
            case 3: // Dodecahedron (12-sided)
                geometry = new THREE.DodecahedronGeometry(OBSTACLE_SIZE * 0.6);
                break;
        }
        
        // Generate a random color for the obstacle
        const hue = Math.random();
        const saturation = 0.7 + Math.random() * 0.3; // High saturation for vibrant colors
        const lightness = 0.4 + Math.random() * 0.3; // Medium lightness
        
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        const hexColor = '#' + color.getHexString();
        
        // Use our new specialized obstacle texture
        const obstacleTexture = this.textureUtils.createObstacleTexture(hexColor);
        
        // Create material with enhanced properties
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            map: obstacleTexture,
            roughness: 0.6,
            metalness: 0.4,
            flatShading: true, // Emphasize low-poly look
            emissive: new THREE.Color(color).multiplyScalar(0.1), // Subtle glow
            emissiveIntensity: 0.2
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
        
        // Enhanced shadow settings
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        
        // Add a subtle point light to some obstacles for dramatic effect
        if (Math.random() < 0.2) { // 20% chance
            const obstacleLight = new THREE.PointLight(
                color,
                0.6, // intensity
                OBSTACLE_SIZE * 3 // distance
            );
            obstacleLight.position.set(0, 0, 0); // Center of obstacle
            obstacle.add(obstacleLight);
        }
        
        this.scene.add(obstacle);
        this.obstacles.push(obstacle);
        
        return obstacle;
    }
    
    updateObstacles(speedMultiplier) {
        const obstacleData = [];
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            // Apply rotation
            obstacle.rotation.x += obstacle.userData.rotationSpeed.x;
            obstacle.rotation.y += obstacle.userData.rotationSpeed.y;
            obstacle.rotation.z += obstacle.userData.rotationSpeed.z;
            
            // Apply velocity (adjusted by difficulty)
            obstacle.position.y -= obstacle.userData.baseSpeed * speedMultiplier;
            
            // Remove obstacles that have fallen below the floor
            if (obstacle.position.y < -5) {
                this.scene.remove(obstacle);
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Collect data for multiplayer sync
            obstacleData.push({
                id: i,
                position: {
                    x: obstacle.position.x,
                    y: obstacle.position.y,
                    z: obstacle.position.z
                },
                rotation: {
                    x: obstacle.rotation.x,
                    y: obstacle.rotation.y,
                    z: obstacle.rotation.z
                }
            });
        }
        
        return obstacleData;
    }
    
    checkCollisions(player, opponent) {
        if (!player) return false;
        
        // Initialize collision result object
        const result = { player: false, opponent: false };
        
        const raycasterDirections = [
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1)
        ];
        
        // Check player cube collisions
        if (!player.isHit) {
            let playerCollision = false;
            
            // Cast rays from player cube in all directions
            for (const direction of raycasterDirections) {
                this.raycaster.set(player.cube.position, direction);
                const intersects = this.raycaster.intersectObjects(this.obstacles);
                
                if (intersects.length > 0 && intersects[0].distance < 0.6) {
                    playerCollision = true;
                    
                    // Visual feedback - flash the hit obstacle
                    const hitObstacle = intersects[0].object;
                    const originalColor = hitObstacle.material.color.clone();
                    hitObstacle.material.color.set(0xffffff);
                    
                    setTimeout(() => {
                        if (hitObstacle && hitObstacle.material) {
                            hitObstacle.material.color.copy(originalColor);
                        }
                    }, 100);
                    
                    break;
                }
            }
            
            if (playerCollision) {
                result.player = true;
                return result;
            }
        }
        
        // Check opponent cube collisions - only if opponent exists and has a valid cube
        if (opponent && opponent.cube && opponent.cube.position && !opponent.isHit) {
            try {
                let opponentCollision = false;
                
                // Cast rays from opponent cube in all directions
                for (const direction of raycasterDirections) {
                    this.raycaster.set(opponent.cube.position, direction);
                    const intersects = this.raycaster.intersectObjects(this.obstacles);
                    
                    if (intersects.length > 0 && intersects[0].distance < 0.6) {
                        opponentCollision = true;
                        
                        // Visual feedback - flash the hit obstacle
                        const hitObstacle = intersects[0].object;
                        if (hitObstacle && hitObstacle.material) {
                            const originalColor = hitObstacle.material.color.clone();
                            hitObstacle.material.color.set(0xffffff);
                            
                            setTimeout(() => {
                                if (hitObstacle && hitObstacle.material) {
                                    hitObstacle.material.color.copy(originalColor);
                                }
                            }, 100);
                        }
                        
                        break;
                    }
                }
                
                if (opponentCollision) {
                    result.opponent = true;
                    return result;
                }
            } catch (error) {
                console.error('Error in opponent collision detection:', error);
                // Continue execution, don't return yet
            }
        }
        
        return result;
    }
    
    syncObstacleData(obstacleData) {
        try {
            if (!Array.isArray(obstacleData)) {
                console.error('Invalid obstacle data received:', obstacleData);
                return;
            }
            
            console.log(`Syncing ${obstacleData.length} obstacles from Player 1`);
            
            // Remove all existing obstacles
            this.clearObstacles();
            
            // Create new obstacles based on received data
            for (const data of obstacleData) {
                if (data && data.position && data.rotation) {
                    const obstacle = this.createObstacle();
                    if (obstacle) {
                        obstacle.position.set(data.position.x, data.position.y, data.position.z);
                        obstacle.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
                    }
                }
            }
            
            console.log(`Successfully synced ${this.obstacles.length} obstacles`);
        } catch (error) {
            console.error('Error syncing obstacle data:', error);
        }
    }
    
    clearObstacles() {
        for (const obstacle of this.obstacles) {
            this.scene.remove(obstacle);
        }
        this.obstacles = [];
    }
    
    // Get all obstacles with their positions and rotations for synchronization
    getAllObstacles() {
        const obstacleData = [];
        
        for (const obstacle of this.obstacles) {
            if (obstacle && obstacle.position && obstacle.rotation) {
                obstacleData.push({
                    position: {
                        x: obstacle.position.x,
                        y: obstacle.position.y,
                        z: obstacle.position.z
                    },
                    rotation: {
                        x: obstacle.rotation.x,
                        y: obstacle.rotation.y,
                        z: obstacle.rotation.z
                    }
                });
            }
        }
        
        return obstacleData;
    }
    
    // Create a new obstacle and return its data for synchronization
    spawnObstacle() {
        const obstacle = this.createObstacle();
        
        if (obstacle) {
            return {
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
                // Include additional data for accurate synchronization
                userData: {
                    baseSpeed: obstacle.userData.baseSpeed,
                    rotationSpeed: obstacle.userData.rotationSpeed
                }
            };
        }
        
        return null;
    }
    
    // Create an obstacle from data received from Player 1
    createObstacleFromData(obstacleData) {
        if (!obstacleData || !obstacleData.position) {
            console.error('Invalid obstacle data received');
            return null;
        }
        
        try {
            // Create a basic obstacle geometry (cube for simplicity)
            const geometry = new THREE.BoxGeometry(OBSTACLE_SIZE, OBSTACLE_SIZE, OBSTACLE_SIZE);
            
            // Generate a random color for the obstacle
            const hue = Math.random();
            const saturation = 0.7 + Math.random() * 0.3;
            const lightness = 0.4 + Math.random() * 0.3;
            
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            const hexColor = '#' + color.getHexString();
            
            // Use our specialized obstacle texture
            const obstacleTexture = this.textureUtils.createObstacleTexture(hexColor);
            
            // Create material with enhanced properties
            const material = new THREE.MeshStandardMaterial({ 
                color: color,
                map: obstacleTexture,
                roughness: 0.6,
                metalness: 0.4,
                flatShading: true,
                emissive: new THREE.Color(color).multiplyScalar(0.1),
                emissiveIntensity: 0.2
            });
            
            const obstacle = new THREE.Mesh(geometry, material);
            
            // Set position from received data
            obstacle.position.set(
                obstacleData.position.x,
                obstacleData.position.y,
                obstacleData.position.z
            );
            
            // Set rotation if available
            if (obstacleData.rotation) {
                obstacle.rotation.set(
                    obstacleData.rotation.x,
                    obstacleData.rotation.y,
                    obstacleData.rotation.z
                );
            }
            
            // Set userData properties
            const baseSpeed = obstacleData.userData?.baseSpeed || 0.05 + (Math.random() * 0.03);
            const rotationSpeed = obstacleData.userData?.rotationSpeed || {
                x: (Math.random() - 0.5) * 0.05,
                y: (Math.random() - 0.5) * 0.05,
                z: (Math.random() - 0.5) * 0.05
            };
            
            obstacle.userData = {
                baseSpeed: baseSpeed,
                velocity: baseSpeed,
                rotationSpeed: rotationSpeed
            };
            
            // Enhanced shadow settings
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            
            this.scene.add(obstacle);
            this.obstacles.push(obstacle);
            
            console.log('Created obstacle from synchronized data');
            return obstacle;
        } catch (error) {
            console.error('Error creating obstacle from data:', error);
            return null;
        }
    }
    
    // Sync all obstacles from data received from Player 1
    syncObstaclesFromData(allObstacles) {
        if (!Array.isArray(allObstacles)) {
            console.error('Invalid obstacle array received');
            return;
        }
        
        try {
            console.log(`Syncing ${allObstacles.length} obstacles from Player 1`);
            
            // Clear existing obstacles
            this.clearObstacles();
            
            // Create new obstacles from received data
            for (const obstacleData of allObstacles) {
                this.createObstacleFromData(obstacleData);
            }
            
            console.log(`Successfully synced ${this.obstacles.length} obstacles`);
        } catch (error) {
            console.error('Error syncing obstacles from data:', error);
        }
    }
}

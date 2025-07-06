// THREE.js is loaded from CDN in the HTML file
const THREE = window.THREE;
import { ARENA_SIZE } from './constants.js';

export class Arena {
    constructor(scene, textureUtils, renderer) {
        this.scene = scene;
        this.arena = null;
        this.textureUtils = textureUtils;
        this.renderer = renderer; // Store renderer reference
        
        // Only create arena if renderer is available
        if (this.renderer) {
            this.createArena();
        } else {
            console.error('Cannot create arena: renderer is undefined');
            const errorLog = document.getElementById('errorLog');
            if (errorLog) {
                errorLog.textContent = 'Arena creation failed: renderer is undefined';
                errorLog.style.color = 'red';
            }
        }
    }
    
    createArena() {
        // Floor with enhanced low-poly grid texture
        const floorGeometry = new THREE.BoxGeometry(ARENA_SIZE, 0.5, ARENA_SIZE, 16, 1, 16); // More segments for better shadows
        const floorTexture = this.textureUtils.createGridTexture();
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8090a0, // Slightly blue-gray
            roughness: 0.8,
            metalness: 0.2,
            map: floorTexture,
            flatShading: true // Enhance low-poly look
        });
        this.arena = new THREE.Mesh(floorGeometry, floorMaterial);
        this.arena.position.y = -0.25;
        this.arena.receiveShadow = true;
        this.scene.add(this.arena);
        
        // Create a subtle glow effect around the arena edges
        const edgeLight = new THREE.RectAreaLight(0x4080ff, 2, ARENA_SIZE, 0.5);
        edgeLight.position.set(0, 0.1, -ARENA_SIZE/2 + 0.25);
        edgeLight.lookAt(0, 0, 0);
        this.scene.add(edgeLight);
        
        // Walls with glass-like material
        const wallMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0x6080a0,
            transparent: true,
            opacity: 0.15,
            roughness: 0.1,
            metalness: 0.8,
            reflectivity: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            envMapIntensity: 1.0
        });
        
        // Create environment map for reflections
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
        cubeRenderTarget.texture.type = THREE.HalfFloatType;
        const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
        this.scene.add(cubeCamera);
        
        // Update the environment map once with proper renderer check
        try {
            if (this.renderer && typeof this.renderer.getRenderTarget === 'function') {
                cubeCamera.update(this.renderer, this.scene);
                wallMaterial.envMap = cubeRenderTarget.texture;
            } else {
                console.warn('Skipping environment map update: renderer not ready');
                // Use a basic environment map as fallback
                wallMaterial.envMap = null;
                wallMaterial.color = new THREE.Color(0x4060a0); // Adjust color to compensate
            }
        } catch (error) {
            console.error('Error updating cube camera:', error);
            // Fallback to no environment map
            wallMaterial.envMap = null;
        }
        
        // North wall with enhanced geometry
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(ARENA_SIZE, 2, 0.1, 8, 4, 1), // More segments
            wallMaterial
        );
        northWall.position.set(0, 1, -ARENA_SIZE/2);
        northWall.receiveShadow = true;
        this.scene.add(northWall);
        
        // South wall
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(ARENA_SIZE, 2, 0.1, 8, 4, 1),
            wallMaterial
        );
        southWall.position.set(0, 1, ARENA_SIZE/2);
        southWall.receiveShadow = true;
        this.scene.add(southWall);
        
        // East wall
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 2, ARENA_SIZE, 1, 4, 8),
            wallMaterial
        );
        eastWall.position.set(ARENA_SIZE/2, 1, 0);
        eastWall.receiveShadow = true;
        this.scene.add(eastWall);
        
        // West wall
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 2, ARENA_SIZE, 1, 4, 8),
            wallMaterial
        );
        westWall.position.set(-ARENA_SIZE/2, 1, 0);
        westWall.receiveShadow = true;
        this.scene.add(westWall);
        
        // Add corner posts for visual interest
        const cornerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8);
        const cornerMaterial = new THREE.MeshStandardMaterial({
            color: 0x303540,
            roughness: 0.7,
            metalness: 0.6,
            flatShading: true
        });
        
        // Create four corner posts
        const cornerPositions = [
            [-ARENA_SIZE/2, 1.25, -ARENA_SIZE/2],
            [ARENA_SIZE/2, 1.25, -ARENA_SIZE/2],
            [-ARENA_SIZE/2, 1.25, ARENA_SIZE/2],
            [ARENA_SIZE/2, 1.25, ARENA_SIZE/2]
        ];
        
        cornerPositions.forEach(pos => {
            const cornerPost = new THREE.Mesh(cornerGeometry, cornerMaterial);
            cornerPost.position.set(pos[0], pos[1], pos[2]);
            cornerPost.castShadow = true;
            cornerPost.receiveShadow = true;
            this.scene.add(cornerPost);
        });
    }
}

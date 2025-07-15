// THREE.js is loaded from CDN in the HTML file
// Make sure THREE.js is available
import { logError, logWarning, logSuccess, updateErrorLog } from './utils.js';

let THREE;

// Function to safely get THREE.js
function getThree() {
    if (typeof window.THREE !== 'undefined') {
        return window.THREE;
    }
    
    // If THREE is not available, log error and return null
    console.error('THREE.js not available! Scene initialization will fail.');
    const errorLog = document.getElementById('errorLog');
    if (errorLog) {
        errorLog.textContent = 'THREE.js not available for scene!';
        errorLog.style.color = 'red';
    }
    return null;
}

// Initialize THREE when this module is imported
THREE = getThree();
import { ARENA_SIZE } from './constants.js';

// Global singleton renderer to prevent multiple WebGL contexts
let globalRenderer = null;
let rendererInitialized = false;

// Scene setup module
export class SceneManager {
    constructor() {
        console.log('Initializing SceneManager');
        
        // Update loading status if available
        if (window.updateLoadingStatus) {
            window.updateLoadingStatus('Initializing 3D scene...', 80);
        }
        
        try {
            // Make sure THREE is available
            if (!window.THREE) {
                throw new Error('THREE.js not available');
            }
            
            // Create scene with a background color
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
            
            // Create camera with better position for game view
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            
            // Initialize renderer as singleton
            if (!globalRenderer) {
                console.log('Creating new WebGLRenderer');
                
                // Clean up any existing canvases first
                const existingCanvases = document.querySelectorAll('canvas');
                existingCanvases.forEach(canvas => {
                    if (canvas.id === 'gameCanvas') {
                        console.log('Removing existing canvas:', canvas.id);
                        canvas.parentNode?.removeChild(canvas);
                    }
                });
                
                // Create renderer with explicit parameters
                try {
                    globalRenderer = new THREE.WebGLRenderer({ 
                        antialias: true,
                        alpha: true,
                        powerPreference: 'high-performance',
                        precision: 'highp'
                    });
                    
                    globalRenderer.setSize(window.innerWidth, window.innerHeight);
                    globalRenderer.setClearColor(0x87CEEB, 1); // Sky blue with full opacity
                    globalRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
                    globalRenderer.shadowMap.enabled = true;
                    globalRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
                    
                    // Add canvas to DOM with explicit styling
                    globalRenderer.domElement.id = 'gameCanvas';
                    globalRenderer.domElement.style.display = 'block';
                    globalRenderer.domElement.style.position = 'absolute';
                    globalRenderer.domElement.style.top = '0';
                    globalRenderer.domElement.style.left = '0';
                    globalRenderer.domElement.style.zIndex = '0';
                    document.body.appendChild(globalRenderer.domElement);
                    
                    // Set renderer as global property
                    this.renderer = globalRenderer;
                    
                    // Explicitly check for getRenderTarget method
                    if (this.renderer && typeof this.renderer.getRenderTarget !== 'function') {
                        console.warn('WARNING: Renderer missing getRenderTarget method, adding stub');
                        // Add a stub implementation to prevent errors
                        this.renderer.getRenderTarget = function() { 
                            console.log('Stub getRenderTarget called');
                            return null; 
                        };
                        
                        // Update error log
                        const errorLog = document.getElementById('errorLog');
                        if (errorLog) {
                            errorLog.textContent = 'Renderer patched with getRenderTarget stub';
                            errorLog.style.color = 'orange';
                        }
                    }
                    
                    rendererInitialized = true;
                    console.log('WebGLRenderer created successfully');
                    
                    // Update renderer status in debug panel
                    const rendererStatus = document.getElementById('rendererStatus');
                    if (rendererStatus) {
                        rendererStatus.textContent = 'Active';
                        rendererStatus.style.color = 'green';
                    }
                } catch (rendererError) {
                    console.error('Failed to create WebGLRenderer:', rendererError);
                    const errorLog = document.getElementById('errorLog');
                    if (errorLog) {
                        errorLog.textContent = 'WebGL error: ' + rendererError.message;
                        errorLog.style.color = 'red';
                    }
                    throw rendererError;
                }
            }
            
            // Store reference to the global renderer
            this.renderer = globalRenderer;
            
            // Set up camera position
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
            
            // Handle window resize
            window.addEventListener('resize', () => this.handleResize());
            
            // Test cube removed for production
            
            // Setup lights with the comprehensive method
            this.setupLights();
            
            console.log('SceneManager initialized successfully');
            if (window.updateLoadingStatus) {
                window.updateLoadingStatus('3D scene ready!', 85);
            }
        } catch (error) {
            console.error('Error initializing SceneManager:', error);
            const errorLog = document.getElementById('errorLog');
            if (errorLog) {
                errorLog.textContent = 'Scene init error: ' + error.message;
                errorLog.style.color = 'red';
            }
            if (window.updateLoadingStatus) {
                window.updateLoadingStatus('Error initializing 3D scene: ' + error.message, 0);
            }
        }
        
        // Log success
        console.log('SceneManager initialization complete');
    }
    
    setupLights() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0xccccff, 0.4); // Slightly blue tint
        this.scene.add(ambientLight);
        
        // Main directional light (sun-like)
        const directionalLight = new THREE.DirectionalLight(0xffffee, 0.8); // Warm light
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        
        // Improve shadow quality
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.0001;
        
        // Set up shadow camera to cover arena
        const shadowSize = ARENA_SIZE * 0.6;
        directionalLight.shadow.camera.left = -shadowSize;
        directionalLight.shadow.camera.right = shadowSize;
        directionalLight.shadow.camera.top = shadowSize;
        directionalLight.shadow.camera.bottom = -shadowSize;
        
        this.scene.add(directionalLight);
        
        // Add secondary fill light from opposite direction
        const fillLight = new THREE.DirectionalLight(0x8080ff, 0.3); // Blue-ish fill
        fillLight.position.set(-5, 8, -5);
        this.scene.add(fillLight);
        
        // Add subtle point light in center for extra dimension
        const centerLight = new THREE.PointLight(0xffffcc, 0.4, ARENA_SIZE * 2);
        centerLight.position.set(0, 2, 0);
        centerLight.castShadow = true;
        centerLight.shadow.mapSize.width = 1024;
        centerLight.shadow.mapSize.height = 1024;
        this.scene.add(centerLight);
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render() {
        try {
            // Ensure scene background is set to sky blue
            if (this.scene) {
                this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
            }
            
            // Ensure renderer clear color is set to sky blue
            if (this.renderer) {
                this.renderer.setClearColor(0x87CEEB, 1); // Sky blue with full opacity
            }
            
            // Use our comprehensive renderer method check
            if (!this.checkRendererMethods()) {
                // If renderer methods check fails, don't attempt to render
                console.warn('Renderer methods check failed, attempting to render anyway');
            }
            
            if (!this.scene || !this.camera) {
                console.warn('Scene or camera not initialized in SceneManager.render()');
                return;
            }
            
            // Force render the scene
            console.log('Rendering scene with background color:', this.scene.background);
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Error in SceneManager.render():', error);
            const errorLog = document.getElementById('errorLog');
            if (errorLog) {
                errorLog.textContent = 'Render error: ' + error.message;
                errorLog.style.color = 'red';
            }
        }
    }
    
    add(object) {
        this.scene.add(object);
    }
    
    remove(object) {
        this.scene.remove(object);
    }
    
    // Add lights to the scene - Method removed as setupLights is more comprehensive
    
    // Test cube method removed for production
    
    // Check if renderer has all required methods
    checkRendererMethods() {
        if (!this.renderer) {
            console.warn('Renderer not initialized');
            return false;
        }
        
        // Check for essential renderer methods
        const requiredMethods = ['render', 'setSize', 'getRenderTarget', 'setRenderTarget'];
        const missingMethods = [];
        
        for (const method of requiredMethods) {
            if (typeof this.renderer[method] !== 'function') {
                missingMethods.push(method);
            }
        }
        
        if (missingMethods.length > 0) {
            console.warn('Renderer missing required methods:', missingMethods);
            
            // Update error log
            const errorLog = document.getElementById('errorLog');
            if (errorLog) {
                errorLog.textContent = 'Renderer missing methods: ' + missingMethods.join(', ');
                errorLog.style.color = 'orange';
            }
            
            return false;
        }
        
        return true;
    }
}

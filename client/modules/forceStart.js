// Force Start module for Cube Dash Arena
// This module provides emergency rendering functionality when normal initialization fails

import { logError, clearErrorLog, updateErrorLog } from './utils.js';

// Create a simple emergency scene with a rotating cube
export function createEmergencyScene() {
    console.log('Creating emergency scene...');
    
    try {
        // Check if THREE.js is available
        if (!window.THREE) {
            throw new Error('THREE.js not available for emergency scene');
        }
        
        // Create basic scene elements
        const scene = new window.THREE.Scene();
        scene.background = new window.THREE.Color(0x87CEEB); // Sky blue background to match main scene
        
        const camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        
        // Create renderer with error handling
        let renderer;
        try {
            renderer = new window.THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x87CEEB, 1); // Sky blue to match main scene
            
            // Clean up any existing canvas with the same ID
            const existingCanvas = document.getElementById('emergencyCanvas');
            if (existingCanvas) {
                existingCanvas.remove();
            }
            
            // Add new canvas to the page
            renderer.domElement.id = 'emergencyCanvas';
            renderer.domElement.style.position = 'absolute';
            renderer.domElement.style.top = '0';
            renderer.domElement.style.left = '0';
            renderer.domElement.style.zIndex = '100';
            document.body.appendChild(renderer.domElement);
        } catch (error) {
            console.error('Failed to create WebGL renderer:', error);
            throw new Error('WebGL renderer creation failed: ' + error.message);
        }
        
        // Create a simple cube
        const geometry = new window.THREE.BoxGeometry(1, 1, 1);
        const material = new window.THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            wireframe: true
        });
        const cube = new window.THREE.Mesh(geometry, material);
        scene.add(cube);
        
        // Animation function
        function animate() {
            requestAnimationFrame(animate);
            
            // Rotate the cube
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            
            // Render the scene
            renderer.render(scene, camera);
            
            // Update debug info
            const fpsCounter = document.getElementById('fpsCounter');
            if (fpsCounter) {
                fpsCounter.textContent = Math.round(renderer.info.render.frame % 60);
            }
            
            const animStatus = document.getElementById('animStatus');
            if (animStatus) {
                animStatus.textContent = 'Emergency Mode';
                animStatus.style.color = 'orange';
            }
            
            const rendererStatus = document.getElementById('rendererStatus');
            if (rendererStatus) {
                rendererStatus.textContent = 'Emergency Renderer';
                rendererStatus.style.color = 'orange';
            }
        }
        
        // Start animation
        animate();
        
        return {
            scene,
            camera,
            renderer,
            cube
        };
    } catch (error) {
        logError('Failed to create emergency scene', error);
        return null;
    }
}

// Force start the game using any available method
export function forceStart() {
    console.log('Force start initiated');
    
    try {
        // Clear any previous errors
        clearErrorLog();
        
        // Try using the game manager if available
        if (window.gameManager) {
            console.log('Using game manager to force start');
            window.gameManager.startGame(true);
            
            updateErrorLog('Forced Start', 'orange');
            
            return true;
        }
        
        // Try using the scene manager if available
        if (window.sceneManager && window.sceneManager.renderer) {
            console.log('Using scene manager to force render');
            
            if (window.sceneManager.scene && window.sceneManager.camera) {
                window.sceneManager.renderer.render(window.sceneManager.scene, window.sceneManager.camera);
                
                // Update renderer status
                const rendererStatus = document.getElementById('rendererStatus');
                if (rendererStatus) {
                    rendererStatus.textContent = 'Direct Render';
                    rendererStatus.style.color = 'orange';
                }
                
                return true;
            }
        }
        
        // Last resort: create an emergency scene
        console.log('Creating emergency scene as last resort');
        return createEmergencyScene() !== null;
    } catch (error) {
        logError('Force start failed', error);
        return false;
    }
}

// Enhanced Texture utilities for Cube Dash Arena with Low-Poly Aesthetics
// THREE.js is loaded from CDN in the HTML file
const THREE = window.THREE;

export class TextureUtils {
    // Helper method to apply common texture settings
    _applyTextureSettings(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        // Set texture encoding based on THREE.js version
        if (THREE.SRGBColorSpace !== undefined) {
            texture.colorSpace = THREE.SRGBColorSpace; // For newer THREE.js versions
        } else if (THREE.sRGBEncoding !== undefined) {
            texture.encoding = THREE.sRGBEncoding; // For older THREE.js versions
        }
        
        texture.needsUpdate = true;
        return texture;
    }
    // Create a low-poly grid texture for the floor
    createGridTexture() {
        const size = 1024; // Increased resolution for better detail
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = context.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#8a9db5');
        gradient.addColorStop(1, '#6d7f99');
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);
        
        // Draw triangular pattern for low-poly effect
        const triangleSize = 64;
        const rows = size / triangleSize;
        const cols = size / triangleSize;
        
        // Create low-poly pattern with triangles
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * triangleSize;
                const y = row * triangleSize;
                
                // Randomize triangle color slightly for variation
                const brightness = 0.8 + Math.random() * 0.4; // 80-120% brightness
                const r = Math.floor(138 * brightness);
                const g = Math.floor(157 * brightness);
                const b = Math.floor(181 * brightness);
                context.fillStyle = `rgb(${r}, ${g}, ${b})`;
                
                // Draw triangles in alternating patterns
                context.beginPath();
                if ((row + col) % 2 === 0) {
                    // Top-left triangle
                    context.moveTo(x, y);
                    context.lineTo(x + triangleSize, y);
                    context.lineTo(x, y + triangleSize);
                } else {
                    // Bottom-right triangle
                    context.moveTo(x + triangleSize, y);
                    context.lineTo(x + triangleSize, y + triangleSize);
                    context.lineTo(x, y + triangleSize);
                }
                context.fill();
            }
        }
        
        // Draw grid lines
        context.strokeStyle = '#566c87';
        context.lineWidth = 1;
        
        // Draw vertical lines
        for (let i = 0; i <= size; i += triangleSize) {
            context.beginPath();
            context.moveTo(i, 0);
            context.lineTo(i, size);
            context.stroke();
        }
        
        // Draw horizontal lines
        for (let i = 0; i <= size; i += triangleSize) {
            context.beginPath();
            context.moveTo(0, i);
            context.lineTo(size, i);
            context.stroke();
        }
        
        // Create a canvas texture
        const texture = new THREE.CanvasTexture(canvas);
        return this._applyTextureSettings(texture);
    }

    // Create a low-poly texture for cubes
    createCubeTexture(color) {
        const size = 256; // Increased resolution
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Parse the color to RGB components
        let r, g, b;
        if (color.startsWith('#')) {
            r = parseInt(color.substring(1, 3), 16);
            g = parseInt(color.substring(3, 5), 16);
            b = parseInt(color.substring(5, 7), 16);
        } else {
            // Default fallback
            r = 100; g = 100; b = 100;
        }
        
        // Fill with base color
        context.fillStyle = color;
        context.fillRect(0, 0, size, size);
        
        // Draw triangular pattern for low-poly effect
        const triangleSize = 32;
        const rows = size / triangleSize;
        const cols = size / triangleSize;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * triangleSize;
                const y = row * triangleSize;
                
                // Vary the color slightly for each triangle
                const brightness = 0.8 + Math.random() * 0.4;
                const tr = Math.min(255, Math.floor(r * brightness));
                const tg = Math.min(255, Math.floor(g * brightness));
                const tb = Math.min(255, Math.floor(b * brightness));
                
                context.fillStyle = `rgb(${tr}, ${tg}, ${tb})`;
                
                // Draw triangles in alternating patterns
                context.beginPath();
                if ((row + col) % 2 === 0) {
                    context.moveTo(x, y);
                    context.lineTo(x + triangleSize, y);
                    context.lineTo(x, y + triangleSize);
                } else {
                    context.moveTo(x + triangleSize, y);
                    context.lineTo(x + triangleSize, y + triangleSize);
                    context.lineTo(x, y + triangleSize);
                }
                context.fill();
                
                // Add subtle edge lines
                context.strokeStyle = `rgba(${Math.floor(r*0.7)}, ${Math.floor(g*0.7)}, ${Math.floor(b*0.7)}, 0.3)`;
                context.lineWidth = 1;
                context.stroke();
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return this._applyTextureSettings(texture);
    }
    
    // Create a texture for obstacles with more complex patterns
    createObstacleTexture(color) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Parse the color to RGB components
        let r, g, b;
        if (color.startsWith('#')) {
            r = parseInt(color.substring(1, 3), 16);
            g = parseInt(color.substring(3, 5), 16);
            b = parseInt(color.substring(5, 7), 16);
        } else {
            // Default fallback
            r = 100; g = 100; b = 200;
        }
        
        // Fill with base color
        context.fillStyle = color;
        context.fillRect(0, 0, size, size);
        
        // Create hexagonal pattern for obstacles
        const hexSize = 32;
        const rows = Math.ceil(size / (hexSize * 1.5));
        const cols = Math.ceil(size / (hexSize * Math.sqrt(3)));
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Calculate center of hexagon
                const x = col * hexSize * Math.sqrt(3);
                const y = row * hexSize * 1.5 + (col % 2 === 0 ? 0 : hexSize * 0.75);
                
                // Vary the color slightly for each hexagon
                const brightness = 0.8 + Math.random() * 0.4;
                const tr = Math.min(255, Math.floor(r * brightness));
                const tg = Math.min(255, Math.floor(g * brightness));
                const tb = Math.min(255, Math.floor(b * brightness));
                
                context.fillStyle = `rgb(${tr}, ${tg}, ${tb})`;
                
                // Draw hexagon
                context.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI / 3);
                    const hx = x + hexSize * Math.cos(angle);
                    const hy = y + hexSize * Math.sin(angle);
                    
                    if (i === 0) {
                        context.moveTo(hx, hy);
                    } else {
                        context.lineTo(hx, hy);
                    }
                }
                context.closePath();
                context.fill();
                
                // Add subtle edge to hexagon
                context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                context.lineWidth = 1;
                context.stroke();
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        return this._applyTextureSettings(texture);
    }
}

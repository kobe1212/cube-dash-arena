// Texture utilities for Cube Dash Arena
window.textureUtils = {
    // Create a simple grid texture for the floor
    createGridTexture: function() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Fill with light gray
        context.fillStyle = '#aaaaaa';
        context.fillRect(0, 0, size, size);
        
        // Draw grid lines
        context.strokeStyle = '#666666';
        context.lineWidth = 2;
        
        // Draw vertical lines
        const gridSize = 64;
        for (let i = 0; i <= size; i += gridSize) {
            context.beginPath();
            context.moveTo(i, 0);
            context.lineTo(i, size);
            context.stroke();
        }
        
        // Draw horizontal lines
        for (let i = 0; i <= size; i += gridSize) {
            context.beginPath();
            context.moveTo(0, i);
            context.lineTo(size, i);
            context.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        return texture;
    },

    // Create a simple pattern texture for cubes
    createCubeTexture: function(color) {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Fill with base color
        context.fillStyle = color;
        context.fillRect(0, 0, size, size);
        
        // Add a highlight pattern
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(0, 0, size/2, size/2);
        context.fillRect(size/2, size/2, size/2, size/2);
        
        // Add a border
        context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        context.lineWidth = 4;
        context.strokeRect(4, 4, size-8, size-8);
        
        return new THREE.CanvasTexture(canvas);
    }
};

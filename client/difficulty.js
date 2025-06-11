// Difficulty manager for Cube Dash Arena
class DifficultyManager {
    constructor() {
        this.baseObstacleSpeed = 0.05;
        this.maxObstacleSpeed = 0.15;
        this.speedIncreaseRate = 0.0001; // How much to increase per second
        this.currentLevel = 1;
        this.startTime = 0;
        this.active = false;
        
        // Create level display
        this.createLevelDisplay();
    }
    
    // Start tracking difficulty
    start() {
        this.startTime = Date.now();
        this.currentLevel = 1;
        this.active = true;
        this.updateLevelDisplay();
    }
    
    // Stop tracking difficulty
    stop() {
        this.active = false;
    }
    
    // Reset difficulty
    reset() {
        this.startTime = Date.now();
        this.currentLevel = 1;
        this.updateLevelDisplay();
    }
    
    // Get current obstacle speed based on elapsed time
    getObstacleSpeed() {
        if (!this.active) {
            return this.baseObstacleSpeed;
        }
        
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        const speedIncrease = Math.min(
            this.speedIncreaseRate * elapsedSeconds,
            this.maxObstacleSpeed - this.baseObstacleSpeed
        );
        
        // Update level based on speed
        const newLevel = Math.floor((speedIncrease / (this.maxObstacleSpeed - this.baseObstacleSpeed)) * 10) + 1;
        if (newLevel !== this.currentLevel) {
            this.currentLevel = newLevel;
            this.updateLevelDisplay();
        }
        
        return this.baseObstacleSpeed + speedIncrease;
    }
    
    // Create level display element
    createLevelDisplay() {
        const levelDisplay = document.createElement('div');
        levelDisplay.id = 'level-display';
        levelDisplay.className = 'game-ui';
        levelDisplay.style.position = 'absolute';
        levelDisplay.style.top = '15px';
        levelDisplay.style.right = '15px';
        levelDisplay.style.padding = '10px';
        levelDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        levelDisplay.style.color = '#fff';
        levelDisplay.style.borderRadius = '5px';
        levelDisplay.style.fontSize = '16px';
        levelDisplay.style.fontWeight = 'bold';
        levelDisplay.textContent = 'Level: 1';
        
        document.body.appendChild(levelDisplay);
    }
    
    // Update level display
    updateLevelDisplay() {
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            levelDisplay.textContent = `Level: ${this.currentLevel}`;
            
            // Flash effect for level up
            if (this.currentLevel > 1) {
                levelDisplay.style.backgroundColor = 'rgba(255, 215, 0, 0.8)';
                levelDisplay.style.color = '#000';
                
                setTimeout(() => {
                    levelDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                    levelDisplay.style.color = '#fff';
                }, 500);
            }
        }
    }
}

// Create global difficulty manager instance
window.difficultyManager = new DifficultyManager();

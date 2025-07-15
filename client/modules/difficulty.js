// Difficulty manager for Cube Dash Arena
export class DifficultyManager {
    constructor() {
        this.baseObstacleSpeed = 0.05;
        this.maxObstacleSpeed = 0.15;
        this.speedIncreaseRate = 0.0001; // How much to increase per second
        this.currentLevel = 1;
        this.startTime = 0;
        this.active = false;
        
        // Initialize level display
        this.updateLevelDisplay();
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
    
    // Create level display element - Removed as it duplicated updateLevelDisplay
    
    // Update level display
    updateLevelDisplay() {
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            levelDisplay.textContent = `Level: ${this.currentLevel}`;
        }
    }
    
    // Get current level
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    // Get obstacle spawn rate based on current level
    getObstacleSpawnRate() {
        // Base spawn rate is 2 seconds, decreasing to 0.8 seconds at max level
        const baseRate = 2000;
        const minRate = 800;
        const levelFactor = (this.currentLevel - 1) / 9; // 0 to 1 based on level 1-10
        return baseRate - (baseRate - minRate) * levelFactor;
    }
}

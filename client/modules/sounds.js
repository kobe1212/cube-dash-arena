// Sound manager for Cube Dash Arena
export class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.volume = 0.5;
        
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Initialize sounds
        this.initSounds();
        
        // Add mute toggle button
        this.createMuteButton();
    }
    
    // Initialize sound effects using Web Audio API
    initSounds() {
        // Jump sound - a simple upward sweep
        this.createSynthSound('jump', (time) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(150, time);
            oscillator.frequency.exponentialRampToValueAtTime(400, time + 0.2);
            
            gainNode.gain.setValueAtTime(this.volume, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(time);
            oscillator.stop(time + 0.2);
        });
        
        // Collision sound - a noise burst
        this.createSynthSound('collision', (time) => {
            const bufferSize = this.audioContext.sampleRate * 0.3; // 0.3 seconds
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Fill buffer with noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.audioContext.createBufferSource();
            noise.buffer = buffer;
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(this.volume * 0.5, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            
            // Add a filter for more "impact" sound
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1000;
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            noise.start(time);
            noise.stop(time + 0.3);
        });
        
        // Game over sound - a descending tone
        this.createSynthSound('gameOver', (time) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, time);
            oscillator.frequency.exponentialRampToValueAtTime(100, time + 1.0);
            
            gainNode.gain.setValueAtTime(this.volume * 0.7, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 1.0);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(time);
            oscillator.stop(time + 1.0);
        });
        
        // Game start sound - an ascending tone
        this.createSynthSound('gameStart', (time) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(200, time);
            oscillator.frequency.exponentialRampToValueAtTime(600, time + 0.5);
            
            gainNode.gain.setValueAtTime(this.volume * 0.5, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(time);
            oscillator.stop(time + 0.5);
        });
    }
    
    // Create a synthetic sound using a callback function
    createSynthSound(name, callback) {
        this.sounds[name] = callback;
    }
    
    // Play sound methods
    playJumpSound() {
        this.play('jump');
    }
    
    playCollisionSound() {
        this.play('collision');
    }
    
    playGameOverSound() {
        this.play('gameOver');
    }
    
    playGameStartSound() {
        this.play('gameStart');
    }
    
    // Play a sound by name
    play(name) {
        if (this.muted) return;
        
        // Resume audio context if it's suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Play the sound if it exists
        if (this.sounds[name]) {
            this.sounds[name](this.audioContext.currentTime);
        }
    }
    
    // Alias for play method - for compatibility with code that uses playSound
    playSound(name) {
        this.play(name);
    }
    
    // Play jump sound
    playJumpSound() {
        if (this.muted) return;
        this.play('jump');
    }
    
    // Play collision sound
    playCollisionSound() {
        if (this.muted) return;
        this.play('collision');
    }
    
    // Play game over sound
    playGameOverSound() {
        if (this.muted) return;
        this.play('gameOver');
    }
    
    // Play game start sound
    playGameStartSound() {
        if (this.muted) return;
        this.play('gameStart');
    }
    
    // Play opponent hit sound
    playOpponentHitSound() {
        if (this.muted) return;
        this.play('opponentHit');
    }
    
    // Toggle mute state
    toggleMute() {
        this.muted = !this.muted;
        this.updateMuteButton();
    }
    
    // Create mute toggle button
    createMuteButton() {
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.addEventListener('click', () => this.toggleMute());
            this.updateMuteButton();
        }
    }
    
    // Update mute button text based on mute state
    updateMuteButton() {
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.textContent = this.muted ? '🔇' : '🔊';
        }
    }
}

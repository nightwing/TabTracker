// Audio Manager Class
class AudioManager {
  constructor() {
    this.backgroundMusic = null;
    this.hitSound = null;
    this.successSound = null;
    this.isMuted = true; // Start muted by default
    
    // Sound effects for special cells and powerups
    this.sounds = {
      hit: null,          // Basic hit sound
      success: null,      // Success sound (lines cleared)
      powerup: null,      // Generic powerup activation
      teleport: null,     // Portal teleportation
      gravity: null,      // Gravity flip
      bounce: null,       // Bouncy cell interaction
      magnetic: null,     // Magnetic attraction
      scramble: null,     // Piece rotation scramble
      gem: null,          // Gem found/collected
      timeFreeze: null,   // Time freeze powerup
      ghostMode: null,    // Ghost mode powerup
      explosion: null,    // Bomb powerup
      extraPiece: null    // Extra piece powerup
    };
    
    // Initialize sounds
    this.init();
  }
  
  // Initialize all sounds
  init() {
    // Create background music element
    this.backgroundMusic = new Audio('/sounds/background.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.5;
    
    // Initialize primary sound effects
    this.sounds.hit = new Audio('/sounds/hit.mp3');
    this.sounds.hit.volume = 0.3;
    
    this.sounds.success = new Audio('/sounds/success.mp3');
    this.sounds.success.volume = 0.5;
    
    // For compatibility with existing code
    this.hitSound = this.sounds.hit;
    this.successSound = this.sounds.success;
    
    // Initialize special effect sounds with fallbacks
    // If a specific sound isn't available, we'll use more generic ones
    this.sounds.powerup = new Audio('/sounds/success.mp3'); // Fallback to success sound
    this.sounds.powerup.volume = 0.4;
    
    this.sounds.teleport = this.sounds.powerup;     // Fallback to powerup sound
    this.sounds.gravity = this.sounds.powerup;      // Fallback to powerup sound
    this.sounds.bounce = this.sounds.hit;           // Fallback to hit sound
    this.sounds.magnetic = this.sounds.powerup;     // Fallback to powerup sound
    this.sounds.scramble = this.sounds.powerup;     // Fallback to powerup sound
    this.sounds.gem = this.sounds.success;          // Fallback to success sound
    this.sounds.timeFreeze = this.sounds.powerup;   // Fallback to powerup sound
    this.sounds.ghostMode = this.sounds.powerup;    // Fallback to powerup sound
    this.sounds.explosion = this.sounds.powerup;    // Fallback to powerup sound
    this.sounds.extraPiece = this.sounds.powerup;   // Fallback to powerup sound
    
    // Update UI based on mute state
    this.updateMuteUI();
  }
  
  // Toggle mute state
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
      }
    } else {
      if (this.backgroundMusic) {
        this.backgroundMusic.play().catch(error => {
          console.log("Background music play prevented:", error);
        });
      }
    }
    
    // Update UI based on new mute state
    this.updateMuteUI();
    
    // Log the change
    console.log(`Sound ${this.isMuted ? 'muted' : 'unmuted'}`);
  }
  
  // Update UI elements related to mute state
  updateMuteUI() {
    // Update the sound toggle button
    const soundBtn = document.getElementById('toggle-sound-btn');
    if (soundBtn) {
      soundBtn.textContent = this.isMuted ? '🔇 Unmute' : '🔊 Mute';
    }
    
    // Update mobile mute button if it exists
    const mobileMuteBtn = document.getElementById('mobile-mute');
    if (mobileMuteBtn) {
      mobileMuteBtn.textContent = this.isMuted ? 'Unmute' : 'Mute';
    }
  }
  
  // Play the hit sound
  playHit() {
    this.playSound('hit');
  }
  
  // Play the success sound
  playSuccess() {
    this.playSound('success');
  }
  
  // Play a specific sound by key name
  playSound(soundKey) {
    if (this.isMuted) {
      console.log(`${soundKey} sound skipped (muted)`);
      return;
    }
    
    const sound = this.sounds[soundKey];
    if (!sound) {
      console.log(`Sound not found: ${soundKey}`);
      return;
    }
    
    try {
      // For 'hit', we want overlapping sounds, so clone it
      if (soundKey === 'hit') {
        const soundClone = sound.cloneNode();
        soundClone.volume = sound.volume;
        soundClone.play().catch(error => {
          console.log(`${soundKey} sound play prevented:`, error);
        });
      } else {
        // For other sounds, reset and play
        sound.currentTime = 0;
        sound.play().catch(error => {
          console.log(`${soundKey} sound play prevented:`, error);
        });
      }
    } catch (error) {
      console.log(`Error playing ${soundKey} sound:`, error);
    }
  }
}

// Create a global audio manager instance
const audioManager = new AudioManager();
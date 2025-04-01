import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  powerupSound: HTMLAudioElement | null;
  portalSound: HTMLAudioElement | null;
  bounceSound: HTMLAudioElement | null;
  gravitySound: HTMLAudioElement | null;
  gemSound: HTMLAudioElement | null;
  explosionSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setPowerupSound: (sound: HTMLAudioElement) => void;
  setPortalSound: (sound: HTMLAudioElement) => void;
  setBounceSound: (sound: HTMLAudioElement) => void;
  setGravitySound: (sound: HTMLAudioElement) => void;
  setGemSound: (sound: HTMLAudioElement) => void;
  setExplosionSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playPowerup: () => void;
  playPortal: () => void;
  playBounce: () => void;
  playGravity: () => void;
  playGem: () => void;
  playExplosion: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  powerupSound: null,
  portalSound: null,
  bounceSound: null,
  gravitySound: null,
  gemSound: null,
  explosionSound: null,
  isMuted: true, // Start muted by default
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setPowerupSound: (sound) => set({ powerupSound: sound }),
  setPortalSound: (sound) => set({ portalSound: sound }),
  setBounceSound: (sound) => set({ bounceSound: sound }),
  setGravitySound: (sound) => set({ gravitySound: sound }),
  setGemSound: (sound) => set({ gemSound: sound }),
  setExplosionSound: (sound) => set({ explosionSound: sound }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playPowerup: () => {
    const { powerupSound, isMuted } = get();
    if (powerupSound) {
      if (isMuted) {
        console.log("Powerup sound skipped (muted)");
        return;
      }
      
      const soundClone = powerupSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.4;
      soundClone.play().catch(error => {
        console.log("Powerup sound play prevented:", error);
      });
    }
  },
  
  playPortal: () => {
    const { portalSound, isMuted } = get();
    if (portalSound) {
      if (isMuted) {
        console.log("Portal sound skipped (muted)");
        return;
      }
      
      const soundClone = portalSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.5;
      soundClone.play().catch(error => {
        console.log("Portal sound play prevented:", error);
      });
    }
  },
  
  playBounce: () => {
    const { bounceSound, isMuted } = get();
    if (bounceSound) {
      if (isMuted) {
        console.log("Bounce sound skipped (muted)");
        return;
      }
      
      const soundClone = bounceSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Bounce sound play prevented:", error);
      });
    }
  },
  
  playGravity: () => {
    const { gravitySound, isMuted } = get();
    if (gravitySound) {
      if (isMuted) {
        console.log("Gravity sound skipped (muted)");
        return;
      }
      
      const soundClone = gravitySound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.4;
      soundClone.play().catch(error => {
        console.log("Gravity sound play prevented:", error);
      });
    }
  },
  
  playGem: () => {
    const { gemSound, isMuted } = get();
    if (gemSound) {
      if (isMuted) {
        console.log("Gem sound skipped (muted)");
        return;
      }
      
      gemSound.currentTime = 0;
      gemSound.volume = 0.6;
      gemSound.play().catch(error => {
        console.log("Gem sound play prevented:", error);
      });
    }
  },
  
  playExplosion: () => {
    const { explosionSound, isMuted } = get();
    if (explosionSound) {
      if (isMuted) {
        console.log("Explosion sound skipped (muted)");
        return;
      }
      
      const soundClone = explosionSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.5;
      soundClone.play().catch(error => {
        console.log("Explosion sound play prevented:", error);
      });
    }
  }
}));

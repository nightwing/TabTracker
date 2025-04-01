import { useEffect } from 'react';
import { useAudio } from '@/lib/stores/useAudio';
import { useKeyboardControls } from '@react-three/drei';
import { ControlKey } from '../types';

export function SoundManager() {
  const { backgroundMusic, isMuted, toggleMute } = useAudio.getState();
  const mutePressed = useKeyboardControls<ControlKey>(state => state.mute);
  
  // Initialize and manage background music
  useEffect(() => {
    // Create new audio elements if they don't exist
    if (!backgroundMusic) {
      const bgMusic = new Audio('/sounds/background.mp3');
      bgMusic.loop = true;
      bgMusic.volume = 0.5;
      useAudio.getState().setBackgroundMusic(bgMusic);
      
      const hitSound = new Audio('/sounds/hit.mp3');
      hitSound.volume = 0.3;
      useAudio.getState().setHitSound(hitSound);
      
      const successSound = new Audio('/sounds/success.mp3');
      successSound.volume = 0.5;
      useAudio.getState().setSuccessSound(successSound);
    }
    
    // Play background music if not muted
    if (backgroundMusic && !isMuted) {
      backgroundMusic.play().catch(error => {
        console.log("Background music play prevented:", error);
      });
    }
    
    // Cleanup function
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
    };
  }, [backgroundMusic]);
  
  // Handle mute toggling
  useEffect(() => {
    if (backgroundMusic) {
      if (isMuted) {
        backgroundMusic.pause();
      } else {
        backgroundMusic.play().catch(error => {
          console.log("Background music play prevented:", error);
        });
      }
    }
  }, [isMuted, backgroundMusic]);
  
  // Toggle mute with keyboard
  useEffect(() => {
    if (mutePressed) {
      toggleMute();
    }
  }, [mutePressed]);
  
  // This is a utility component with no visual representation
  return null;
}

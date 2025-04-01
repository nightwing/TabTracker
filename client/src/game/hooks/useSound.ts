import { useEffect, useRef } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { ControlKey } from '../types';
import { useAudio } from '@/lib/stores/useAudio';
import { useGameStore } from '../stores/gameStore';

/**
 * Custom hook to handle game sounds
 */
export function useSound() {
  const audioRef = useRef<{
    backgroundMusic: HTMLAudioElement | null;
    move: HTMLAudioElement | null;
    rotate: HTMLAudioElement | null;
    drop: HTMLAudioElement | null;
    lineClear: HTMLAudioElement | null;
    levelComplete: HTMLAudioElement | null;
    gameOver: HTMLAudioElement | null;
  }>({
    backgroundMusic: null,
    move: null,
    rotate: null,
    drop: null,
    lineClear: null,
    levelComplete: null,
    gameOver: null
  });
  
  const mutePressed = useKeyboardControls<ControlKey>(state => state.mute);
  const { isMuted, toggleMute } = useAudio.getState();
  const gameState = useGameStore(state => ({
    paused: state.paused,
    gameOver: state.gameOver,
    linesCleared: state.linesCleared
  }));
  
  const prevLinesClearedRef = useRef(0);
  
  // Initialize sound effects
  useEffect(() => {
    // Set up audio references
    audioRef.current = {
      backgroundMusic: new Audio('/sounds/background.mp3'),
      move: new Audio('/sounds/hit.mp3'),
      rotate: new Audio('/sounds/hit.mp3'),
      drop: new Audio('/sounds/hit.mp3'),
      lineClear: new Audio('/sounds/success.mp3'),
      levelComplete: new Audio('/sounds/success.mp3'),
      gameOver: new Audio('/sounds/hit.mp3')
    };
    
    // Configure background music
    if (audioRef.current.backgroundMusic) {
      audioRef.current.backgroundMusic.loop = true;
      audioRef.current.backgroundMusic.volume = 0.5;
    }
    
    // Start playing background music
    playBackgroundMusic();
    
    // Cleanup
    return () => {
      Object.values(audioRef.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);
  
  // Handle mute toggle
  useEffect(() => {
    if (mutePressed) {
      toggleMute();
    }
  }, [mutePressed]);
  
  // Update audio state based on mute setting
  useEffect(() => {
    Object.values(audioRef.current).forEach(audio => {
      if (audio) {
        audio.muted = isMuted;
      }
    });
    
    // Resume or pause background music based on mute state
    if (audioRef.current.backgroundMusic) {
      if (isMuted) {
        audioRef.current.backgroundMusic.pause();
      } else if (!gameState.paused && !gameState.gameOver) {
        audioRef.current.backgroundMusic.play().catch(e => console.log("Audio play prevented:", e));
      }
    }
  }, [isMuted]);
  
  // Handle game state changes (pause, game over)
  useEffect(() => {
    if (audioRef.current.backgroundMusic) {
      if (gameState.paused || gameState.gameOver) {
        audioRef.current.backgroundMusic.pause();
      } else if (!isMuted) {
        audioRef.current.backgroundMusic.play().catch(e => console.log("Audio play prevented:", e));
      }
    }
    
    // Play game over sound
    if (gameState.gameOver && audioRef.current.gameOver && !isMuted) {
      audioRef.current.gameOver.play().catch(e => console.log("Audio play prevented:", e));
    }
  }, [gameState.paused, gameState.gameOver]);
  
  // Play line clear sound when lines are cleared
  useEffect(() => {
    if (gameState.linesCleared > prevLinesClearedRef.current && audioRef.current.lineClear && !isMuted) {
      audioRef.current.lineClear.play().catch(e => console.log("Audio play prevented:", e));
      prevLinesClearedRef.current = gameState.linesCleared;
    }
  }, [gameState.linesCleared]);
  
  // Helper functions to play sounds
  const playBackgroundMusic = () => {
    if (audioRef.current.backgroundMusic && !isMuted && !gameState.paused && !gameState.gameOver) {
      audioRef.current.backgroundMusic.play().catch(e => console.log("Audio play prevented:", e));
    }
  };
  
  const playMoveSound = () => {
    if (audioRef.current.move && !isMuted) {
      audioRef.current.move.currentTime = 0;
      audioRef.current.move.play().catch(e => console.log("Audio play prevented:", e));
    }
  };
  
  const playRotateSound = () => {
    if (audioRef.current.rotate && !isMuted) {
      audioRef.current.rotate.currentTime = 0;
      audioRef.current.rotate.play().catch(e => console.log("Audio play prevented:", e));
    }
  };
  
  const playDropSound = () => {
    if (audioRef.current.drop && !isMuted) {
      audioRef.current.drop.currentTime = 0;
      audioRef.current.drop.play().catch(e => console.log("Audio play prevented:", e));
    }
  };
  
  const playLineClearSound = () => {
    if (audioRef.current.lineClear && !isMuted) {
      audioRef.current.lineClear.currentTime = 0;
      audioRef.current.lineClear.play().catch(e => console.log("Audio play prevented:", e));
    }
  };
  
  const playLevelCompleteSound = () => {
    if (audioRef.current.levelComplete && !isMuted) {
      audioRef.current.levelComplete.currentTime = 0;
      audioRef.current.levelComplete.play().catch(e => console.log("Audio play prevented:", e));
    }
  };
  
  const playGameOverSound = () => {
    if (audioRef.current.gameOver && !isMuted) {
      audioRef.current.gameOver.currentTime = 0;
      audioRef.current.gameOver.play().catch(e => console.log("Audio play prevented:", e));
    }
  };
  
  return {
    isMuted,
    toggleMute,
    playMoveSound,
    playRotateSound,
    playDropSound,
    playLineClearSound,
    playLevelCompleteSound,
    playGameOverSound
  };
}

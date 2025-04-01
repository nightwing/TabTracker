import { useEffect, useState } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { ControlKey } from '../types';
import { useGameStore } from '../stores/gameStore';
import { useAudio } from '@/lib/stores/useAudio';

/**
 * Custom hook to handle game controls
 */
export function useControls() {
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());
  const [moveDelay, setMoveDelay] = useState<number>(150); // ms delay between moves
  const [dropDelay, setDropDelay] = useState<number>(50); // ms delay for soft drop
  
  const gameStore = useGameStore();
  const { playHit, playSuccess } = useAudio.getState();
  
  // Get keyboard control states using drei's useKeyboardControls
  const leftPressed = useKeyboardControls<ControlKey>(state => state.left);
  const rightPressed = useKeyboardControls<ControlKey>(state => state.right);
  const downPressed = useKeyboardControls<ControlKey>(state => state.down);
  const rotatePressed = useKeyboardControls<ControlKey>(state => state.rotate);
  const dropPressed = useKeyboardControls<ControlKey>(state => state.drop);
  const pausePressed = useKeyboardControls<ControlKey>(state => state.pause);
  const mutePressed = useKeyboardControls<ControlKey>(state => state.mute);
  
  // Function to handle movement with cooldown
  const handleMovement = (moveFunction: () => void, isSuccess: boolean = false) => {
    const now = Date.now();
    if (now - lastMoveTime > moveDelay) {
      moveFunction();
      if (isSuccess) {
        playSuccess();
      } else {
        playHit();
      }
      setLastMoveTime(now);
    }
  };
  
  // Key press handlers with throttling
  useEffect(() => {
    // Skip if game is paused or over
    if (gameStore.paused || gameStore.gameOver) return;
    
    // Check if keys are pressed and sufficient time has passed since the last move
    const now = Date.now();

    if (leftPressed && now - lastMoveTime > moveDelay) {
      gameStore.moveLeft();
      playHit();
      setLastMoveTime(now);
    }
    
    if (rightPressed && now - lastMoveTime > moveDelay) {
      gameStore.moveRight();
      playHit();
      setLastMoveTime(now);
    }
    
    if (downPressed && now - lastMoveTime > dropDelay) {
      gameStore.moveDown();
      setLastMoveTime(now);
    }
    
    if (rotatePressed && now - lastMoveTime > moveDelay) {
      gameStore.rotatePiece();
      playHit();
      setLastMoveTime(now);
    }
    
    if (dropPressed && now - lastMoveTime > moveDelay) {
      gameStore.dropPiece();
      playHit();
      setLastMoveTime(now);
    }
  }, [
    leftPressed, 
    rightPressed, 
    downPressed, 
    rotatePressed, 
    dropPressed, 
    lastMoveTime,
    gameStore.paused,
    gameStore.gameOver
  ]);
  
  // Handle pause toggle on key press
  useEffect(() => {
    const now = Date.now();
    if (pausePressed && now - lastMoveTime > moveDelay) {
      gameStore.setPaused(!gameStore.paused);
      playHit();
      setLastMoveTime(now);
    }
  }, [pausePressed, lastMoveTime]);
  
  // Handle mute toggle on key press
  useEffect(() => {
    const now = Date.now();
    if (mutePressed && now - lastMoveTime > moveDelay) {
      useAudio.getState().toggleMute();
      setLastMoveTime(now);
    }
  }, [mutePressed, lastMoveTime]);
  
  // Setup touch controls for mobile devices
  useEffect(() => {
    // Detect if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // If on mobile, make the movement delay shorter for better responsiveness
      setMoveDelay(100); 
      setDropDelay(30);
      
      // Mobile devices might need additional touch controls
      // We'll implement them here if needed
    }
  }, []);
  
  return {
    handleLeft: () => handleMovement(gameStore.moveLeft),
    handleRight: () => handleMovement(gameStore.moveRight),
    handleDown: () => handleMovement(gameStore.moveDown), 
    handleRotate: () => handleMovement(gameStore.rotatePiece),
    handleDrop: () => handleMovement(gameStore.dropPiece),
    handlePause: () => handleMovement(() => gameStore.setPaused(!gameStore.paused)),
    handleMute: () => handleMovement(() => useAudio.getState().toggleMute())
  };
}

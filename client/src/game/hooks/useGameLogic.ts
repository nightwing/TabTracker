import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useAudio } from '@/lib/stores/useAudio';
import { useKeyboardControls } from '@react-three/drei';
import { ControlKey, GridCell, TetrominoPiece, Position } from '../types';

/**
 * Custom hook to handle all the game logic
 */
export function useGameLogic(levelId: number, gridType: 'normal' | 'hexagonal' | 'triangular') {
  const [gameInterval, setGameInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());
  const gameStore = useGameStore();
  const { playHit, playSuccess } = useAudio.getState();
  
  // Get keyboard control states
  const leftPressed = useKeyboardControls<ControlKey>(state => state.left);
  const rightPressed = useKeyboardControls<ControlKey>(state => state.right);
  const downPressed = useKeyboardControls<ControlKey>(state => state.down);
  const rotatePressed = useKeyboardControls<ControlKey>(state => state.rotate);
  const dropPressed = useKeyboardControls<ControlKey>(state => state.drop);
  const pausePressed = useKeyboardControls<ControlKey>(state => state.pause);
  
  // Initialize game
  useEffect(() => {
    // Initialize the game with the selected level
    gameStore.initializeGame(levelId);
    
    // Start the game interval
    const interval = setInterval(() => {
      if (!gameStore.paused && !gameStore.gameOver) {
        gameStore.tick();
      }
    }, 1000 / gameStore.fallingSpeed);
    
    setGameInterval(interval);
    
    // Cleanup on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [levelId, gridType]);
  
  // Handle keyboard controls
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastMove = now - lastMoveTime;
    const moveDelay = 100; // ms between moves
    
    if (timeSinceLastMove < moveDelay) return;
    
    if (leftPressed) {
      gameStore.moveLeft();
      playHit();
      setLastMoveTime(now);
    }
    
    if (rightPressed) {
      gameStore.moveRight();
      playHit();
      setLastMoveTime(now);
    }
    
    if (downPressed) {
      gameStore.moveDown();
      setLastMoveTime(now);
    }
    
    if (rotatePressed) {
      gameStore.rotatePiece();
      playHit();
      setLastMoveTime(now);
    }
    
    if (dropPressed) {
      gameStore.dropPiece();
      playHit();
      setLastMoveTime(now);
    }
  }, [leftPressed, rightPressed, downPressed, rotatePressed, dropPressed, lastMoveTime]);
  
  // Handle pause toggle
  useEffect(() => {
    if (pausePressed) {
      gameStore.setPaused(!gameStore.paused);
    }
  }, [pausePressed]);
  
  // Handle line clear event
  const handleLineCleared = useCallback((linesCleared: number) => {
    if (linesCleared > 0) {
      playSuccess();
      
      // Update score and other game mechanics
      // ...
    }
  }, []);
  
  // Adjust falling speed based on score
  useEffect(() => {
    const baseSpeed = gameStore.level.difficulty;
    const scoreFactorSpeed = Math.floor(gameStore.score / 1000) * 0.1;
    const newSpeed = baseSpeed + scoreFactorSpeed;
    
    // Update interval if speed changes
    if (newSpeed !== gameStore.fallingSpeed) {
      // Clear old interval
      if (gameInterval) clearInterval(gameInterval);
      
      // Set new interval with adjusted speed
      const interval = setInterval(() => {
        if (!gameStore.paused && !gameStore.gameOver) {
          gameStore.tick();
        }
      }, 1000 / newSpeed);
      
      setGameInterval(interval);
      
      // Update falling speed in the store
      // (We don't use the store setter here to avoid loop with the dependency array)
    }
  }, [gameStore.score]);
  
  // Return game state and helper functions
  return {
    state: {
      grid: gameStore.grid,
      currentPiece: gameStore.currentPiece,
      nextPiece: gameStore.nextPiece,
      piecePosition: gameStore.piecePosition,
      score: gameStore.score,
      linesCleared: gameStore.linesCleared,
      viewportPosition: gameStore.viewportPosition,
      level: gameStore.level,
      gameOver: gameStore.gameOver,
      paused: gameStore.paused
    },
    actions: {
      moveLeft: gameStore.moveLeft,
      moveRight: gameStore.moveRight,
      moveDown: gameStore.moveDown,
      rotatePiece: gameStore.rotatePiece,
      dropPiece: gameStore.dropPiece,
      togglePause: () => gameStore.setPaused(!gameStore.paused),
      resetGame: () => gameStore.initializeGame(levelId)
    }
  };
}

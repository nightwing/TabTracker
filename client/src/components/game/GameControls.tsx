import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { useTetrisGame } from "@/lib/stores/useTetrisGame";
import { GameState, INITIAL_DROP_TIME } from "@/lib/constants";

// Game controls handler component
export default function GameControls() {
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { 
    gameState, 
    tick, 
    moveLeft, 
    moveRight, 
    moveDown, 
    rotateClockwise, 
    rotateCounterClockwise, 
    hardDrop, 
    pauseGame, 
    resumeGame, 
    restartLevel, 
    dropTime 
  } = useTetrisGame();
  
  // For drop timing
  const lastDropTime = useRef(0);
  
  // For continuous movement (when holding down a key)
  const moveLeftInterval = useRef<number | null>(null);
  const moveRightInterval = useRef<number | null>(null);
  const moveDownInterval = useRef<number | null>(null);
  const lastMoveHorizontalTime = useRef(0);
  
  // Subscribe to keyboard events
  useEffect(() => {
    // Listen for key presses for one-time actions (rotate, hard drop)
    const rotateClockwiseUnsubscribe = subscribeKeys(
      (state) => state.rotateClockwise,
      (pressed) => {
        if (pressed && gameState === GameState.PLAYING) {
          rotateClockwise();
        }
      }
    );
    
    const rotateCounterClockwiseUnsubscribe = subscribeKeys(
      (state) => state.rotateCounterClockwise,
      (pressed) => {
        if (pressed && gameState === GameState.PLAYING) {
          rotateCounterClockwise();
        }
      }
    );
    
    const hardDropUnsubscribe = subscribeKeys(
      (state) => state.hardDrop,
      (pressed) => {
        if (pressed && gameState === GameState.PLAYING) {
          hardDrop();
        }
      }
    );
    
    const pauseUnsubscribe = subscribeKeys(
      (state) => state.pause,
      (pressed) => {
        if (pressed) {
          if (gameState === GameState.PLAYING) {
            pauseGame();
          } else if (gameState === GameState.PAUSED) {
            resumeGame();
          }
        }
      }
    );
    
    const restartUnsubscribe = subscribeKeys(
      (state) => state.restart,
      (pressed) => {
        if (pressed && (gameState === GameState.GAME_OVER || gameState === GameState.PAUSED)) {
          restartLevel();
        }
      }
    );
    
    // Add logging for debugging
    console.log("Game controls initialized");
    
    return () => {
      rotateClockwiseUnsubscribe();
      rotateCounterClockwiseUnsubscribe();
      hardDropUnsubscribe();
      pauseUnsubscribe();
      restartUnsubscribe();
      
      // Clear any intervals
      if (moveLeftInterval.current) clearInterval(moveLeftInterval.current);
      if (moveRightInterval.current) clearInterval(moveRightInterval.current);
      if (moveDownInterval.current) clearInterval(moveDownInterval.current);
    };
  }, [
    subscribeKeys, 
    gameState, 
    rotateClockwise, 
    rotateCounterClockwise, 
    hardDrop, 
    pauseGame, 
    resumeGame, 
    restartLevel
  ]);
  
  // Handle continuous movement in the game loop
  useFrame((state) => {
    if (gameState !== GameState.PLAYING) return;
    
    const { clock } = state;
    const keys = getKeys();
    
    // Handle automatic drop based on level speed
    if (clock.elapsedTime - lastDropTime.current > dropTime / 1000) {
      lastDropTime.current = clock.elapsedTime;
      tick();
    }
    
    // Handle horizontal movement (with delay between movements)
    const moveRepeatDelay = 0.1; // seconds
    
    if (clock.elapsedTime - lastMoveHorizontalTime.current > moveRepeatDelay) {
      if (keys.moveLeft) {
        moveLeft();
        lastMoveHorizontalTime.current = clock.elapsedTime;
      } else if (keys.moveRight) {
        moveRight();
        lastMoveHorizontalTime.current = clock.elapsedTime;
      }
    }
    
    // Handle soft drop (move down faster)
    if (keys.moveDown) {
      // Increase drop speed when holding down
      if (clock.elapsedTime - lastDropTime.current > dropTime / 5000) {
        lastDropTime.current = clock.elapsedTime;
        moveDown();
      }
    }
  });
  
  return null; // This component doesn't render anything
}

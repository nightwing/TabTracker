import { useEffect } from "react";
import { useTetrisGame } from "../../lib/stores/useTetrisGame";
import { GameState } from "../../lib/constants";

// Game controls handler component
export default function GameControls() {
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
  
  // Set up game tick and keyboard controls
  useEffect(() => {
    // Add logging for debugging
    console.log("3D Game controls initialized");
    
    // Set up auto drop timer
    let lastTickTime = performance.now();
    const gameInterval = setInterval(() => {
      if (gameState === GameState.PLAYING) {
        const now = performance.now();
        
        // Check if enough time has passed for a game tick
        if (now - lastTickTime >= dropTime) {
          lastTickTime = now;
          tick();
        }
      }
    }, 50); // Check frequently to make timing more accurate
    
    // Handle keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      // Always log key presses for debugging
      console.log(`Key pressed: "${e.key}" - Game state: ${gameState}`);
      
      // Only respond to controls if the game is in playing state
      if (gameState !== GameState.PLAYING) {
        if (gameState === GameState.PAUSED && e.key === 'p') {
          resumeGame();
        }
        return;
      }
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          console.log("Moving left");
          moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
          console.log("Moving right");
          moveRight();
          break;
        case 'ArrowDown':
        case 's':
          console.log("Moving down");
          moveDown();
          break;
        case 'ArrowUp':
        case 'w':
          console.log("Rotating clockwise");
          rotateClockwise();
          break;
        case 'z':
        case 'q':
          console.log("Rotating counter-clockwise");
          rotateCounterClockwise();
          break;
        case ' ':
          console.log("Hard dropping");
          hardDrop();
          break;
        case 'p':
          console.log("Pausing game");
          pauseGame();
          break;
        case 'r':
          console.log("Restarting level");
          restartLevel();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(gameInterval);
    };
  }, [
    gameState, 
    moveLeft, 
    moveRight, 
    rotateClockwise, 
    rotateCounterClockwise, 
    moveDown, 
    hardDrop, 
    pauseGame,
    resumeGame,
    restartLevel,
    tick,
    dropTime
  ]);
  
  return null; // This component doesn't render anything
}

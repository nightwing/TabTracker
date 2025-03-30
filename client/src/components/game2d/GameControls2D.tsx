import { useEffect } from 'react';
import { useTetrisGame } from '../../lib/stores/useTetrisGame';
import { GameState } from '../../lib/constants';

export default function GameControls2D() {
  const { 
    moveLeft, 
    moveRight,
    rotateClockwise,
    rotateCounterClockwise,
    moveDown,
    hardDrop,
    pauseGame,
    resumeGame,
    restartLevel,
    gameState
  } = useTetrisGame();
  
  // Set up keyboard controls for the game
  useEffect(() => {
    console.log("Game controls initialized");
    
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
    };
  }, [
    moveLeft, 
    moveRight, 
    rotateClockwise, 
    rotateCounterClockwise, 
    moveDown, 
    hardDrop, 
    pauseGame,
    resumeGame,
    restartLevel,
    gameState
  ]);
  
  return null; // This component only handles keyboard controls, no rendering
}
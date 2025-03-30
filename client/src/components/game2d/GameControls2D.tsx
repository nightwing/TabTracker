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
          moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
          moveRight();
          break;
        case 'ArrowDown':
        case 's':
          moveDown();
          break;
        case 'ArrowUp':
        case 'w':
          rotateClockwise();
          break;
        case 'z':
        case 'q':
          rotateCounterClockwise();
          break;
        case ' ':
          hardDrop();
          break;
        case 'p':
          pauseGame();
          break;
        case 'r':
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
import { useEffect } from "react";
import ScoreDisplay from "./ScoreDisplay";
import { useTetrisGame } from "../../lib/stores/useTetrisGame";
import { GameState } from "../../lib/constants";
import { useAudio } from "../../lib/stores/useAudio";

export default function GameUI() {
  const { gameState, startGame } = useTetrisGame();
  const { backgroundMusic, isMuted } = useAudio();
  
  // Start game if no state is set
  useEffect(() => {
    if (gameState === GameState.MENU) {
      // Leave in menu state, let user click start
    }
  }, [gameState, startGame]);
  
  // Handle background music
  useEffect(() => {
    if (backgroundMusic) {
      if (!isMuted) {
        backgroundMusic.play().catch(err => {
          console.log("Background music playback prevented:", err);
        });
      } else {
        backgroundMusic.pause();
      }
    }
    
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [backgroundMusic, isMuted]);
  
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Game title and overlay for non-playing states */}
      {(gameState === GameState.MENU || gameState === GameState.GAME_OVER || gameState === GameState.PAUSED || gameState === GameState.LEVEL_COMPLETE) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
          {gameState === GameState.MENU && (
            <>
              <h1 className="text-4xl text-white font-bold mb-8 tracking-tight">
                Geometric Tetris
              </h1>
              <button 
                onClick={() => startGame(1)} 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg text-lg pointer-events-auto transition-colors"
              >
                Start Game
              </button>
            </>
          )}
          
          {gameState === GameState.PAUSED && (
            <>
              <h2 className="text-3xl text-white font-bold mb-4">
                Game Paused
              </h2>
              <p className="text-white text-lg mb-6">
                Press 'P' to resume
              </p>
            </>
          )}
          
          {gameState === GameState.GAME_OVER && (
            <>
              <h2 className="text-3xl text-white font-bold mb-4">
                Game Over
              </h2>
              <p className="text-white text-lg mb-6">
                Press 'R' to restart level
              </p>
              <button 
                onClick={() => startGame(1)} 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg text-lg pointer-events-auto transition-colors"
              >
                Start New Game
              </button>
            </>
          )}
          
          {gameState === GameState.LEVEL_COMPLETE && (
            <>
              <h2 className="text-3xl text-white font-bold mb-4">
                Level Complete!
              </h2>
              <button 
                onClick={() => startGame(1)} 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg text-lg pointer-events-auto transition-colors mt-4"
              >
                Start New Game
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Score display - positioned at top right */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <ScoreDisplay />
      </div>
      
      {/* Game instructions - positioned at bottom */}
      {gameState === GameState.PLAYING && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center text-sm bg-slate-900 bg-opacity-80 px-4 py-2 rounded-md">
          <p className="mb-1">Controls: ←↓→ or WASD to move, ↑ or W to rotate</p>
          <p>Space to hard drop, P to pause, R to restart</p>
          <p className="mt-1 font-bold">Clear lines to reach the gem at the bottom!</p>
        </div>
      )}
    </div>
  );
}

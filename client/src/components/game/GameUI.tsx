import { useEffect } from "react";
import ScoreDisplay from "./ScoreDisplay";
import { useTetrisGame } from "@/lib/stores/useTetrisGame";
import { GameState } from "@/lib/constants";
import { useAudio } from "@/lib/stores/useAudio";

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
      {(gameState === GameState.MENU || gameState === GameState.GAME_OVER || gameState === GameState.PAUSED) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
          {gameState === GameState.MENU && (
            <h1 className="text-4xl text-white font-bold mb-8 tracking-tight">
              Geometric Tetris
            </h1>
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
          <p>Clear lines to reach the gem at the bottom!</p>
        </div>
      )}
    </div>
  );
}

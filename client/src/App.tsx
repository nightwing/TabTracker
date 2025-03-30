import { useEffect, useState } from "react";
import { useAudio } from "./lib/stores/useAudio";
import { useTetrisGame } from "./lib/stores/useTetrisGame";
import WellRenderer from "./components/game/WellRenderer";
import GameControls from "./components/game/GameControls";
import GameUI from "./components/game/GameUI";
import { Canvas } from "@react-three/fiber";
import "@fontsource/inter";

// Main App component
function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { startGame, gameState } = useTetrisGame();

  // Show the game once everything is loaded
  useEffect(() => {
    setIsLoaded(true);
    
    // Auto-start the game with level 1
    if (gameState === 'menu') {
      console.log("Auto-starting game with level 1");
      startGame(1);
    }
  }, [gameState, startGame]);

  return (
    <div className="w-full h-full bg-slate-900">
      {isLoaded && (
        <div className="w-full h-full relative">
          {/* 3D Canvas */}
          <div className="absolute inset-0">
            <Canvas
              camera={{ 
                position: [0, 5, 40],
                zoom: 30,
                up: [0, 0, 1]
              }}
              shadows
              flat
              orthographic
            >
              <WellRenderer />
              {/* Add ambient light for flat, even lighting */}
              <ambientLight intensity={0.8} />
            </Canvas>
          </div>
          
          {/* Game UI overlay */}
          <GameUI />
          
          {/* Game controls (keyboard handling) */}
          <GameControls />
        </div>
      )}
    </div>
  );
}

export default App;

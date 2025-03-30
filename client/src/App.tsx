import { useEffect, useState } from "react";
import { useAudio } from "./lib/stores/useAudio";
import { useTetrisGame } from "./lib/stores/useTetrisGame";
import Game2D from "./components/game2d/Game2D";
import "@fontsource/inter";

// Main App component
function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Show the game once everything is loaded
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="w-full h-full bg-slate-900">
      {isLoaded && (
        <Game2D />
      )}
    </div>
  );
}

export default App;

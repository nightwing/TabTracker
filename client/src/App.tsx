import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import { useTetrisGame } from "./lib/stores/useTetrisGame";
import GameUI from "./components/game/GameUI";
import WellRenderer from "./components/game/WellRenderer";
import "@fontsource/inter";

// Define control keys for the game
const controls = [
  { name: "moveLeft", keys: ["KeyA", "ArrowLeft"] },
  { name: "moveRight", keys: ["KeyD", "ArrowRight"] },
  { name: "moveDown", keys: ["KeyS", "ArrowDown"] },
  { name: "rotateClockwise", keys: ["KeyE"] },
  { name: "rotateCounterClockwise", keys: ["KeyQ"] },
  { name: "hardDrop", keys: ["Space"] },
  { name: "pause", keys: ["KeyP"] },
  { name: "restart", keys: ["KeyR"] },
];

// Background sound setup function
function SoundManager() {
  const { setBackgroundMusic, setHitSound, setSuccessSound, toggleMute } = useAudio();
  
  useEffect(() => {
    // Load and set background music
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    setBackgroundMusic(bgMusic);
    
    // Load and set sound effects
    const hit = new Audio("/sounds/hit.mp3");
    setHitSound(hit);
    
    const success = new Audio("/sounds/success.mp3");
    setSuccessSound(success);
    
    // Start with sounds unmuted
    toggleMute();
    
    return () => {
      bgMusic.pause();
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound, toggleMute]);
  
  return null;
}

// Main App component
function App() {
  const { gameState } = useTetrisGame();
  const [showCanvas, setShowCanvas] = useState(false);

  // Show the canvas once everything is loaded
  useEffect(() => {
    setShowCanvas(true);
  }, []);

  return (
    <div className="w-full h-full bg-slate-900">
      {showCanvas && (
        <KeyboardControls map={controls}>
          <Canvas
            shadows
            camera={{
              position: [0, 4, 8],
              fov: 50,
              near: 0.1,
              far: 100
            }}
            gl={{
              antialias: true,
              powerPreference: "default"
            }}
          >
            <color attach="background" args={["#0f172a"]} />

            {/* Ambient lighting */}
            <ambientLight intensity={0.3} />
            
            {/* Main directional light to create shadows */}
            <directionalLight 
              position={[5, 10, 5]} 
              intensity={1} 
              castShadow 
              shadow-mapSize-width={1024} 
              shadow-mapSize-height={1024}
            />

            <Suspense fallback={null}>
              <WellRenderer />
            </Suspense>
          </Canvas>
          
          {/* Game UI overlay */}
          <GameUI />
          
          {/* Sound management */}
          <SoundManager />
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;

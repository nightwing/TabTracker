import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import { Game } from "./game/components/Game";
import { LevelSelect } from "./game/components/LevelSelect";
import { SoundManager } from "./game/components/SoundManager";
import { Controls } from "./game/components/Controls";
import { ControlKey } from "./game/types";

// Define control keys for the game
const controls = [
  { name: ControlKey.LEFT, keys: ["KeyA", "ArrowLeft"] },
  { name: ControlKey.RIGHT, keys: ["KeyD", "ArrowRight"] },
  { name: ControlKey.DOWN, keys: ["KeyS", "ArrowDown"] },
  { name: ControlKey.ROTATE, keys: ["KeyW", "ArrowUp"] },
  { name: ControlKey.DROP, keys: ["Space"] },
  { name: ControlKey.PAUSE, keys: ["KeyP", "Escape"] },
  { name: ControlKey.MUTE, keys: ["KeyM"] },
];

// Main App component
function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [gridType, setGridType] = useState<'normal' | 'hexagonal' | 'triangular'>('normal');
  
  // Initialize audio
  useAudio.getState().setBackgroundMusic(new Audio('/sounds/background.mp3'));
  useAudio.getState().setHitSound(new Audio('/sounds/hit.mp3'));
  useAudio.getState().setSuccessSound(new Audio('/sounds/success.mp3'));

  const startGame = (levelId: number, type: 'normal' | 'hexagonal' | 'triangular') => {
    setSelectedLevel(levelId);
    setGridType(type);
    setGameStarted(true);
  };

  const returnToMenu = () => {
    setGameStarted(false);
  };

  return (
    <div className="w-full h-full">
      <KeyboardControls map={controls}>
        {!gameStarted ? (
          <LevelSelect onStartGame={startGame} />
        ) : (
          <>
            <Canvas
              shadows
              camera={{
                position: [0, 0, 10],
                fov: 75,
                near: 0.1,
                far: 1000
              }}
            >
              <color attach="background" args={["#111111"]} />
              <ambientLight intensity={0.5} />
              <directionalLight 
                position={[10, 10, 5]} 
                intensity={1} 
                castShadow 
                shadow-mapSize-width={1024} 
                shadow-mapSize-height={1024} 
              />
              
              <Suspense fallback={null}>
                <Game 
                  levelId={selectedLevel} 
                  gridType={gridType} 
                  onGameOver={returnToMenu} 
                />
              </Suspense>
            </Canvas>
            <Controls />
          </>
        )}
        <SoundManager />
      </KeyboardControls>
    </div>
  );
}

export default App;

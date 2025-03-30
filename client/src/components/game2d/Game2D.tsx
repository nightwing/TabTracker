import { useEffect, useRef } from 'react';
import Grid2DCanvas from './Grid2DCanvas';
import GameControls2D from './GameControls2D';
import GameUI2D from './GameUI2D';
import { useTetrisGame } from '../../lib/stores/useTetrisGame';
import { useAudio } from '../../lib/stores/useAudio';
import { GameState } from '../../lib/constants';

export default function Game2D() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { tick, gameState, dropTime, startGame } = useTetrisGame();
  const { backgroundMusic, isMuted } = useAudio();
  
  // Set up the game loop with requestAnimationFrame for smoother animation
  useEffect(() => {
    let lastTime = 0;
    let elapsed = 0;
    let animationFrameId: number;
    
    const gameLoop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      
      elapsed += deltaTime;
      
      // Only process game logic at intervals specified by dropTime
      if (elapsed > dropTime) {
        console.log("Game tick at", timestamp, "ms, dropTime:", dropTime);
        tick();
        elapsed = 0;
      }
      
      // Continue the loop
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    // Only run the game loop if the game is in playing state
    if (gameState === GameState.PLAYING) {
      console.log("Starting game loop with dropTime:", dropTime);
      animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameState, tick, dropTime]);
  
  // Start game when component mounts if not already started
  useEffect(() => {
    if (gameState === GameState.MENU) {
      // Start with the first level
      startGame(1);
    }
  }, [gameState, startGame]);
  
  // Start/stop background music based on game state
  useEffect(() => {
    if (!backgroundMusic) return;
    
    if (gameState === GameState.PLAYING) {
      if (!isMuted && backgroundMusic.paused) {
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.5;
        backgroundMusic.play().catch(e => console.error("Music playback error:", e));
      }
    } else {
      backgroundMusic.pause();
    }
    
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [gameState, backgroundMusic, isMuted]);
  
  // Load assets when component mounts
  useEffect(() => {
    const bgMusic = new Audio('/audio/background.mp3');
    const hitSound = new Audio('/audio/hit.mp3');
    const successSound = new Audio('/audio/success.mp3');
    
    // Pre-load sounds to prevent delays
    bgMusic.preload = 'auto';
    hitSound.preload = 'auto';
    successSound.preload = 'auto';
    
    // Add to audio context
    const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio.getState();
    setBackgroundMusic(bgMusic);
    setHitSound(hitSound);
    setSuccessSound(successSound);
    
    return () => {
      bgMusic.pause();
      hitSound.pause();
      successSound.pause();
    };
  }, []);
  
  // Calculate dimensions for the game grid
  const getGridDimensions = () => {
    if (!gameContainerRef.current) return { width: 0, height: 0 };
    
    const container = gameContainerRef.current;
    return {
      width: container.clientWidth,
      height: container.clientHeight,
    };
  };
  
  const { width, height } = getGridDimensions();
  
  return (
    <div className="w-full h-full relative bg-slate-800 overflow-hidden">
      <div 
        ref={gameContainerRef} 
        className="absolute inset-0"
      >
        {width > 0 && height > 0 && (
          <Grid2DCanvas width={width} height={height} />
        )}
      </div>
      
      <GameControls2D />
      <GameUI2D />
    </div>
  );
}
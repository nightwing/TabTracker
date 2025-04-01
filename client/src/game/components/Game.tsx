import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Grid } from './Grid';
import { Tetromino } from './Tetromino';
import { GameUI } from './GameUI';
import { useGameLogic } from '../hooks/useGameLogic';
import { useGameStore } from '../stores/gameStore';
import { useAudio } from '@/lib/stores/useAudio';
import { checkCollision, getViewportGrid } from '../utils/gameUtils';

// Props for the Game component
interface GameProps {
  levelId: number;
  gridType: 'normal' | 'hexagonal' | 'triangular';
  onGameOver: () => void;
}

export function Game({ levelId, gridType, onGameOver }: GameProps) {
  const { camera } = useThree();
  const gameState = useGameLogic(levelId, gridType);
  const gameStore = useGameStore();
  const audioStore = useAudio();
  
  // Set up viewport size
  const [viewportConfig, setViewportConfig] = useState({
    width: 10,
    height: 20,
    cellSize: 1
  });
  
  // Reference for tracking time for game updates
  const timeRef = useRef({
    lastTick: 0,
    tickInterval: 1000 // milliseconds
  });
  
  // Adjust viewport based on grid type and screen size
  useEffect(() => {
    // Different grid types need different viewport configurations
    if (gridType === 'hexagonal') {
      setViewportConfig({
        width: 8,
        height: 16,
        cellSize: 1.15
      });
    } else if (gridType === 'triangular') {
      setViewportConfig({
        width: 10,
        height: 20,
        cellSize: 0.9
      });
    } else {
      setViewportConfig({
        width: 10,
        height: 20,
        cellSize: 1
      });
    }
    
    // Position camera based on grid type
    const centerX = viewportConfig.width * viewportConfig.cellSize / 2;
    const centerY = viewportConfig.height * viewportConfig.cellSize / 2;
    
    camera.position.set(centerX, centerY, 15);
    camera.lookAt(centerX, centerY, 0);
  }, [gridType, camera]);
  
  // Listen for game over state
  useEffect(() => {
    if (gameStore.gameOver) {
      // Add a small delay before returning to menu
      setTimeout(() => {
        onGameOver();
      }, 3000);
    }
  }, [gameStore.gameOver, onGameOver]);
  
  // Game loop
  useFrame((state, delta) => {
    if (gameStore.paused || gameStore.gameOver) return;
    
    // Update time reference for game ticks
    timeRef.current.lastTick += delta * 1000;
    
    // Calculate tick interval based on falling speed
    const tickInterval = 1000 / gameStore.fallingSpeed;
    
    // If enough time has passed, update the game
    if (timeRef.current.lastTick >= tickInterval) {
      // Move the current piece down
      gameStore.tick();
      
      // Reset the timer
      timeRef.current.lastTick = 0;
    }
  });
  
  // Get the visible portion of the grid
  const visibleGrid = getViewportGrid(
    gameStore.grid,
    gameStore.viewportPosition,
    viewportConfig.height
  );
  
  // Calculate ghost piece position (preview of where the piece will land)
  const ghostPosition = (() => {
    if (!gameStore.currentPiece) return null;
    
    let testPosition = { ...gameStore.piecePosition };
    
    // Move the ghost piece down until it would collide
    while (!checkCollision(gameStore.grid, gameStore.currentPiece, { ...testPosition, y: testPosition.y + 1 })) {
      testPosition.y += 1;
    }
    
    return testPosition;
  })();
  
  return (
    <>
      {/* Game grid */}
      <Grid 
        grid={visibleGrid} 
        viewportPosition={gameStore.viewportPosition}
        gridType={gridType} 
        cellSize={viewportConfig.cellSize}
        viewportHeight={viewportConfig.height}
      />
      
      {/* Current falling piece */}
      {gameStore.currentPiece && !gameStore.gameOver && !gameStore.paused && (
        <>
          {/* Ghost piece (landing preview) */}
          {ghostPosition && (
            <Tetromino 
              piece={{
                ...gameStore.currentPiece,
                color: `${gameStore.currentPiece.color}33` // Transparent version of the piece color
              }}
              position={{
                x: ghostPosition.x, 
                y: ghostPosition.y - gameStore.viewportPosition
              }}
              gridType={gridType}
              cellSize={viewportConfig.cellSize}
              isGhost={true}
            />
          )}
          
          {/* Active piece */}
          <Tetromino 
            piece={gameStore.currentPiece} 
            position={{
              x: gameStore.piecePosition.x, 
              y: gameStore.piecePosition.y - gameStore.viewportPosition
            }}
            gridType={gridType}
            cellSize={viewportConfig.cellSize}
          />
        </>
      )}
      
      {/* Pause message */}
      {gameStore.paused && !gameStore.gameOver && (
        <Text
          position={[viewportConfig.width / 2, viewportConfig.height / 2, 1]}
          color="white"
          fontSize={1}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          PAUSED
        </Text>
      )}
      
      {/* Game over message */}
      {gameStore.gameOver && (
        <Text
          position={[viewportConfig.width / 2, viewportConfig.height / 2, 1]}
          color="red"
          fontSize={1}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          GAME OVER
        </Text>
      )}
      
      {/* Overlay UI for score, next piece, etc. */}
      <GameUI 
        score={gameStore.score}
        linesCleared={gameStore.linesCleared}
        level={gameStore.level}
        nextPiece={gameStore.nextPiece}
        gridType={gridType}
      />
    </>
  );
}

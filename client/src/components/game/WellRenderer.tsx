import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { useTetrisGame } from "../../lib/stores/useTetrisGame";
import { GridType } from "../../lib/constants";
import SquareGrid from "./SquareGrid";
import HexGrid from "./HexGrid";
import TriangleGrid from "./TriangleGrid";
import * as THREE from "three";

export default function WellRenderer() {
  const { 
    gameState, 
    matrix, 
    gridType, 
    tetromino, 
    position,
    currentLevelData
  } = useTetrisGame();
  
  const { camera } = useThree();
  const cameraRef = useRef<THREE.Camera>(camera);
  
  // Set up camera position based on grid type
  useEffect(() => {
    if (!cameraRef.current) return;
    
    // Adjust camera position based on grid type
    switch (gridType) {
      case GridType.SQUARE:
        cameraRef.current.position.set(0, 4, 8);
        break;
      case GridType.HEXAGONAL:
        cameraRef.current.position.set(0, 5, 12);
        break;
      case GridType.TRIANGULAR:
        cameraRef.current.position.set(0, 5, 12);
        break;
    }
    
  }, [gridType]);
  
  // Add subtle camera movement
  useFrame((state) => {
    const { clock } = state;
    
    if (!cameraRef.current) return;
    
    // Subtle camera movement
    const cameraX = Math.sin(clock.elapsedTime * 0.2) * 0.5;
    const cameraY = Math.sin(clock.elapsedTime * 0.1) * 0.2 + 4;
    
    // Update camera position with lerping for smoothness
    cameraRef.current.position.x += (cameraX - cameraRef.current.position.x) * 0.05;
    cameraRef.current.position.y += (cameraY - cameraRef.current.position.y) * 0.05;
    
    // Always look at center of well
    cameraRef.current.lookAt(0, 0, 0);
  });
  
  // Render the appropriate grid type
  const renderGrid = () => {
    switch (gridType) {
      case GridType.SQUARE:
        return (
          <SquareGrid 
            matrix={matrix} 
            activeTetromino={tetromino?.shape} 
            activePosition={position}
            wellShape={currentLevelData.wellShape}
          />
        );
      case GridType.HEXAGONAL:
        return (
          <HexGrid 
            matrix={matrix} 
            activeTetromino={tetromino?.shape} 
            activePosition={position}
            wellShape={currentLevelData.wellShape}
          />
        );
      case GridType.TRIANGULAR:
        return (
          <TriangleGrid 
            matrix={matrix} 
            activeTetromino={tetromino?.shape} 
            activePosition={position}
            wellShape={currentLevelData.wellShape}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* The grid renderer */}
      {renderGrid()}
      
      {/* Environment lighting */}
      <hemisphereLight intensity={0.2} color="#eaeaea" groundColor="#080820" />
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048} 
      />
    </>
  );
}

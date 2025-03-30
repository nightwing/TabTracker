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
  
  // We'll skip adjusting the camera position here since we've set it as orthographic in App.tsx
  useEffect(() => {
    // We're now using a fixed orthographic camera configured in App.tsx
    // No need to adjust the camera position here
  }, [gridType]);
  
  // Skip the camera movement for a flat, stable view
  useFrame(() => {
    // No camera animation for the flat perspective
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
      
      {/* Environment lighting optimized for flat view */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[0, 20, 10]} 
        intensity={0.7} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-left={-20}
        shadow-camera-right={20}
      />
      {/* Add a second directional light from opposite direction to reduce harsh shadows */}
      <directionalLight 
        position={[0, 5, -10]} 
        intensity={0.3} 
      />
    </>
  );
}

import { useRef } from "react";
import { Matrix } from "../../lib/tetrominos";
import { BLOCK_COLORS, GRID_TRIANGLE_SIZE, TRIANGLE_WELL_HEIGHT, TRIANGLE_WELL_WIDTH } from "../../lib/constants";
import { Position, gridToWorld } from "../../lib/gridUtils";
import { GridType } from "../../lib/constants";
import { useTetrisGame } from "../../lib/stores/useTetrisGame";
import * as THREE from "three";

interface TriangleGridProps {
  matrix: Matrix;
  activeTetromino?: Matrix;
  activePosition?: Position;
  wellShape?: boolean[][];
}

// Create a triangle shape for the blocks
function createTriangleShape(size: number, pointUp: boolean): THREE.Shape {
  const shape = new THREE.Shape();
  const height = size * 0.866; // height of equilateral triangle
  
  if (pointUp) {
    shape.moveTo(0, -height / 2);       // bottom
    shape.lineTo(size / 2, height / 2);  // top right
    shape.lineTo(-size / 2, height / 2); // top left
  } else {
    shape.moveTo(0, height / 2);        // top
    shape.lineTo(size / 2, -height / 2); // bottom right
    shape.lineTo(-size / 2, -height / 2); // bottom left
  }
  
  shape.closePath();
  return shape;
}

// Triangular block component
function TriangleBlock({ 
  position, 
  color, 
  type, 
  isUpward,
  isActive = false 
}: { 
  position: [number, number, number]; 
  color: string; 
  type: "regular" | "locked" | "gem"; 
  isUpward: boolean;
  isActive?: boolean; 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // For gem type, render a sphere
  if (type === "gem") {
    return (
      <group position={position}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[GRID_TRIANGLE_SIZE * 0.4, 16, 16]} />
          <meshStandardMaterial 
            color={BLOCK_COLORS.GEM}
            emissive={BLOCK_COLORS.GEM}
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
        
        {/* Inner glow */}
        <pointLight
          position={[0, 0, 0]}
          intensity={1}
          distance={1.5}
          color={BLOCK_COLORS.GEM}
        />
      </group>
    );
  }
  
  // For regular blocks, create triangular shape
  const triangleShape = createTriangleShape(GRID_TRIANGLE_SIZE * 0.9, isUpward);
  const extrudeSettings = {
    depth: GRID_TRIANGLE_SIZE * 0.4,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: GRID_TRIANGLE_SIZE * 0.05,
    bevelThickness: GRID_TRIANGLE_SIZE * 0.05,
  };
  
  return (
    <mesh 
      ref={meshRef} 
      position={[position[0], position[1] + (isActive ? Math.sin(Date.now() * 0.003) * 0.05 + 0.05 : 0), position[2]]} 
      castShadow 
      receiveShadow
    >
      <extrudeGeometry args={[triangleShape, extrudeSettings]} />
      <meshStandardMaterial 
        color={color} 
        roughness={type === "locked" ? 0.8 : 0.3}
        metalness={type === "locked" ? 0.1 : 0.4}
        opacity={type === "locked" ? 0.9 : 1}
        transparent={type === "locked"}
      />
      
      {/* Highlight for active blocks */}
      {isActive && (
        <lineSegments>
          <edgesGeometry args={[new THREE.ExtrudeGeometry(triangleShape, extrudeSettings)]} />
          <lineBasicMaterial color="white" transparent opacity={0.3} />
        </lineSegments>
      )}
    </mesh>
  );
}

export default function TriangleGrid({ 
  matrix, 
  activeTetromino, 
  activePosition, 
  wellShape 
}: TriangleGridProps) {
  const gridRef = useRef<THREE.Group>(null);
  const { currentLevelData } = useTetrisGame();
  
  // Helper to check if a cell has active tetromino
  const isActiveCell = (x: number, y: number): boolean => {
    if (!activeTetromino || !activePosition) return false;
    
    // Check if the cell falls within the active tetromino's bounds
    const relX = x - activePosition.x;
    const relY = y - activePosition.y;
    
    if (
      relX >= 0 && 
      relX < activeTetromino[0].length && 
      relY >= 0 && 
      relY < activeTetromino.length
    ) {
      return activeTetromino[relY][relX] === 1;
    }
    
    return false;
  };
  
  // Get tetromino color
  const getTetrominoColor = (): string => {
    const tetromino = useTetrisGame.getState().tetromino;
    return tetromino ? tetromino.color : "#FFFFFF";
  };
  
  return (
    <group ref={gridRef}>
      {/* Render the well shape outlines */}
      {wellShape && wellShape.map((row, y) => 
        row.map((isAccessible, x) => {
          if (!isAccessible) return null;
          
          const worldPos = gridToWorld({ x, y }, GridType.TRIANGULAR);
          const isUpward = (x + y) % 2 === 0;
          
          return (
            <group key={`cell-${x}-${y}`} position={worldPos}>
              {/* Grid cell outline */}
              <lineSegments>
                {isUpward ? (
                  <edgesGeometry args={[new THREE.ConeGeometry(GRID_TRIANGLE_SIZE * 0.5, GRID_TRIANGLE_SIZE * 0.866, 3, 1)]} />
                ) : (
                  <edgesGeometry args={[new THREE.ConeGeometry(GRID_TRIANGLE_SIZE * 0.5, GRID_TRIANGLE_SIZE * 0.866, 3, 1)]} />
                )}
                <lineBasicMaterial color="#1f2937" opacity={0.3} transparent />
              </lineSegments>
            </group>
          );
        })
      )}
      
      {/* Render the static blocks */}
      {matrix.map((row, y) => 
        row.map((cell, x) => {
          // Skip empty cells
          if (cell === 0) return null;
          
          // Skip cells not in the well shape
          if (wellShape && !wellShape[y][x]) return null;
          
          const worldPos = gridToWorld({ x, y }, GridType.TRIANGULAR);
          const isUpward = (x + y) % 2 === 0;
          
          // Render different cell types
          if (cell === 8) {
            // Gem cell
            return (
              <TriangleBlock
                key={`gem-${x}-${y}`}
                position={worldPos}
                color={BLOCK_COLORS.GEM}
                type="gem"
                isUpward={isUpward}
              />
            );
          } else if (cell === 2) {
            // Locked block
            return (
              <TriangleBlock
                key={`locked-${x}-${y}`}
                position={worldPos}
                color={BLOCK_COLORS.LOCKED}
                type="locked"
                isUpward={isUpward}
              />
            );
          } else {
            // Regular block
            return (
              <TriangleBlock
                key={`block-${x}-${y}`}
                position={worldPos}
                color={BLOCK_COLORS.I} // Default color for static blocks
                type="regular"
                isUpward={isUpward}
              />
            );
          }
        })
      )}
      
      {/* Render the active tetromino */}
      {activeTetromino && activePosition && matrix.map((row, y) => 
        row.map((cell, x) => {
          // Only render active cells
          if (!isActiveCell(x, y)) return null;
          
          // Skip cells not in the well shape
          if (wellShape && !wellShape[y][x]) return null;
          
          const worldPos = gridToWorld({ x, y }, GridType.TRIANGULAR);
          const isUpward = (x + y) % 2 === 0;
          
          return (
            <TriangleBlock
              key={`active-${x}-${y}`}
              position={worldPos}
              color={getTetrominoColor()}
              type="regular"
              isUpward={isUpward}
              isActive={true}
            />
          );
        })
      )}
      
      {/* Render the well bottom */}
      <mesh 
        position={[
          0, 
          -0.5, 
          gridToWorld({ x: 0, y: TRIANGLE_WELL_HEIGHT }, GridType.TRIANGULAR)[2] + 0.5
        ]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[TRIANGLE_WELL_WIDTH * GRID_TRIANGLE_SIZE * 0.5 + 2, 2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
    </group>
  );
}

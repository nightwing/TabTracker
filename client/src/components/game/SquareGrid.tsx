import { useRef } from "react";
import { Matrix } from "@/lib/tetrominos";
import { BLOCK_COLORS, GRID_SQUARE_SIZE, SQUARE_WELL_HEIGHT, SQUARE_WELL_WIDTH } from "@/lib/constants";
import Block from "./Block";
import { Position, gridToWorld } from "@/lib/gridUtils";
import { GridType } from "@/lib/constants";
import { useTetrisGame } from "@/lib/stores/useTetrisGame";
import * as THREE from "three";

interface SquareGridProps {
  matrix: Matrix;
  activeTetromino?: Matrix;
  activePosition?: Position;
  wellShape?: boolean[][];
}

export default function SquareGrid({ 
  matrix, 
  activeTetromino, 
  activePosition, 
  wellShape 
}: SquareGridProps) {
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
          
          const worldPos = gridToWorld({ x, y }, GridType.SQUARE);
          
          return (
            <group key={`cell-${x}-${y}`} position={worldPos}>
              {/* Grid cell outline */}
              <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(GRID_SQUARE_SIZE, GRID_SQUARE_SIZE, GRID_SQUARE_SIZE)]} />
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
          
          const worldPos = gridToWorld({ x, y }, GridType.SQUARE);
          
          // Render different cell types
          if (cell === 8) {
            // Gem cell
            return (
              <Block
                key={`gem-${x}-${y}`}
                position={worldPos}
                color={BLOCK_COLORS.GEM}
                type="gem"
              />
            );
          } else if (cell === 2) {
            // Locked block
            return (
              <Block
                key={`locked-${x}-${y}`}
                position={worldPos}
                color={BLOCK_COLORS.LOCKED}
                type="locked"
              />
            );
          } else {
            // Regular block
            return (
              <Block
                key={`block-${x}-${y}`}
                position={worldPos}
                color={BLOCK_COLORS.I} // Default color for static blocks
                type="regular"
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
          
          const worldPos = gridToWorld({ x, y }, GridType.SQUARE);
          
          return (
            <Block
              key={`active-${x}-${y}`}
              position={worldPos}
              color={getTetrominoColor()}
              type="regular"
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
          gridToWorld({ x: 0, y: SQUARE_WELL_HEIGHT }, GridType.SQUARE)[2] + 0.5
        ]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[SQUARE_WELL_WIDTH * GRID_SQUARE_SIZE + 2, 2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
    </group>
  );
}

import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TetrominoPiece, Position, GridType } from '../types';
import { getCellPosition, getCellShape } from '../utils/gridUtils';

interface TetrominoProps {
  piece: TetrominoPiece;
  position: Position;
  gridType: 'normal' | 'hexagonal' | 'triangular';
  cellSize?: number;
  isGhost?: boolean;
}

export function Tetromino({ 
  piece, 
  position, 
  gridType, 
  cellSize = 1,
  isGhost = false
}: TetrominoProps) {
  // Convert grid type string to enum
  const gridTypeEnum = useMemo(() => {
    switch (gridType) {
      case 'hexagonal': return GridType.HEXAGONAL;
      case 'triangular': return GridType.TRIANGULAR;
      default: return GridType.NORMAL;
    }
  }, [gridType]);
  
  // Create cell shape based on grid type
  const cellShape = useMemo(() => {
    return getCellShape(gridTypeEnum);
  }, [gridTypeEnum]);
  
  // Create geometry for the cell type
  const cellGeometry = useMemo(() => {
    if (gridTypeEnum === GridType.NORMAL) {
      // For normal grid, use box geometry with slight beveled edges for better look
      return new THREE.BoxGeometry(cellSize * 0.95, cellSize * 0.95, cellSize * 0.2);
    } else if (gridTypeEnum === GridType.HEXAGONAL) {
      // For hexagonal grid, use cylinder geometry with 6 segments
      return new THREE.CylinderGeometry(cellSize * 0.5, cellSize * 0.5, cellSize * 0.2, 6);
    } else {
      // For triangular grid, use custom geometry based on triangle shape
      const shape = new THREE.Shape();
      
      // Create triangle path
      shape.moveTo(0, 0);
      shape.lineTo(cellSize, 0);
      shape.lineTo(cellSize / 2, cellSize * 0.866);
      shape.lineTo(0, 0);
      
      // Create geometry with slight extrusion for 3D effect
      return new THREE.ExtrudeGeometry(shape, {
        depth: cellSize * 0.2,
        bevelEnabled: false
      });
    }
  }, [gridTypeEnum, cellSize]);
  
  // Create material for the tetromino
  const material = useMemo(() => {
    if (isGhost) {
      // For ghost piece, use transparent material
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color(piece.color),
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
    } else {
      // For regular piece, use standard material with some shine
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(piece.color),
        roughness: 0.7,
        metalness: 0.2
      });
    }
  }, [piece.color, isGhost]);
  
  // Function to render each cell of the tetromino
  const renderCells = () => {
    const cells = [];
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        // Only render filled cells (value of 1)
        if (piece.shape[y][x]) {
          // Get position of this cell based on grid type
          const [posX, posY] = getCellPosition(x, y, gridTypeEnum, cellSize);
          
          // For triangular grids, alternate cell rotation based on position
          const rotation = 
            gridTypeEnum === GridType.TRIANGULAR && (x + y) % 2 === 1 
              ? [0, 0, Math.PI] 
              : [0, 0, 0];
              
          // For hexagonal grids, rotate to face up
          const hexRotation = 
            gridTypeEnum === GridType.HEXAGONAL 
              ? [Math.PI / 2, 0, 0] 
              : [0, 0, 0];
              
          cells.push(
            <mesh 
              key={`${x}-${y}`}
              position={[posX, posY, 0]} 
              rotation={gridTypeEnum === GridType.HEXAGONAL ? hexRotation : rotation}
              geometry={cellGeometry}
              material={material}
              castShadow
              receiveShadow
            />
          );
        }
      }
    }
    
    return cells;
  };
  
  // Position the entire tetromino group at the specified position
  const groupPosition = useMemo(() => {
    // For most grid types, simple positioning works
    return [position.x * cellSize, position.y * cellSize, 0.1];
  }, [position, cellSize]);
  
  return (
    <group position={groupPosition as any}>
      {renderCells()}
    </group>
  );
}

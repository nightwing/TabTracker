import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GridCell, CellType, GridType } from '../types';
import { getCellPosition, getCellShape } from '../utils/gridUtils';
import { useGridRenderer } from '../hooks/useGridRenderer';

interface GridProps {
  grid: GridCell[][];
  viewportPosition: number;
  gridType: 'normal' | 'hexagonal' | 'triangular';
  cellSize?: number;
  viewportHeight: number;
}

export function Grid({ 
  grid, 
  viewportPosition, 
  gridType,
  cellSize = 1,
  viewportHeight
}: GridProps) {
  // Use the grid renderer hook for efficient rendering
  const { meshRef, cellGeometry, materials } = useGridRenderer({
    grid,
    viewportPosition,
    gridType,
    viewportHeight,
    cellSize
  });
  
  // Create a buffer of empty cells for the borders
  const borderWidth = Math.max(grid[0]?.length || 10, 10);
  const borderMaterial = new THREE.MeshStandardMaterial({ 
    color: '#333333', 
    roughness: 0.8, 
    metalness: 0.2 
  });
  
  // Calculate positions for border cells
  const gridBounds = useMemo(() => {
    const gridTypeEnum = gridType === 'hexagonal' 
      ? GridType.HEXAGONAL 
      : gridType === 'triangular' ? GridType.TRIANGULAR : GridType.NORMAL;
      
    const width = grid[0]?.length || 10;
    const height = viewportHeight;
    
    // Calculate grid boundaries based on grid type
    let left = 0;
    let right = width * cellSize;
    let top = 0;
    let bottom = height * cellSize;
    
    // Adjust for hexagonal grids which have offset rows
    if (gridTypeEnum === GridType.HEXAGONAL) {
      right += cellSize / 2;
      bottom *= 0.75;
    }
    
    // Adjust for triangular grids
    if (gridTypeEnum === GridType.TRIANGULAR) {
      right += cellSize / 2;
      bottom *= 0.866; // sqrt(3)/2 for triangle height
    }
    
    return { left, right, top, bottom, width, height };
  }, [grid, viewportHeight, cellSize, gridType]);
  
  // Render border cells around the grid
  const renderBorders = () => {
    // Create border geometry based on grid type
    let borderGeometry;
    
    if (gridType === 'normal') {
      // For normal grid, use plane geometry for borders
      borderGeometry = new THREE.PlaneGeometry(1, 1);
    } else if (gridType === 'hexagonal') {
      // For hexagonal grid, use our cell geometry
      const shape = getCellShape(GridType.HEXAGONAL);
      borderGeometry = new THREE.ShapeGeometry(
        new THREE.Shape(shape.map(([x, y]) => new THREE.Vector2(x * cellSize, y * cellSize)))
      );
    } else {
      // For triangular grid, use our cell geometry
      const shape = getCellShape(GridType.TRIANGULAR);
      borderGeometry = new THREE.ShapeGeometry(
        new THREE.Shape(shape.map(([x, y]) => new THREE.Vector2(x * cellSize, y * cellSize)))
      );
    }
    
    // Return border elements
    return (
      <group>
        {/* Left border */}
        <mesh 
          position={[gridBounds.left - cellSize, gridBounds.top + gridBounds.bottom / 2, -0.1]} 
          material={borderMaterial}
        >
          <planeGeometry args={[cellSize, gridBounds.bottom + cellSize * 2]} />
        </mesh>
        
        {/* Right border */}
        <mesh 
          position={[gridBounds.right + cellSize, gridBounds.top + gridBounds.bottom / 2, -0.1]} 
          material={borderMaterial}
        >
          <planeGeometry args={[cellSize, gridBounds.bottom + cellSize * 2]} />
        </mesh>
        
        {/* Bottom border */}
        <mesh 
          position={[gridBounds.left + gridBounds.right / 2, gridBounds.bottom + cellSize, -0.1]} 
          material={borderMaterial}
        >
          <planeGeometry args={[gridBounds.right - gridBounds.left + cellSize * 2, cellSize]} />
        </mesh>
        
        {/* Top border */}
        <mesh 
          position={[gridBounds.left + gridBounds.right / 2, gridBounds.top - cellSize, -0.1]} 
          material={borderMaterial}
        >
          <planeGeometry args={[gridBounds.right - gridBounds.left + cellSize * 2, cellSize]} />
        </mesh>
      </group>
    );
  };
  
  // Create instanced mesh for efficient cell rendering
  return (
    <group>
      {/* Main grid cells rendered as instanced mesh */}
      <instancedMesh 
        ref={meshRef}
        args={[cellGeometry, materials[CellType.FILLED], 1000]} // Max 1000 instances
        frustumCulled={true}
      />
      
      {/* Border cells */}
      {renderBorders()}
      
      {/* Background for the grid */}
      <mesh position={[gridBounds.width * cellSize / 2, gridBounds.height * cellSize / 2, -0.2]}>
        <planeGeometry args={[gridBounds.width * cellSize, gridBounds.height * cellSize]} />
        <meshBasicMaterial color="#111111" />
      </mesh>
    </group>
  );
}

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GridCell, CellType, Position, GridType } from '../types';
import { getCellPosition, getCellShape } from '../utils/gridUtils';

interface UseGridRendererProps {
  grid: GridCell[][];
  viewportPosition: number;
  gridType: 'normal' | 'hexagonal' | 'triangular';
  viewportHeight: number;
  cellSize?: number;
}

/**
 * Custom hook to handle grid rendering
 */
export function useGridRenderer({
  grid,
  viewportPosition,
  gridType,
  viewportHeight,
  cellSize = 1
}: UseGridRendererProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { gl } = useThree();

  // Convert grid type string to enum
  const gridTypeEnum = useMemo(() => {
    switch (gridType) {
      case 'hexagonal': return GridType.HEXAGONAL;
      case 'triangular': return GridType.TRIANGULAR;
      default: return GridType.NORMAL;
    }
  }, [gridType]);

  // Create cell shape geometry based on grid type
  const cellGeometry = useMemo(() => {
    const shape = getCellShape(gridTypeEnum);
    const geometry = new THREE.BufferGeometry();
    
    // For normal grid (square)
    if (gridTypeEnum === GridType.NORMAL) {
      // Create a simple square
      const vertices = shape.flat();
      const indices = [0, 1, 2, 0, 2, 3]; // Two triangles for a square
      
      geometry.setIndex(indices);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 2));
    } 
    // For hexagonal grid
    else if (gridTypeEnum === GridType.HEXAGONAL) {
      // Create a hexagon
      const vertices = shape.map(([x, y]) => [x * cellSize, y * cellSize, 0]).flat();
      const indices = [];
      
      // Create triangles for the hexagon (fan triangulation)
      for (let i = 1; i < shape.length - 1; i++) {
        indices.push(0, i, i + 1);
      }
      
      geometry.setIndex(indices);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    }
    // For triangular grid
    else {
      // Create a triangle
      const vertices = shape.map(([x, y]) => [x * cellSize, y * cellSize, 0]).flat();
      const indices = [0, 1, 2]; // One triangle
      
      geometry.setIndex(indices);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }, [gridTypeEnum, cellSize]);
  
  // Get visible portion of the grid
  const visibleGrid = useMemo(() => {
    const start = viewportPosition;
    const end = Math.min(start + viewportHeight, grid.length);
    return grid.slice(start, end);
  }, [grid, viewportPosition, viewportHeight]);

  // Create material map for different cell types
  const materials = useMemo(() => {
    return {
      [CellType.EMPTY]: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }),
      [CellType.FILLED]: new THREE.MeshBasicMaterial({ color: 0xffffff }), // Will be colored per instance
      [CellType.FROZEN]: new THREE.MeshStandardMaterial({ 
        color: 0xaaccff, 
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
      }),
      [CellType.POWERUP]: new THREE.MeshStandardMaterial({ 
        color: 0xffcc00,
        emissive: 0xffcc00,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.7
      }),
      [CellType.GEM]: new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.9
      })
    };
  }, []);

  // Handle animation and rendering
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Update instancedMesh with current cells
    let instanceCount = 0;
    
    // For each visible cell in the grid
    for (let y = 0; y < visibleGrid.length; y++) {
      for (let x = 0; x < visibleGrid[y].length; x++) {
        const cell = visibleGrid[y][x];
        
        // Skip empty cells
        if (cell.type === CellType.EMPTY) continue;
        
        // Create matrix for this cell's position
        const matrix = new THREE.Matrix4();
        
        // Get position based on grid type
        const [posX, posY] = getCellPosition(x, y, gridTypeEnum, cellSize);
        
        // Set cell position
        matrix.setPosition(posX, posY, 0);
        
        // Set the matrix for this instance
        meshRef.current.setMatrixAt(instanceCount, matrix);
        
        // Set the color for this instance
        const color = new THREE.Color(cell.color);
        meshRef.current.setColorAt(instanceCount, color);
        
        instanceCount++;
      }
    }
    
    // Update instance count and mark instances for update
    meshRef.current.count = instanceCount;
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Update colors if needed
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return {
    meshRef,
    cellGeometry,
    materials
  };
}

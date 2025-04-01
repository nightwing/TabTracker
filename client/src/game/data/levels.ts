import { GameLevel, CellType } from '../types';
import { generateInitialGrid, applyWellShape } from '../utils/gridUtils';

// Define well shapes for different levels
const WELL_SHAPES = {
  // Standard well - rectangular
  standard: Array(20).fill(Array(10).fill(1)),
  
  // L-shaped well
  lshaped: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  ],
  
  // Hourglass shape
  hourglass: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  
  // Zigzag shape
  zigzag: [
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  ],
  
  // Cross shape
  cross: [
    [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
  ]
};

// Create levels with different grid types and well shapes
const createLevels = (): GameLevel[] => {
  const gridHeight = 800; // Very large grid for deep gameplay
  return [
    // Level 1: Standard Tetris with normal grid
    {
      id: 1,
      name: "Classic Deep",
      wellShape: WELL_SHAPES.standard,
      initialGrid: applyWellShape(
        generateInitialGrid(gridHeight, 10, 0.3, 0.05, 0.03),
        WELL_SHAPES.standard
      ),
      gridType: 'normal',
      gemPosition: { x: 5, y: gridHeight - 1 },
      difficulty: 1,
      backgroundColor: '#111122',
      description: "Classic Tetris with a deep well. Clear lines and dig down to find the gem!"
    },
    
    // Level 2: L-shaped well with normal grid
    {
      id: 2,
      name: "L-Shaped Challenge",
      wellShape: WELL_SHAPES.lshaped,
      initialGrid: applyWellShape(
        generateInitialGrid(gridHeight, 12, 0.35, 0.08, 0.04),
        WELL_SHAPES.lshaped
      ),
      gridType: 'normal',
      gemPosition: { x: 3, y: gridHeight - 1 },
      difficulty: 2,
      backgroundColor: '#112211',
      description: "Navigate the L-shaped well as you descend. Watch for frozen blocks!"
    },
    
    // Level 3: Hexagonal grid with hourglass shape
    {
      id: 3,
      name: "Hexagonal Hourglass",
      wellShape: WELL_SHAPES.hourglass,
      initialGrid: applyWellShape(
        generateInitialGrid(gridHeight, 10, 0.4, 0.1, 0.05),
        WELL_SHAPES.hourglass
      ),
      gridType: 'hexagonal',
      gemPosition: { x: 5, y: gridHeight - 1 },
      difficulty: 3,
      backgroundColor: '#221122',
      description: "Hexagonal grid with an hourglass well shape. A challenging new way to play!"
    },
    
    // Level 4: Triangular grid with zigzag shape
    {
      id: 4,
      name: "Triangular Zigzag",
      wellShape: WELL_SHAPES.zigzag,
      initialGrid: applyWellShape(
        generateInitialGrid(gridHeight, 10, 0.4, 0.12, 0.06),
        WELL_SHAPES.zigzag
      ),
      gridType: 'triangular',
      gemPosition: { x: 5, y: gridHeight - 1 },
      difficulty: 4,
      backgroundColor: '#2A0A30',
      description: "Triangular grid with a zigzag well. The most challenging layout!"
    },
    
    // Level 5: Cross-shaped well with normal grid
    {
      id: 5,
      name: "Frozen Cross",
      wellShape: WELL_SHAPES.cross,
      initialGrid: applyWellShape(
        generateInitialGrid(gridHeight, 10, 0.45, 0.18, 0.08),
        WELL_SHAPES.cross
      ),
      gridType: 'normal',
      gemPosition: { x: 5, y: gridHeight - 1 },
      difficulty: 5,
      backgroundColor: '#001144',
      description: "Navigate a cross-shaped well with many frozen blocks. Use power-ups wisely!"
    },
  ];
};

// Get all levels
export const levels = createLevels();

// Get a level by ID
export function getLevelById(id: number): GameLevel {
  const level = levels.find(l => l.id === id);
  if (!level) {
    console.error(`Level with ID ${id} not found. Defaulting to first level.`);
    return levels[0];
  }
  return level;
}

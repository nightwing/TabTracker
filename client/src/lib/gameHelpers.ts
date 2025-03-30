import { GridType, POINTS_DOUBLE, POINTS_HARD_DROP, POINTS_SINGLE, POINTS_SOFT_DROP, POINTS_TETRIS, POINTS_TRIPLE } from "./constants";
import { LEVELS } from "./levelData";
import { Matrix } from "./tetrominos";
import { isRowFull, rowHasLockedBlocks } from "./gridUtils";

// Check for completed rows and return the new matrix and points scored
export function checkRows(matrix: Matrix): {
  newMatrix: Matrix;
  rowsCleared: number;
  pointsScored: number;
} {
  let rowsCleared = 0;
  let pointsScored = 0;
  
  // Create a new matrix to avoid modifying the original
  let newMatrix = [...matrix];
  
  // Check each row from bottom to top
  for (let y = newMatrix.length - 1; y >= 0; y--) {
    const row = newMatrix[y];
    
    // If the row is full and doesn't have locked blocks, clear it
    if (isRowFull(row) && !rowHasLockedBlocks(row)) {
      // Remove the row
      newMatrix.splice(y, 1);
      
      // Add an empty row at the top
      newMatrix = [Array(row.length).fill(0), ...newMatrix];
      
      // Increment cleared rows count
      rowsCleared++;
    }
  }
  
  // Calculate points based on number of rows cleared
  switch (rowsCleared) {
    case 1:
      pointsScored = POINTS_SINGLE;
      break;
    case 2:
      pointsScored = POINTS_DOUBLE;
      break;
    case 3:
      pointsScored = POINTS_TRIPLE;
      break;
    case 4:
      pointsScored = POINTS_TETRIS;
      break;
  }
  
  return { newMatrix, rowsCleared, pointsScored };
}

// Convert grid type to display name
export function gridTypeToDisplayName(gridType: GridType): string {
  switch (gridType) {
    case GridType.SQUARE:
      return "Square";
    case GridType.HEXAGONAL:
      return "Hexagonal";
    case GridType.TRIANGULAR:
      return "Triangular";
  }
}

// Check if the player has reached a gem
export function hasReachedGem(matrix: Matrix): boolean {
  // A gem is uncovered if it has a non-blocked cell above it
  for (let x = 0; x < matrix[0].length; x++) {
    for (let y = 0; y < matrix.length; y++) {
      // If this cell is a gem
      if (matrix[y][x] === 8) {
        // Check if the cell above is empty
        if (y > 0 && matrix[y - 1][x] === 0) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Unlock a block (convert value 2 to value 1)
export function unlockBlock(x: number, y: number, matrix: Matrix): Matrix {
  if (x < 0 || y < 0 || y >= matrix.length || x >= matrix[0].length) {
    return matrix;
  }
  
  if (matrix[y][x] !== 2) {
    return matrix;
  }
  
  // Create a deep copy
  const newMatrix = matrix.map(row => [...row]);
  newMatrix[y][x] = 1; // Convert locked block to regular block
  
  return newMatrix;
}

// Unlock all adjacent locked blocks
export function unlockAdjacentBlocks(
  x: number, 
  y: number, 
  matrix: Matrix, 
  gridType: GridType
): Matrix {
  let newMatrix = [...matrix.map(row => [...row])];
  
  // Define adjacent cells based on grid type
  let adjacentCells: [number, number][] = [];
  
  switch (gridType) {
    case GridType.SQUARE:
      adjacentCells = [
        [x-1, y], [x+1, y], [x, y-1], [x, y+1]
      ];
      break;
      
    case GridType.HEXAGONAL:
      // In a hex grid, adjacent cells depend on whether the row is even or odd
      const isEvenRow = y % 2 === 0;
      if (isEvenRow) {
        adjacentCells = [
          [x-1, y], [x+1, y], 
          [x-1, y-1], [x, y-1], 
          [x-1, y+1], [x, y+1]
        ];
      } else {
        adjacentCells = [
          [x-1, y], [x+1, y], 
          [x, y-1], [x+1, y-1], 
          [x, y+1], [x+1, y+1]
        ];
      }
      break;
      
    case GridType.TRIANGULAR:
      // In a triangular grid, adjacent cells depend on the triangle orientation
      const isUpwardTriangle = (x + y) % 2 === 0;
      if (isUpwardTriangle) {
        adjacentCells = [
          [x-1, y], [x+1, y], [x, y+1]
        ];
      } else {
        adjacentCells = [
          [x-1, y], [x+1, y], [x, y-1]
        ];
      }
      break;
  }
  
  // Unlock each adjacent cell
  for (const [adjX, adjY] of adjacentCells) {
    newMatrix = unlockBlock(adjX, adjY, newMatrix);
  }
  
  return newMatrix;
}

// Get next level data
export function getNextLevel(currentLevelId: number): typeof LEVELS[0] | null {
  const nextLevelIndex = LEVELS.findIndex(level => level.id === currentLevelId) + 1;
  
  if (nextLevelIndex < LEVELS.length) {
    return LEVELS[nextLevelIndex];
  }
  
  return null; // No more levels
}

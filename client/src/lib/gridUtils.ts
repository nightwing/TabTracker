import { GridType, GRID_HEX_SIZE, GRID_SQUARE_SIZE, GRID_TRIANGLE_SIZE } from "./constants";
import { Matrix } from "./tetrominos";

// Position of a cell in grid
export interface Position {
  x: number;
  y: number;
}

// Convert grid coordinates to world coordinates for each grid type
export function gridToWorld(pos: Position, gridType: GridType): [number, number, number] {
  switch (gridType) {
    case GridType.SQUARE:
      return [
        pos.x * GRID_SQUARE_SIZE - (GRID_SQUARE_SIZE * 4.5), // Center the grid
        0, // y is up in 3D space
        pos.y * GRID_SQUARE_SIZE - (GRID_SQUARE_SIZE * 10) // z is depth in 3D space
      ];
    
    case GridType.HEXAGONAL:
      const evenRow = pos.y % 2 === 0;
      // Hexagonal grid uses staggered coordinates
      return [
        (pos.x + (evenRow ? 0.5 : 0)) * GRID_HEX_SIZE * 1.75 - (GRID_HEX_SIZE * 5.25), // Offset for even rows
        0,
        pos.y * GRID_HEX_SIZE * 1.5 - (GRID_HEX_SIZE * 15)
      ];
    
    case GridType.TRIANGULAR:
      const isUpwardTriangle = (pos.x + pos.y) % 2 === 0;
      // Triangular grid uses alternating triangles
      return [
        pos.x * GRID_TRIANGLE_SIZE * 0.5 - (GRID_TRIANGLE_SIZE * 3.5),
        0,
        pos.y * GRID_TRIANGLE_SIZE * 0.866 - (GRID_TRIANGLE_SIZE * 10), // height of equilateral triangle
      ];
  }
}

// Check if a position on the grid is valid (within bounds and not colliding)
export function isValidPosition(
  position: Position,
  matrix: Matrix,
  tetromino: Matrix,
  gridWidth: number,
  gridHeight: number,
  wellShape?: boolean[][]
): boolean {
  // Check each cell of the tetromino
  for (let y = 0; y < tetromino.length; y++) {
    for (let x = 0; x < tetromino[y].length; x++) {
      // Skip empty cells of the tetromino
      if (!tetromino[y][x]) continue;
      
      const posX = position.x + x;
      const posY = position.y + y;
      
      // Check bounds
      if (
        posX < 0 || 
        posX >= gridWidth || 
        posY < 0 || 
        posY >= gridHeight
      ) {
        return false;
      }
      
      // Check well shape if provided
      if (wellShape && !wellShape[posY][posX]) {
        return false;
      }
      
      // Check collision with existing blocks
      // Ignore collisions with locked blocks (value 2) for checking valid moves
      if (matrix[posY][posX] === 1 || matrix[posY][posX] === 8) {
        return false;
      }
    }
  }
  
  return true;
}

// Merge the tetromino into the matrix at its current position
export function mergeTetrominoIntoMatrix(
  matrix: Matrix,
  tetromino: Matrix,
  position: Position
): Matrix {
  // Create a deep copy of the matrix to avoid modifying the original
  const newMatrix = matrix.map(row => [...row]);
  
  // For each cell in the tetromino
  for (let y = 0; y < tetromino.length; y++) {
    for (let x = 0; x < tetromino[y].length; x++) {
      // If the cell is filled
      if (tetromino[y][x] === 1) {
        // Add it to the matrix (1 means a settled block)
        newMatrix[position.y + y][position.x + x] = 1;
      }
    }
  }
  
  return newMatrix;
}

// Rotate a matrix (tetromino) clockwise
export function rotateMatrixClockwise(matrix: Matrix): Matrix {
  const N = matrix.length;
  const result = Array(N).fill(0).map(() => Array(N).fill(0));
  
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      result[x][N - 1 - y] = matrix[y][x];
    }
  }
  
  return result;
}

// Rotate a matrix (tetromino) counter-clockwise
export function rotateMatrixCounterClockwise(matrix: Matrix): Matrix {
  const N = matrix.length;
  const result = Array(N).fill(0).map(() => Array(N).fill(0));
  
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      result[N - 1 - x][y] = matrix[y][x];
    }
  }
  
  return result;
}

// Check if a row is completely filled (can be cleared)
export function isRowFull(row: (0 | 1 | 2 | 8)[]): boolean {
  // A row is considered full if it has no empty spaces (0) and no gems (8)
  return !row.some(cell => cell === 0 || cell === 8);
}

// Check if a row contains any locked blocks (can't be cleared yet)
export function rowHasLockedBlocks(row: (0 | 1 | 2 | 8)[]): boolean {
  // A row has locked blocks if any cell has value 2
  return row.some(cell => cell === 2);
}

import { GridCell, TetrominoPiece, Position, CellType } from '../types';

/**
 * Check if a tetromino collides with grid cells or boundaries
 */
export function checkCollision(
  grid: GridCell[][],
  piece: TetrominoPiece,
  position: Position
): boolean {
  const { shape } = piece;
  const { x: pieceX, y: pieceY } = position;

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      // Only check filled cells of the piece
      if (shape[y][x]) {
        const gridX = pieceX + x;
        const gridY = pieceY + y;
        
        // Check for boundaries
        if (
          gridX < 0 || // Left boundary
          gridX >= grid[0].length || // Right boundary
          gridY >= grid.length // Bottom boundary
        ) {
          return true; // Collision detected
        }
        
        // Check for collision with existing grid cells
        // But skip if we're above the grid (negative y)
        if (gridY >= 0 && grid[gridY][gridX].type !== CellType.EMPTY) {
          return true; // Collision detected with a non-empty cell
        }
      }
    }
  }
  
  return false; // No collision
}

/**
 * Merge the current tetromino with the grid
 */
export function mergeTetrominoWithGrid(
  grid: GridCell[][],
  piece: TetrominoPiece,
  position: Position
): GridCell[][] {
  const newGrid = JSON.parse(JSON.stringify(grid)) as GridCell[][]; // Deep clone
  const { shape, color } = piece;
  const { x: pieceX, y: pieceY } = position;

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const gridY = pieceY + y;
        const gridX = pieceX + x;
        
        // Only merge if within boundaries
        if (
          gridX >= 0 && 
          gridX < newGrid[0].length && 
          gridY >= 0 && 
          gridY < newGrid.length
        ) {
          newGrid[gridY][gridX] = {
            type: CellType.FILLED,
            color
          };
        }
      }
    }
  }
  
  return newGrid;
}

/**
 * Check and clear completed lines in the grid
 */
export function clearLines(grid: GridCell[][]): { clearedRows: number[], newGrid: GridCell[][] } {
  const clearedRows: number[] = [];
  let newGrid = JSON.parse(JSON.stringify(grid)) as GridCell[][];
  
  // Check each row from bottom to top
  for (let y = newGrid.length - 1; y >= 0; y--) {
    // A row is complete if all cells are filled and not frozen
    const isComplete = newGrid[y].every(
      cell => cell.type === CellType.FILLED || cell.type === CellType.POWERUP
    );
    
    if (isComplete) {
      clearedRows.push(y);
    }
  }
  
  // If there are cleared rows, update the grid
  if (clearedRows.length > 0) {
    // Sort rows in descending order to remove from bottom to top
    clearedRows.sort((a, b) => b - a);
    
    // Remove each cleared row
    for (const rowIndex of clearedRows) {
      // Remove the cleared row
      newGrid.splice(rowIndex, 1);
      
      // Add a new empty row at the top
      const newRow: GridCell[] = Array(newGrid[0].length).fill(null).map(() => ({
        type: CellType.EMPTY,
        color: 'transparent'
      }));
      
      newGrid.unshift(newRow);
    }
  }
  
  return { clearedRows, newGrid };
}

/**
 * Create a viewport slice of the grid based on current viewport position
 */
export function getViewportGrid(
  grid: GridCell[][],
  viewportPosition: number,
  viewportHeight: number
): GridCell[][] {
  const start = viewportPosition;
  const end = Math.min(start + viewportHeight, grid.length);
  
  return grid.slice(start, end);
}

/**
 * Check if the player has reached the gem
 */
export function checkGemCollected(
  grid: GridCell[][],
  gemPosition: Position
): boolean {
  // Check if the cell at the gem position is empty (meaning it was collected)
  return grid[gemPosition.y][gemPosition.x].type === CellType.EMPTY;
}

/**
 * Calculate current level progress as a percentage
 */
export function calculateProgress(
  viewportPosition: number,
  gemPosition: number,
  totalGridHeight: number
): number {
  // Calculate how far we've progressed toward the gem
  const distanceToGem = gemPosition - viewportPosition;
  const totalDistance = gemPosition;
  
  // Calculate progress percentage (0-100)
  return Math.min(100, Math.max(0, (1 - distanceToGem / totalDistance) * 100));
}

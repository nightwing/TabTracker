import { GridType, GridCell, CellType, PowerUpType } from '../types';

/**
 * Generate a random initial grid with some cells filled and some empty
 */
export function generateInitialGrid(
  rows: number,
  cols: number,
  fillPercentage: number = 0.3,
  frozenPercentage: number = 0.1,
  powerUpPercentage: number = 0.05
): GridCell[][] {
  const grid: GridCell[][] = [];
  
  // Helper function to determine if a cell should be filled based on probability
  const shouldFill = () => Math.random() < fillPercentage;
  const shouldBeFrozen = () => Math.random() < frozenPercentage;
  const shouldHavePowerUp = () => Math.random() < powerUpPercentage;
  
  // Generate power-up type randomly
  const getRandomPowerUp = (): PowerUpType => {
    const powerUps = [
      PowerUpType.CLEAR_ROW,
      PowerUpType.CLEAR_COLUMN,
      PowerUpType.REMOVE_FROZEN,
      PowerUpType.SLOW_FALL,
      PowerUpType.BOMB
    ];
    return powerUps[Math.floor(Math.random() * powerUps.length)];
  };
  
  // Generate random color
  const getRandomColor = (): string => {
    const colors = [
      '#FF0000', // Red
      '#00FF00', // Green
      '#0000FF', // Blue
      '#FFFF00', // Yellow
      '#FF00FF', // Magenta
      '#00FFFF', // Cyan
      '#FFA500', // Orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // The top 10 rows should be empty to allow pieces to spawn
  for (let y = 0; y < 10; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < cols; x++) {
      row.push({
        type: CellType.EMPTY,
        color: 'transparent'
      });
    }
    grid.push(row);
  }
  
  // Fill the rest of the grid with some random cells
  for (let y = 10; y < rows; y++) {
    const row: GridCell[] = [];
    
    for (let x = 0; x < cols; x++) {
      if (shouldFill()) {
        if (shouldBeFrozen()) {
          // Create frozen cell
          row.push({
            type: CellType.FROZEN,
            color: '#AACCFF',
            frozen: true
          });
        } else if (shouldHavePowerUp()) {
          // Create power-up cell
          const powerUpType = getRandomPowerUp();
          row.push({
            type: CellType.POWERUP,
            color: '#FFCC00',
            powerUpType
          });
        } else {
          // Create regular filled cell
          row.push({
            type: CellType.FILLED,
            color: getRandomColor()
          });
        }
      } else {
        // Create empty cell
        row.push({
          type: CellType.EMPTY,
          color: 'transparent'
        });
      }
    }
    
    grid.push(row);
  }
  
  // Place gem at the bottom
  const gemY = rows - 1;
  const gemX = Math.floor(cols / 2);
  grid[gemY][gemX] = {
    type: CellType.GEM,
    color: '#FFD700' // Gold color for gem
  };
  
  return grid;
}

/**
 * Apply well shape constraints to grid (cutting out areas that shouldn't be part of the playfield)
 */
export function applyWellShape(grid: GridCell[][], wellShape: number[][]): GridCell[][] {
  const newGrid = JSON.parse(JSON.stringify(grid)) as GridCell[][];
  
  // wellShape is a matrix of 0s and 1s, where 0 means the cell is not part of the playfield
  for (let y = 0; y < Math.min(wellShape.length, grid.length); y++) {
    for (let x = 0; x < Math.min(wellShape[y].length, grid[y].length); x++) {
      if (wellShape[y][x] === 0) {
        // This position is outside the well
        newGrid[y][x] = {
          type: CellType.EMPTY,
          color: 'transparent'
        };
      }
    }
  }
  
  return newGrid;
}

/**
 * Get rendering positions for different grid types
 */
export function getCellPosition(x: number, y: number, gridType: GridType, cellSize: number = 1): [number, number] {
  switch (gridType) {
    case GridType.HEXAGONAL:
      // In a hexagonal grid, odd rows are offset by half a cell
      return [
        x * cellSize + (y % 2) * (cellSize / 2),
        y * cellSize * 0.75
      ];
      
    case GridType.TRIANGULAR:
      // In a triangular grid, cells form a pattern of up and down triangles
      return [
        x * cellSize + (y % 2) * (cellSize / 2),
        y * cellSize * 0.866 // sqrt(3)/2 for triangle height
      ];
      
    case GridType.NORMAL:
    default:
      // Normal square grid
      return [x * cellSize, y * cellSize];
  }
}

/**
 * Get the shape to render for a cell based on grid type
 */
export function getCellShape(gridType: GridType): number[][] {
  switch (gridType) {
    case GridType.HEXAGONAL:
      // Hexagon points (6 vertices)
      return [
        [0.5, 0], [1, 0.25], [1, 0.75], 
        [0.5, 1], [0, 0.75], [0, 0.25]
      ];
      
    case GridType.TRIANGULAR:
      // Triangle points (3 vertices)
      // Alternating between up and down triangles based on position
      return [
        [0, 0], [1, 0], [0.5, 0.866]
      ];
      
    case GridType.NORMAL:
    default:
      // Square (4 vertices)
      return [
        [0, 0], [1, 0], [1, 1], [0, 1]
      ];
  }
}

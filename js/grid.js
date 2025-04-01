// Grid Utility Functions

// Apply well shape constraints to grid (cutting out areas that shouldn't be part of the playfield)
function applyWellShape(grid, wellShape) {
  const newGrid = JSON.parse(JSON.stringify(grid)); // Deep copy
  
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      // If this cell is outside the well, make it a wall (null)
      if (y < wellShape.length && x < wellShape[y].length && wellShape[y][x] === 0) {
        newGrid[y][x] = null;
      }
    }
  }
  
  return newGrid;
}

// Get rendering positions for different grid types
function getCellPosition(x, y, gridType, cellSize = 1) {
  switch(gridType) {
    case GRID_TYPE.HEXAGONAL:
      // Hexagonal grid - staggered pattern
      return [
        (x * cellSize * 0.75),
        (y * cellSize) + ((x % 2) * cellSize * 0.5)
      ];
      
    case GRID_TYPE.TRIANGULAR:
      // Triangular grid - alternate up and down triangles
      return [
        (x * cellSize * 0.5),
        (y * cellSize * 0.866) // Height of equilateral triangle
      ];
      
    default:
      // Normal square grid
      return [x * cellSize, y * cellSize];
  }
}

// Get the shape to render for a cell based on grid type
function getCellShape(gridType) {
  switch(gridType) {
    case GRID_TYPE.HEXAGONAL:
      // Hexagonal cells - 6 vertices
      return [
        [0, -1], [0.866, -0.5], [0.866, 0.5], 
        [0, 1], [-0.866, 0.5], [-0.866, -0.5]
      ];
      
    case GRID_TYPE.TRIANGULAR:
      // Triangular cells - 3 vertices
      return [
        [0, 0], [1, 0], [0.5, 0.866]
      ];
      
    default:
      // Normal square cells - 4 vertices
      return [
        [0, 0], [1, 0], [1, 1], [0, 1]
      ];
  }
}

// Check if a tetromino collides with grid cells or boundaries
function checkCollision(grid, piece, position, gameState = null) {
  // Special game state checks
  const ghostMode = gameState && gameState.ghostModeActive;
  
  // Iterate through each cell of the piece
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      // Only check filled cells (value of 1)
      if (piece.shape[y][x] !== 0) {
        const newX = position.x + x;
        const newY = position.y + y;
        
        // Check boundary conditions
        if (
          newX < 0 || // Left boundary
          newX >= grid[0].length || // Right boundary
          newY >= grid.length || // Bottom boundary
          newY < 0 // Top boundary (shouldn't happen normally)
        ) {
          return true; // Collision detected
        }
        
        // Skip further checks if the cell isn't in bounds
        if (!grid[newY] || !grid[newY][newX]) continue;
        
        const cell = grid[newY][newX];
        
        // Handle special cell types
        if (cell.type === CELL_TYPE.PORTAL && gameState) {
          // Portal teleportation logic handled elsewhere
          // Just consider it as non-colliding here
          continue;
        }
        
        // Bouncy cells don't cause collision, they cause reflection
        // Handled in the movement logic
        if (cell.type === CELL_TYPE.BOUNCY && gameState) {
          // Increment the bounce counter for handling in the movement logic
          if (gameState.bouncyCollisionCount !== undefined) {
            gameState.bouncyCollisionCount++;
          }
          continue;
        }
        
        // Handle ghost mode - allow passing through filled cells
        if (ghostMode && cell.type === CELL_TYPE.FILLED) {
          continue;
        }
        
        // Check if this position is already filled in the grid
        if (
          cell.type !== CELL_TYPE.EMPTY &&
          cell.type !== CELL_TYPE.POWERUP && // Power-ups can be collected
          cell.type !== CELL_TYPE.MAGNETIC && // Magnetic cells handle attraction elsewhere
          cell.type !== CELL_TYPE.GRAVITY && // Gravity cells handle gravity shifts elsewhere
          cell.type !== CELL_TYPE.SCRAMBLE // Scramble cells cause rotation elsewhere
        ) {
          return true; // Collision detected
        }
      }
    }
  }
  
  return false; // No collision
}

// Merge the current tetromino with the grid
function mergeTetrominoWithGrid(grid, piece, position, gameState = null) {
  // Create a deep copy of the grid to avoid directly modifying the original
  const newGrid = JSON.parse(JSON.stringify(grid));
  let specialEffects = [];
  
  // Iterate through each cell of the piece
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      // Only merge filled cells (value of 1)
      if (piece.shape[y][x] !== 0) {
        const newY = position.y + y;
        const newX = position.x + x;
        
        // Ensure we're within grid bounds
        if (
          newY >= 0 && 
          newY < newGrid.length && 
          newX >= 0 && 
          newX < newGrid[newY].length
        ) {
          // Check for special cell interactions before merging
          const originalCell = newGrid[newY][newX];
          
          if (originalCell.type === CELL_TYPE.PORTAL && gameState) {
            // Handle portal teleportation
            if (gameState.portalActiveCooldown <= 0 && originalCell.exitPosition) {
              // Teleport the piece to the exit portal's position
              const exitPortal = originalCell.exitPosition;
              
              // Set cooldown to prevent immediate re-teleportation
              gameState.portalActiveCooldown = 5; // 5 game ticks
              
              if (gameState.onSpecialEffectActivate) {
                gameState.onSpecialEffectActivate('portal', { 
                  from: { x: newX, y: newY },
                  to: exitPortal
                });
              }
              
              // Record the special effect
              specialEffects.push({
                type: 'portal',
                position: { x: newX, y: newY },
                exitPosition: exitPortal
              });
              
              // Don't merge here, the piece will be teleported
              continue;
            }
          }
          else if (originalCell.type === CELL_TYPE.MAGNETIC && gameState) {
            // Magnetic cells attract pieces
            // Handle in movement logic, but record the effect
            specialEffects.push({
              type: 'magnetic',
              position: { x: newX, y: newY }
            });
          }
          else if (originalCell.type === CELL_TYPE.GRAVITY && gameState) {
            // Toggle gravity direction
            gameState.gravityFlipped = !gameState.gravityFlipped;
            
            if (gameState.onSpecialEffectActivate) {
              gameState.onSpecialEffectActivate('gravity', { 
                position: { x: newX, y: newY },
                flipped: gameState.gravityFlipped
              });
            }
            
            specialEffects.push({
              type: 'gravity',
              position: { x: newX, y: newY },
              flipped: gameState.gravityFlipped
            });
          }
          else if (originalCell.type === CELL_TYPE.SCRAMBLE && gameState) {
            // Scramble the piece rotation
            // Will be handled after merging
            specialEffects.push({
              type: 'scramble',
              position: { x: newX, y: newY }
            });
          }
          else if (originalCell.type === CELL_TYPE.POWERUP && gameState) {
            // Activate power-up
            if (gameState.usePowerUp) {
              gameState.usePowerUp({ x: newX, y: newY });
            }
            specialEffects.push({
              type: 'powerup',
              position: { x: newX, y: newY },
              powerUpType: originalCell.powerUpType
            });
          }
          
          // Set the cell in the grid to be filled with the piece's color
          newGrid[newY][newX] = {
            type: CELL_TYPE.FILLED,
            color: piece.color
          };
        }
      }
    }
  }
  
  // Return the modified grid and any special effects
  return gameState ? { grid: newGrid, specialEffects } : newGrid;
}

// Check and clear completed lines in the grid
function clearLines(grid) {
  const clearedRows = [];
  let newGrid = JSON.parse(JSON.stringify(grid)); // Deep copy
  
  // Check each row from bottom to top
  for (let y = newGrid.length - 1; y >= 0; y--) {
    // Check if the row is full (all cells are filled and not null)
    let rowIsFull = true;
    for (let x = 0; x < newGrid[y].length; x++) {
      // Skip cells that are null (outside the well shape)
      if (newGrid[y][x] === null) continue;
      
      // If any cell is empty or a powerup, the row is not full
      if (
        !newGrid[y][x] || 
        newGrid[y][x].type === CELL_TYPE.EMPTY || 
        newGrid[y][x].type === CELL_TYPE.POWERUP
      ) {
        rowIsFull = false;
        break;
      }
    }
    
    // If the row is full, mark it for clearing
    if (rowIsFull) {
      clearedRows.push(y);
    }
  }
  
  // If no rows to clear, return original grid
  if (clearedRows.length === 0) {
    return { clearedRows, newGrid };
  }
  
  // Clear the completed rows
  for (const rowIndex of clearedRows) {
    // Clear the row (set all cells to empty)
    for (let x = 0; x < newGrid[rowIndex].length; x++) {
      // Skip cells that are null (outside the well shape)
      if (newGrid[rowIndex][x] === null) continue;
      
      newGrid[rowIndex][x] = {
        type: CELL_TYPE.EMPTY,
        color: 'transparent'
      };
    }
  }
  
  // Move all cells above the cleared row down
  for (const rowIndex of clearedRows) {
    for (let y = rowIndex; y > 0; y--) {
      for (let x = 0; x < newGrid[y].length; x++) {
        // Skip cells that are null (outside the well shape)
        if (newGrid[y][x] === null) continue;
        
        // Move the cell from above down
        newGrid[y][x] = newGrid[y-1][x];
      }
    }
  }
  
  return { clearedRows, newGrid };
}

// Create a viewport slice of the grid based on current viewport position
function getViewportGrid(grid, viewportPosition, viewportHeight) {
  // Ensure viewportPosition is an integer
  const startRow = Math.floor(viewportPosition);
  
  // Create a slice of the grid that fits in the viewport
  const visibleRows = Math.min(viewportHeight, grid.length - startRow);
  
  if (startRow >= grid.length) {
    return [];
  }
  
  return grid.slice(startRow, startRow + visibleRows);
}

// Check if the player has reached the gem
function checkGemCollected(grid, piece, position, gemPosition) {
  // Iterate through each cell of the piece
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      // Only check filled cells (value of 1)
      if (piece.shape[y][x] !== 0) {
        const newY = position.y + y;
        const newX = position.x + x;
        
        // Check if this piece position matches the gem position
        if (newX === gemPosition.x && newY === gemPosition.y) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Calculate current level progress as a percentage
function calculateProgress(viewportPosition, gemPosition) {
  return Math.min(100, Math.max(0, viewportPosition / gemPosition * 100));
}
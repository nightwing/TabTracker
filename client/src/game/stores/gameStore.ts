import { create } from 'zustand';
import { GameState, GridCell, Position, TetrominoPiece, GridType, PowerUpType, CellType } from '../types';
import { getLevelById } from '../data/levels';
import { generateRandomPiece } from '../utils/tetrominoUtils';
import { checkCollision, clearLines, mergeTetrominoWithGrid } from '../utils/gameUtils';

interface GameStore extends GameState {
  // Actions
  initializeGame: (levelId: number) => void;
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotatePiece: () => void;
  dropPiece: () => void;
  tick: () => void;
  setGameOver: () => void;
  setPaused: (paused: boolean) => void;
  handleCompletedLines: () => number[];
  updateViewportPosition: () => void;
  usePowerUp: (position: Position) => void;
  setNextPiece: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  level: getLevelById(1),
  grid: [],
  currentPiece: undefined,
  nextPiece: undefined,
  piecePosition: { x: 0, y: 0 },
  score: 0,
  linesCleared: 0,
  gameOver: false,
  paused: false,
  fallingSpeed: 1,
  viewportPosition: 0,
  
  // Special states for powerups and special cells
  gravityFlipped: false,
  gemFinderActive: false,
  gemFinderDuration: 0,
  gemPosition: undefined,
  ghostModeActive: false,
  extraPiece: undefined,
  portalActiveCooldown: 0,
  bouncyCollisionCount: 0,
  
  // Special effects callback
  onSpecialEffectActivate: undefined,

  initializeGame: (levelId: number) => {
    const level = getLevelById(levelId);
    if (!level) return;

    // Deep clone the initial grid to avoid reference issues
    const initialGrid: GridCell[][] = JSON.parse(JSON.stringify(level.initialGrid));
    const currentPiece = generateRandomPiece();
    const nextPiece = generateRandomPiece();
    
    // Calculate initial piece position at the top center of the grid
    const startX = Math.floor((initialGrid[0].length - currentPiece.shape[0].length) / 2);
    
    set({
      level,
      grid: initialGrid,
      currentPiece,
      nextPiece,
      piecePosition: { x: startX, y: 0 },
      score: 0,
      linesCleared: 0,
      gameOver: false,
      paused: false,
      fallingSpeed: 1 + (level.difficulty * 0.2),
      viewportPosition: 0,
      
      // Reset all special states
      gravityFlipped: false,
      gemFinderActive: false,
      gemFinderDuration: 0,
      gemPosition: level.gemPosition,
      ghostModeActive: false,
      extraPiece: undefined,
      portalActiveCooldown: 0,
      bouncyCollisionCount: 0
    });
  },

  moveLeft: () => {
    const { piecePosition, currentPiece, grid, paused } = get();
    if (!currentPiece || paused || get().gameOver) return;

    const newPosition = { ...piecePosition, x: piecePosition.x - 1 };
    if (!checkCollision(grid, currentPiece, newPosition)) {
      set({ piecePosition: newPosition });
    }
  },

  moveRight: () => {
    const { piecePosition, currentPiece, grid, paused } = get();
    if (!currentPiece || paused || get().gameOver) return;

    const newPosition = { ...piecePosition, x: piecePosition.x + 1 };
    if (!checkCollision(grid, currentPiece, newPosition)) {
      set({ piecePosition: newPosition });
    }
  },

  moveDown: () => {
    const { piecePosition, currentPiece, grid, paused, ghostModeActive, gravityFlipped, onSpecialEffectActivate } = get();
    if (!currentPiece || paused || get().gameOver) return;

    // Handle gravity flipping
    const direction = gravityFlipped ? -1 : 1;
    const newPosition = { ...piecePosition, y: piecePosition.y + direction };

    // Check for special cell collisions
    const hasCollision = !ghostModeActive && checkCollision(grid, currentPiece, newPosition);
    
    if (!hasCollision) {
      // If no collision, just move the piece
      set({ piecePosition: newPosition });
      
      // Check if we're colliding with any special cells
      currentPiece.shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell) {
            const gridX = newPosition.x + colIndex;
            const gridY = newPosition.y + rowIndex;
            
            // Make sure we're in grid bounds
            if (gridY >= 0 && gridY < grid.length && gridX >= 0 && gridX < grid[0].length) {
              const gridCell = grid[gridY][gridX];
              
              // Handle portal cells
              if (gridCell.type === CellType.PORTAL && gridCell.portalId && !gridCell.isExit) {
                // Find the exit portal
                const portalCooldown = get().portalActiveCooldown;
                if (portalCooldown <= 0) {
                  for (let y = 0; y < grid.length; y++) {
                    for (let x = 0; x < grid[y].length; x++) {
                      const cell = grid[y][x];
                      if (cell.type === CellType.PORTAL && 
                          cell.portalId === gridCell.portalId && 
                          cell.isExit) {
                        // Teleport the piece to the exit
                        set({ 
                          piecePosition: { x: x - colIndex, y: y - rowIndex },
                          portalActiveCooldown: 10 // Add cooldown to prevent immediate re-entry
                        });
                        if (onSpecialEffectActivate) {
                          onSpecialEffectActivate('portal', { 
                            fromX: gridX, 
                            fromY: gridY,
                            toX: x,
                            toY: y
                          });
                        }
                        return;
                      }
                    }
                  }
                }
              }
              
              // Handle magnetic cells that attract the piece
              else if (gridCell.type === CellType.MAGNETIC && gridCell.magneticStrength) {
                const strength = gridCell.magneticStrength / 10; // Scale down the effect
                const pullX = gridX - (newPosition.x + currentPiece.shape[0].length / 2);
                const pullDirection = pullX > 0 ? 1 : -1;
                
                // Apply magnetic pull based on strength
                if (Math.random() < strength) {
                  const magneticPosition = { 
                    ...newPosition, 
                    x: newPosition.x + pullDirection
                  };
                  
                  // Only move if it doesn't cause collision
                  if (!checkCollision(grid, currentPiece, magneticPosition)) {
                    set({ piecePosition: magneticPosition });
                    if (onSpecialEffectActivate) {
                      onSpecialEffectActivate('magnetic', { 
                        strength: gridCell.magneticStrength,
                        direction: pullDirection
                      });
                    }
                  }
                }
              }
              
              // Handle gravity cells
              else if (gridCell.type === CellType.GRAVITY && gridCell.gravityDirection) {
                let gravityPosition = { ...newPosition };
                
                switch(gridCell.gravityDirection) {
                  case 'up':
                    gravityPosition.y -= 1;
                    break;
                  case 'down':
                    gravityPosition.y += 1;
                    break;
                  case 'left':
                    gravityPosition.x -= 1;
                    break;
                  case 'right':
                    gravityPosition.x += 1;
                    break;
                }
                
                // Only apply if it doesn't cause collision
                if (!checkCollision(grid, currentPiece, gravityPosition)) {
                  set({ piecePosition: gravityPosition });
                  if (onSpecialEffectActivate) {
                    onSpecialEffectActivate('gravity', { direction: gridCell.gravityDirection });
                  }
                }
              }
              
              // Handle scramble cells
              else if (gridCell.type === CellType.SCRAMBLE && gridCell.scrambleRotations) {
                // Rotate the piece randomly
                let rotated = { ...currentPiece };
                
                // Apply multiple rotations
                for (let i = 0; i < gridCell.scrambleRotations; i++) {
                  rotated.shape = rotated.shape[0].map((_, i) => 
                    rotated.shape.map(row => row[i]).reverse()
                  );
                }
                
                // Only apply if it doesn't cause collision
                if (!checkCollision(grid, rotated, newPosition)) {
                  set({ currentPiece: rotated });
                  if (onSpecialEffectActivate) {
                    onSpecialEffectActivate('scramble', { rotations: gridCell.scrambleRotations });
                  }
                }
              }
            }
          }
        });
      });
      
      // Reduce portal cooldown
      if (get().portalActiveCooldown > 0) {
        set(state => ({ portalActiveCooldown: state.portalActiveCooldown - 1 }));
      }
    } else {
      // Check for bouncy cells before locking the piece
      let isBouncy = false;
      
      currentPiece.shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell) {
            const gridX = piecePosition.x + colIndex;
            const gridY = piecePosition.y + rowIndex + 1; // Check one row below
            
            if (gridY < grid.length && gridX >= 0 && gridX < grid[0].length) {
              if (grid[gridY][gridX].type === CellType.BOUNCY) {
                isBouncy = true;
              }
            }
          }
        });
      });
      
      if (isBouncy) {
        // Bounce the piece upward
        const bouncePosition = { ...piecePosition, y: piecePosition.y - 1 };
        if (!checkCollision(grid, currentPiece, bouncePosition)) {
          set({ 
            piecePosition: bouncePosition,
            bouncyCollisionCount: get().bouncyCollisionCount + 1
          });
          
          if (onSpecialEffectActivate) {
            onSpecialEffectActivate('bouncy', { count: get().bouncyCollisionCount });
          }
          
          // After too many bounces, lock the piece anyway
          if (get().bouncyCollisionCount > 3) {
            set({ bouncyCollisionCount: 0 });
            // Continue to piece locking code below
          } else {
            return; // Skip locking the piece
          }
        }
      }
      
      // If we can't move down, the piece is set in place
      const newGrid = mergeTetrominoWithGrid(grid, currentPiece, piecePosition);
      const completedLines = get().handleCompletedLines();
      
      // Set the new grid and spawn a new piece
      set({ 
        grid: newGrid,
        bouncyCollisionCount: 0 // Reset bounce counter
      });
      get().setNextPiece();
      
      // Update score based on completed lines
      if (completedLines.length > 0) {
        const addedScore = completedLines.length * 100 * (completedLines.length); // Bonus for multiple lines
        set(state => ({ 
          score: state.score + addedScore,
          linesCleared: state.linesCleared + completedLines.length
        }));
        get().updateViewportPosition();
      }
      
      // Check if the piece has reached the gem
      const gemPosition = get().level.gemPosition;
      let gemCollected = false;
      
      currentPiece.shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell) {
            const gridX = piecePosition.x + colIndex;
            const gridY = piecePosition.y + rowIndex;
            
            if (gridX === gemPosition.x && gridY === gemPosition.y) {
              gemCollected = true;
            }
          }
        });
      });
      
      if (gemCollected) {
        // Victory! Player has reached the gem
        set({ gameOver: true });
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('gemCollected', { position: gemPosition });
        }
      }
    }
  },

  rotatePiece: () => {
    const { currentPiece, piecePosition, grid, paused } = get();
    if (!currentPiece || paused || get().gameOver) return;

    // Create a rotated version of the piece
    const rotated = {
      ...currentPiece,
      shape: currentPiece.shape[0].map((_, i) => 
        currentPiece.shape.map(row => row[i]).reverse()
      )
    };

    // Check if the rotation is valid
    if (!checkCollision(grid, rotated, piecePosition)) {
      set({ currentPiece: rotated });
    }
  },

  dropPiece: () => {
    const { currentPiece, grid, piecePosition, paused } = get();
    if (!currentPiece || paused || get().gameOver) return;

    // Find how far down we can drop
    let dropDistance = 0;
    let newPosition = { ...piecePosition };
    
    while (!checkCollision(grid, currentPiece, { ...newPosition, y: newPosition.y + 1 })) {
      newPosition.y += 1;
      dropDistance += 1;
    }
    
    if (dropDistance > 0) {
      // Update position and score
      set(state => ({ 
        piecePosition: newPosition,
        score: state.score + (dropDistance * 2) // Bonus for hard drop
      }));
      
      // Immediately set the piece and check for completed lines
      const newGrid = mergeTetrominoWithGrid(grid, currentPiece, newPosition);
      const completedLines = get().handleCompletedLines();
      
      set({ grid: newGrid });
      get().setNextPiece();
      
      // Update score based on completed lines
      if (completedLines.length > 0) {
        const addedScore = completedLines.length * 100 * (completedLines.length);
        set(state => ({ 
          score: state.score + addedScore,
          linesCleared: state.linesCleared + completedLines.length
        }));
        get().updateViewportPosition();
      }
    }
  },

  tick: () => {
    if (get().paused || get().gameOver) return;
    get().moveDown();
  },

  setGameOver: () => {
    set({ gameOver: true });
  },

  setPaused: (paused: boolean) => {
    set({ paused });
  },

  handleCompletedLines: () => {
    const { grid } = get();
    const { clearedRows, newGrid } = clearLines(grid);
    
    if (clearedRows.length > 0) {
      set({ grid: newGrid });
    }
    
    return clearedRows;
  },

  updateViewportPosition: () => {
    const { linesCleared, viewportPosition } = get();
    // Move viewport down every 10 lines cleared
    const newPosition = Math.floor(linesCleared / 10) * 10;
    if (newPosition > viewportPosition) {
      set({ viewportPosition: newPosition });
    }
  },
  
  usePowerUp: (position: Position) => {
    const { grid, level, currentPiece, onSpecialEffectActivate } = get();
    const cell = grid[position.y][position.x];
    
    if (cell.type !== CellType.POWERUP || !cell.powerUpType) return;
    
    // Apply power-up effect based on type
    let newGrid = [...grid];
    
    switch (cell.powerUpType) {
      case PowerUpType.CLEAR_ROW:
        // Clear the entire row
        newGrid = newGrid.map((row, y) => 
          y === position.y ? row.map(() => ({ type: CellType.EMPTY, color: 'transparent' })) : row
        );
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('clearRow', { y: position.y });
        }
        break;
        
      case PowerUpType.CLEAR_COLUMN:
        // Clear the entire column
        newGrid = newGrid.map(row => 
          row.map((cell, x) => x === position.x ? { type: CellType.EMPTY, color: 'transparent' } : cell)
        );
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('clearColumn', { x: position.x });
        }
        break;
        
      case PowerUpType.REMOVE_FROZEN:
        // Remove all frozen cells in a 3x3 area
        for (let y = Math.max(0, position.y - 1); y <= Math.min(grid.length - 1, position.y + 1); y++) {
          for (let x = Math.max(0, position.x - 1); x <= Math.min(grid[0].length - 1, position.x + 1); x++) {
            if (newGrid[y][x].type === CellType.FROZEN) {
              newGrid[y][x] = { type: CellType.EMPTY, color: 'transparent' };
            }
          }
        }
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('removeFrozen', { x: position.x, y: position.y, radius: 1 });
        }
        break;
        
      case PowerUpType.SLOW_FALL:
        // Temporarily slow down the falling speed
        set(state => ({ fallingSpeed: state.fallingSpeed * 0.5 }));
        setTimeout(() => {
          set(state => ({ fallingSpeed: state.fallingSpeed * 2 }));
        }, 10000); // Effect lasts for 10 seconds
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('slowFall', { duration: 10000 });
        }
        break;
        
      case PowerUpType.BOMB:
        // Clear cells in a 5x5 area
        for (let y = Math.max(0, position.y - 2); y <= Math.min(grid.length - 1, position.y + 2); y++) {
          for (let x = Math.max(0, position.x - 2); x <= Math.min(grid[0].length - 1, position.x + 2); x++) {
            newGrid[y][x] = { type: CellType.EMPTY, color: 'transparent' };
          }
        }
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('bomb', { x: position.x, y: position.y, radius: 2 });
        }
        break;
        
      case PowerUpType.SHAPE_SHIFT:
        // Transform current piece into a different shape
        if (currentPiece) {
          const newPiece = generateRandomPiece();
          newPiece.color = currentPiece.color; // Keep the same color
          set({ currentPiece: newPiece });
          if (onSpecialEffectActivate) {
            onSpecialEffectActivate('shapeShift', { oldPiece: currentPiece, newPiece });
          }
        }
        break;
        
      case PowerUpType.MULTI_CLEAR:
        // Clear multiple random rows
        const totalRows = newGrid.length;
        const rowsToClear = Math.min(3, totalRows); // Clear up to 3 rows
        const rowIndices: number[] = [];
        
        // Select random rows to clear
        for (let i = 0; i < rowsToClear; i++) {
          let randomRow: number;
          do {
            randomRow = Math.floor(Math.random() * totalRows);
          } while (rowIndices.includes(randomRow));
          rowIndices.push(randomRow);
        }
        
        // Clear the selected rows
        rowIndices.forEach(rowIndex => {
          newGrid[rowIndex] = newGrid[rowIndex].map(() => ({ 
            type: CellType.EMPTY, 
            color: 'transparent' 
          }));
        });
        
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('multiClear', { rows: rowIndices });
        }
        break;
        
      case PowerUpType.TIME_FREEZE:
        // Temporarily pause the game
        set({ paused: true });
        setTimeout(() => {
          set({ paused: false });
        }, 5000); // Paused for 5 seconds
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('timeFreeze', { duration: 5000 });
        }
        break;
        
      case PowerUpType.GRAVITY_FLIP:
        // Reverse gravity direction
        set({ gravityFlipped: true });
        setTimeout(() => {
          set({ gravityFlipped: false });
        }, 15000); // Flipped for 15 seconds
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('gravityFlip', { duration: 15000 });
        }
        break;
        
      case PowerUpType.WILD_CARD:
        // Transform into a random power-up
        const randomPowerUpType = Object.values(PowerUpType)
          .filter(type => type !== PowerUpType.WILD_CARD)[
          Math.floor(Math.random() * (Object.values(PowerUpType).length - 1))
        ];
        // Recursively call usePowerUp with the new power-up type
        newGrid[position.y][position.x] = {
          ...newGrid[position.y][position.x],
          powerUpType: randomPowerUpType
        };
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('wildCard', { newType: randomPowerUpType });
        }
        get().usePowerUp(position);
        return; // Skip the rest of the function to avoid double effects
        
      case PowerUpType.GEM_FINDER:
        // Show direction to the gem
        set({ 
          gemFinderActive: true,
          gemFinderDuration: 30000 // 30 seconds
        });
        setTimeout(() => {
          set({ gemFinderActive: false });
        }, 30000);
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('gemFinder', { 
            gemPosition: level.gemPosition,
            duration: 30000
          });
        }
        break;
        
      case PowerUpType.EXTRA_PIECE:
        // Give an extra piece to place
        const extraPiece = generateRandomPiece();
        set({ extraPiece });
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('extraPiece', { piece: extraPiece });
        }
        break;
        
      case PowerUpType.GHOST_MODE:
        // Enable ghost mode (pass through blocks)
        set({ ghostModeActive: true });
        setTimeout(() => {
          set({ ghostModeActive: false });
        }, 10000); // Active for 10 seconds
        if (onSpecialEffectActivate) {
          onSpecialEffectActivate('ghostMode', { duration: 10000 });
        }
        break;
    }
    
    // Update the grid to remove the power-up
    if (newGrid[position.y] && newGrid[position.y][position.x]) {
      newGrid[position.y][position.x] = { type: CellType.EMPTY, color: 'transparent' };
    }
    
    set({ grid: newGrid });
    
    // Add score for using a power-up
    set(state => ({ score: state.score + 50 }));
  },
  
  setNextPiece: () => {
    const { nextPiece, grid } = get();
    if (!nextPiece) return;
    
    // Create a new next piece
    const newNextPiece = generateRandomPiece();
    
    // Calculate starting position (center top of grid)
    const startX = Math.floor((grid[0].length - nextPiece.shape[0].length) / 2);
    const startY = 0;
    
    // Check if the new piece can be placed at the starting position
    if (checkCollision(grid, nextPiece, { x: startX, y: startY })) {
      // If collision occurs immediately, the game is over
      get().setGameOver();
      return;
    }
    
    // Otherwise set the current piece to the next piece and update state
    set({
      currentPiece: nextPiece,
      nextPiece: newNextPiece,
      piecePosition: { x: startX, y: startY }
    });
  }
}));

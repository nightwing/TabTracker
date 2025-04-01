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
      viewportPosition: 0
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
    const { piecePosition, currentPiece, grid, paused } = get();
    if (!currentPiece || paused || get().gameOver) return;

    const newPosition = { ...piecePosition, y: piecePosition.y + 1 };
    if (!checkCollision(grid, currentPiece, newPosition)) {
      set({ piecePosition: newPosition });
    } else {
      // If we can't move down, the piece is set in place
      const newGrid = mergeTetrominoWithGrid(grid, currentPiece, piecePosition);
      const completedLines = get().handleCompletedLines();
      
      // Set the new grid and spawn a new piece
      set({ grid: newGrid });
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
    const { grid } = get();
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
        break;
        
      case PowerUpType.CLEAR_COLUMN:
        // Clear the entire column
        newGrid = newGrid.map(row => 
          row.map((cell, x) => x === position.x ? { type: CellType.EMPTY, color: 'transparent' } : cell)
        );
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
        break;
        
      case PowerUpType.SLOW_FALL:
        // Temporarily slow down the falling speed
        set(state => ({ fallingSpeed: state.fallingSpeed * 0.5 }));
        setTimeout(() => {
          set(state => ({ fallingSpeed: state.fallingSpeed * 2 }));
        }, 10000); // Effect lasts for 10 seconds
        break;
        
      case PowerUpType.BOMB:
        // Clear cells in a 5x5 area
        for (let y = Math.max(0, position.y - 2); y <= Math.min(grid.length - 1, position.y + 2); y++) {
          for (let x = Math.max(0, position.x - 2); x <= Math.min(grid[0].length - 1, position.x + 2); x++) {
            newGrid[y][x] = { type: CellType.EMPTY, color: 'transparent' };
          }
        }
        break;
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

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { 
  GameState, 
  INITIAL_DROP_TIME, 
  LEVEL_SPEED_MULTIPLIER, 
  POINTS_HARD_DROP, 
  POINTS_SOFT_DROP,
  GridType
} from "../constants";
import { TetrominoGenerator, Matrix, Tetromino } from "../tetrominos";
import { Position, isValidPosition, mergeTetrominoIntoMatrix, rotateMatrixClockwise, rotateMatrixCounterClockwise } from "../gridUtils";
import { LEVELS, getLevelById, LevelData } from "../levelData";
import { checkRows, getNextLevel, hasReachedGem, unlockAdjacentBlocks } from "../gameHelpers";
import { useAudio } from "./useAudio";

interface TetrisGameState {
  // Game status
  gameState: GameState;
  score: number;
  level: number;
  rowsCleared: number;
  dropTime: number;
  
  // Current level data
  currentLevelId: number;
  currentLevelData: LevelData;
  
  // Grid state
  matrix: Matrix;
  gridType: GridType;
  wellWidth: number;
  wellHeight: number;
  
  // Current tetromino
  tetromino: Tetromino | null;
  position: Position;
  
  // Tetromino generator
  tetrominoGenerator: TetrominoGenerator;
  
  // Actions
  startGame: (levelId?: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  hardDrop: () => void;
  tick: () => void; // For the game loop
  restartLevel: () => void;
  nextLevel: () => void;
}

export const useTetrisGame = create<TetrisGameState>()(
  subscribeWithSelector((set, get) => {
    // Initialize tetromino generator
    const tetrominoGenerator = new TetrominoGenerator();
    
    // Get initial level data
    const initialLevelData = LEVELS[0];
    
    return {
      // Game status
      gameState: GameState.MENU,
      score: 0,
      level: initialLevelData.initialLevel,
      rowsCleared: 0,
      dropTime: INITIAL_DROP_TIME,
      
      // Current level data
      currentLevelId: initialLevelData.id,
      currentLevelData: initialLevelData,
      
      // Grid state
      matrix: initialLevelData.initialMatrix,
      gridType: initialLevelData.gridType,
      wellWidth: initialLevelData.initialMatrix[0].length,
      wellHeight: initialLevelData.initialMatrix.length,
      
      // Current tetromino (null = no active tetromino)
      tetromino: null,
      position: { x: 0, y: 0 },
      
      // Tetromino generator
      tetrominoGenerator,
      
      // Start a new game
      startGame: (levelId) => {
        const levelData = levelId ? getLevelById(levelId) : LEVELS[0];
        
        if (!levelData) {
          console.error(`Level with ID ${levelId} not found`);
          return;
        }
        
        // Get a new tetromino
        const newTetromino = tetrominoGenerator.getNextTetromino();
        
        // Calculate starting position (center top)
        const startPosition = {
          x: Math.floor((levelData.initialMatrix[0].length - newTetromino.shape[0].length) / 2),
          y: 0,
        };
        
        set({
          gameState: GameState.PLAYING,
          score: 0,
          level: levelData.initialLevel,
          rowsCleared: 0,
          dropTime: INITIAL_DROP_TIME / Math.pow(LEVEL_SPEED_MULTIPLIER, levelData.initialLevel - 1),
          
          currentLevelId: levelData.id,
          currentLevelData: levelData,
          
          matrix: levelData.initialMatrix,
          gridType: levelData.gridType,
          wellWidth: levelData.initialMatrix[0].length,
          wellHeight: levelData.initialMatrix.length,
          
          tetromino: newTetromino,
          position: startPosition,
        });
      },
      
      pauseGame: () => {
        set(state => {
          if (state.gameState === GameState.PLAYING) {
            return { gameState: GameState.PAUSED };
          }
          return {};
        });
      },
      
      resumeGame: () => {
        set(state => {
          if (state.gameState === GameState.PAUSED) {
            return { gameState: GameState.PLAYING };
          }
          return {};
        });
      },
      
      gameOver: () => {
        set({ gameState: GameState.GAME_OVER });
      },
      
      moveLeft: () => {
        set(state => {
          if (
            state.gameState !== GameState.PLAYING ||
            !state.tetromino
          ) {
            return {};
          }
          
          const newPosition = {
            ...state.position,
            x: state.position.x - 1,
          };
          
          if (isValidPosition(
            newPosition, 
            state.matrix, 
            state.tetromino.shape, 
            state.wellWidth, 
            state.wellHeight,
            state.currentLevelData.wellShape
          )) {
            return { position: newPosition };
          }
          
          return {};
        });
      },
      
      moveRight: () => {
        set(state => {
          if (
            state.gameState !== GameState.PLAYING ||
            !state.tetromino
          ) {
            return {};
          }
          
          const newPosition = {
            ...state.position,
            x: state.position.x + 1,
          };
          
          if (isValidPosition(
            newPosition, 
            state.matrix, 
            state.tetromino.shape, 
            state.wellWidth, 
            state.wellHeight,
            state.currentLevelData.wellShape
          )) {
            return { position: newPosition };
          }
          
          return {};
        });
      },
      
      moveDown: () => {
        set(state => {
          if (
            state.gameState !== GameState.PLAYING ||
            !state.tetromino
          ) {
            return {};
          }
          
          const newPosition = {
            ...state.position,
            y: state.position.y + 1,
          };
          
          // If the new position is valid, move down
          if (isValidPosition(
            newPosition, 
            state.matrix, 
            state.tetromino.shape, 
            state.wellWidth, 
            state.wellHeight,
            state.currentLevelData.wellShape
          )) {
            // Add points for soft drop
            return { 
              position: newPosition,
              score: state.score + POINTS_SOFT_DROP
            };
          }
          
          // If we can't move, the piece is settled
          // Merge it with the matrix
          const newMatrix = mergeTetrominoIntoMatrix(
            state.matrix,
            state.tetromino.shape,
            state.position
          );
          
          // Check for cleared rows
          const { newMatrix: matrixAfterRowCheck, rowsCleared, pointsScored } = checkRows(newMatrix);
          
          // Add to total score
          const newScore = state.score + pointsScored;
          
          // Add to total rows cleared
          const totalRowsCleared = state.rowsCleared + rowsCleared;
          
          // Play sound effect for line clear
          if (rowsCleared > 0) {
            useAudio.getState().playSuccess();
          } else {
            useAudio.getState().playHit();
          }
          
          // Check if a gem is accessible
          if (hasReachedGem(matrixAfterRowCheck)) {
            return {
              matrix: matrixAfterRowCheck,
              gameState: GameState.LEVEL_COMPLETE,
              score: newScore,
              rowsCleared: totalRowsCleared,
            };
          }
          
          // Get a new tetromino
          const nextTetromino = state.tetrominoGenerator.getNextTetromino();
          
          // Calculate starting position
          const startPosition = {
            x: Math.floor((state.wellWidth - nextTetromino.shape[0].length) / 2),
            y: 0,
          };
          
          // Check if the new tetromino would immediately collide
          // This would mean game over
          if (!isValidPosition(
            startPosition, 
            matrixAfterRowCheck, 
            nextTetromino.shape, 
            state.wellWidth, 
            state.wellHeight,
            state.currentLevelData.wellShape
          )) {
            return {
              matrix: matrixAfterRowCheck,
              gameState: GameState.GAME_OVER,
              score: newScore,
              rowsCleared: totalRowsCleared,
            };
          }
          
          return {
            matrix: matrixAfterRowCheck,
            tetromino: nextTetromino,
            position: startPosition,
            score: newScore,
            rowsCleared: totalRowsCleared,
          };
        });
      },
      
      rotateClockwise: () => {
        set(state => {
          if (
            state.gameState !== GameState.PLAYING ||
            !state.tetromino
          ) {
            return {};
          }
          
          // Special case for 'O' tetromino, which doesn't rotate
          if (state.tetromino.type === 'O') {
            return {};
          }
          
          // Rotate the tetromino
          const rotatedTetromino = rotateMatrixClockwise(state.tetromino.shape);
          
          // Check if the rotated position is valid
          if (isValidPosition(
            state.position, 
            state.matrix, 
            rotatedTetromino, 
            state.wellWidth, 
            state.wellHeight,
            state.currentLevelData.wellShape
          )) {
            return { 
              tetromino: {
                ...state.tetromino,
                shape: rotatedTetromino
              }
            };
          }
          
          // If the rotation isn't valid, try wall kicks (offset positions)
          // Simple wall kick implementation - try shifting left, right, and up
          const possibleOffsets = [
            { x: -1, y: 0 }, // Try left
            { x: 1, y: 0 },  // Try right
            { x: 0, y: -1 }, // Try up
            { x: -1, y: -1 }, // Try up-left
            { x: 1, y: -1 },  // Try up-right
          ];
          
          for (const offset of possibleOffsets) {
            const offsetPosition = {
              x: state.position.x + offset.x,
              y: state.position.y + offset.y,
            };
            
            if (isValidPosition(
              offsetPosition, 
              state.matrix, 
              rotatedTetromino, 
              state.wellWidth, 
              state.wellHeight,
              state.currentLevelData.wellShape
            )) {
              return { 
                tetromino: {
                  ...state.tetromino,
                  shape: rotatedTetromino
                },
                position: offsetPosition
              };
            }
          }
          
          // If no valid position for rotation, don't rotate
          return {};
        });
      },
      
      rotateCounterClockwise: () => {
        set(state => {
          if (
            state.gameState !== GameState.PLAYING ||
            !state.tetromino
          ) {
            return {};
          }
          
          // Special case for 'O' tetromino, which doesn't rotate
          if (state.tetromino.type === 'O') {
            return {};
          }
          
          // Rotate the tetromino
          const rotatedTetromino = rotateMatrixCounterClockwise(state.tetromino.shape);
          
          // Check if the rotated position is valid
          if (isValidPosition(
            state.position, 
            state.matrix, 
            rotatedTetromino, 
            state.wellWidth, 
            state.wellHeight,
            state.currentLevelData.wellShape
          )) {
            return { 
              tetromino: {
                ...state.tetromino,
                shape: rotatedTetromino
              }
            };
          }
          
          // If the rotation isn't valid, try wall kicks (offset positions)
          // Simple wall kick implementation - try shifting left, right, and up
          const possibleOffsets = [
            { x: -1, y: 0 }, // Try left
            { x: 1, y: 0 },  // Try right
            { x: 0, y: -1 }, // Try up
            { x: -1, y: -1 }, // Try up-left
            { x: 1, y: -1 },  // Try up-right
          ];
          
          for (const offset of possibleOffsets) {
            const offsetPosition = {
              x: state.position.x + offset.x,
              y: state.position.y + offset.y,
            };
            
            if (isValidPosition(
              offsetPosition, 
              state.matrix, 
              rotatedTetromino, 
              state.wellWidth, 
              state.wellHeight,
              state.currentLevelData.wellShape
            )) {
              return { 
                tetromino: {
                  ...state.tetromino,
                  shape: rotatedTetromino
                },
                position: offsetPosition
              };
            }
          }
          
          // If no valid position for rotation, don't rotate
          return {};
        });
      },
      
      hardDrop: () => {
        set(state => {
          if (
            state.gameState !== GameState.PLAYING ||
            !state.tetromino
          ) {
            return {};
          }
          
          // Calculate how far the tetromino can drop
          let dropDistance = 0;
          let newY = state.position.y;
          
          // Keep moving down until collision
          while (isValidPosition(
            { x: state.position.x, y: newY + 1 }, 
            state.matrix, 
            state.tetromino.shape, 
            state.wellWidth, 
            state.wellHeight,
            state.currentLevelData.wellShape
          )) {
            newY++;
            dropDistance++;
          }
          
          // Create the new position
          const newPosition = {
            x: state.position.x,
            y: newY,
          };
          
          // Add points for hard drop (2 points per cell dropped)
          const hardDropPoints = dropDistance * POINTS_HARD_DROP;
          
          // Move to the new position
          get().moveDown(); // This will handle the settlement and next tetromino
          
          return { 
            position: newPosition,
            score: state.score + hardDropPoints
          };
        });
      },
      
      tick: () => {
        set(state => {
          if (state.gameState !== GameState.PLAYING) {
            return {};
          }
          
          // Move the current tetromino down by one row
          get().moveDown();
          
          return {};
        });
      },
      
      restartLevel: () => {
        set(state => {
          const levelData = state.currentLevelData;
          
          // Get a new tetromino
          const newTetromino = state.tetrominoGenerator.getNextTetromino();
          
          // Calculate starting position (center top)
          const startPosition = {
            x: Math.floor((levelData.initialMatrix[0].length - newTetromino.shape[0].length) / 2),
            y: 0,
          };
          
          return {
            gameState: GameState.PLAYING,
            score: 0,
            level: levelData.initialLevel,
            rowsCleared: 0,
            dropTime: INITIAL_DROP_TIME / Math.pow(LEVEL_SPEED_MULTIPLIER, levelData.initialLevel - 1),
            
            matrix: levelData.initialMatrix,
            
            tetromino: newTetromino,
            position: startPosition,
          };
        });
      },
      
      nextLevel: () => {
        set(state => {
          const nextLevelData = getNextLevel(state.currentLevelId);
          
          // Check if this was the last level
          if (!nextLevelData) {
            return { gameState: GameState.GAME_OVER };
          }
          
          // Get a new tetromino
          const newTetromino = state.tetrominoGenerator.getNextTetromino();
          
          // Calculate starting position (center top)
          const startPosition = {
            x: Math.floor((nextLevelData.initialMatrix[0].length - newTetromino.shape[0].length) / 2),
            y: 0,
          };
          
          return {
            gameState: GameState.PLAYING,
            // Keep the existing score
            level: nextLevelData.initialLevel,
            dropTime: INITIAL_DROP_TIME / Math.pow(LEVEL_SPEED_MULTIPLIER, nextLevelData.initialLevel - 1),
            
            currentLevelId: nextLevelData.id,
            currentLevelData: nextLevelData,
            
            matrix: nextLevelData.initialMatrix,
            gridType: nextLevelData.gridType,
            wellWidth: nextLevelData.initialMatrix[0].length,
            wellHeight: nextLevelData.initialMatrix.length,
            
            tetromino: newTetromino,
            position: startPosition,
          };
        });
      },
    };
  })
);

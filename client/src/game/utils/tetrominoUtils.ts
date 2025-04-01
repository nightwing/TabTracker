import { TetrominoPiece } from '../types';

// Define tetromino shapes
const TETROMINOS = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00FFFF'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0000FF'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#FFA500'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#FFFF00'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00FF00'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#FF00FF'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#FF0000'
  }
};

// Define shaped for hexagonal grid
const HEX_TETROMINOS = {
  H1: {
    shape: [
      [1, 1, 1],
      [0, 1, 0]
    ],
    color: '#00FFFF'
  },
  H2: {
    shape: [
      [1, 1],
      [1, 1],
      [1, 0]
    ],
    color: '#0000FF'
  },
  H3: {
    shape: [
      [1, 1, 1],
      [1, 0, 0]
    ],
    color: '#FFA500'
  },
  H4: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#FFFF00'
  },
  H5: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ],
    color: '#00FF00'
  }
};

// Define shapes for triangular grid
const TRI_TETROMINOS = {
  T1: {
    shape: [
      [1, 1],
      [1, 0]
    ],
    color: '#FF00FF'
  },
  T2: {
    shape: [
      [1, 1, 1]
    ],
    color: '#FF0000'
  },
  T3: {
    shape: [
      [1, 0],
      [1, 1]
    ],
    color: '#00FFFF'
  },
  T4: {
    shape: [
      [1, 1],
      [0, 1]
    ],
    color: '#0000FF'
  }
};

// Generate a random tetromino
export function generateRandomPiece(
  gridType: 'normal' | 'hexagonal' | 'triangular' = 'normal'
): TetrominoPiece {
  let tetrominoTypes: { [key: string]: { shape: number[][], color: string } };
  
  // Select appropriate tetromino set based on grid type
  switch (gridType) {
    case 'hexagonal':
      tetrominoTypes = HEX_TETROMINOS;
      break;
    case 'triangular':
      tetrominoTypes = TRI_TETROMINOS;
      break;
    default:
      tetrominoTypes = TETROMINOS;
  }
  
  // Get random tetromino type
  const types = Object.keys(tetrominoTypes);
  const randomType = types[Math.floor(Math.random() * types.length)];
  const tetromino = tetrominoTypes[randomType];
  
  return {
    id: Date.now(), // Unique ID for the piece
    shape: tetromino.shape,
    color: tetromino.color,
    rotation: 0
  };
}

// Rotate a tetromino clockwise
export function rotateTetromino(piece: TetrominoPiece): TetrominoPiece {
  // Clone the piece to avoid modifying the original
  const rotatedPiece = { ...piece };
  
  // Transpose the matrix
  rotatedPiece.shape = rotatedPiece.shape[0].map((_, i) => 
    rotatedPiece.shape.map(row => row[i])
  );
  
  // Reverse each row to get a clockwise rotation
  rotatedPiece.shape = rotatedPiece.shape.map(row => [...row].reverse());
  
  // Update rotation value
  rotatedPiece.rotation = (rotatedPiece.rotation + 90) % 360;
  
  return rotatedPiece;
}

// Get ghost piece position (preview of where piece will land)
export function getGhostPosition(
  grid: any[][],
  piece: TetrominoPiece,
  position: { x: number, y: number },
  checkCollisionFn: (grid: any[][], piece: TetrominoPiece, position: { x: number, y: number }) => boolean
): { x: number, y: number } {
  let ghostPosition = { ...position };
  
  // Move the ghost piece down until it collides
  while (!checkCollisionFn(grid, piece, { ...ghostPosition, y: ghostPosition.y + 1 })) {
    ghostPosition.y += 1;
  }
  
  return ghostPosition;
}

// Get all tetromino shapes for the given grid type
export function getAllTetrominoShapes(gridType: 'normal' | 'hexagonal' | 'triangular'): { [key: string]: { shape: number[][], color: string } } {
  switch (gridType) {
    case 'hexagonal':
      return HEX_TETROMINOS;
    case 'triangular':
      return TRI_TETROMINOS;
    default:
      return TETROMINOS;
  }
}

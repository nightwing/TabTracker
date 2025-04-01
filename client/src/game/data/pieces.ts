import { TetrominoPiece } from '../types';

// Standard Tetromino shapes
export const STANDARD_TETROMINOS: { [key: string]: TetrominoPiece } = {
  I: {
    id: 1,
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00FFFF', // Cyan
    rotation: 0
  },
  J: {
    id: 2,
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0000FF', // Blue
    rotation: 0
  },
  L: {
    id: 3,
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#FFA500', // Orange
    rotation: 0
  },
  O: {
    id: 4,
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#FFFF00', // Yellow
    rotation: 0
  },
  S: {
    id: 5,
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00FF00', // Green
    rotation: 0
  },
  T: {
    id: 6,
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#800080', // Purple
    rotation: 0
  },
  Z: {
    id: 7,
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#FF0000', // Red
    rotation: 0
  }
};

// Hexagonal grid tetrominos
export const HEX_TETROMINOS: { [key: string]: TetrominoPiece } = {
  H1: {
    id: 101,
    shape: [
      [1, 1, 1],
      [0, 1, 0]
    ],
    color: '#00FFFF', // Cyan
    rotation: 0
  },
  H2: {
    id: 102,
    shape: [
      [1, 1],
      [1, 1],
      [1, 0]
    ],
    color: '#0000FF', // Blue
    rotation: 0
  },
  H3: {
    id: 103,
    shape: [
      [1, 1, 1],
      [1, 0, 0]
    ],
    color: '#FFA500', // Orange
    rotation: 0
  },
  H4: {
    id: 104,
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#FFFF00', // Yellow
    rotation: 0
  },
  H5: {
    id: 105,
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ],
    color: '#00FF00', // Green
    rotation: 0
  }
};

// Triangular grid tetrominos
export const TRI_TETROMINOS: { [key: string]: TetrominoPiece } = {
  T1: {
    id: 201,
    shape: [
      [1, 1],
      [1, 0]
    ],
    color: '#800080', // Purple
    rotation: 0
  },
  T2: {
    id: 202,
    shape: [
      [1, 1, 1]
    ],
    color: '#FF0000', // Red
    rotation: 0
  },
  T3: {
    id: 203,
    shape: [
      [1, 0],
      [1, 1]
    ],
    color: '#00FFFF', // Cyan
    rotation: 0
  },
  T4: {
    id: 204,
    shape: [
      [1, 1],
      [0, 1]
    ],
    color: '#0000FF', // Blue
    rotation: 0
  }
};

/**
 * Get tetromino shapes based on grid type
 */
export function getTetrominoesForGridType(gridType: 'normal' | 'hexagonal' | 'triangular'): { [key: string]: TetrominoPiece } {
  switch (gridType) {
    case 'hexagonal':
      return HEX_TETROMINOS;
    case 'triangular':
      return TRI_TETROMINOS;
    case 'normal':
    default:
      return STANDARD_TETROMINOS;
  }
}

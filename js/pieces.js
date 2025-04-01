// Standard Tetromino Pieces (for normal grid)
const STANDARD_TETROMINOS = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00FFFF' // Cyan
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0000FF' // Blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#FF7F00' // Orange
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#FFFF00' // Yellow
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00FF00' // Green
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#800080' // Purple
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#FF0000' // Red
  }
};

// Hexagonal grid tetromino shapes
const HEX_TETROMINOS = {
  HX1: {
    shape: [
      [1, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#FF5733' // Coral
  },
  HX2: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 1, 0]
    ],
    color: '#33FF57' // Lime green
  },
  HX3: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ],
    color: '#5733FF' // Blue-purple
  },
  HX4: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [1, 0, 0]
    ],
    color: '#FFFF33' // Yellow
  },
  HX5: {
    shape: [
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1]
    ],
    color: '#FF33FF' // Pink
  }
};

// Triangular grid tetromino shapes
const TRI_TETROMINOS = {
  TR1: {
    shape: [
      [1, 1, 0],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#FFA07A' // Light salmon
  },
  TR2: {
    shape: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 0, 0]
    ],
    color: '#7FFFD4' // Aquamarine
  },
  TR3: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#9370DB' // Medium purple
  },
  TR4: {
    shape: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 0]
    ],
    color: '#FF6347' // Tomato
  },
  TR5: {
    shape: [
      [1, 1, 1],
      [1, 0, 0],
      [0, 0, 0]
    ],
    color: '#20B2AA' // Light sea green
  }
};

// Generate a random tetromino piece based on the grid type
function generateRandomPiece(gridType = GRID_TYPE.NORMAL) {
  let tetrominos;
  
  // Select the appropriate tetromino set based on grid type
  switch(gridType) {
    case GRID_TYPE.HEXAGONAL:
      tetrominos = HEX_TETROMINOS;
      break;
    case GRID_TYPE.TRIANGULAR:
      tetrominos = TRI_TETROMINOS;
      break;
    default:
      tetrominos = STANDARD_TETROMINOS;
  }
  
  // Get a random piece type
  const pieceTypes = Object.keys(tetrominos);
  const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
  const piece = tetrominos[randomType];
  
  // Create a new piece object with a unique ID
  return {
    id: Math.floor(Math.random() * 10000),
    shape: JSON.parse(JSON.stringify(piece.shape)), // Deep copy the shape
    color: piece.color,
    rotation: 0
  };
}

// Rotate a tetromino piece 90 degrees clockwise
function rotateTetromino(piece) {
  const rotatedPiece = {
    ...piece,
    shape: piece.shape[0].map((_, colIndex) => 
      piece.shape.map(row => row[colIndex]).reverse()
    ),
    rotation: (piece.rotation + 90) % 360
  };
  
  return rotatedPiece;
}

// Get the "ghost" position (preview of where piece will land)
function getGhostPosition(grid, piece, position, checkCollisionFn) {
  let ghostPosition = { ...position };
  
  // Move the ghost piece down until it collides
  while (!checkCollisionFn(grid, piece, { ...ghostPosition, y: ghostPosition.y + 1 })) {
    ghostPosition.y++;
  }
  
  return ghostPosition;
}

// Get all tetromino shapes for a particular grid type
function getAllTetrominoShapes(gridType) {
  switch(gridType) {
    case GRID_TYPE.HEXAGONAL:
      return HEX_TETROMINOS;
    case GRID_TYPE.TRIANGULAR:
      return TRI_TETROMINOS;
    default:
      return STANDARD_TETROMINOS;
  }
}
import { BLOCK_COLORS } from "./constants";

export type Matrix = (0 | 1 | 2 | 8)[][];
export type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

// Define tetromino shapes
// 0 = empty space
// 1 = filled block
// 2 = filled block that came from level data (can't be cleared until unlocked)
// 8 = gem (goal)

export interface Tetromino {
  type: TetrominoType;
  color: string;
  shape: Matrix;
}

// Tetromino shapes as matrices
export const TETROMINOS: Record<TetrominoType, Tetromino> = {
  I: {
    type: "I",
    color: BLOCK_COLORS.I,
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  O: {
    type: "O",
    color: BLOCK_COLORS.O,
    shape: [
      [1, 1],
      [1, 1],
    ],
  },
  T: {
    type: "T",
    color: BLOCK_COLORS.T,
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  S: {
    type: "S",
    color: BLOCK_COLORS.S,
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
  },
  Z: {
    type: "Z",
    color: BLOCK_COLORS.Z,
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  },
  J: {
    type: "J",
    color: BLOCK_COLORS.J,
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  L: {
    type: "L",
    color: BLOCK_COLORS.L,
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
};

// Random tetromino generator with "bag" method to ensure fair distribution
export class TetrominoGenerator {
  private bag: TetrominoType[] = [];

  // Get the next tetromino from the bag
  getNextTetromino(): Tetromino {
    if (this.bag.length === 0) {
      this.refillBag();
    }

    const type = this.bag.pop()!;
    return TETROMINOS[type];
  }

  // Create a new randomized bag with one of each tetromino type
  private refillBag() {
    this.bag = ["I", "O", "T", "S", "Z", "J", "L"];
    
    // Fisher-Yates shuffle algorithm
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }
}

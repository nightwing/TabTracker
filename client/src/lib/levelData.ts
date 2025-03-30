import { GridType } from "./constants";
import { Matrix } from "./tetrominos";

export interface LevelData {
  id: number;
  name: string;
  gridType: GridType;
  initialLevel: number;
  initialMatrix: Matrix;
  goalPosition: [number, number]; // [x, y] position of gem
  wellShape: boolean[][];  // true = accessible space, false = blocked space
}

// Level 1: Square grid with a simple well
const level1: LevelData = {
  id: 1,
  name: "Square Beginnings",
  gridType: GridType.SQUARE,
  initialLevel: 1,
  wellShape: Array(20).fill(Array(10).fill(true)), // 10x20 well, all accessible
  initialMatrix: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0, 2, 0],
    [0, 0, 0, 0, 8, 0, 0, 0, 0, 0], // Gem at the bottom center
  ],
  goalPosition: [4, 19],
};

// Level 2: Square grid with an interesting well shape
const level2: LevelData = {
  id: 2,
  name: "Hourglass",
  gridType: GridType.SQUARE,
  initialLevel: 2,
  wellShape: [
    Array(10).fill(true),
    Array(10).fill(true),
    Array(10).fill(true),
    Array(10).fill(true),
    [...Array(2).fill(false), ...Array(6).fill(true), ...Array(2).fill(false)],
    [...Array(2).fill(false), ...Array(6).fill(true), ...Array(2).fill(false)],
    [...Array(2).fill(false), ...Array(6).fill(true), ...Array(2).fill(false)],
    [...Array(2).fill(false), ...Array(6).fill(true), ...Array(2).fill(false)],
    [...Array(3).fill(false), ...Array(4).fill(true), ...Array(3).fill(false)],
    [...Array(3).fill(false), ...Array(4).fill(true), ...Array(3).fill(false)],
    [...Array(3).fill(false), ...Array(4).fill(true), ...Array(3).fill(false)],
    [...Array(3).fill(false), ...Array(4).fill(true), ...Array(3).fill(false)],
    [...Array(2).fill(false), ...Array(6).fill(true), ...Array(2).fill(false)],
    [...Array(2).fill(false), ...Array(6).fill(true), ...Array(2).fill(false)],
    [...Array(2).fill(false), ...Array(6).fill(true), ...Array(2).fill(false)],
    [...Array(2).fill(false), ...Array(6).fill(true), ...Array(2).fill(false)],
    Array(10).fill(true),
    Array(10).fill(true),
    Array(10).fill(true),
    Array(10).fill(true),
  ],
  initialMatrix: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
    [0, 0, 2, 2, 0, 0, 2, 2, 0, 0],
    [0, 2, 2, 0, 0, 0, 0, 2, 2, 0],
    [2, 2, 0, 0, 0, 0, 0, 0, 2, 2],
    [2, 0, 0, 0, 2, 2, 0, 0, 0, 2],
    [0, 0, 0, 0, 8, 0, 0, 0, 0, 0], // Gem at the bottom middle
  ],
  goalPosition: [4, 19],
};

// Level 3: Hexagonal grid
const level3: LevelData = {
  id: 3,
  name: "Hexagon Haven",
  gridType: GridType.HEXAGONAL,
  initialLevel: 3,
  wellShape: Array(20).fill(Array(7).fill(true)), // 7x20 hexagonal grid
  initialMatrix: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [2, 0, 2, 0, 2, 0, 2],
    [0, 2, 0, 2, 0, 2, 0],
    [2, 0, 2, 0, 2, 0, 2],
    [0, 2, 0, 2, 0, 2, 0],
    [0, 0, 0, 8, 0, 0, 0], // Gem at the bottom
  ],
  goalPosition: [3, 19],
};

// Level 4: Triangular grid
const level4: LevelData = {
  id: 4,
  name: "Triangle Twist",
  gridType: GridType.TRIANGULAR,
  initialLevel: 4,
  wellShape: Array(20).fill(Array(14).fill(true)), // 14x20 triangular grid
  initialMatrix: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
    [0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0], // Gem at the bottom middle
  ],
  goalPosition: [6, 19],
};

// Add all levels in sequence
export const LEVELS: LevelData[] = [level1, level2, level3, level4];

// Get a level by ID
export function getLevelById(id: number): LevelData | undefined {
  return LEVELS.find(level => level.id === id);
}

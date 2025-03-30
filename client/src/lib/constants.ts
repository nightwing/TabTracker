// Game speed settings
export const INITIAL_DROP_TIME = 1000; // ms between drops
export const LEVEL_SPEED_MULTIPLIER = 0.8; // Speed increases by this factor each level

// Grid sizes
export const GRID_SQUARE_SIZE = 1; // Size of a single cell in the square grid
export const GRID_HEX_SIZE = 0.9; // Radius of a hexagon
export const GRID_TRIANGLE_SIZE = 1.2; // Size of a triangular cell

// Well dimensions for square grid
export const SQUARE_WELL_WIDTH = 10;
export const SQUARE_WELL_HEIGHT = 20;

// Well dimensions for hex grid (equivalent area)
export const HEX_WELL_WIDTH = 7; // Fewer cells wide due to staggered layout
export const HEX_WELL_HEIGHT = 20;

// Well dimensions for triangular grid
export const TRIANGLE_WELL_WIDTH = 14; // Need more cells for equivalent area
export const TRIANGLE_WELL_HEIGHT = 20;

// Scoring points
export const POINTS_SINGLE = 100;
export const POINTS_DOUBLE = 300;
export const POINTS_TRIPLE = 600;
export const POINTS_TETRIS = 1200;
export const POINTS_SOFT_DROP = 1;
export const POINTS_HARD_DROP = 2;

// Colors for blocks
export const BLOCK_COLORS = {
  I: "#0DC2FF", // Cyan
  O: "#FFD300", // Yellow
  T: "#BF40BF", // Purple
  S: "#00FF7F", // Green
  Z: "#FF0000", // Red
  J: "#0000FF", // Blue
  L: "#FF8000", // Orange
  GEM: "#FF00FF", // Magenta
  LOCKED: "#888888", // Gray
  EMPTY: "#000000", // Black (invisible)
};

// Game states
export enum GameState {
  MENU = "menu",
  PLAYING = "playing",
  PAUSED = "paused",
  GAME_OVER = "gameOver",
  LEVEL_COMPLETE = "levelComplete",
}

// Grid types
export enum GridType {
  SQUARE = "square",
  HEXAGONAL = "hexagonal",
  TRIANGULAR = "triangular",
}

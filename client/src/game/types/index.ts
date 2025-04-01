export enum ControlKey {
  LEFT = 'left',
  RIGHT = 'right',
  DOWN = 'down',
  ROTATE = 'rotate',
  DROP = 'drop',
  PAUSE = 'pause',
  MUTE = 'mute'
}

export enum CellType {
  EMPTY = 'empty',
  FILLED = 'filled',
  FROZEN = 'frozen',
  POWERUP = 'powerup',
  GEM = 'gem'
}

export enum PowerUpType {
  CLEAR_ROW = 'clearRow',
  CLEAR_COLUMN = 'clearColumn',
  REMOVE_FROZEN = 'removeFrozen',
  SLOW_FALL = 'slowFall',
  BOMB = 'bomb'
}

export enum GridType {
  NORMAL = 'normal',
  HEXAGONAL = 'hexagonal', 
  TRIANGULAR = 'triangular'
}

export type TetrominoPiece = {
  id: number;
  shape: number[][];
  color: string;
  rotation: number;
}

export type GridCell = {
  type: CellType;
  color: string;
  powerUpType?: PowerUpType;
  frozen?: boolean;
}

export type GameLevel = {
  id: number;
  name: string;
  wellShape: number[][];
  initialGrid: GridCell[][];
  gridType: 'normal' | 'hexagonal' | 'triangular';
  gemPosition: { x: number, y: number };
  difficulty: number;
  backgroundColor: string;
  description: string;
}

export type Position = {
  x: number;
  y: number;
}

export type GameState = {
  level: GameLevel;
  grid: GridCell[][];
  currentPiece?: TetrominoPiece;
  nextPiece?: TetrominoPiece;
  piecePosition: Position;
  score: number;
  linesCleared: number;
  gameOver: boolean;
  paused: boolean;
  fallingSpeed: number;
  viewportPosition: number;
}

export type ViewportConfig = {
  width: number;
  height: number;
  position: number;
}

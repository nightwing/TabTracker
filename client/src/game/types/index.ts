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
  GEM = 'gem',
  BOUNCY = 'bouncy',     // Pieces bounce off instead of sticking
  MAGNETIC = 'magnetic', // Attracts pieces towards it
  GRAVITY = 'gravity',   // Reverses gravity in the area
  PORTAL = 'portal',     // Teleports pieces to another location
  SCRAMBLE = 'scramble'  // Scrambles piece rotation when touched
}

export enum PowerUpType {
  CLEAR_ROW = 'clearRow',
  CLEAR_COLUMN = 'clearColumn',
  REMOVE_FROZEN = 'removeFrozen',
  SLOW_FALL = 'slowFall',
  BOMB = 'bomb',
  SHAPE_SHIFT = 'shapeShift',      // Changes current piece to a different shape
  MULTI_CLEAR = 'multiClear',      // Clears multiple random rows
  TIME_FREEZE = 'timeFreeze',      // Freezes time momentarily
  GRAVITY_FLIP = 'gravityFlip',    // Reverses the gravity direction temporarily
  WILD_CARD = 'wildCard',          // Turns into a random power-up when activated
  GEM_FINDER = 'gemFinder',        // Shows direction to the gem
  EXTRA_PIECE = 'extraPiece',      // Gives an extra piece to place anywhere
  GHOST_MODE = 'ghostMode'         // Makes pieces pass through filled cells temporarily
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
  
  // For portal cells
  portalId?: number;
  isExit?: boolean;
  entrancePosition?: Position;
  exitPosition?: Position;
  
  // For gravity cells
  gravityDirection?: 'up' | 'down' | 'left' | 'right';
  
  // For magnetic cells
  magneticStrength?: number; // 1-10 to determine pull strength
  
  // For scramble cells
  scrambleRotations?: number; // Number of rotations to apply
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
  
  // Special states for powerups and special cells
  gravityFlipped: boolean;      // For GRAVITY_FLIP power-up
  gemFinderActive: boolean;     // For GEM_FINDER power-up
  gemFinderDuration: number;    // Duration for GEM_FINDER
  gemPosition?: Position;       // Position of the gem for GEM_FINDER
  ghostModeActive: boolean;     // For GHOST_MODE power-up
  extraPiece?: TetrominoPiece;  // For EXTRA_PIECE power-up
  portalActiveCooldown: number; // Cooldown for using portals
  bouncyCollisionCount: number; // Track bouncy collisions
  
  // Special effects callback
  onSpecialEffectActivate?: (effectType: string, effectData: any) => void;
}

export type ViewportConfig = {
  width: number;
  height: number;
  position: number;
}

// Cell Types
const CELL_TYPE = {
  EMPTY: 'empty',
  FILLED: 'filled',
  FROZEN: 'frozen',
  POWERUP: 'powerup',
  GEM: 'gem',
  BOUNCY: 'bouncy',     // Pieces bounce off instead of sticking
  MAGNETIC: 'magnetic', // Attracts pieces towards it
  GRAVITY: 'gravity',   // Reverses gravity in the area
  PORTAL: 'portal',     // Teleports pieces to another location
  SCRAMBLE: 'scramble'  // Scrambles piece rotation when touched
};

// Power-Up Types
const POWERUP_TYPE = {
  CLEAR_ROW: 'clearRow',
  CLEAR_COLUMN: 'clearColumn',
  REMOVE_FROZEN: 'removeFrozen',
  SLOW_FALL: 'slowFall',
  BOMB: 'bomb',
  SHAPE_SHIFT: 'shapeShift',      // Changes current piece to a different shape
  MULTI_CLEAR: 'multiClear',      // Clears multiple random rows
  TIME_FREEZE: 'timeFreeze',      // Freezes time momentarily
  GRAVITY_FLIP: 'gravityFlip',    // Reverses the gravity direction temporarily
  WILD_CARD: 'wildCard',          // Turns into a random power-up when activated
  GEM_FINDER: 'gemFinder',        // Shows direction to the gem
  EXTRA_PIECE: 'extraPiece',      // Gives an extra piece to place anywhere
  GHOST_MODE: 'ghostMode'         // Makes pieces pass through filled cells temporarily
};

// Grid Types
const GRID_TYPE = {
  NORMAL: 'normal',
  HEXAGONAL: 'hexagonal',
  TRIANGULAR: 'triangular'
};

// Control keys
const CONTROL_KEYS = {
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  DOWN: ['ArrowDown', 's', 'S'],
  ROTATE: ['ArrowUp', 'w', 'W'],
  DROP: [' '], // Space
  PAUSE: ['p', 'P'],
  MUTE: ['m', 'M']
};

// Power-ups data
const POWERUPS = {
  [POWERUP_TYPE.CLEAR_ROW]: {
    type: POWERUP_TYPE.CLEAR_ROW,
    name: 'Line Clear',
    color: '#FF5733',
    description: 'Clears an entire row',
    icon: '⚡'
  },
  [POWERUP_TYPE.CLEAR_COLUMN]: {
    type: POWERUP_TYPE.CLEAR_COLUMN,
    name: 'Column Clear',
    color: '#33FF57',
    description: 'Clears an entire column',
    icon: '↕'
  },
  [POWERUP_TYPE.REMOVE_FROZEN]: {
    type: POWERUP_TYPE.REMOVE_FROZEN,
    name: 'Defrost',
    color: '#5733FF',
    description: 'Removes frozen cells in a 3x3 area',
    radius: 1,
    icon: '❄'
  },
  [POWERUP_TYPE.SLOW_FALL]: {
    type: POWERUP_TYPE.SLOW_FALL,
    name: 'Slow Fall',
    color: '#FFFF33',
    description: 'Slows down falling speed temporarily',
    duration: 10000,
    icon: '⏱'
  },
  [POWERUP_TYPE.BOMB]: {
    type: POWERUP_TYPE.BOMB,
    name: 'Bomb',
    color: '#FF3333',
    description: 'Clears cells in a 5x5 area',
    radius: 2,
    icon: '💣'
  },
  [POWERUP_TYPE.SHAPE_SHIFT]: {
    type: POWERUP_TYPE.SHAPE_SHIFT,
    name: 'Shape Shift',
    color: '#9C27B0',
    description: 'Changes current piece to a different shape',
    icon: '🔄'
  },
  [POWERUP_TYPE.MULTI_CLEAR]: {
    type: POWERUP_TYPE.MULTI_CLEAR,
    name: 'Multi Clear',
    color: '#E91E63',
    description: 'Clears multiple random rows',
    count: 3, // Number of rows to clear
    icon: '🧹'
  },
  [POWERUP_TYPE.TIME_FREEZE]: {
    type: POWERUP_TYPE.TIME_FREEZE,
    name: 'Time Freeze',
    color: '#00BCD4',
    description: 'Freezes time momentarily',
    duration: 5000, // 5 seconds
    icon: '❄️'
  },
  [POWERUP_TYPE.GRAVITY_FLIP]: {
    type: POWERUP_TYPE.GRAVITY_FLIP,
    name: 'Gravity Flip',
    color: '#607D8B',
    description: 'Reverses the gravity direction temporarily',
    duration: 15000, // 15 seconds
    icon: '🔃'
  },
  [POWERUP_TYPE.WILD_CARD]: {
    type: POWERUP_TYPE.WILD_CARD,
    name: 'Wild Card',
    color: '#8BC34A',
    description: 'Turns into a random power-up when activated',
    icon: '🃏'
  },
  [POWERUP_TYPE.GEM_FINDER]: {
    type: POWERUP_TYPE.GEM_FINDER,
    name: 'Gem Finder',
    color: '#FFC107',
    description: 'Shows direction to the gem',
    duration: 30000, // 30 seconds
    icon: '🧭'
  },
  [POWERUP_TYPE.EXTRA_PIECE]: {
    type: POWERUP_TYPE.EXTRA_PIECE,
    name: 'Extra Piece',
    color: '#4CAF50',
    description: 'Gives an extra piece to place anywhere',
    icon: '➕'
  },
  [POWERUP_TYPE.GHOST_MODE]: {
    type: POWERUP_TYPE.GHOST_MODE,
    name: 'Ghost Mode',
    color: '#9E9E9E',
    description: 'Makes pieces pass through filled cells temporarily',
    duration: 10000, // 10 seconds
    icon: '👻'
  }
};

// Get random power-up type
function getRandomPowerUp() {
  const powerUpTypes = Object.values(POWERUP_TYPE);
  const randomIndex = Math.floor(Math.random() * powerUpTypes.length);
  return powerUpTypes[randomIndex];
}

// Get power-up details by type
function getPowerUpDetails(type) {
  return POWERUPS[type];
}
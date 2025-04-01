import { PowerUpType } from '../types';

// Define power-up types and their effects
export interface PowerUp {
  type: PowerUpType;
  name: string;
  color: string;
  description: string;
  duration?: number;  // Duration in milliseconds (if applicable)
  radius?: number;    // Effect radius (if applicable)
  count?: number;     // Count for effects that have multiple instances (e.g., rows)
  icon: string;       // Unicode or icon reference
}

export const POWERUPS: Record<PowerUpType, PowerUp> = {
  [PowerUpType.CLEAR_ROW]: {
    type: PowerUpType.CLEAR_ROW,
    name: "Row Clearer",
    color: "#FF9900",
    description: "Clears the entire row where it's activated",
    icon: "↔️"
  },
  
  [PowerUpType.CLEAR_COLUMN]: {
    type: PowerUpType.CLEAR_COLUMN,
    name: "Column Clearer",
    color: "#9900FF",
    description: "Clears the entire column where it's activated",
    icon: "↕️"
  },
  
  [PowerUpType.REMOVE_FROZEN]: {
    type: PowerUpType.REMOVE_FROZEN,
    name: "De-Freeze",
    color: "#00CCFF",
    description: "Melts frozen blocks in a 3x3 area",
    radius: 1, // 1 block radius (3x3 area)
    icon: "❄️"
  },
  
  [PowerUpType.SLOW_FALL]: {
    type: PowerUpType.SLOW_FALL,
    name: "Time Warp",
    color: "#FFCC00",
    description: "Slows down the falling speed for 10 seconds",
    duration: 10000, // 10 seconds
    icon: "⏱️"
  },
  
  [PowerUpType.BOMB]: {
    type: PowerUpType.BOMB,
    name: "Bomb",
    color: "#FF0000",
    description: "Clears blocks in a 5x5 area",
    radius: 2, // 2 block radius (5x5 area)
    icon: "💣"
  },
  
  [PowerUpType.SHAPE_SHIFT]: {
    type: PowerUpType.SHAPE_SHIFT,
    name: "Shape Shifter",
    color: "#9C27B0",
    description: "Transforms current piece into a different shape",
    icon: "🔄"
  },
  
  [PowerUpType.MULTI_CLEAR]: {
    type: PowerUpType.MULTI_CLEAR,
    name: "Multi Clear",
    color: "#E91E63",
    description: "Clears multiple random rows at once",
    count: 3, // Number of rows to clear
    icon: "🧹"
  },
  
  [PowerUpType.TIME_FREEZE]: {
    type: PowerUpType.TIME_FREEZE,
    name: "Time Freeze",
    color: "#00BCD4",
    description: "Temporarily pauses the game for 5 seconds",
    duration: 5000, // 5 seconds
    icon: "❄️"
  },
  
  [PowerUpType.GRAVITY_FLIP]: {
    type: PowerUpType.GRAVITY_FLIP,
    name: "Gravity Flip",
    color: "#607D8B",
    description: "Reverses gravity direction for 15 seconds",
    duration: 15000, // 15 seconds
    icon: "🔃"
  },
  
  [PowerUpType.WILD_CARD]: {
    type: PowerUpType.WILD_CARD,
    name: "Wild Card",
    color: "#8BC34A",
    description: "Transforms into a random power-up",
    icon: "🃏"
  },
  
  [PowerUpType.GEM_FINDER]: {
    type: PowerUpType.GEM_FINDER,
    name: "Gem Finder",
    color: "#FFC107",
    description: "Shows the direction to the gem for 30 seconds",
    duration: 30000, // 30 seconds
    icon: "🧭"
  },
  
  [PowerUpType.EXTRA_PIECE]: {
    type: PowerUpType.EXTRA_PIECE,
    name: "Extra Piece",
    color: "#4CAF50",
    description: "Gives an extra piece to place anywhere",
    icon: "➕"
  },
  
  [PowerUpType.GHOST_MODE]: {
    type: PowerUpType.GHOST_MODE,
    name: "Ghost Mode",
    color: "#9E9E9E",
    description: "Pass through filled blocks for 10 seconds",
    duration: 10000, // 10 seconds
    icon: "👻"
  }
};

/**
 * Get a random power-up type
 */
export function getRandomPowerUp(): PowerUpType {
  const powerUpTypes = Object.values(PowerUpType);
  return powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
}

/**
 * Get details of a power-up by type
 */
export function getPowerUpDetails(type: PowerUpType): PowerUp {
  return POWERUPS[type];
}

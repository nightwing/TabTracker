import { PowerUpType } from '../types';

// Define power-up types and their effects
export interface PowerUp {
  type: PowerUpType;
  name: string;
  color: string;
  description: string;
  duration?: number;  // Duration in milliseconds (if applicable)
  radius?: number;    // Effect radius (if applicable)
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

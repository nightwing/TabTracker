// Create a level with given parameters
function createLevel(id, name, gridType, difficulty, backgroundColor, description) {
  // Generate dimensions based on grid type
  let width, height;
  switch(gridType) {
    case GRID_TYPE.HEXAGONAL:
      width = 8;
      height = 500; // Very deep grid
      break;
    case GRID_TYPE.TRIANGULAR:
      width = 10;
      height = 500;
      break;
    default:
      width = 10;
      height = 500;
  }
  
  // Generate a random position for the gem
  const gemPosition = {
    x: Math.floor(width / 2),
    y: Math.floor(height * 0.9) // Place it near the bottom
  };
  
  // Create a well shape (defines playable area)
  const wellShape = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // For more interesting levels, generate different well shapes
      if (id === 2) {
        // Level 2: Has a zigzag pattern
        row.push((x > 0 && x < width - 1 && y % 20 < 10) ? 1 : 1);
      } else if (id === 3) {
        // Level 3: Has a narrowing tunnel
        const narrowing = Math.floor(y / 50);
        row.push((x >= narrowing && x < width - narrowing) ? 1 : 0);
      } else {
        // Default rectangular well
        row.push(1);
      }
    }
    wellShape.push(row);
  }
  
  // Create the initial grid with some filled and frozen cells
  const initialGrid = generateInitialGrid(width, height, difficulty, gridType);
  
  // Place the gem
  if (initialGrid[gemPosition.y] && initialGrid[gemPosition.y][gemPosition.x]) {
    initialGrid[gemPosition.y][gemPosition.x] = {
      type: CELL_TYPE.GEM,
      color: '#FFD700' // Gold color for the gem
    };
  }
  
  return {
    id,
    name,
    wellShape,
    initialGrid,
    gridType,
    gemPosition,
    difficulty,
    backgroundColor,
    description
  };
}

// Generate a random initial grid with various cell types
function generateInitialGrid(width, height, difficulty, gridType) {
  const grid = [];
  
  // Probability factors for different cell types based on difficulty
  const filledProb = 0.01 * difficulty;
  const frozenProb = 0.005 * difficulty;
  const powerupProb = 0.002 * difficulty;
  const specialCellProb = 0.001 * difficulty; // Probability for special cells
  
  // Create an array of possible special cell types (excluding empty, filled, frozen, powerup, gem)
  const specialCellTypes = [
    CELL_TYPE.BOUNCY,
    CELL_TYPE.MAGNETIC,
    CELL_TYPE.GRAVITY,
    CELL_TYPE.PORTAL,
    CELL_TYPE.SCRAMBLE
  ];
  
  // Portal pairs tracking
  const portals = [];
  let portalPairId = 0;
  
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Leave the top area empty for new pieces to spawn
      if (y < 5) {
        row.push({
          type: CELL_TYPE.EMPTY,
          color: 'transparent'
        });
        continue;
      }
      
      // Random value to determine cell type
      const rand = Math.random();
      
      if (rand < powerupProb) {
        // Create a power-up cell
        const powerUpType = getRandomPowerUp();
        const powerUpDetails = getPowerUpDetails(powerUpType);
        row.push({
          type: CELL_TYPE.POWERUP,
          color: powerUpDetails.color,
          powerUpType
        });
      } else if (rand < frozenProb + powerupProb) {
        // Create a frozen cell
        row.push({
          type: CELL_TYPE.FROZEN,
          color: '#AADDFF',
          frozen: true
        });
      } else if (rand < filledProb + frozenProb + powerupProb) {
        // Create a filled cell
        row.push({
          type: CELL_TYPE.FILLED,
          color: '#888888'
        });
      } else if (rand < filledProb + frozenProb + powerupProb + specialCellProb) {
        // Create a special cell
        const specialTypeIndex = Math.floor(Math.random() * specialCellTypes.length);
        const specialType = specialCellTypes[specialTypeIndex];
        
        // Configure the special cell based on its type
        let specialCell = {
          type: specialType,
          color: getSpecialCellColor(specialType)
        };
        
        // Special handling for portal cells (need to come in pairs)
        if (specialType === CELL_TYPE.PORTAL) {
          // Add to portal pairs list to create the corresponding exit portal later
          const portalColor = getPortalColor(portalPairId);
          specialCell.color = portalColor;
          specialCell.portalId = portalPairId;
          
          // Add portal to pair list so we can create an exit later
          portals.push({
            id: portalPairId,
            color: portalColor,
            entrance: { x, y }
          });
          
          portalPairId++;
        }
        
        row.push(specialCell);
      } else {
        // Create an empty cell
        row.push({
          type: CELL_TYPE.EMPTY,
          color: 'transparent'
        });
      }
    }
    grid.push(row);
  }
  
  // Create exit portals for each entrance portal
  portals.forEach(portal => {
    // Find a random empty cell position for the exit portal
    let exitPlaced = false;
    let attempts = 0;
    const maxAttempts = 50;
    
    while (!exitPlaced && attempts < maxAttempts) {
      // Choose a random position that's not too close to the entrance
      const randomY = Math.floor(Math.random() * (height - 10)) + 10;
      const randomX = Math.floor(Math.random() * width);
      
      // Check if the position is empty
      if (grid[randomY] && grid[randomY][randomX] && 
          grid[randomY][randomX].type === CELL_TYPE.EMPTY) {
        
        // Set this cell as an exit portal
        grid[randomY][randomX] = {
          type: CELL_TYPE.PORTAL,
          color: portal.color,
          portalId: portal.id,
          isExit: true,
          entrancePosition: portal.entrance
        };
        
        // Update the entrance portal with exit location
        if (grid[portal.entrance.y] && grid[portal.entrance.x]) {
          grid[portal.entrance.y][portal.entrance.x].exitPosition = { x: randomX, y: randomY };
        }
        
        exitPlaced = true;
      }
      
      attempts++;
    }
  });
  
  return grid;
}

// Create an array of predefined levels
function createLevels() {
  return [
    createLevel(
      1,
      'Beginners Valley',
      GRID_TYPE.NORMAL,
      1,
      '#4A6572',
      'A simple starting level with a normal grid.'
    ),
    createLevel(
      2,
      'Hexagonal Heights',
      GRID_TYPE.HEXAGONAL,
      2,
      '#6B5B95',
      'Navigate through a hexagonal grid with more obstacles.'
    ),
    createLevel(
      3,
      'Triangle Trench',
      GRID_TYPE.TRIANGULAR,
      3,
      '#878f99',
      'The most challenging level with a triangular grid.'
    ),
    createLevel(
      4,
      'Frozen Cavern',
      GRID_TYPE.NORMAL,
      4,
      '#77A1D3',
      'A deep well with many frozen blocks to navigate.'
    ),
    createLevel(
      5,
      'Power-Up Paradise',
      GRID_TYPE.NORMAL,
      2,
      '#3C9D9B',
      'Lots of power-ups to help you reach the gem.'
    ),
  ];
}

// Get a level by its ID
function getLevelById(id) {
  return LEVELS.find(level => level.id === id) || LEVELS[0];
}

// The array of all available levels
// Get a color for special cell types
function getSpecialCellColor(cellType) {
  switch (cellType) {
    case CELL_TYPE.BOUNCY:
      return '#2196F3'; // Blue
    case CELL_TYPE.MAGNETIC:
      return '#673AB7'; // Deep Purple
    case CELL_TYPE.GRAVITY:
      return '#FF9800'; // Orange
    case CELL_TYPE.PORTAL:
      return '#03A9F4'; // Light Blue (default, will be overridden)
    case CELL_TYPE.SCRAMBLE:
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Grey fallback
  }
}

// Get a unique color for portal pairs
function getPortalColor(portalId) {
  // Array of distinct colors for portals
  const portalColors = [
    '#9C27B0', // Purple
    '#E91E63', // Pink
    '#00BCD4', // Cyan
    '#8BC34A', // Light Green
    '#FFEB3B', // Yellow
    '#FF5722', // Deep Orange
    '#607D8B', // Blue Grey
    '#795548', // Brown
    '#009688', // Teal
    '#3F51B5'  // Indigo
  ];
  
  // Get a color based on the portal ID
  return portalColors[portalId % portalColors.length];
}

// Create an array of all available levels
const LEVELS = [
  ...createLevels(),
  // Add a new level with more special cells and power-ups
  createLevel(
    6,
    'Special Cell Madness',
    GRID_TYPE.NORMAL,
    3,
    '#9C27B0',
    'Navigate through portals, bouncy walls and gravity flips to reach the gem.'
  )
];
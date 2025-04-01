// Game Logic Class
class GameLogic {
  constructor() {
    // Game state
    this.level = null;
    this.grid = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.piecePosition = { x: 0, y: 0 };
    this.score = 0;
    this.linesCleared = 0;
    this.gameOver = false;
    this.paused = false;
    this.fallingSpeed = 1;
    this.viewportPosition = 0;
    
    // Special state for power-ups and special cells
    this.gravityFlipped = false;    // For GRAVITY_FLIP power-up
    this.gemFinderActive = false;   // For GEM_FINDER power-up
    this.gemFinderDuration = 0;     // Duration for GEM_FINDER
    this.gemPosition = null;        // Position of the gem for GEM_FINDER
    this.ghostModeActive = false;   // For GHOST_MODE power-up
    this.extraPiece = null;         // For EXTRA_PIECE power-up
    this.portalActiveCooldown = 0;  // Cooldown for using portals
    this.bouncyCollisionCount = 0;  // Track bouncy collisions
    
    // Time tracking
    this.lastTick = 0;
    this.lastMoveTime = 0;
    
    // Event callbacks
    this.onScoreChange = null;
    this.onLinesChange = null;
    this.onGameOver = null;
    this.onViewportChange = null;
    this.onPieceChange = null;
    this.onPause = null;
    this.onSpecialEffectActivate = null; // Callback for special effects
  }
  
  // Initialize the game with selected level
  initializeGame(levelId) {
    // Get the level data
    this.level = getLevelById(levelId);
    if (!this.level) return;
    
    // Deep clone the initial grid to avoid reference issues
    this.grid = JSON.parse(JSON.stringify(this.level.initialGrid));
    
    // Generate the first pieces
    this.currentPiece = generateRandomPiece(this.level.gridType);
    this.nextPiece = generateRandomPiece(this.level.gridType);
    
    // Calculate initial piece position at the top center of the grid
    const startX = Math.floor((this.grid[0].length - this.currentPiece.shape[0].length) / 2);
    
    // Set initial state
    this.piecePosition = { x: startX, y: 0 };
    this.score = 0;
    this.linesCleared = 0;
    this.gameOver = false;
    this.paused = false;
    this.fallingSpeed = 1 + (this.level.difficulty * 0.2);
    this.viewportPosition = 0;
    this.lastTick = performance.now();
    
    // Reset special states
    this.gravityFlipped = false;
    this.gemFinderActive = false;
    this.gemFinderDuration = 0;
    this.gemPosition = null;
    this.ghostModeActive = false;
    this.extraPiece = null;
    this.portalActiveCooldown = 0;
    this.bouncyCollisionCount = 0;
    
    // Trigger callbacks
    if (this.onScoreChange) this.onScoreChange(this.score);
    if (this.onLinesChange) this.onLinesChange(this.linesCleared);
    if (this.onViewportChange) this.onViewportChange(this.viewportPosition);
    if (this.onPieceChange) this.onPieceChange(this.currentPiece, this.nextPiece);
  }
  
  // Move the current piece left
  moveLeft() {
    if (!this.currentPiece || this.paused || this.gameOver) return;
    
    const newPosition = { ...this.piecePosition, x: this.piecePosition.x - 1 };
    if (!checkCollision(this.grid, this.currentPiece, newPosition)) {
      this.piecePosition = newPosition;
      if (this.onPieceChange) this.onPieceChange(this.currentPiece, this.nextPiece);
      return true;
    }
    return false;
  }
  
  // Move the current piece right
  moveRight() {
    if (!this.currentPiece || this.paused || this.gameOver) return;
    
    const newPosition = { ...this.piecePosition, x: this.piecePosition.x + 1 };
    if (!checkCollision(this.grid, this.currentPiece, newPosition)) {
      this.piecePosition = newPosition;
      if (this.onPieceChange) this.onPieceChange(this.currentPiece, this.nextPiece);
      return true;
    }
    return false;
  }
  
  // Move the current piece down (or up if gravity is flipped)
  moveDown() {
    if (!this.currentPiece || this.paused || this.gameOver) return;
    
    // Check if gravity is flipped (move up instead of down)
    const direction = this.gravityFlipped ? -1 : 1;
    const newPosition = { 
      ...this.piecePosition, 
      y: this.piecePosition.y + direction 
    };
    
    // Check for collisions with the grid
    if (!checkCollision(this.grid, this.currentPiece, newPosition, this)) {
      this.piecePosition = newPosition;
      
      // Handle magnetic cells - pull the piece toward them
      if (this.handleMagneticAttraction()) {
        // If we moved the piece due to magnetic attraction,
        // we've already triggered the pieceChange event
        return true;
      }
      
      if (this.onPieceChange) this.onPieceChange(this.currentPiece, this.nextPiece);
      return true;
    } else {
      // If we can't move, check for bouncy cells
      if (this.bouncyCollisionCount > 0) {
        // Bounce in the opposite direction
        this.bouncyCollisionCount = 0;
        
        // Try moving in the opposite direction
        const bouncePosition = { 
          ...this.piecePosition, 
          y: this.piecePosition.y - direction
        };
        
        if (!checkCollision(this.grid, this.currentPiece, bouncePosition, this)) {
          this.piecePosition = bouncePosition;
          if (this.onPieceChange) this.onPieceChange(this.currentPiece, this.nextPiece);
          return true;
        }
      }
      
      // If we can't move down (or up), the piece is set in place
      this.lockPiece();
      return false;
    }
  }
  
  // Handle magnetic attraction to magnetic cells
  handleMagneticAttraction() {
    let moved = false;
    let closestMagneticCell = null;
    let closestDistance = Infinity;
    
    // Find closest magnetic cell
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        const cell = this.grid[y][x];
        if (cell && cell.type === CELL_TYPE.MAGNETIC) {
          // Calculate distance to piece center
          const pieceCenter = {
            x: this.piecePosition.x + Math.floor(this.currentPiece.shape[0].length / 2),
            y: this.piecePosition.y + Math.floor(this.currentPiece.shape.length / 2)
          };
          
          const distance = Math.sqrt(
            Math.pow(pieceCenter.x - x, 2) + 
            Math.pow(pieceCenter.y - y, 2)
          );
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMagneticCell = { x, y };
          }
        }
      }
    }
    
    // If there's a nearby magnetic cell, move toward it
    if (closestMagneticCell && closestDistance < 5) {
      const pieceCenter = {
        x: this.piecePosition.x + Math.floor(this.currentPiece.shape[0].length / 2),
        y: this.piecePosition.y + Math.floor(this.currentPiece.shape.length / 2)
      };
      
      // Determine direction to move (horizontal)
      if (pieceCenter.x < closestMagneticCell.x) {
        // Move right
        const rightPosition = { ...this.piecePosition, x: this.piecePosition.x + 1 };
        if (!checkCollision(this.grid, this.currentPiece, rightPosition, this)) {
          this.piecePosition = rightPosition;
          moved = true;
        }
      } else if (pieceCenter.x > closestMagneticCell.x) {
        // Move left
        const leftPosition = { ...this.piecePosition, x: this.piecePosition.x - 1 };
        if (!checkCollision(this.grid, this.currentPiece, leftPosition, this)) {
          this.piecePosition = leftPosition;
          moved = true;
        }
      }
      
      if (moved && this.onPieceChange) {
        this.onPieceChange(this.currentPiece, this.nextPiece);
      }
    }
    
    return moved;
  }
  
  // Rotate the current piece
  rotatePiece() {
    if (!this.currentPiece || this.paused || this.gameOver) return;
    
    // Create a rotated version of the piece
    const rotated = rotateTetromino(this.currentPiece);
    
    // Check if the rotation is valid
    if (!checkCollision(this.grid, rotated, this.piecePosition)) {
      this.currentPiece = rotated;
      if (this.onPieceChange) this.onPieceChange(this.currentPiece, this.nextPiece);
      return true;
    }
    return false;
  }
  
  // Drop the piece to the bottom (or top if gravity is flipped) instantly
  dropPiece() {
    if (!this.currentPiece || this.paused || this.gameOver) return;
    
    // Determine direction based on gravity
    const direction = this.gravityFlipped ? -1 : 1;
    
    // Find how far we can drop in the gravity direction
    let dropDistance = 0;
    let newPosition = { ...this.piecePosition };
    
    while (!checkCollision(this.grid, this.currentPiece, { 
      ...newPosition, 
      y: newPosition.y + direction 
    }, this)) {
      newPosition.y += direction;
      dropDistance += 1;
      
      // Check for portal cells that might teleport the piece
      let shouldBreak = false;
      for (let y = 0; y < this.currentPiece.shape.length; y++) {
        for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
          if (this.currentPiece.shape[y][x] !== 0) {
            const gridY = newPosition.y + y;
            const gridX = newPosition.x + x;
            
            // Check if within grid bounds
            if (gridY >= 0 && gridY < this.grid.length && 
                gridX >= 0 && gridX < this.grid[0].length) {
              
              const cell = this.grid[gridY][gridX];
              if (cell && cell.type === CELL_TYPE.PORTAL) {
                // Stop drop on portal
                shouldBreak = true;
                break;
              }
            }
          }
        }
        if (shouldBreak) break;
      }
      
      if (shouldBreak) break;
    }
    
    if (dropDistance > 0) {
      // Update position and score
      this.piecePosition = newPosition;
      this.score += (dropDistance * 2); // Bonus for hard drop
      
      // Lock the piece and check for completed lines
      this.lockPiece();
      
      // Update score display
      if (this.onScoreChange) this.onScoreChange(this.score);
      
      return true;
    }
    return false;
  }
  
  // Game tick (called each frame)
  tick(timestamp) {
    if (this.paused || this.gameOver) return;
    
    // Calculate time since last tick
    const delta = timestamp - this.lastTick;
    
    // Calculate tick interval based on falling speed
    const tickInterval = 1000 / this.fallingSpeed;
    
    // If enough time has passed, update the game
    if (delta >= tickInterval) {
      // Move the current piece down
      this.moveDown();
      
      // Reset the timer
      this.lastTick = timestamp;
    }
  }
  
  // Lock the current piece in place and spawn a new one
  lockPiece() {
    // Check if we reached the gem
    const gemCollected = checkGemCollected(
      this.grid, 
      this.currentPiece, 
      this.piecePosition, 
      this.level.gemPosition
    );
    
    if (gemCollected) {
      // Win condition!
      this.score += 10000; // Big bonus for collecting the gem
      if (this.onScoreChange) this.onScoreChange(this.score);
      this.setGameOver();
      return;
    }
    
    // Merge the current piece with the grid, and check for special effects
    const mergeResult = mergeTetrominoWithGrid(
      this.grid, 
      this.currentPiece, 
      this.piecePosition, 
      this
    );
    
    // Update the grid with the merged result
    if (mergeResult.grid) {
      this.grid = mergeResult.grid;
      
      // Handle special effects
      if (mergeResult.specialEffects && mergeResult.specialEffects.length > 0) {
        this.handleSpecialEffects(mergeResult.specialEffects);
      }
    } else {
      // Backward compatibility for older code that might call with just grid
      this.grid = mergeResult;
    }
    
    // Check for and clear completed lines
    const completedLines = this.handleCompletedLines();
    
    // Update score based on completed lines
    if (completedLines.length > 0) {
      const addedScore = completedLines.length * 100 * (completedLines.length); // Bonus for multiple lines
      this.score += addedScore;
      this.linesCleared += completedLines.length;
      
      // Update displays
      if (this.onScoreChange) this.onScoreChange(this.score);
      if (this.onLinesChange) this.onLinesChange(this.linesCleared);
      
      // Update viewport position
      this.updateViewportPosition();
    }
    
    // Set the next piece as the current piece
    this.setNextPiece();
  }
  
  // Handle special effects from cell interactions
  handleSpecialEffects(effects) {
    for (const effect of effects) {
      switch (effect.type) {
        case 'portal':
          if (effect.exitPosition) {
            // Teleport the piece to the exit portal location
            this.piecePosition = { ...effect.exitPosition };
            audioManager.playSound('teleport'); // If you have a teleport sound
          }
          break;
          
        case 'scramble':
          // Randomly rotate the piece 1-3 times
          const rotations = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < rotations; i++) {
            this.currentPiece = rotateTetromino(this.currentPiece);
          }
          break;
          
        case 'magnetic': 
          // Magnetic effects will be handled in the movement logic
          // by adjusting the piece's movement toward the magnetic cell
          break;
          
        case 'gravity':
          // Gravity flipping will be handled in the tick/movement logic
          // The effect has already updated this.gravityFlipped
          break;
          
        case 'powerup':
          // Power-ups are handled by the usePowerUp method
          // which is called directly during the collision
          break;
      }
      
      // Notify listeners about the special effect
      if (this.onSpecialEffectActivate) {
        this.onSpecialEffectActivate(effect.type, effect);
      }
    }
  }
  
  // Set game over state
  setGameOver() {
    this.gameOver = true;
    if (this.onGameOver) this.onGameOver(this.score);
  }
  
  // Set paused state
  setPaused(paused) {
    this.paused = paused;
    if (this.onPause) this.onPause(paused);
  }
  
  // Handle completed lines
  handleCompletedLines() {
    const { clearedRows, newGrid } = clearLines(this.grid);
    
    if (clearedRows.length > 0) {
      this.grid = newGrid;
      audioManager.playSuccess();
    }
    
    return clearedRows;
  }
  
  // Update viewport position based on lines cleared
  updateViewportPosition() {
    // Move viewport down every 10 lines cleared
    const newPosition = Math.floor(this.linesCleared / 10) * 10;
    if (newPosition > this.viewportPosition) {
      this.viewportPosition = newPosition;
      if (this.onViewportChange) this.onViewportChange(this.viewportPosition);
    }
  }
  
  // Use a power-up at the specified position
  usePowerUp(position) {
    const cell = this.grid[position.y][position.x];
    
    if (cell.type !== CELL_TYPE.POWERUP || !cell.powerUpType) return;
    
    // Apply power-up effect based on type
    let newGrid = JSON.parse(JSON.stringify(this.grid)); // Deep copy
    
    switch (cell.powerUpType) {
      case POWERUP_TYPE.CLEAR_ROW:
        // Clear the entire row
        newGrid = newGrid.map((row, y) => 
          y === position.y ? row.map(() => ({ type: CELL_TYPE.EMPTY, color: 'transparent' })) : row
        );
        break;
        
      case POWERUP_TYPE.CLEAR_COLUMN:
        // Clear the entire column
        newGrid = newGrid.map(row => 
          row.map((cell, x) => x === position.x ? { type: CELL_TYPE.EMPTY, color: 'transparent' } : cell)
        );
        break;
        
      case POWERUP_TYPE.REMOVE_FROZEN:
        // Remove all frozen cells in a 3x3 area
        for (let y = Math.max(0, position.y - 1); y <= Math.min(newGrid.length - 1, position.y + 1); y++) {
          for (let x = Math.max(0, position.x - 1); x <= Math.min(newGrid[0].length - 1, position.x + 1); x++) {
            if (newGrid[y][x].type === CELL_TYPE.FROZEN) {
              newGrid[y][x] = { type: CELL_TYPE.EMPTY, color: 'transparent' };
            }
          }
        }
        break;
        
      case POWERUP_TYPE.SLOW_FALL:
        // Temporarily slow down the falling speed
        this.fallingSpeed *= 0.5;
        setTimeout(() => {
          this.fallingSpeed *= 2;
        }, 10000); // Effect lasts for 10 seconds
        break;
        
      case POWERUP_TYPE.BOMB:
        // Clear cells in a 5x5 area
        for (let y = Math.max(0, position.y - 2); y <= Math.min(newGrid.length - 1, position.y + 2); y++) {
          for (let x = Math.max(0, position.x - 2); x <= Math.min(newGrid[0].length - 1, position.x + 2); x++) {
            newGrid[y][x] = { type: CELL_TYPE.EMPTY, color: 'transparent' };
          }
        }
        break;
        
      case POWERUP_TYPE.SHAPE_SHIFT:
        // Change current piece to a different shape
        if (this.currentPiece) {
          // Get all possible tetromino shapes for the current grid type
          const allPieces = getAllTetrominoShapes(this.level.gridType);
          const pieceKeys = Object.keys(allPieces);
          
          // Get a different piece type
          let newPieceKey;
          do {
            const randomIndex = Math.floor(Math.random() * pieceKeys.length);
            newPieceKey = pieceKeys[randomIndex];
          } while (newPieceKey === this.currentPiece.type);
          
          // Create a new piece with the same position and rotation
          this.currentPiece = {
            ...this.currentPiece,
            type: newPieceKey,
            shape: allPieces[newPieceKey].shape,
            color: allPieces[newPieceKey].color
          };
        }
        break;
        
      case POWERUP_TYPE.MULTI_CLEAR:
        // Clear multiple random rows
        const clearCount = 3; // Number of rows to clear
        const availableRows = [];
        
        // Find rows with filled cells
        for (let y = 0; y < newGrid.length; y++) {
          if (newGrid[y].some(cell => cell.type !== CELL_TYPE.EMPTY)) {
            availableRows.push(y);
          }
        }
        
        // Clear random rows, up to clearCount or available rows
        for (let i = 0; i < Math.min(clearCount, availableRows.length); i++) {
          const randomIndex = Math.floor(Math.random() * availableRows.length);
          const rowToClear = availableRows.splice(randomIndex, 1)[0];
          
          // Clear the row
          newGrid[rowToClear] = newGrid[rowToClear].map(() => ({ 
            type: CELL_TYPE.EMPTY, 
            color: 'transparent' 
          }));
        }
        break;
        
      case POWERUP_TYPE.TIME_FREEZE:
        // Freezes time momentarily (pause for a brief period)
        this.setPaused(true);
        setTimeout(() => {
          this.setPaused(false);
        }, 5000); // 5 seconds
        break;
        
      case POWERUP_TYPE.GRAVITY_FLIP:
        // Reverses the gravity direction temporarily
        this.gravityFlipped = true;
        setTimeout(() => {
          this.gravityFlipped = false;
        }, 15000); // 15 seconds
        break;
        
      case POWERUP_TYPE.WILD_CARD:
        // Turns into a random power-up
        const availablePowerUps = Object.values(POWERUP_TYPE).filter(type => 
          type !== POWERUP_TYPE.WILD_CARD // Avoid selecting wild card again
        );
        const randomType = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
        
        // Apply the random power-up effect by recursively calling usePowerUp
        // with the same position but new power-up type
        cell.powerUpType = randomType;
        return this.usePowerUp(position);
        
      case POWERUP_TYPE.GEM_FINDER:
        // Shows direction to the gem
        this.gemFinderActive = true;
        this.gemFinderDuration = Date.now() + 30000; // 30 seconds
        
        // Find the gem position
        for (let y = 0; y < this.grid.length; y++) {
          for (let x = 0; x < this.grid[y].length; x++) {
            if (this.grid[y][x].type === CELL_TYPE.GEM) {
              this.gemPosition = { x, y };
              break;
            }
          }
          if (this.gemPosition) break;
        }
        
        setTimeout(() => {
          this.gemFinderActive = false;
          this.gemFinderDuration = 0;
        }, 30000); // 30 seconds
        break;
        
      case POWERUP_TYPE.EXTRA_PIECE:
        // Store an extra piece for later use
        this.extraPiece = generateRandomPiece(this.level.gridType);
        break;
        
      case POWERUP_TYPE.GHOST_MODE:
        // Makes pieces pass through filled cells temporarily
        this.ghostModeActive = true;
        setTimeout(() => {
          this.ghostModeActive = false;
        }, 10000); // 10 seconds
        break;
    }
    
    this.grid = newGrid;
    
    // Add score for using a power-up
    this.score += 50;
    if (this.onScoreChange) this.onScoreChange(this.score);
    
    // Play sound
    audioManager.playSuccess();
  }
  
  // Set the next piece as the current piece and generate a new next piece
  setNextPiece() {
    if (!this.nextPiece) return;
    
    // Use the next piece as the current piece
    this.currentPiece = this.nextPiece;
    
    // Create a new next piece
    this.nextPiece = generateRandomPiece(this.level.gridType);
    
    // Calculate starting position (center top of grid)
    const startX = Math.floor((this.grid[0].length - this.currentPiece.shape[0].length) / 2);
    const startY = 0;
    
    // Check if the new piece can be placed at the starting position
    if (checkCollision(this.grid, this.currentPiece, { x: startX, y: startY })) {
      // If collision occurs immediately, the game is over
      this.setGameOver();
      return;
    }
    
    // Otherwise set the piece position and notify listeners
    this.piecePosition = { x: startX, y: startY };
    if (this.onPieceChange) this.onPieceChange(this.currentPiece, this.nextPiece);
  }
  
  // Calculate the ghost piece position (preview of where the piece will land)
  getGhostPosition() {
    if (!this.currentPiece) return null;
    
    let ghostPosition = { ...this.piecePosition };
    
    // Determine direction based on gravity
    const direction = this.gravityFlipped ? -1 : 1;
    
    // Move the ghost piece in the gravity direction until it would collide
    while (!checkCollision(this.grid, this.currentPiece, { 
      ...ghostPosition, 
      y: ghostPosition.y + direction 
    }, this)) {
      ghostPosition.y += direction;
    }
    
    return ghostPosition;
  }
  
  // Get the visible portion of the grid for rendering
  getVisibleGrid() {
    return getViewportGrid(this.grid, this.viewportPosition, 20); // Assuming viewport height of 20
  }
}
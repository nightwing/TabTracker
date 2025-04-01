// Main Game Application
class GameApp {
  constructor() {
    // DOM elements
    this.gameContainer = document.getElementById('game-container');
    this.levelSelectScreen = document.getElementById('level-select');
    this.levelList = document.getElementById('level-list');
    this.startGameBtn = document.getElementById('start-game-btn');
    this.toggleSoundBtn = document.getElementById('toggle-sound-btn');
    this.scoreDisplay = document.getElementById('score-display');
    this.linesDisplay = document.getElementById('lines-display');
    this.levelDisplay = document.getElementById('level-display');
    this.progressDisplay = document.getElementById('progress-display');
    this.gameOverScreen = document.getElementById('game-over');
    this.finalScoreDisplay = document.getElementById('final-score');
    this.restartBtn = document.getElementById('restart-btn');
    this.pauseMenu = document.getElementById('pause-menu');
    this.resumeBtn = document.getElementById('resume-btn');
    this.quitBtn = document.getElementById('quit-btn');
    
    // Game state
    this.gameLogic = new GameLogic();
    this.renderer = null;
    this.controls = null;
    this.isRunning = false;
    this.animationFrameId = null;
    
    // Selected level and grid type
    this.selectedLevelId = 1;
    this.selectedGridType = GRID_TYPE.NORMAL;
    
    // Initialize the game
    this.init();
  }
  
  // Initialize the game
  init() {
    // Populate the level list
    this.populateLevelList();
    
    // Set up event listeners for UI buttons
    this.setupEventListeners();
    
    // Set up game callbacks
    this.setupGameCallbacks();
  }
  
  // Populate the level selection list
  populateLevelList() {
    // Clear existing level cards
    this.levelList.innerHTML = '';
    
    // Create a card for each level
    LEVELS.forEach(level => {
      const levelCard = document.createElement('div');
      levelCard.className = 'level-card';
      levelCard.dataset.levelId = level.id;
      
      if (level.id === this.selectedLevelId) {
        levelCard.classList.add('selected');
      }
      
      levelCard.innerHTML = `
        <h3>${level.name}</h3>
        <div style="height: 60px; background-color: ${level.backgroundColor}; margin: 10px 0;"></div>
        <p>${level.description}</p>
        <div>Difficulty: ${Array(level.difficulty).fill('★').join('')}</div>
      `;
      
      // Add click event to select this level
      levelCard.addEventListener('click', () => {
        // Remove selected class from all level cards
        document.querySelectorAll('.level-card').forEach(card => {
          card.classList.remove('selected');
        });
        
        // Add selected class to this card
        levelCard.classList.add('selected');
        
        // Update selected level ID
        this.selectedLevelId = level.id;
        
        // Play sound
        audioManager.playHit();
      });
      
      this.levelList.appendChild(levelCard);
    });
    
    // Setup grid type selector
    const gridTypeOptions = document.querySelectorAll('.grid-type-option');
    gridTypeOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        gridTypeOptions.forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Add selected class to this option
        option.classList.add('selected');
        
        // Update selected grid type
        this.selectedGridType = option.dataset.gridType;
        
        // Play sound
        audioManager.playHit();
      });
    });
  }
  
  // Set up event listeners
  setupEventListeners() {
    // Start game button
    this.startGameBtn.addEventListener('click', () => {
      this.startGame();
    });
    
    // Toggle sound button
    this.toggleSoundBtn.addEventListener('click', () => {
      audioManager.toggleMute();
    });
    
    // Restart button
    this.restartBtn.addEventListener('click', () => {
      this.restartGame();
    });
    
    // Resume button
    this.resumeBtn.addEventListener('click', () => {
      if (this.gameLogic) {
        this.gameLogic.setPaused(false);
        this.pauseMenu.style.display = 'none';
      }
    });
    
    // Quit button
    this.quitBtn.addEventListener('click', () => {
      this.quitToMenu();
    });
  }
  
  // Set up game callbacks
  setupGameCallbacks() {
    // Score change callback
    this.gameLogic.onScoreChange = (score) => {
      if (this.scoreDisplay) {
        this.scoreDisplay.textContent = score;
      }
    };
    
    // Lines change callback
    this.gameLogic.onLinesChange = (lines) => {
      if (this.linesDisplay) {
        this.linesDisplay.textContent = lines;
      }
    };
    
    // Game over callback
    this.gameLogic.onGameOver = (finalScore) => {
      // Update final score display
      if (this.finalScoreDisplay) {
        this.finalScoreDisplay.textContent = finalScore;
      }
      
      // Show game over screen
      if (this.gameOverScreen) {
        this.gameOverScreen.style.display = 'flex';
      }
      
      // Play success sound
      audioManager.playSuccess();
      
      // Stop the game loop
      this.stopGameLoop();
    };
    
    // Viewport change callback
    this.gameLogic.onViewportChange = (viewportPosition) => {
      // Update progress display
      if (this.progressDisplay && this.gameLogic.level) {
        const progress = calculateProgress(
          viewportPosition,
          this.gameLogic.level.gemPosition.y
        );
        this.progressDisplay.textContent = Math.round(progress);
      }
    };
    
    // Pause change callback
    this.gameLogic.onPause = (isPaused) => {
      if (isPaused) {
        // Show pause menu
        if (this.pauseMenu) {
          this.pauseMenu.style.display = 'flex';
        }
      } else {
        // Hide pause menu
        if (this.pauseMenu) {
          this.pauseMenu.style.display = 'none';
        }
      }
    };
  }
  
  // Start the game
  startGame() {
    // Hide level select screen
    this.levelSelectScreen.style.display = 'none';
    
    // Initialize the game with selected level
    this.gameLogic.initializeGame(this.selectedLevelId);
    
    // Create renderer and controls if they don't exist
    if (!this.renderer) {
      this.renderer = new GameRenderer(this.gameLogic, this.gameContainer);
    }
    
    if (!this.controls) {
      this.controls = new Controls(this.gameLogic);
    }
    
    // Update display elements
    if (this.levelDisplay && this.gameLogic.level) {
      this.levelDisplay.textContent = this.gameLogic.level.name;
    }
    
    // Hide game over screen if visible
    if (this.gameOverScreen) {
      this.gameOverScreen.style.display = 'none';
    }
    
    // Start game loop
    this.startGameLoop();
    
    // Play success sound
    audioManager.playSuccess();
  }
  
  // Restart the game
  restartGame() {
    // Reset game state
    this.gameLogic.initializeGame(this.selectedLevelId);
    
    // Hide game over screen
    if (this.gameOverScreen) {
      this.gameOverScreen.style.display = 'none';
    }
    
    // Start game loop
    this.startGameLoop();
  }
  
  // Quit to main menu
  quitToMenu() {
    // Stop game loop
    this.stopGameLoop();
    
    // Hide game over and pause screens
    if (this.gameOverScreen) {
      this.gameOverScreen.style.display = 'none';
    }
    
    if (this.pauseMenu) {
      this.pauseMenu.style.display = 'none';
    }
    
    // Show level select screen
    this.levelSelectScreen.style.display = 'flex';
  }
  
  // Game loop
  gameLoop(timestamp) {
    // Process game logic tick
    this.gameLogic.tick(timestamp);
    
    // Process controls
    this.controls.update();
    
    // Render the game
    this.renderer.render(timestamp);
    
    // Continue the loop if game is running
    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
  }
  
  // Start the game loop
  startGameLoop() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
  }
  
  // Stop the game loop
  stopGameLoop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new GameApp();
});
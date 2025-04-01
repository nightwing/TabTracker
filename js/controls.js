// Controls Handler Class
class Controls {
  constructor(gameLogic) {
    this.gameLogic = gameLogic;
    this.keyStates = {}; // Track which keys are currently pressed
    this.moveDelay = 100; // ms between moves when key is held
    this.dropDelay = 30; // ms between moves when drop key is held
    this.lastMoveTime = {}; // Track last move time for each key
    this.isMobile = false;
    
    // Initialize event listeners
    this.init();
  }
  
  // Initialize control event listeners
  init() {
    // Check if we're on a mobile device
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // If on mobile, make the movement delay shorter for better responsiveness
    if (this.isMobile) {
      this.moveDelay = 80;
      this.dropDelay = 20;
    }
    
    // Add keyboard event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Add mobile control listeners if needed
    if (this.isMobile) {
      this.initMobileControls();
    }
  }
  
  // Initialize mobile touch controls
  initMobileControls() {
    // Left button
    const leftBtn = document.getElementById('mobile-left');
    if (leftBtn) {
      leftBtn.addEventListener('touchstart', () => this.handleLeft());
      leftBtn.addEventListener('touchend', () => this.clearMoveTime('left'));
    }
    
    // Right button
    const rightBtn = document.getElementById('mobile-right');
    if (rightBtn) {
      rightBtn.addEventListener('touchstart', () => this.handleRight());
      rightBtn.addEventListener('touchend', () => this.clearMoveTime('right'));
    }
    
    // Down button
    const downBtn = document.getElementById('mobile-down');
    if (downBtn) {
      downBtn.addEventListener('touchstart', () => this.handleDown());
      downBtn.addEventListener('touchend', () => this.clearMoveTime('down'));
    }
    
    // Rotate button
    const rotateBtn = document.getElementById('mobile-rotate');
    if (rotateBtn) {
      rotateBtn.addEventListener('touchstart', () => this.handleRotate());
      rotateBtn.addEventListener('touchend', () => this.clearMoveTime('rotate'));
    }
    
    // Drop button
    const dropBtn = document.getElementById('drop-btn');
    if (dropBtn) {
      dropBtn.addEventListener('touchstart', () => this.handleDrop());
      dropBtn.addEventListener('touchend', () => this.clearMoveTime('drop'));
    }
    
    // Pause button
    const pauseBtn = document.getElementById('mobile-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.handlePause());
    }
    
    // Mute button
    const muteBtn = document.getElementById('mobile-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => this.handleMute());
    }
  }
  
  // Handle keyboard key down event
  handleKeyDown(event) {
    const key = event.key;
    
    // Only process keys we care about
    if (!this.isGameControlKey(key)) return;
    
    // Set key state to pressed
    this.keyStates[key] = true;
    
    // Prevent default for game control keys (to avoid page scrolling etc.)
    event.preventDefault();
    
    // Handle key press
    const now = Date.now();
    
    // Left movement
    if (CONTROL_KEYS.LEFT.includes(key)) {
      this.handleLeft();
    }
    
    // Right movement
    else if (CONTROL_KEYS.RIGHT.includes(key)) {
      this.handleRight();
    }
    
    // Down movement
    else if (CONTROL_KEYS.DOWN.includes(key)) {
      this.handleDown();
    }
    
    // Rotation
    else if (CONTROL_KEYS.ROTATE.includes(key)) {
      this.handleRotate();
    }
    
    // Hard drop
    else if (CONTROL_KEYS.DROP.includes(key)) {
      this.handleDrop();
    }
    
    // Pause toggle
    else if (CONTROL_KEYS.PAUSE.includes(key)) {
      // Only trigger pause on initial key press
      if (!this.lastMoveTime['pause'] || now - this.lastMoveTime['pause'] > 300) {
        this.handlePause();
        this.lastMoveTime['pause'] = now;
      }
    }
    
    // Mute toggle
    else if (CONTROL_KEYS.MUTE.includes(key)) {
      // Only trigger mute on initial key press
      if (!this.lastMoveTime['mute'] || now - this.lastMoveTime['mute'] > 300) {
        this.handleMute();
        this.lastMoveTime['mute'] = now;
      }
    }
  }
  
  // Handle keyboard key up event
  handleKeyUp(event) {
    const key = event.key;
    
    // Only process keys we care about
    if (!this.isGameControlKey(key)) return;
    
    // Set key state to not pressed
    this.keyStates[key] = false;
    
    // Clear last move time for the key type
    if (CONTROL_KEYS.LEFT.includes(key)) {
      this.clearMoveTime('left');
    } else if (CONTROL_KEYS.RIGHT.includes(key)) {
      this.clearMoveTime('right');
    } else if (CONTROL_KEYS.DOWN.includes(key)) {
      this.clearMoveTime('down');
    } else if (CONTROL_KEYS.ROTATE.includes(key)) {
      this.clearMoveTime('rotate');
    } else if (CONTROL_KEYS.DROP.includes(key)) {
      this.clearMoveTime('drop');
    }
  }
  
  // Check if a key is a game control key
  isGameControlKey(key) {
    return (
      CONTROL_KEYS.LEFT.includes(key) ||
      CONTROL_KEYS.RIGHT.includes(key) ||
      CONTROL_KEYS.DOWN.includes(key) ||
      CONTROL_KEYS.ROTATE.includes(key) ||
      CONTROL_KEYS.DROP.includes(key) ||
      CONTROL_KEYS.PAUSE.includes(key) ||
      CONTROL_KEYS.MUTE.includes(key)
    );
  }
  
  // Handle movement with rate limiting
  handleMovement(moveFn, keyType, delay = this.moveDelay) {
    const now = Date.now();
    const lastMove = this.lastMoveTime[keyType] || 0;
    
    // If enough time has passed since last move, perform the move
    if (now - lastMove >= delay) {
      if (moveFn.call(this.gameLogic)) {
        audioManager.playHit();
      }
      this.lastMoveTime[keyType] = now;
    }
  }
  
  // Clear last move time for a key type
  clearMoveTime(keyType) {
    this.lastMoveTime[keyType] = 0;
  }
  
  // Handle left movement
  handleLeft() {
    this.handleMovement(this.gameLogic.moveLeft, 'left');
  }
  
  // Handle right movement
  handleRight() {
    this.handleMovement(this.gameLogic.moveRight, 'right');
  }
  
  // Handle down movement
  handleDown() {
    this.handleMovement(this.gameLogic.moveDown, 'down');
  }
  
  // Handle rotation
  handleRotate() {
    this.handleMovement(this.gameLogic.rotatePiece, 'rotate');
  }
  
  // Handle hard drop
  handleDrop() {
    this.handleMovement(this.gameLogic.dropPiece, 'drop', this.dropDelay);
  }
  
  // Handle pause toggle
  handlePause() {
    this.gameLogic.setPaused(!this.gameLogic.paused);
    
    // Update UI
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
      pauseMenu.style.display = this.gameLogic.paused ? 'flex' : 'none';
    }
  }
  
  // Handle mute toggle
  handleMute() {
    audioManager.toggleMute();
  }
  
  // Process continuous key presses for game loop
  update() {
    // Only process if the game is active
    if (this.gameLogic.paused || this.gameLogic.gameOver) return;
    
    const now = Date.now();
    
    // Check for continuous key presses
    // Left movement
    if (this.isAnyKeyPressed(CONTROL_KEYS.LEFT)) {
      this.handleLeft();
    }
    
    // Right movement
    if (this.isAnyKeyPressed(CONTROL_KEYS.RIGHT)) {
      this.handleRight();
    }
    
    // Down movement
    if (this.isAnyKeyPressed(CONTROL_KEYS.DOWN)) {
      this.handleDown();
    }
    
    // Hard drop
    if (this.isAnyKeyPressed(CONTROL_KEYS.DROP)) {
      this.handleDrop();
    }
  }
  
  // Check if any key in the key list is pressed
  isAnyKeyPressed(keyList) {
    return keyList.some(key => this.keyStates[key]);
  }
}
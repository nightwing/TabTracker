// Renderer Class
class GameRenderer {
  constructor(gameLogic, container) {
    this.gameLogic = gameLogic;
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.gridGroup = null;
    this.tetrominoRenderer = null;
    this.lightGrid = [];
    this.lastViewportPosition = 0;
    
    // Configuration
    this.viewportConfig = {
      width: 10,
      height: 20,
      cellSize: 1
    };
    
    this.init();
  }
  
  // Initialize the renderer
  init() {
    // Create the scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    
    // Create the camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    
    // Create the renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
    
    // Add lights
    this.addLights();
    
    // Create a group for the grid
    this.gridGroup = new THREE.Group();
    this.scene.add(this.gridGroup);
    
    // Create tetromino renderer
    this.tetrominoRenderer = new TetrominoRenderer(this.scene, this.gameLogic.level?.gridType, this.viewportConfig.cellSize);
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Set up initial camera position
    this.updateCameraPosition();
  }
  
  // Add lights to the scene
  addLights() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    // Add directional lights for better shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 10);
    mainLight.castShadow = true;
    this.scene.add(mainLight);
    
    // Add secondary light from another angle
    const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.5);
    secondaryLight.position.set(-5, 5, -10);
    this.scene.add(secondaryLight);
  }
  
  // Handle window resize
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(width, height);
  }
  
  // Update camera position based on grid type
  updateCameraPosition() {
    const gridType = this.gameLogic.level?.gridType || GRID_TYPE.NORMAL;
    
    // Adjust viewport config based on grid type
    switch(gridType) {
      case GRID_TYPE.HEXAGONAL:
        this.viewportConfig = {
          width: 8,
          height: 16,
          cellSize: 1.15
        };
        break;
      case GRID_TYPE.TRIANGULAR:
        this.viewportConfig = {
          width: 10,
          height: 20,
          cellSize: 0.9
        };
        break;
      default:
        this.viewportConfig = {
          width: 10,
          height: 20,
          cellSize: 1
        };
    }
    
    // Update tetromino renderer with new cell size and grid type
    if (this.tetrominoRenderer) {
      this.tetrominoRenderer.updateCellSize(this.viewportConfig.cellSize);
      this.tetrominoRenderer.updateGridType(gridType);
    }
    
    // Calculate center of grid
    const centerX = this.viewportConfig.width * this.viewportConfig.cellSize / 2;
    const centerY = this.viewportConfig.height * this.viewportConfig.cellSize / 2;
    
    // Position camera to view the grid
    this.camera.position.set(centerX, centerY, 15);
    this.camera.lookAt(centerX, centerY, 0);
  }
  
  // Render the grid
  renderGrid() {
    const gridType = this.gameLogic.level?.gridType || GRID_TYPE.NORMAL;
    const grid = this.gameLogic.getVisibleGrid();
    const viewportPosition = this.gameLogic.viewportPosition;
    
    // Check if viewport position has changed, if not we can skip rebuilding the grid
    if (this.lastViewportPosition === viewportPosition && this.lightGrid.length > 0) {
      return;
    }
    
    // Update last viewport position
    this.lastViewportPosition = viewportPosition;
    
    // Clear the existing grid
    while(this.gridGroup.children.length > 0) {
      this.gridGroup.remove(this.gridGroup.children[0]);
    }
    
    // Reset the light grid
    this.lightGrid = [];
    
    // Create grid geometry based on grid type
    const gridWidth = grid[0] ? grid[0].length : 0;
    const gridHeight = grid.length;
    
    // Create cells for each position in the grid
    for (let y = 0; y < gridHeight; y++) {
      this.lightGrid[y] = [];
      
      for (let x = 0; x < gridWidth; x++) {
        const cell = grid[y] ? grid[y][x] : null;
        if (!cell) continue; // Skip null cells (outside the well shape)
        
        // Get cell position based on grid type
        const [posX, posY] = getCellPosition(x, y, gridType, this.viewportConfig.cellSize);
        
        // Create the cell geometry
        let cellGeometry;
        let rotation = [0, 0, 0];
        
        switch(gridType) {
          case GRID_TYPE.HEXAGONAL:
            // For hexagonal grid, use cylinder geometry with 6 segments
            cellGeometry = new THREE.CylinderGeometry(
              this.viewportConfig.cellSize * 0.48, 
              this.viewportConfig.cellSize * 0.48, 
              this.viewportConfig.cellSize * 0.1, 
              6
            );
            // Rotate to face up
            rotation = [Math.PI / 2, 0, 0];
            break;
            
          case GRID_TYPE.TRIANGULAR:
            // For triangular grid, use custom geometry based on triangle shape
            const triangleShape = new THREE.Shape();
            
            // Create triangle path
            triangleShape.moveTo(0, 0);
            triangleShape.lineTo(this.viewportConfig.cellSize, 0);
            triangleShape.lineTo(this.viewportConfig.cellSize / 2, this.viewportConfig.cellSize * 0.866);
            triangleShape.lineTo(0, 0);
            
            // Create geometry with slight extrusion for 3D effect
            cellGeometry = new THREE.ExtrudeGeometry(triangleShape, {
              depth: this.viewportConfig.cellSize * 0.1,
              bevelEnabled: false
            });
            
            // For triangular grids, alternate cell rotation based on position
            rotation = (x + y) % 2 === 1 ? [0, 0, Math.PI] : [0, 0, 0];
            break;
            
          default:
            // For normal grid, use a slightly smaller box to create grid lines
            cellGeometry = new THREE.PlaneGeometry(
              this.viewportConfig.cellSize * 0.95, 
              this.viewportConfig.cellSize * 0.95
            );
        }
        
        // Create material based on cell type
        let material;
        
        switch(cell.type) {
          case CELL_TYPE.FILLED:
            material = new THREE.MeshStandardMaterial({
              color: cell.color || '#888888',
              roughness: 0.7,
              metalness: 0.2
            });
            break;
            
          case CELL_TYPE.FROZEN:
            material = new THREE.MeshStandardMaterial({
              color: cell.color || '#AADDFF',
              roughness: 0.2,
              metalness: 0.8,
              transparent: true,
              opacity: 0.8
            });
            break;
            
          case CELL_TYPE.POWERUP:
            material = new THREE.MeshStandardMaterial({
              color: cell.color || '#FF5733',
              roughness: 0.4,
              metalness: 0.6,
              emissive: cell.color || '#FF5733',
              emissiveIntensity: 0.3
            });
            break;
            
          case CELL_TYPE.GEM:
            material = new THREE.MeshStandardMaterial({
              color: '#FFD700',
              roughness: 0.1,
              metalness: 1.0,
              emissive: '#FFFF00',
              emissiveIntensity: 0.5
            });
            break;
            
          default: // EMPTY
            // For empty cells, just use a slightly visible grid
            material = new THREE.MeshBasicMaterial({
              color: '#333333',
              transparent: true,
              opacity: 0.2
            });
        }
        
        // Create the mesh
        const cellMesh = new THREE.Mesh(cellGeometry, material);
        
        // Set position and rotation
        cellMesh.position.set(posX, posY, 0);
        cellMesh.rotation.set(rotation[0], rotation[1], rotation[2]);
        
        // Add to the grid group
        this.gridGroup.add(cellMesh);
        
        // Store in light grid for later reference
        this.lightGrid[y][x] = cellMesh;
      }
    }
  }
  
  // Render active tetromino and ghost piece
  renderTetromino() {
    const currentPiece = this.gameLogic.currentPiece;
    
    if (currentPiece) {
      // Render ghost piece first (so it appears behind the active piece)
      const ghostPosition = this.gameLogic.getGhostPosition();
      if (ghostPosition) {
        // Create adjusted ghost position that accounts for viewport position
        const adjustedGhostPosition = {
          x: ghostPosition.x,
          y: ghostPosition.y - this.gameLogic.viewportPosition
        };
        
        this.tetrominoRenderer.renderGhostPiece(currentPiece, adjustedGhostPosition);
      }
      
      // Render active piece
      // Create adjusted position that accounts for viewport position
      const adjustedPosition = {
        x: this.gameLogic.piecePosition.x,
        y: this.gameLogic.piecePosition.y - this.gameLogic.viewportPosition
      };
      
      this.tetrominoRenderer.renderPiece(currentPiece, adjustedPosition);
      
      // Update next piece preview in 2D canvas
      const nextPieceCanvas = document.getElementById('next-piece-canvas');
      if (nextPieceCanvas && this.gameLogic.nextPiece) {
        renderNextPiecePreview(
          nextPieceCanvas, 
          this.gameLogic.nextPiece, 
          this.gameLogic.level?.gridType
        );
      }
    }
  }
  
  // Main render method
  render(timestamp) {
    // Only render if game is active or paused
    if (this.gameLogic.gameOver) return;
    
    // Render the grid
    this.renderGrid();
    
    // Render the active tetromino and ghost piece
    this.renderTetromino();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}
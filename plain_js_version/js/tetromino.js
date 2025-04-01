// Tetromino Renderer Class
class TetrominoRenderer {
  constructor(scene, gridType = GRID_TYPE.NORMAL, cellSize = 1) {
    this.scene = scene;
    this.gridType = gridType;
    this.cellSize = cellSize;
    this.pieceGroup = null;
    this.ghostGroup = null;
    
    // Create Three.js objects for rendering
    this.init();
  }
  
  // Initialize Three.js objects
  init() {
    // Create group for the main tetromino
    this.pieceGroup = new THREE.Group();
    this.scene.add(this.pieceGroup);
    
    // Create group for the ghost piece (landing preview)
    this.ghostGroup = new THREE.Group();
    this.scene.add(this.ghostGroup);
  }
  
  // Render the active tetromino
  renderPiece(piece, position) {
    if (!piece) return;
    
    // Clear existing piece
    while(this.pieceGroup.children.length > 0) { 
      this.pieceGroup.remove(this.pieceGroup.children[0]); 
    }
    
    // Set the group position
    this.pieceGroup.position.set(
      position.x * this.cellSize,
      position.y * this.cellSize,
      0.1 // Slightly above the grid
    );
    
    // Create cell objects for each filled cell in the piece
    this._createCellsForPiece(piece, this.pieceGroup, false);
  }
  
  // Render the ghost piece (landing preview)
  renderGhostPiece(piece, position) {
    if (!piece) return;
    
    // Clear existing ghost piece
    while(this.ghostGroup.children.length > 0) { 
      this.ghostGroup.remove(this.ghostGroup.children[0]); 
    }
    
    // Set the group position
    this.ghostGroup.position.set(
      position.x * this.cellSize,
      position.y * this.cellSize,
      0.05 // Slightly above the grid but below the active piece
    );
    
    // Create cell objects for each filled cell in the piece
    this._createCellsForPiece(piece, this.ghostGroup, true);
  }
  
  // Clear both the active piece and ghost piece
  clear() {
    while(this.pieceGroup.children.length > 0) { 
      this.pieceGroup.remove(this.pieceGroup.children[0]); 
    }
    
    while(this.ghostGroup.children.length > 0) { 
      this.ghostGroup.remove(this.ghostGroup.children[0]); 
    }
  }
  
  // Helper method to create cell objects for a piece
  _createCellsForPiece(piece, group, isGhost) {
    // Create geometry for the cell type
    let cellGeometry;
    
    switch(this.gridType) {
      case GRID_TYPE.HEXAGONAL:
        // For hexagonal grid, use cylinder geometry with 6 segments
        cellGeometry = new THREE.CylinderGeometry(
          this.cellSize * 0.5, 
          this.cellSize * 0.5, 
          this.cellSize * 0.2, 
          6
        );
        break;
        
      case GRID_TYPE.TRIANGULAR:
        // For triangular grid, use custom geometry based on triangle shape
        const shape = new THREE.Shape();
        
        // Create triangle path
        shape.moveTo(0, 0);
        shape.lineTo(this.cellSize, 0);
        shape.lineTo(this.cellSize / 2, this.cellSize * 0.866);
        shape.lineTo(0, 0);
        
        // Create geometry with slight extrusion for 3D effect
        cellGeometry = new THREE.ExtrudeGeometry(shape, {
          depth: this.cellSize * 0.2,
          bevelEnabled: false
        });
        break;
        
      default:
        // For normal grid, use box geometry with slight beveled edges
        cellGeometry = new THREE.BoxGeometry(
          this.cellSize * 0.95, 
          this.cellSize * 0.95, 
          this.cellSize * 0.2
        );
    }
    
    // Create material for the tetromino
    const material = isGhost 
      ? new THREE.MeshBasicMaterial({
          color: new THREE.Color(piece.color),
          transparent: true,
          opacity: 0.3,
          wireframe: true
        })
      : new THREE.MeshStandardMaterial({
          color: new THREE.Color(piece.color),
          roughness: 0.7,
          metalness: 0.2
        });
    
    // For each cell in the piece shape
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        // Only render filled cells (value of 1)
        if (piece.shape[y][x]) {
          // Get position of this cell based on grid type
          const [posX, posY] = getCellPosition(x, y, this.gridType, this.cellSize);
          
          // Create the mesh
          const cellMesh = new THREE.Mesh(cellGeometry, material);
          
          // Position the cell
          cellMesh.position.set(posX, posY, 0);
          
          // For triangular grids, alternate cell rotation based on position
          if (this.gridType === GRID_TYPE.TRIANGULAR && (x + y) % 2 === 1) {
            cellMesh.rotation.z = Math.PI;
          }
          
          // For hexagonal grids, rotate to face up
          if (this.gridType === GRID_TYPE.HEXAGONAL) {
            cellMesh.rotation.x = Math.PI / 2;
          }
          
          // Add the cell to the group
          group.add(cellMesh);
        }
      }
    }
  }
  
  // Update the renderer when grid type changes
  updateGridType(gridType) {
    this.gridType = gridType;
  }
  
  // Update cell size
  updateCellSize(cellSize) {
    this.cellSize = cellSize;
  }
}

// Function to render the next piece preview in a 2D canvas
function renderNextPiecePreview(canvas, piece, gridType = GRID_TYPE.NORMAL) {
  if (!canvas || !piece) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set background
  ctx.fillStyle = '#222222';
  ctx.fillRect(0, 0, width, height);
  
  // Calculate cell size based on piece shape and canvas size
  const pieceWidth = piece.shape[0].length;
  const pieceHeight = piece.shape.length;
  const cellSize = Math.min(
    (width - 20) / pieceWidth,
    (height - 20) / pieceHeight
  );
  
  // Center the piece in the canvas
  const offsetX = (width - pieceWidth * cellSize) / 2;
  const offsetY = (height - pieceHeight * cellSize) / 2;
  
  // Draw the piece
  for (let y = 0; y < pieceHeight; y++) {
    for (let x = 0; x < pieceWidth; x++) {
      if (piece.shape[y][x]) {
        ctx.fillStyle = piece.color;
        
        // Draw different shapes based on grid type
        switch(gridType) {
          case GRID_TYPE.HEXAGONAL:
            // Draw a hexagon
            drawHexagon(
              ctx, 
              offsetX + x * cellSize + cellSize/2, 
              offsetY + y * cellSize + cellSize/2, 
              cellSize/2
            );
            break;
            
          case GRID_TYPE.TRIANGULAR:
            // Draw a triangle
            if ((x + y) % 2 === 0) {
              drawTriangle(
                ctx, 
                offsetX + x * cellSize, 
                offsetY + y * cellSize, 
                cellSize
              );
            } else {
              drawInvertedTriangle(
                ctx, 
                offsetX + x * cellSize, 
                offsetY + y * cellSize, 
                cellSize
              );
            }
            break;
            
          default:
            // Draw a square
            ctx.fillRect(
              offsetX + x * cellSize, 
              offsetY + y * cellSize, 
              cellSize * 0.9, 
              cellSize * 0.9
            );
        }
      }
    }
  }
}

// Helper function to draw a hexagon
function drawHexagon(ctx, x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

// Helper function to draw a triangle
function drawTriangle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size/2, y + size * 0.866);
  ctx.closePath();
  ctx.fill();
}

// Helper function to draw an inverted triangle
function drawInvertedTriangle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.866);
  ctx.lineTo(x + size, y + size * 0.866);
  ctx.lineTo(x + size/2, y);
  ctx.closePath();
  ctx.fill();
}
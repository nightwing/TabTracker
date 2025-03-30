import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useTetrisGame } from '../../lib/stores/useTetrisGame';
import { Position } from '../../lib/gridUtils';
import { 
  GridType, 
  BLOCK_COLORS, 
  SQUARE_WELL_WIDTH, 
  SQUARE_WELL_HEIGHT,
  HEX_WELL_WIDTH,
  HEX_WELL_HEIGHT,
  TRIANGLE_WELL_WIDTH,
  TRIANGLE_WELL_HEIGHT
} from '../../lib/constants';
import { Matrix } from '../../lib/tetrominos';

interface Grid2DProps {
  width: number;
  height: number;
}

export default function Grid2D({ width, height }: Grid2DProps) {
  const pixiContainer = useRef<HTMLDivElement>(null);
  const app = useRef<PIXI.Application | null>(null);
  const gameContainer = useRef<PIXI.Container | null>(null);
  const blockContainers = useRef<PIXI.Container[]>([]);
  
  const { 
    matrix, 
    gridType, 
    tetromino, 
    position,
    wellWidth,
    wellHeight,
    currentLevelData
  } = useTetrisGame();

  // Calculate cell size based on available space and well dimensions
  const getCellSize = () => {
    const maxWidth = width;
    const maxHeight = height;
    
    let gridWidth, gridHeight;
    
    switch (gridType) {
      case GridType.SQUARE:
        gridWidth = SQUARE_WELL_WIDTH;
        gridHeight = SQUARE_WELL_HEIGHT;
        break;
      case GridType.HEXAGONAL:
        gridWidth = HEX_WELL_WIDTH;
        gridHeight = HEX_WELL_HEIGHT;
        break;
      case GridType.TRIANGULAR:
        gridWidth = TRIANGLE_WELL_WIDTH;
        gridHeight = TRIANGLE_WELL_HEIGHT;
        break;
      default:
        gridWidth = SQUARE_WELL_WIDTH;
        gridHeight = SQUARE_WELL_HEIGHT;
    }
    
    // Calculate cell size to fit the grid
    const cellSizeWidth = maxWidth / (gridWidth + 2); // Add padding
    const cellSizeHeight = maxHeight / (gridHeight + 2); // Add padding
    
    // Use the smaller dimension to ensure it fits
    return Math.min(cellSizeWidth, cellSizeHeight);
  };

  // Convert grid coordinates to pixel coordinates
  const gridToPixel = (pos: Position): { x: number, y: number } => {
    const cellSize = getCellSize();
    const offsetX = (width - wellWidth * cellSize) / 2;
    const offsetY = (height - wellHeight * cellSize) / 2;
    
    switch (gridType) {
      case GridType.SQUARE:
        return {
          x: offsetX + pos.x * cellSize,
          y: offsetY + pos.y * cellSize
        };
        
      case GridType.HEXAGONAL: {
        const isEvenRow = pos.y % 2 === 0;
        return {
          x: offsetX + (pos.x + (isEvenRow ? 0.5 : 0)) * cellSize * 1.5,
          y: offsetY + pos.y * cellSize * 0.866
        };
      }
        
      case GridType.TRIANGULAR: {
        const isUpward = (pos.x + pos.y) % 2 === 0;
        return {
          x: offsetX + pos.x * cellSize * 0.75,
          y: offsetY + pos.y * cellSize * 0.866
        };
      }
        
      default:
        return {
          x: offsetX + pos.x * cellSize,
          y: offsetY + pos.y * cellSize
        };
    }
  };
  
  // Draw a square cell
  const drawSquareCell = (
    graphics: PIXI.Graphics, 
    x: number, 
    y: number, 
    cellSize: number, 
    color: number, 
    type: 'regular' | 'locked' | 'gem' | 'active'
  ) => {
    const padding = cellSize * 0.05;
    
    // Draw the cell background
    graphics.beginFill(color);
    
    if (type === 'gem') {
      // Draw a gem (circle)
      graphics.drawCircle(
        x + cellSize / 2, 
        y + cellSize / 2, 
        cellSize / 2 - padding
      );
      
      // Add a glow effect
      const glow = new PIXI.Graphics();
      glow.beginFill(color, 0.3);
      glow.drawCircle(
        x + cellSize / 2, 
        y + cellSize / 2, 
        cellSize / 2
      );
      glow.endFill();
      gameContainer.current?.addChild(glow);
    } else {
      // Draw a regular block with rounded corners
      graphics.drawRoundedRect(
        x + padding, 
        y + padding, 
        cellSize - padding * 2, 
        cellSize - padding * 2,
        cellSize * 0.1
      );
      
      // Add shading for 3D effect
      if (type !== 'locked') {
        // Highlight (top and left)
        graphics.beginFill(0xFFFFFF, 0.3);
        graphics.drawPolygon([
          x + padding, y + padding,
          x + cellSize - padding, y + padding,
          x + padding, y + cellSize - padding
        ]);
        graphics.endFill();
        
        // Shadow (bottom and right)
        graphics.beginFill(0x000000, 0.2);
        graphics.drawPolygon([
          x + cellSize - padding, y + padding,
          x + cellSize - padding, y + cellSize - padding,
          x + padding, y + cellSize - padding
        ]);
        graphics.endFill();
      }
    }
    
    graphics.endFill();
    
    // Add border for active pieces
    if (type === 'active') {
      graphics.lineStyle(2, 0xFFFFFF, 0.8);
      graphics.drawRoundedRect(
        x + padding - 1, 
        y + padding - 1, 
        cellSize - padding * 2 + 2, 
        cellSize - padding * 2 + 2,
        cellSize * 0.1
      );
    }
    
    // Add lock symbol for locked blocks
    if (type === 'locked') {
      graphics.lineStyle(2, 0xFFFFFF, 0.6);
      
      // Draw a simple lock icon
      const centerX = x + cellSize / 2;
      const centerY = y + cellSize / 2;
      const lockSize = cellSize * 0.3;
      
      // Lock body
      graphics.drawRoundedRect(
        centerX - lockSize / 2,
        centerY - lockSize / 3,
        lockSize,
        lockSize * 0.8,
        lockSize * 0.2
      );
      
      // Lock shackle
      graphics.drawCircle(
        centerX,
        centerY - lockSize / 3,
        lockSize / 4
      );
      
      // Lock keyhole
      graphics.beginFill(0x000000, 0.5);
      graphics.drawCircle(
        centerX,
        centerY + lockSize / 6,
        lockSize / 6
      );
      graphics.endFill();
    }
  };
  
  // Draw a hexagonal cell
  const drawHexCell = (
    graphics: PIXI.Graphics, 
    x: number, 
    y: number, 
    cellSize: number, 
    color: number, 
    type: 'regular' | 'locked' | 'gem' | 'active'
  ) => {
    const radius = cellSize / 2;
    const centerX = x + radius;
    const centerY = y + radius;
    
    // Create hexagon points
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      points.push(
        centerX + radius * 0.9 * Math.cos(angle),
        centerY + radius * 0.9 * Math.sin(angle)
      );
    }
    
    // Draw the hexagon
    graphics.beginFill(color);
    
    if (type === 'gem') {
      // Draw a gem (circle inside hexagon)
      graphics.drawCircle(centerX, centerY, radius * 0.8);
      
      // Add a glow effect
      const glow = new PIXI.Graphics();
      glow.beginFill(color, 0.3);
      glow.drawCircle(centerX, centerY, radius * 1.1);
      glow.endFill();
      gameContainer.current?.addChild(glow);
    } else {
      graphics.drawPolygon(points);
      
      // Add shading for 3D effect if not locked
      if (type !== 'locked') {
        // Create highlight (top half)
        graphics.beginFill(0xFFFFFF, 0.3);
        graphics.drawPolygon([
          points[0], points[1], // First point
          points[2], points[3], // Second point
          points[4], points[5], // Third point
          centerX, centerY       // Center point
        ]);
        graphics.endFill();
        
        // Create shadow (bottom half)
        graphics.beginFill(0x000000, 0.2);
        graphics.drawPolygon([
          points[6], points[7],   // Fourth point
          points[8], points[9],   // Fifth point
          points[10], points[11], // Sixth point
          centerX, centerY        // Center point
        ]);
        graphics.endFill();
      }
    }
    
    graphics.endFill();
    
    // Add border for active pieces
    if (type === 'active') {
      graphics.lineStyle(2, 0xFFFFFF, 0.8);
      graphics.drawPolygon(points);
    }
    
    // Add lock symbol for locked blocks
    if (type === 'locked') {
      graphics.lineStyle(2, 0xFFFFFF, 0.6);
      
      // Draw a simple lock icon
      const lockSize = cellSize * 0.3;
      
      // Lock body
      graphics.drawRoundedRect(
        centerX - lockSize / 2,
        centerY - lockSize / 3,
        lockSize,
        lockSize * 0.8,
        lockSize * 0.2
      );
      
      // Lock shackle
      graphics.drawCircle(
        centerX,
        centerY - lockSize / 3,
        lockSize / 4
      );
      
      // Lock keyhole
      graphics.beginFill(0x000000, 0.5);
      graphics.drawCircle(
        centerX,
        centerY + lockSize / 6,
        lockSize / 6
      );
      graphics.endFill();
    }
  };
  
  // Draw a triangular cell
  const drawTriangleCell = (
    graphics: PIXI.Graphics, 
    x: number, 
    y: number, 
    cellSize: number, 
    color: number, 
    type: 'regular' | 'locked' | 'gem' | 'active',
    isUpward: boolean
  ) => {
    const halfWidth = cellSize / 2;
    const height = cellSize * 0.866; // Height of equilateral triangle
    const centerX = x + halfWidth;
    const centerY = y + height / 2;
    
    // Create triangle points
    let points;
    if (isUpward) {
      points = [
        centerX, y + 0.1 * height, // Top
        x + 0.1 * cellSize, y + 0.9 * height, // Bottom left
        x + 0.9 * cellSize, y + 0.9 * height  // Bottom right
      ];
    } else {
      points = [
        centerX, y + 0.9 * height, // Bottom
        x + 0.1 * cellSize, y + 0.1 * height, // Top left
        x + 0.9 * cellSize, y + 0.1 * height  // Top right
      ];
    }
    
    // Draw the triangle
    graphics.beginFill(color);
    
    if (type === 'gem') {
      // Draw a gem (circle)
      graphics.drawCircle(centerX, centerY, cellSize * 0.3);
      
      // Add a glow effect
      const glow = new PIXI.Graphics();
      glow.beginFill(color, 0.3);
      glow.drawCircle(centerX, centerY, cellSize * 0.4);
      glow.endFill();
      gameContainer.current?.addChild(glow);
    } else {
      graphics.drawPolygon(points);
      
      // Add shading for 3D effect if not locked
      if (type !== 'locked') {
        if (isUpward) {
          // Highlight (left side)
          graphics.beginFill(0xFFFFFF, 0.3);
          graphics.drawPolygon([
            points[0], points[1], // Top
            points[2], points[3], // Bottom left
            centerX, centerY      // Center
          ]);
          graphics.endFill();
          
          // Shadow (right side)
          graphics.beginFill(0x000000, 0.2);
          graphics.drawPolygon([
            points[0], points[1], // Top
            points[4], points[5], // Bottom right
            centerX, centerY      // Center
          ]);
        } else {
          // Highlight (right side)
          graphics.beginFill(0xFFFFFF, 0.3);
          graphics.drawPolygon([
            points[2], points[3], // Top left
            points[4], points[5], // Top right
            centerX, centerY      // Center
          ]);
          graphics.endFill();
          
          // Shadow (bottom side)
          graphics.beginFill(0x000000, 0.2);
          graphics.drawPolygon([
            points[0], points[1], // Bottom
            points[2], points[3], // Top left
            centerX, centerY      // Center
          ]);
        }
      }
    }
    
    graphics.endFill();
    
    // Add border for active pieces
    if (type === 'active') {
      graphics.lineStyle(2, 0xFFFFFF, 0.8);
      graphics.drawPolygon(points);
    }
    
    // Add lock symbol for locked blocks
    if (type === 'locked') {
      graphics.lineStyle(2, 0xFFFFFF, 0.6);
      
      // Draw a simpler lock icon due to space constraints
      const lockSize = cellSize * 0.25;
      
      // Lock body
      graphics.drawRoundedRect(
        centerX - lockSize / 2,
        centerY - lockSize / 4,
        lockSize,
        lockSize * 0.8,
        lockSize * 0.2
      );
      
      // Lock keyhole
      graphics.beginFill(0x000000, 0.5);
      graphics.drawCircle(
        centerX,
        centerY + lockSize / 8,
        lockSize / 6
      );
      graphics.endFill();
    }
  };
  
  // Initialize PIXI application
  useEffect(() => {
    if (!pixiContainer.current) return;
    
    // Create a new PIXI Application with PixiJS v8 syntax
    const pixiApp = new PIXI.Application();
    
    // Initialize with proper parameters
    pixiApp.init({
      width,
      height,
      backgroundColor: 0x1e293b, // Match the background color
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });
    
    // Store reference to the application
    app.current = pixiApp;
    
    // Add the canvas to the DOM if it exists
    if (pixiApp.canvas) {
      pixiContainer.current.appendChild(pixiApp.canvas);
      
      // Create a container for all game objects
      gameContainer.current = new PIXI.Container();
      pixiApp.stage.addChild(gameContainer.current);
      
      // Add a render ticker
      pixiApp.ticker.add(() => {
        // Any animations can go here
      });
    }
    
    return () => {
      if (app.current) {
        app.current.destroy(true, true);
        app.current = null;
      }
    };
  }, [width, height]);
  
  // Helper to check if a cell has active tetromino
  const isActiveCell = (x: number, y: number): boolean => {
    if (!tetromino || !position) return false;
    
    // Check if the cell falls within the active tetromino's bounds
    const relX = x - position.x;
    const relY = y - position.y;
    
    if (
      relX >= 0 && 
      relX < tetromino.shape[0].length && 
      relY >= 0 && 
      relY < tetromino.shape.length
    ) {
      return tetromino.shape[relY][relX] === 1;
    }
    
    return false;
  };
  
  // Get tetromino color as a number
  const getTetrominoColor = (): number => {
    if (!tetromino) return 0xFFFFFF;
    return parseInt(tetromino.color.replace('#', '0x'));
  };
  
  // Parse color string to number
  const parseColor = (color: string): number => {
    return parseInt(color.replace('#', '0x'));
  };
  
  // Render the grid
  useEffect(() => {
    if (!app.current || !gameContainer.current) return;
    
    // Clear previous grid
    while (gameContainer.current.children.length > 0) {
      gameContainer.current.removeChildAt(0);
    }
    
    // Create a new graphics object for the grid
    const gridGraphics = new PIXI.Graphics();
    const cellSize = getCellSize();
    
    // Draw well background and grid lines
    const wellGraphics = new PIXI.Graphics();
    const offsetX = (width - wellWidth * cellSize) / 2;
    const offsetY = (height - wellHeight * cellSize) / 2;
    
    // Draw a background for the well
    wellGraphics.beginFill(0x0f172a);
    wellGraphics.drawRect(
      offsetX - cellSize * 0.1, 
      offsetY - cellSize * 0.1, 
      wellWidth * cellSize + cellSize * 0.2, 
      wellHeight * cellSize + cellSize * 0.1
    );
    wellGraphics.endFill();
    
    // Add subtle grid lines
    wellGraphics.lineStyle(1, 0x1f2937, 0.3);
    
    if (gridType === GridType.SQUARE) {
      // Vertical lines
      for (let x = 0; x <= wellWidth; x++) {
        wellGraphics.moveTo(offsetX + x * cellSize, offsetY);
        wellGraphics.lineTo(offsetX + x * cellSize, offsetY + wellHeight * cellSize);
      }
      
      // Horizontal lines
      for (let y = 0; y <= wellHeight; y++) {
        wellGraphics.moveTo(offsetX, offsetY + y * cellSize);
        wellGraphics.lineTo(offsetX + wellWidth * cellSize, offsetY + y * cellSize);
      }
    }
    
    gameContainer.current.addChild(wellGraphics);
    
    // Draw static blocks in the matrix
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        const cell = matrix[y][x];
        if (cell === 0) continue; // Skip empty cells
        
        // Skip cells not in well shape
        if (currentLevelData.wellShape && !currentLevelData.wellShape[y][x]) continue;
        
        const { x: pixelX, y: pixelY } = gridToPixel({ x, y });
        
        // Determine cell type and color
        let cellColor;
        let cellType: 'regular' | 'locked' | 'gem';
        
        if (cell === 8) {
          // Gem cell
          cellColor = parseColor(BLOCK_COLORS.GEM);
          cellType = 'gem';
        } else if (cell === 2) {
          // Locked block
          cellColor = parseColor(BLOCK_COLORS.LOCKED);
          cellType = 'locked';
        } else {
          // Regular block
          cellColor = parseColor(BLOCK_COLORS.I); // Default color
          cellType = 'regular';
        }
        
        const isUpward = (x + y) % 2 === 0; // For triangular grid
        
        switch (gridType) {
          case GridType.SQUARE:
            drawSquareCell(gridGraphics, pixelX, pixelY, cellSize, cellColor, cellType);
            break;
          case GridType.HEXAGONAL:
            drawHexCell(gridGraphics, pixelX, pixelY, cellSize, cellColor, cellType);
            break;
          case GridType.TRIANGULAR:
            drawTriangleCell(gridGraphics, pixelX, pixelY, cellSize, cellColor, cellType, isUpward);
            break;
        }
      }
    }
    
    // Draw active tetromino
    if (tetromino && position) {
      const activeColor = getTetrominoColor();
      
      for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
          // Only render active cells
          if (!isActiveCell(x, y)) continue;
          
          // Skip cells not in well shape
          if (currentLevelData.wellShape && !currentLevelData.wellShape[y][x]) continue;
          
          const { x: pixelX, y: pixelY } = gridToPixel({ x, y });
          const isUpward = (x + y) % 2 === 0; // For triangular grid
          
          switch (gridType) {
            case GridType.SQUARE:
              drawSquareCell(gridGraphics, pixelX, pixelY, cellSize, activeColor, 'active');
              break;
            case GridType.HEXAGONAL:
              drawHexCell(gridGraphics, pixelX, pixelY, cellSize, activeColor, 'active');
              break;
            case GridType.TRIANGULAR:
              drawTriangleCell(gridGraphics, pixelX, pixelY, cellSize, activeColor, 'active', isUpward);
              break;
          }
        }
      }
    }
    
    gameContainer.current.addChild(gridGraphics);
    
  }, [matrix, tetromino, position, gridType, width, height, wellWidth, wellHeight, currentLevelData.wellShape]);
  
  return (
    <div ref={pixiContainer} className="w-full h-full" />
  );
}
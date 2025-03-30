import React, { useEffect, useRef } from 'react';
import { useTetrisGame } from '../../lib/stores/useTetrisGame';
import { BLOCK_COLORS, GridType } from '../../lib/constants';
import { Position } from '../../lib/gridUtils';
import { Matrix } from '../../lib/tetrominos';

interface Grid2DCanvasProps {
  width: number;
  height: number;
}

export default function Grid2DCanvas({ width, height }: Grid2DCanvasProps) {
  // Reference for canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get game state from store
  const tetromino = useTetrisGame(state => state.tetromino);
  const position = useTetrisGame(state => state.position);
  const matrix = useTetrisGame(state => state.matrix);
  const gridType = useTetrisGame(state => state.gridType);
  const wellWidth = useTetrisGame(state => state.wellWidth);
  const wellHeight = useTetrisGame(state => state.wellHeight);
  const currentLevelData = useTetrisGame(state => state.currentLevelData);
  
  // Calculate cell size based on container and well dimensions
  const getCellSize = (): number => {
    const maxCellWidth = width / wellWidth;
    const maxCellHeight = height / wellHeight;
    return Math.min(maxCellWidth, maxCellHeight) * 0.95; // 5% margin
  };
  
  // Convert grid position to pixel coordinates
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
        
      case GridType.HEXAGONAL:
        // Offset every other row for hexagonal grid
        return {
          x: offsetX + pos.x * cellSize + (pos.y % 2 === 0 ? 0 : cellSize / 2),
          y: offsetY + pos.y * cellSize * 0.75 // Hexagons overlap vertically
        };
        
      case GridType.TRIANGULAR:
        // For triangular grid, position depends on whether the triangle points up or down
        const isUpward = (pos.x + pos.y) % 2 === 0;
        return {
          x: offsetX + pos.x * cellSize / 2, // Triangles are half-width
          y: offsetY + pos.y * cellSize
        };
        
      default:
        return { x: 0, y: 0 };
    }
  };
  
  // Draw a square cell
  const drawSquareCell = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    type: 'regular' | 'locked' | 'gem' | 'active'
  ) => {
    const padding = size * 0.1; // 10% padding
    
    // Draw cell background
    ctx.fillStyle = color;
    ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
    
    // Add details based on cell type
    if (type === 'locked') {
      // Draw a lock symbol
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      const lockSize = size * 0.4;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2 - lockSize / 4, lockSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + size / 2 - lockSize / 4, y + size / 2);
      ctx.lineTo(x + size / 2 - lockSize / 4, y + size / 2 + lockSize / 2);
      ctx.lineTo(x + size / 2 + lockSize / 4, y + size / 2 + lockSize / 2);
      ctx.lineTo(x + size / 2 + lockSize / 4, y + size / 2);
      ctx.stroke();
    } else if (type === 'gem') {
      // Draw a gem/diamond shape
      const gemSize = size * 0.6;
      const centerX = x + size / 2;
      const centerY = y + size / 2;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - gemSize / 2);
      ctx.lineTo(centerX + gemSize / 2, centerY);
      ctx.lineTo(centerX, centerY + gemSize / 2);
      ctx.lineTo(centerX - gemSize / 2, centerY);
      ctx.closePath();
      ctx.stroke();
      
      // Add a shine effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX - gemSize / 5, centerY - gemSize / 5, gemSize / 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'active' || type === 'regular') {
      // Add a subtle highlight for active/regular blocks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(
        x + padding, 
        y + padding, 
        (size - padding * 2) * 0.3, 
        (size - padding * 2) * 0.3
      );
    }
  };
  
  // Draw a hexagonal cell
  const drawHexCell = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    type: 'regular' | 'locked' | 'gem' | 'active'
  ) => {
    const hexRadius = size * 0.5;
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // Draw hexagon
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const pointX = centerX + hexRadius * Math.cos(angle);
      const pointY = centerY + hexRadius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.closePath();
    ctx.fill();
    
    // Add details based on cell type
    if (type === 'locked') {
      // Lock symbol
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      const lockSize = hexRadius * 0.6;
      ctx.beginPath();
      ctx.arc(centerX, centerY - lockSize / 4, lockSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX - lockSize / 4, centerY);
      ctx.lineTo(centerX - lockSize / 4, centerY + lockSize / 2);
      ctx.lineTo(centerX + lockSize / 4, centerY + lockSize / 2);
      ctx.lineTo(centerX + lockSize / 4, centerY);
      ctx.stroke();
    } else if (type === 'gem') {
      // Gem shape
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      const gemSize = hexRadius * 0.6;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - gemSize);
      ctx.lineTo(centerX + gemSize, centerY);
      ctx.lineTo(centerX, centerY + gemSize);
      ctx.lineTo(centerX - gemSize, centerY);
      ctx.closePath();
      ctx.stroke();
      
      // Shine effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX - gemSize / 5, centerY - gemSize / 5, gemSize / 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'active' || type === 'regular') {
      // Highlight for active/regular blocks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(centerX - hexRadius * 0.2, centerY - hexRadius * 0.2, hexRadius * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  // Draw a triangular cell
  const drawTriangleCell = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string, 
    type: 'regular' | 'locked' | 'gem' | 'active',
    isUpward: boolean = true
  ) => {
    const halfSize = size / 2;
    const height = size * 0.866; // Triangle height (√3/2 * size)
    
    // Draw triangle
    ctx.fillStyle = color;
    ctx.beginPath();
    if (isUpward) {
      ctx.moveTo(x + halfSize, y);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + size, y + height);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + halfSize, y + height);
    }
    ctx.closePath();
    ctx.fill();
    
    // Calculate center point for details
    const centerX = x + halfSize;
    const centerY = y + (isUpward ? height / 3 : 2 * height / 3);
    
    // Add details based on cell type
    if (type === 'locked') {
      // Lock symbol - simplified for triangle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      const lockSize = size * 0.25;
      ctx.beginPath();
      ctx.arc(centerX, centerY - lockSize / 4, lockSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX - lockSize / 4, centerY);
      ctx.lineTo(centerX - lockSize / 4, centerY + lockSize / 2);
      ctx.lineTo(centerX + lockSize / 4, centerY + lockSize / 2);
      ctx.lineTo(centerX + lockSize / 4, centerY);
      ctx.stroke();
    } else if (type === 'gem') {
      // Gem shape - smaller for triangle
      const gemSize = size * 0.3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - gemSize / 2);
      ctx.lineTo(centerX + gemSize / 2, centerY);
      ctx.lineTo(centerX, centerY + gemSize / 2);
      ctx.lineTo(centerX - gemSize / 2, centerY);
      ctx.closePath();
      ctx.stroke();
      
      // Small shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX - gemSize / 5, centerY - gemSize / 5, gemSize / 10, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
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
  
  // Render the game
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#1e293b'; // Background color
    ctx.fillRect(0, 0, width, height);
    
    const cellSize = getCellSize();
    const offsetX = (width - wellWidth * cellSize) / 2;
    const offsetY = (height - wellHeight * cellSize) / 2;
    
    // Draw well background
    ctx.fillStyle = '#0f172a'; // Well background color
    ctx.fillRect(
      offsetX - cellSize * 0.1,
      offsetY - cellSize * 0.1,
      wellWidth * cellSize + cellSize * 0.2,
      wellHeight * cellSize + cellSize * 0.1
    );
    
    // Draw grid lines for square grid
    if (gridType === GridType.SQUARE) {
      ctx.strokeStyle = 'rgba(31, 41, 55, 0.3)';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x <= wellWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * cellSize, offsetY);
        ctx.lineTo(offsetX + x * cellSize, offsetY + wellHeight * cellSize);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= wellHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * cellSize);
        ctx.lineTo(offsetX + wellWidth * cellSize, offsetY + y * cellSize);
        ctx.stroke();
      }
    }
    
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
          cellColor = BLOCK_COLORS.GEM;
          cellType = 'gem';
        } else if (cell === 2) {
          // Locked block
          cellColor = BLOCK_COLORS.LOCKED;
          cellType = 'locked';
        } else {
          // Regular block
          cellColor = BLOCK_COLORS.I; // Default color
          cellType = 'regular';
        }
        
        const isUpward = (x + y) % 2 === 0; // For triangular grid
        
        switch (gridType) {
          case GridType.SQUARE:
            drawSquareCell(ctx, pixelX, pixelY, cellSize, cellColor, cellType);
            break;
          case GridType.HEXAGONAL:
            drawHexCell(ctx, pixelX, pixelY, cellSize, cellColor, cellType);
            break;
          case GridType.TRIANGULAR:
            drawTriangleCell(ctx, pixelX, pixelY, cellSize, cellColor, cellType, isUpward);
            break;
        }
      }
    }
    
    // Draw active tetromino
    if (tetromino && position) {
      const activeColor = tetromino.color;
      
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
              drawSquareCell(ctx, pixelX, pixelY, cellSize, activeColor, 'active');
              break;
            case GridType.HEXAGONAL:
              drawHexCell(ctx, pixelX, pixelY, cellSize, activeColor, 'active');
              break;
            case GridType.TRIANGULAR:
              drawTriangleCell(ctx, pixelX, pixelY, cellSize, activeColor, 'active', isUpward);
              break;
          }
        }
      }
    }
    
    // Request next animation frame
    requestAnimationFrame(renderGame);
  };
  
  // Initialize canvas and start rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Start the render loop
    const animationFrame = requestAnimationFrame(renderGame);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [width, height]);
  
  // Update when game state changes
  useEffect(() => {
    // This is just a dependency array to trigger re-renders
    // The actual rendering happens in renderGame()
  }, [matrix, tetromino, position, gridType, wellWidth, wellHeight, currentLevelData.wellShape]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="w-full h-full"
    />
  );
}
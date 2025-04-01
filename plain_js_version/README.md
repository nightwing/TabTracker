# DeepTetris - Plain JavaScript Version

This is a plain JavaScript implementation of DeepTetris, a Tetris-like game with an extended grid, multiple layouts, and level progression mechanics.

## Features

- **Extended Grid**: The game features a very deep grid (500+ lines) with a gem at the bottom to reach
- **Multiple Grid Layouts**: Choose between normal (square), hexagonal, or triangular grid layouts
- **Power-ups**: Special power-up cells provide abilities to help navigate the grid
- **Level Progression**: The viewable area shifts downward as you clear lines, revealing more of the grid
- **Mobile Support**: Touch controls for mobile devices

## How to Run

1. Make sure you have Node.js installed on your system
2. Navigate to the project directory in your terminal
3. Install dependencies by running:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser and go to:
   ```
   http://localhost:3000
   ```

## Controls

- **Arrow Keys**: Move tetromino
- **Up Arrow**: Rotate tetromino
- **Down Arrow**: Soft drop
- **Space**: Hard drop
- **P**: Pause/resume game
- **M**: Toggle sound

## Why Plain JavaScript?

This version uses plain JavaScript with Three.js for rendering, without React or other frontend frameworks. This approach avoids issues with state management loops that can occur in React when handling complex game state, particularly the "Maximum update depth exceeded" error.

## Implementation Details

The implementation follows these core principles:

1. **Direct DOM Manipulation**: Using plain JavaScript to manipulate the DOM
2. **Vanilla Three.js**: Direct usage of Three.js without React wrappers
3. **Class-Based Architecture**: Using ES6 classes for better organization
4. **Game Loop Pattern**: Using requestAnimationFrame for the game loop

## Project Structure

- `index.html`: Main HTML file with game interface
- `js/constants.js`: Game constants and enums
- `js/pieces.js`: Tetromino piece definitions and utilities
- `js/levels.js`: Level definitions and generation
- `js/audio.js`: Audio management
- `js/grid.js`: Grid utilities and collision detection
- `js/tetromino.js`: Tetromino rendering
- `js/gameLogic.js`: Core game logic
- `js/controls.js`: Input handling
- `js/renderer.js`: Three.js rendering
- `js/main.js`: Main application code
- `server.js`: Simple Express server to serve the game
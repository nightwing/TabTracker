#!/bin/bash

# Make sure Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create sounds directory if it doesn't exist
mkdir -p public/sounds

# Copy sound files from the React project (if they exist)
if [ -d "../client/public/sounds" ]; then
    echo "Copying sound files from React project..."
    cp -r ../client/public/sounds/* public/sounds/
else
    echo "No sound files found in React project. Creating dummy sound files..."
    
    # Create dummy sound files if needed
    touch public/sounds/background.mp3
    touch public/sounds/hit.mp3
    touch public/sounds/success.mp3
fi

# Start the server
echo "Starting DeepTetris Plain JS server..."
npm start
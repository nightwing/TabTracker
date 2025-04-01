import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { levels } from '../data/levels';
import { useAudio } from '@/lib/stores/useAudio';

interface LevelSelectProps {
  onStartGame: (levelId: number, gridType: 'normal' | 'hexagonal' | 'triangular') => void;
}

export function LevelSelect({ onStartGame }: LevelSelectProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [selectedGridType, setSelectedGridType] = useState<'normal' | 'hexagonal' | 'triangular'>('normal');
  const { toggleMute, isMuted } = useAudio.getState();
  
  // Get the selected level data
  const selectedLevel = levels.find(level => level.id === selectedLevelId);
  
  // Handler to start the game
  const handleStartGame = () => {
    if (selectedLevelId) {
      // Play sound when starting the game
      if (!isMuted) {
        useAudio.getState().playSuccess();
      }
      
      // Start the game with selected level and grid type
      onStartGame(selectedLevelId, selectedGridType);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full mx-auto text-center mb-8"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
          Deep<span className="text-yellow-400">Tetris</span>
        </h1>
        <p className="text-lg text-gray-300">
          Solve lines and dig deeper to find the gem!
        </p>
      </motion.div>
      
      {/* Grid Type Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-4xl w-full mx-auto mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Select Grid Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['normal', 'hexagonal', 'triangular'] as const).map((type) => (
            <div 
              key={type}
              className={`cursor-pointer p-4 rounded-lg transition-colors border-2 ${
                selectedGridType === type 
                  ? 'border-yellow-400 bg-gray-800' 
                  : 'border-gray-700 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => setSelectedGridType(type)}
            >
              <h3 className="text-xl font-bold text-white capitalize mb-2">{type}</h3>
              <div className="aspect-square bg-gray-700 rounded-md flex items-center justify-center">
                {type === 'normal' && (
                  <div className="grid grid-cols-3 grid-rows-3 gap-1 w-3/4 h-3/4">
                    {Array(9).fill(0).map((_, i) => (
                      <div key={i} className="bg-blue-500 rounded-sm" />
                    ))}
                  </div>
                )}
                {type === 'hexagonal' && (
                  <svg viewBox="0 0 100 100" className="w-3/4 h-3/4">
                    <polygon points="50,0 100,25 100,75 50,100 0,75 0,25" fill="#9c59b6" />
                  </svg>
                )}
                {type === 'triangular' && (
                  <svg viewBox="0 0 100 100" className="w-3/4 h-3/4">
                    <polygon points="50,0 100,87 0,87" fill="#2ecc71" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Level Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="max-w-4xl w-full mx-auto mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Select Level</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map(level => (
            <Card 
              key={level.id}
              className={`cursor-pointer transition-all hover:scale-105 ${
                selectedLevelId === level.id 
                  ? 'border-2 border-yellow-400' 
                  : 'border border-gray-700'
              }`}
              onClick={() => {
                setSelectedLevelId(level.id);
                useAudio.getState().playHit();
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle>{level.name}</CardTitle>
                <CardDescription>Difficulty: {Array(level.difficulty).fill('★').join('')}</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div 
                  className="h-20 rounded-md mb-2"
                  style={{ backgroundColor: level.backgroundColor }}
                />
                <p className="text-sm">{level.description}</p>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-gray-500">
                  {level.gridType.charAt(0).toUpperCase() + level.gridType.slice(1)} Grid
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </motion.div>
      
      {/* Start Game Button */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-6"
      >
        <Button 
          size="lg" 
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold text-lg px-8 py-6"
          onClick={handleStartGame}
        >
          Start Game
        </Button>
        
        {/* Sound toggle button */}
        <Button
          variant="outline"
          className="ml-4"
          onClick={toggleMute}
        >
          {isMuted ? "🔇 Unmute" : "🔊 Mute"}
        </Button>
      </motion.div>
      
      {/* Instructions */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-10 max-w-xl text-gray-400 text-center text-sm"
      >
        <h3 className="text-gray-300 font-bold mb-2">How to Play:</h3>
        <p>Use arrow keys to move, up arrow to rotate, space to drop pieces.</p>
        <p>Clear lines to dig deeper and reach the gem at the bottom of the well.</p>
        <p>Look for powerups to help you navigate frozen cells and obstacles!</p>
      </motion.div>
    </div>
  );
}

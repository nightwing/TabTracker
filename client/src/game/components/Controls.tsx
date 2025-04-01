import React, { useState, useEffect } from 'react';
import { useControls } from '../hooks/useControls';
import { useGameStore } from '../stores/gameStore';
import { useAudio } from '@/lib/stores/useAudio';

export function Controls() {
  const [isMobile, setIsMobile] = useState(false);
  const controls = useControls();
  const { toggleMute, isMuted } = useAudio.getState();
  const gameState = useGameStore(state => ({
    paused: state.paused,
    setPaused: state.setPaused
  }));
  
  // Detect if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // If not on mobile, don't render touch controls
  if (!isMobile) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 w-full">
      {/* Touch controls for mobile */}
      <div className="flex flex-col">
        {/* Top row: Pause, Mute, etc. */}
        <div className="flex justify-between p-2 bg-gray-900 bg-opacity-70">
          <button
            className="px-4 py-2 bg-gray-800 rounded-md text-white"
            onClick={() => gameState.setPaused(!gameState.paused)}
          >
            {gameState.paused ? 'Resume' : 'Pause'}
          </button>
          
          <button
            className="px-4 py-2 bg-gray-800 rounded-md text-white"
            onClick={toggleMute}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
        
        {/* Game controls */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-gray-900 bg-opacity-70">
          {/* Left button */}
          <button
            className="p-4 bg-gray-800 rounded-md active:bg-gray-700 text-white text-2xl"
            onTouchStart={() => controls.handleLeft()}
            onTouchEnd={() => {}}
          >
            ←
          </button>
          
          {/* Middle column with rotate and drop */}
          <div className="flex flex-col gap-2">
            <button
              className="p-4 bg-gray-800 rounded-md active:bg-gray-700 text-white text-2xl"
              onTouchStart={() => controls.handleRotate()}
              onTouchEnd={() => {}}
            >
              ↻
            </button>
            
            <button
              className="p-4 bg-gray-800 rounded-md active:bg-gray-700 text-white text-2xl"
              onTouchStart={() => controls.handleDown()}
              onTouchEnd={() => {}}
            >
              ↓
            </button>
          </div>
          
          {/* Right button */}
          <button
            className="p-4 bg-gray-800 rounded-md active:bg-gray-700 text-white text-2xl"
            onTouchStart={() => controls.handleRight()}
            onTouchEnd={() => {}}
          >
            →
          </button>
          
          {/* Hard drop button (full width) */}
          <button
            className="p-4 bg-yellow-600 rounded-md active:bg-yellow-700 text-white text-xl col-span-3"
            onTouchStart={() => controls.handleDrop()}
            onTouchEnd={() => {}}
          >
            DROP
          </button>
        </div>
      </div>
    </div>
  );
}

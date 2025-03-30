import { useTetrisGame } from '../../lib/stores/useTetrisGame';
import { GameState, GridType } from '../../lib/constants';
import { gridTypeToDisplayName } from '../../lib/gameHelpers';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useAudio } from '../../lib/stores/useAudio';

export default function GameUI2D() {
  const { 
    score,
    level,
    rowsCleared,
    gameState,
    startGame,
    resumeGame,
    pauseGame,
    restartLevel,
    nextLevel,
    currentLevelData,
    gridType
  } = useTetrisGame();
  
  const { isMuted, toggleMute } = useAudio();
  
  // Determine what UI to show based on game state
  const renderGameStateUI = () => {
    switch (gameState) {
      case GameState.MENU:
        return (
          <div className="flex flex-col items-center space-y-4 bg-slate-900/80 p-6 rounded-lg shadow-lg">
            <h1 className="text-4xl font-bold text-white">BlockBreaker</h1>
            <p className="text-slate-300">
              Clear a path to reach the gem at the bottom of each level!
            </p>
            <Button 
              size="lg" 
              className="mt-4"
              onClick={() => startGame(1)}
            >
              Start Game
            </Button>
          </div>
        );
        
      case GameState.PAUSED:
        return (
          <div className="flex flex-col items-center space-y-4 bg-slate-900/80 p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-white">Game Paused</h2>
            <div className="flex space-x-2">
              <Button onClick={resumeGame}>
                Resume
              </Button>
              <Button
                variant="outline"
                onClick={restartLevel}
              >
                Restart Level
              </Button>
            </div>
          </div>
        );
        
      case GameState.GAME_OVER:
        return (
          <div className="flex flex-col items-center space-y-4 bg-slate-900/80 p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-red-500">Game Over</h2>
            <p className="text-white">Your final score: {score}</p>
            <Button onClick={restartLevel}>
              Try Again
            </Button>
          </div>
        );
        
      case GameState.LEVEL_COMPLETE:
        return (
          <div className="flex flex-col items-center space-y-4 bg-slate-900/80 p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-green-500">Level Complete!</h2>
            <p className="text-white">Level score: {score}</p>
            <div className="flex space-x-2">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={nextLevel}
              >
                Next Level
              </Button>
              <Button
                variant="outline"
                onClick={restartLevel}
              >
                Play Again
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* Game state overlay */}
      {gameState !== GameState.PLAYING && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          {renderGameStateUI()}
        </div>
      )}
      
      {/* Info bar */}
      <div className="absolute top-0 left-0 right-0 bg-slate-900/80 p-2 flex items-center justify-between z-5">
        <div className="flex items-center space-x-4">
          <div className="text-white">
            <span className="text-slate-400 text-sm">Score:</span>{' '}
            <span className="font-bold">{score}</span>
          </div>
          
          <div className="text-white">
            <span className="text-slate-400 text-sm">Level:</span>{' '}
            <span className="font-bold">{level}</span>
          </div>
          
          <div className="text-white">
            <span className="text-slate-400 text-sm">Lines:</span>{' '}
            <span className="font-bold">{rowsCleared}</span>
          </div>
          
          <Badge className="bg-amber-600 hover:bg-amber-700">
            {currentLevelData?.name || 'Level ' + currentLevelData?.id}
          </Badge>
          
          <Badge className="bg-blue-600 hover:bg-blue-700">
            {gridTypeToDisplayName(gridType)}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white"
            onClick={toggleMute}
          >
            {isMuted ? '🔇' : '🔊'}
          </Button>
          
          {gameState === GameState.PLAYING && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white"
              onClick={pauseGame}
            >
              Pause
            </Button>
          )}
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-2 left-2 bg-slate-900/60 p-3 rounded text-white text-xs z-5">
        <p>Controls: Arrow keys or WASD to move</p>
        <p>Up/W: Rotate • Space: Hard drop • P: Pause • R: Restart</p>
      </div>
    </>
  );
}
import { ReactNode } from "react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { gridTypeToDisplayName } from "../../lib/gameHelpers";
import { useTetrisGame } from "../../lib/stores/useTetrisGame";
import { useAudio } from "../../lib/stores/useAudio";
import { Button } from "../../components/ui/button";
import { GameState } from "../../lib/constants";
import { 
  TrophyIcon, 
  LayersIcon, 
  ZapIcon, 
  VolumeIcon, 
  Volume2Icon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SkipForwardIcon,
  KeyboardIcon
} from "lucide-react";

// Styled container for score info
function InfoContainer({ title, value, icon }: { title: string, value: ReactNode, icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-md">
      <div className="text-primary">
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-400">{title}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
}

export default function ScoreDisplay() {
  const { 
    score, 
    level, 
    rowsCleared, 
    gameState, 
    currentLevelData,
    startGame,
    pauseGame,
    resumeGame,
    restartLevel,
    nextLevel
  } = useTetrisGame();
  
  const { isMuted, toggleMute } = useAudio();
  
  // Determine grid type display
  const gridType = gridTypeToDisplayName(currentLevelData.gridType);
  
  // Display controls info
  const showControls = () => {
    return (
      <div className="bg-slate-800 p-4 rounded-lg mt-4">
        <h3 className="flex items-center gap-2 font-bold mb-2 text-primary">
          <KeyboardIcon size={16} /> Controls
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-slate-400">Left/Right:</div>
          <div>Move block</div>
          
          <div className="text-slate-400">Down:</div>
          <div>Soft drop</div>
          
          <div className="text-slate-400">Q/E:</div>
          <div>Rotate</div>
          
          <div className="text-slate-400">Space:</div>
          <div>Hard drop</div>
          
          <div className="text-slate-400">P:</div>
          <div>Pause/Resume</div>
          
          <div className="text-slate-400">R:</div>
          <div>Restart level</div>
        </div>
      </div>
    );
  };
  
  // Different UI based on game state
  if (gameState === GameState.MENU) {
    return (
      <Card className="w-72 bg-slate-900 border-slate-700 text-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center text-primary">Geometric Tetris</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-center text-slate-400">
            Clear lines to reach the gem at the bottom of each well!
          </p>
          
          <Button 
            className="w-full mb-2" 
            onClick={() => startGame(1)}
          >
            Start Game
          </Button>
          
          <div className="flex mt-4 justify-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
            >
              {isMuted ? <VolumeIcon size={18} /> : <Volume2Icon size={18} />}
            </Button>
          </div>
          
          {showControls()}
        </CardContent>
      </Card>
    );
  }
  
  if (gameState === GameState.LEVEL_COMPLETE) {
    return (
      <Card className="w-72 bg-slate-900 border-slate-700 text-slate-100">
        <CardHeader className="pb-2">
          <div className="flex justify-center mb-2">
            <TrophyIcon className="h-10 w-10 text-yellow-500" />
          </div>
          <CardTitle className="text-center text-xl">Level Complete!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <InfoContainer title="Score" value={score} icon={<TrophyIcon size={16} />} />
            <InfoContainer title="Lines" value={rowsCleared} icon={<LayersIcon size={16} />} />
          </div>
          
          <Button 
            className="w-full mb-2" 
            onClick={nextLevel}
          >
            <SkipForwardIcon className="mr-2 h-4 w-4" /> Next Level
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={restartLevel}
          >
            <RotateCcwIcon className="mr-2 h-4 w-4" /> Replay Level
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (gameState === GameState.GAME_OVER) {
    return (
      <Card className="w-72 bg-slate-900 border-slate-700 text-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-xl">Game Over</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <InfoContainer title="Final Score" value={score} icon={<TrophyIcon size={16} />} />
            <InfoContainer title="Lines Cleared" value={rowsCleared} icon={<LayersIcon size={16} />} />
          </div>
          
          <Button 
            className="w-full mb-2" 
            onClick={() => startGame(1)}
          >
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (gameState === GameState.PAUSED) {
    return (
      <Card className="w-72 bg-slate-900 border-slate-700 text-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-xl">Game Paused</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <InfoContainer title="Score" value={score} icon={<TrophyIcon size={16} />} />
            <InfoContainer title="Level" value={level} icon={<ZapIcon size={16} />} />
          </div>
          
          <Button 
            className="w-full mb-2" 
            onClick={resumeGame}
          >
            <PlayIcon className="mr-2 h-4 w-4" /> Resume
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full mb-2" 
            onClick={restartLevel}
          >
            <RotateCcwIcon className="mr-2 h-4 w-4" /> Restart Level
          </Button>
          
          <div className="flex mt-2 justify-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
            >
              {isMuted ? <VolumeIcon size={18} /> : <Volume2Icon size={18} />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Default score display (for playing state)
  return (
    <Card className="w-72 bg-slate-900 border-slate-700 text-slate-100">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Level {currentLevelData.id}: {currentLevelData.name}</CardTitle>
          <Badge variant="outline">{gridType}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <InfoContainer title="Score" value={score} icon={<TrophyIcon size={16} />} />
          <InfoContainer title="Level" value={level} icon={<ZapIcon size={16} />} />
          <InfoContainer title="Lines" value={rowsCleared} icon={<LayersIcon size={16} />} />
          <div className="flex justify-between gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={pauseGame}
              className="flex-1"
            >
              <PauseIcon size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
              className="flex-1"
            >
              {isMuted ? <VolumeIcon size={16} /> : <Volume2Icon size={16} />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

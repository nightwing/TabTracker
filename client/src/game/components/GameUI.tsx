import React from 'react';
import { Text, Html } from '@react-three/drei';
import { useGameStore } from '../stores/gameStore';
import { TetrominoPiece, GameLevel } from '../types';
import { Tetromino } from './Tetromino';

interface GameUIProps {
  score: number;
  linesCleared: number;
  level: GameLevel;
  nextPiece?: TetrominoPiece;
  gridType: 'normal' | 'hexagonal' | 'triangular';
}

export function GameUI({ score, linesCleared, level, nextPiece, gridType }: GameUIProps) {
  // Calculate progress to the gem (as percentage)
  const viewportPosition = useGameStore(state => state.viewportPosition);
  const gemPosition = level.gemPosition.y;
  const progress = Math.min(100, Math.max(0, viewportPosition / gemPosition * 100));
  
  return (
    <>
      {/* 3D Text for score */}
      <Text
        position={[12, 18, 0]}
        color="white"
        fontSize={0.7}
        anchorX="left"
        anchorY="top"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        SCORE: {score}
      </Text>
      
      {/* Lines cleared */}
      <Text
        position={[12, 17, 0]}
        color="white"
        fontSize={0.7}
        anchorX="left"
        anchorY="top"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        LINES: {linesCleared}
      </Text>
      
      {/* Level name */}
      <Text
        position={[12, 16, 0]}
        color="white"
        fontSize={0.7}
        anchorX="left"
        anchorY="top"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        LEVEL: {level.name}
      </Text>
      
      {/* Progress to gem */}
      <Text
        position={[12, 15, 0]}
        color="white"
        fontSize={0.7}
        anchorX="left"
        anchorY="top"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        PROGRESS: {Math.round(progress)}%
      </Text>
      
      {/* Next piece preview box */}
      <group position={[12, 11, 0]}>
        <Text
          position={[0, 2, 0]}
          color="white"
          fontSize={0.7}
          anchorX="left"
          anchorY="top"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          NEXT:
        </Text>
        
        {/* Box background */}
        <mesh position={[2, 0, -0.1]}>
          <planeGeometry args={[4, 4]} />
          <meshBasicMaterial color="#222222" />
        </mesh>
        
        {/* Next tetromino preview */}
        {nextPiece && (
          <Tetromino
            piece={nextPiece}
            position={{ x: 0, y: 0 }}
            gridType={gridType}
            cellSize={0.8}
          />
        )}
      </group>
      
      {/* Game controls help */}
      <Html position={[12, 5, 0]} transform>
        <div style={{ 
          color: 'white', 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px',
          width: '150px'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Controls:</h3>
          <p style={{ margin: '5px 0' }}>← → : Move</p>
          <p style={{ margin: '5px 0' }}>↑ : Rotate</p>
          <p style={{ margin: '5px 0' }}>↓ : Soft Drop</p>
          <p style={{ margin: '5px 0' }}>Space : Hard Drop</p>
          <p style={{ margin: '5px 0' }}>P : Pause</p>
          <p style={{ margin: '5px 0' }}>M : Mute</p>
        </div>
      </Html>
      
      {/* Progress bar to show depth progress towards gem */}
      <group position={[5, -1, 0]}>
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[10, 0.5]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
        
        <mesh position={[-5 + (progress / 100) * 5, 0, 0]}>
          <planeGeometry args={[(progress / 100) * 10, 0.4]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
        
        <Text
          position={[0, 0, 0.1]}
          color="white"
          fontSize={0.3}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          GEM PROGRESS: {Math.round(progress)}%
        </Text>
      </group>
    </>
  );
}

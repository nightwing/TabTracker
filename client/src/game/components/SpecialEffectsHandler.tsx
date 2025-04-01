import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useAudio } from '@/lib/stores/useAudio';

export function SpecialEffectsHandler() {
  const audio = useAudio();
  
  useEffect(() => {
    // Set up the effects handler
    const handleSpecialEffect = (effectType: string, effectData: any) => {
      console.log(`Special effect activated: ${effectType}`, effectData);
      
      // Play the appropriate sound based on the effect type
      switch (effectType) {
        case 'clearRow':
        case 'clearColumn':
        case 'multiClear':
          audio.playSuccess();
          break;
          
        case 'removeFrozen':
          audio.playPowerup();
          break;
          
        case 'slowFall':
        case 'timeFreeze':
        case 'gravityFlip':
        case 'shapeShift':
        case 'wildCard':
        case 'gemFinder':
        case 'ghostMode':
        case 'extraPiece':
          audio.playPowerup();
          break;
          
        case 'bomb':
          audio.playExplosion();
          break;
          
        case 'portal':
          audio.playPortal();
          break;
          
        case 'bouncy':
          audio.playBounce();
          break;
          
        case 'magnetic':
        case 'gravity':
          audio.playGravity();
          break;
          
        case 'scramble':
          audio.playHit();
          break;
          
        case 'gemCollected':
          audio.playGem();
          break;
      }
      
      // Here we could add visual effects as well, like particles or animations
    };
    
    // Register the effect handler with the game store
    useGameStore.setState({ 
      onSpecialEffectActivate: handleSpecialEffect 
    });
    
    // Cleanup function to remove the handler when component unmounts
    return () => {
      useGameStore.setState({ 
        onSpecialEffectActivate: undefined 
      });
    };
  }, []);
  
  // This is a utility component with no visual representation
  return null;
}
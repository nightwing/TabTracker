import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";
import { BLOCK_COLORS } from "@/lib/constants";

interface GemProps {
  position: [number, number, number];
}

export default function Gem({ position }: GemProps) {
  const gemRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  // Animate gem
  useFrame(({ clock }) => {
    if (!gemRef.current || !lightRef.current) return;
    
    // Rotate the gem
    gemRef.current.rotation.y = clock.elapsedTime * 0.5;
    
    // Make the gem float up and down
    gemRef.current.position.y = Math.sin(clock.elapsedTime) * 0.1 + 0.2;
    
    // Pulse the light
    lightRef.current.intensity = 1 + Math.sin(clock.elapsedTime * 2) * 0.3;
  });
  
  return (
    <group position={position}>
      {/* Gem sphere */}
      <Sphere ref={gemRef} args={[0.4, 16, 16]} castShadow receiveShadow>
        <meshStandardMaterial 
          color={BLOCK_COLORS.GEM}
          emissive={BLOCK_COLORS.GEM}
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
      
      {/* Light source */}
      <pointLight
        ref={lightRef}
        position={[0, 0.3, 0]}
        intensity={1}
        distance={2}
        color={BLOCK_COLORS.GEM}
      />
    </group>
  );
}

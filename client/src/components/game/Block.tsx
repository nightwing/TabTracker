import { useRef } from "react";
import { Box, Sphere } from "@react-three/drei";
import { useFrame, ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { BLOCK_COLORS } from "@/lib/constants";

interface BlockProps {
  position: [number, number, number];
  color: string;
  type: "regular" | "locked" | "gem";
  isActive?: boolean;
}

export default function Block({ position, color, type, isActive = false }: BlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Animate active blocks slightly
  useFrame((state) => {
    if (!meshRef.current || !isActive) return;
    
    // Subtle hover effect for active blocks
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 0.05;
  });
  
  // Render different block types
  if (type === "gem") {
    return (
      <group position={position}>
        {/* Glowing gem sphere */}
        <Sphere args={[0.4, 16, 16]} castShadow receiveShadow>
          <meshStandardMaterial 
            color={BLOCK_COLORS.GEM}
            emissive={BLOCK_COLORS.GEM}
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.8}
          />
        </Sphere>
        
        {/* Inner glow */}
        <pointLight
          position={[0, 0, 0]}
          intensity={1}
          distance={1.5}
          color={BLOCK_COLORS.GEM}
        />
      </group>
    );
  }
  
  return (
    <Box
      ref={meshRef}
      args={[0.9, 0.9, 0.9]} // Slightly smaller than the grid size for spacing
      position={position}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial 
        color={color} 
        roughness={type === "locked" ? 0.8 : 0.3}
        metalness={type === "locked" ? 0.1 : 0.4}
        opacity={type === "locked" ? 0.9 : 1}
        transparent={type === "locked"}
      />
      
      {/* Highlight for active blocks */}
      {isActive && (
        <Box args={[0.93, 0.93, 0.93]} position={[0, 0, 0]}>
          <meshBasicMaterial 
            color="white" 
            wireframe 
            transparent 
            opacity={0.3} 
          />
        </Box>
      )}
    </Box>
  );
}

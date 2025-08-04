/**
 * Microphone3D.tsx - 3D Microphone Component for Storyline
 * 
 * A Three.js-powered 3D microphone model that responds to voice states with 
 * animations for recording, processing, and other voice interaction states.
 * Designed for React Native with expo-three and optimized for performance.
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Mesh, Group, Color } from 'three';
import * as THREE from 'three';
import { useTheme } from '../../design-system/ThemeProvider';
import { VoiceStatus } from '../Voice/VoiceState';

// Extend Three.js objects for JSX use
extend(THREE);

interface Microphone3DProps {
  /** Current voice interaction state */
  state: VoiceStatus;
  /** Size of the 3D microphone (width/height in pixels) */
  size?: number;
  /** Whether to auto-rotate when not recording */
  autoRotate?: boolean;
  /** Audio level for waveform animation (0-100) */
  audioLevel?: number;
  /** Callback when microphone is pressed */
  onPress?: () => void;
  /** Enable/disable animations */
  animated?: boolean;
  /** Camera distance from microphone */
  cameraDistance?: number;
}

interface MicrophoneModelProps {
  state: VoiceStatus;
  autoRotate: boolean;
  audioLevel: number;
  colors: any;
  animated: boolean;
}

/**
 * 3D Microphone Model Component
 * Handles the actual Three.js geometry and animations
 */
const MicrophoneModel: React.FC<MicrophoneModelProps> = ({
  state,
  autoRotate,
  audioLevel,
  colors,
  animated,
}) => {
  const groupRef = useRef<Group>(null);
  const micBodyRef = useRef<Mesh>(null);
  const waveRefs = useRef<Mesh[]>([]);
  const particleRefs = useRef<Mesh[]>([]);
  const glowRef = useRef<Mesh>(null);

  // Animation frame handler
  useFrame((_, delta) => {
    if (!animated) return;

    const time = Date.now() * 0.001;

    // Auto-rotation when not actively recording
    if (groupRef.current && autoRotate && state !== 'recording') {
      groupRef.current.rotation.y += delta * 0.3;
    }

    // Microphone body animations
    if (micBodyRef.current) {
      switch (state) {
        case 'recording':
          // Gentle pulsing during recording
          const recordingScale = 1 + Math.sin(time * 3) * 0.05;
          micBodyRef.current.scale.setScalar(recordingScale);
          break;
        case 'processing':
          // Faster pulsing during processing
          const processingScale = 1 + Math.sin(time * 6) * 0.08;
          micBodyRef.current.scale.setScalar(processingScale);
          break;
        case 'thinking':
          // Gentle sway during AI thinking
          micBodyRef.current.rotation.z = Math.sin(time * 2) * 0.1;
          break;
        case 'speaking':
          // Rhythmic movement during AI speaking
          const speakingScale = 1 + Math.sin(time * 4) * 0.03;
          micBodyRef.current.scale.setScalar(speakingScale);
          micBodyRef.current.rotation.z = Math.sin(time * 3) * 0.05;
          break;
        default:
          // Return to normal state
          micBodyRef.current.scale.setScalar(1);
          micBodyRef.current.rotation.z = 0;
      }
    }

    // Sound wave animations for recording state
    if (state === 'recording') {
      waveRefs.current.forEach((wave, index) => {
        if (wave) {
          wave.rotation.z += delta * (2 + index * 0.5);
          const baseScale = 1 + index * 0.3;
          const audioInfluence = (audioLevel / 100) * 0.5;
          const waveScale = baseScale + Math.sin(time * 4 + index) * (0.2 + audioInfluence);
          wave.scale.setScalar(waveScale);
          
          // Opacity based on audio level
          if (wave.material && 'opacity' in wave.material) {
            (wave.material as any).opacity = 0.3 + (audioLevel / 100) * 0.4;
          }
        }
      });
    }

    // Particle effects for processing state
    if (state === 'processing' || state === 'thinking') {
      particleRefs.current.forEach((particle, index) => {
        if (particle) {
          particle.rotation.x += delta * (1 + index * 0.2);
          particle.rotation.y += delta * (0.8 + index * 0.15);
          const floatHeight = Math.sin(time * 2 + index) * 0.3;
          particle.position.y = 1.5 + floatHeight;
        }
      });
    }

    // Glow effect animation
    if (glowRef.current) {
      const glowIntensity = getGlowIntensity(state, audioLevel, time);
      if (glowRef.current.material && 'opacity' in glowRef.current.material) {
        (glowRef.current.material as any).opacity = glowIntensity;
      }
    }
  });

  // Helper function to determine glow intensity
  const getGlowIntensity = (state: VoiceStatus, audioLevel: number, time: number): number => {
    switch (state) {
      case 'recording':
        return 0.2 + (audioLevel / 100) * 0.3 + Math.sin(time * 3) * 0.1;
      case 'processing':
        return 0.4 + Math.sin(time * 6) * 0.2;
      case 'thinking':
        return 0.3 + Math.sin(time * 2) * 0.15;
      case 'speaking':
        return 0.35 + Math.sin(time * 4) * 0.1;
      case 'listening':
        return 0.15 + Math.sin(time * 1.5) * 0.05;
      default:
        return 0.1;
    }
  };

  // Materials based on current state and theme
  const materials = useMemo(() => {
    const getStateColor = (state: VoiceStatus): string => {
      switch (state) {
        case 'recording':
          return colors.gentleSage;
        case 'processing':
          return colors.warmOchre;
        case 'thinking':
          return colors.warmOchre;
        case 'speaking':
          return colors.softPlum;
        case 'listening':
          return colors.gentleSage;
        case 'error':
          return colors.error;
        case 'offline':
          return colors.slateGray;
        default:
          return colors.softPlum;
      }
    };

    const stateColor = getStateColor(state);

    return {
      primary: new THREE.MeshPhysicalMaterial({
        color: new Color(stateColor),
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1,
      }),
      accent: new THREE.MeshPhysicalMaterial({
        color: new Color(colors.warmOchre),
        metalness: 0.2,
        roughness: 0.3,
        clearcoat: 0.2,
        envMapIntensity: 0.8,
      }),
      glow: new THREE.MeshBasicMaterial({
        color: new Color(stateColor),
        transparent: true,
        opacity: 0.2,
      }),
      wave: new THREE.MeshBasicMaterial({
        color: new Color(colors.gentleSage),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      }),
      particle: new THREE.MeshBasicMaterial({
        color: new Color(colors.warmOchre),
        transparent: true,
        opacity: 0.6,
      }),
    };
  }, [state, colors]);

  return (
    <group ref={groupRef}>
      {/* Lighting Setup */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.6}
        color={colors.softPlum}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-3, -2, 2]}
        intensity={0.3}
        color={colors.warmOchre}
      />
      <pointLight
        position={[0, 2, 0]}
        intensity={0.5}
        color={colors.gentleSage}
        distance={10}
        decay={2}
      />

      {/* Main Microphone Body */}
      <mesh
        ref={micBodyRef}
        position={[0, 0.3, 0]}
        material={materials.primary}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.4, 0.4, 1.2, 32]} />
      </mesh>

      {/* Top Hemisphere Cap */}
      <mesh position={[0, 0.9, 0]} material={materials.primary} castShadow>
        <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* Bottom Hemisphere Cap */}
      <mesh position={[0, -0.3, 0]} material={materials.primary} castShadow>
        <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>

      {/* Grille Details */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={`grille-${i}`}
          position={[0, 0.7 - (i * 0.12), 0]}
          material={materials.accent}
          castShadow
        >
          <torusGeometry args={[0.38, 0.015, 8, 32]} />
        </mesh>
      ))}

      {/* Microphone Stand */}
      <mesh position={[0, -0.5, 0]} material={materials.primary} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.0, 16]} />
      </mesh>

      {/* Base Platform */}
      <mesh position={[0, -1.05, 0]} material={materials.primary} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
      </mesh>

      {/* Base Ring Detail */}
      <mesh position={[0, -1.0, 0]} material={materials.accent} castShadow>
        <torusGeometry args={[0.32, 0.02, 8, 32]} />
      </mesh>

      {/* Glow Effect */}
      <mesh ref={glowRef} position={[0, 0.3, 0]} material={materials.glow}>
        <sphereGeometry args={[0.8, 32, 32]} />
      </mesh>

      {/* Sound Waves for Recording State */}
      {state === 'recording' &&
        Array.from({ length: 3 }, (_, i) => (
          <mesh
            key={`wave-${i}`}
            ref={(el) => el && (waveRefs.current[i] = el)}
            position={[0, 0.3, 0]}
            material={materials.wave}
          >
            <torusGeometry args={[1.2 + i * 0.4, 0.02, 8, 64]} />
          </mesh>
        ))}

      {/* Floating Particles for Processing States */}
      {(state === 'processing' || state === 'thinking') &&
        Array.from({ length: 6 }, (_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const radius = 1.5;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          return (
            <mesh
              key={`particle-${i}`}
              ref={(el) => el && (particleRefs.current[i] = el)}
              position={[x, 1.5, z]}
              material={materials.particle}
            >
              <sphereGeometry args={[0.03, 8, 8]} />
            </mesh>
          );
        })}

      {/* Error State Indicator */}
      {state === 'error' && (
        <mesh position={[0, 1.2, 0]} material={materials.particle}>
          <octahedronGeometry args={[0.1]} />
        </mesh>
      )}
    </group>
  );
};

/**
 * Main Microphone3D Component
 * Provides the Canvas wrapper and manages props
 */
export const Microphone3D: React.FC<Microphone3DProps> = ({
  state,
  size = 200,
  autoRotate = true,
  audioLevel = 0,
  onPress,
  animated = true,
  cameraDistance = 4,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 10,
      overflow: 'hidden',
    },
  });

  // Handle press events if provided
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <View style={styles.container}>
      <Canvas
        camera={{
          position: [0, 0, cameraDistance],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        shadows
        onPointerDown={handlePress}
      >
        {/* Scene Setup */}
        <color attach="background" args={['transparent']} />
        <fog attach="fog" args={[theme.colors.background, 5, 15]} />

        {/* 3D Microphone Model */}
        <MicrophoneModel
          state={state}
          autoRotate={autoRotate}
          audioLevel={audioLevel}
          colors={theme.colors}
          animated={animated}
        />
      </Canvas>
    </View>
  );
};

export default Microphone3D;
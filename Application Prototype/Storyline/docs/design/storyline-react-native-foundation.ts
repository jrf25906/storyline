// package.json - React Native dependencies
{
  "name": "storyline-app",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~49.0.15",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "react-native-reanimated": "~3.3.0",
    "expo-gl": "~13.2.0",
    "expo-gl-cpp": "~13.2.0",
    "three": "^0.155.0",
    "expo-three": "~7.0.0",
    "@react-three/fiber": "^8.13.0",
    "@react-three/drei": "^9.77.0",
    "expo-av": "~13.4.1",
    "expo-speech": "~11.3.0",
    "react-native-voice": "^3.2.4",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/bottom-tabs": "^6.5.8",
    "react-native-gesture-handler": "~2.12.0",
    "react-native-safe-area-context": "4.6.3",
    "react-native-screens": "~3.22.0",
    "styled-components": "^6.0.7",
    "@types/styled-components-react-native": "^5.2.1"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.14",
    "@types/three": "^0.155.0",
    "typescript": "^5.1.3"
  }
}

// ===================================================================

// src/design-system/tokens.ts - Design System Foundation
export const colors = {
  light: {
    // Primary Brand Colors
    inkBlack: '#1B1C1E',
    parchmentWhite: '#FDFBF7',
    softPlum: '#8854D0',
    warmOchre: '#E4B363',
    slateGray: '#6E7076',
    
    // Supporting Colors
    gentleSage: '#A8C090',
    whisperGray: '#F5F4F2',
    deepPlum: '#6B3FA0',
    warningAmber: '#F4A261',
    softBlush: '#F2E8E5',
    
    // Semantic Colors
    success: '#A8C090',
    warning: '#F4A261',
    error: '#E94B3C',
    info: '#8854D0',
    safeSpace: '#F2E8E5',
  },
  
  dark: {
    inkBlack: '#000000',
    parchmentWhite: '#1A1A1A',
    softPlum: '#9A6FE0',
    warmOchre: '#F2C679',
    slateGray: '#8A8A8A',
    gentleSage: '#A8C090',
    whisperGray: '#2A2A2A',
    deepPlum: '#9A6FE0',
    warningAmber: '#F4A261',
    softBlush: 'rgba(242, 232, 229, 0.1)',
    accentGlow: 'rgba(154, 111, 224, 0.3)',
    success: '#A8C090',
    warning: '#F4A261',
    error: '#E94B3C',
    info: '#9A6FE0',
    safeSpace: 'rgba(242, 232, 229, 0.1)',
  }
};

export const typography = {
  families: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    display: 'Playfair Display, Georgia, serif',
    monospace: 'SF Mono, Monaco, Inconsolata, monospace',
  },
  
  sizes: {
    display: { fontSize: 34, fontWeight: '700' as const, lineHeight: 40.8 },
    headline: { fontSize: 28, fontWeight: '600' as const, lineHeight: 36.4 },
    title: { fontSize: 22, fontWeight: '600' as const, lineHeight: 30.8 },
    bodyLarge: { fontSize: 17, fontWeight: '400' as const, lineHeight: 25.5 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
    caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18.2 },
    label: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14.3 },
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  components: {
    buttonPadding: { horizontal: 16, vertical: 12 },
    cardPadding: { horizontal: 16, vertical: 16 },
    screenMargin: { horizontal: 16, vertical: 0 },
    safeAreaPadding: { top: 44, bottom: 34 },
  },
  
  voice: {
    recordingButtonSize: 80,
    waveformHeight: 60,
    conversationBubbleSpacing: 12,
    voiceCommandMargin: 8,
  }
};

export const animations = {
  duration: {
    immediate: 100,
    fast: 200,
    moderate: 300,
    slow: 500,
    emotional: 800,
  },
  
  easing: {
    linear: 'linear',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  }
};

// ===================================================================

// src/design-system/ThemeProvider.tsx - Theme Management
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { colors, typography, spacing, animations } from './tokens';

interface Theme {
  colors: typeof colors.light;
  typography: typeof typography;
  spacing: typeof spacing;
  animations: typeof animations;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const theme: Theme = {
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    animations,
    isDark,
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ===================================================================

// src/components/Voice/VoiceState.ts - Voice State Management
export type VoiceStatus = 
  | 'idle'
  | 'listening'
  | 'recording'
  | 'processing'
  | 'thinking'
  | 'speaking'
  | 'paused'
  | 'error'
  | 'offline';

export interface VoiceState {
  status: VoiceStatus;
  audioLevel: number;
  confidence: number;
  processingTime: number;
  transcript: string;
  error?: string;
}

export interface RecordingConfig {
  sampleRate: number;
  channels: number;
  encoding: string;
  maxDuration?: number;
  emotionalSafetyMode?: boolean;
}

// ===================================================================

// src/components/3D/Microphone3D.tsx - 3D Microphone Component
import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';
import * as THREE from 'three';
import { useTheme } from '../../design-system/ThemeProvider';
import { VoiceStatus } from '../Voice/VoiceState';

interface Microphone3DProps {
  state: VoiceStatus;
  size?: number;
  autoRotate?: boolean;
  onPress?: () => void;
}

const MicrophoneModel: React.FC<{
  state: VoiceStatus;
  autoRotate: boolean;
  colors: any;
}> = ({ state, autoRotate, colors }) => {
  const groupRef = useRef<Group>(null);
  const waveRefs = useRef<Mesh[]>([]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.5;
    }

    // Animate sound waves for recording state
    if (state === 'recording') {
      waveRefs.current.forEach((wave, index) => {
        if (wave) {
          wave.rotation.z += delta * 2;
          const scale = 1 + Math.sin(Date.now() * 0.01 + index) * 0.1;
          wave.scale.setScalar(scale);
        }
      });
    }
  });

  // Materials
  const primaryMaterial = new THREE.MeshPhysicalMaterial({
    color: state === 'recording' ? colors.gentleSage : colors.softPlum,
    metalness: 0.1,
    roughness: 0.2,
    clearcoat: 0.3,
    clearcoatRoughness: 0.1,
  });

  const accentMaterial = new THREE.MeshPhysicalMaterial({
    color: colors.warmOchre,
    metalness: 0.2,
    roughness: 0.3,
    clearcoat: 0.2,
  });

  const recordingMaterial = new THREE.MeshPhysicalMaterial({
    color: colors.gentleSage,
    metalness: 0.1,
    roughness: 0.2,
    emissive: new THREE.Color(colors.gentleSage),
    emissiveIntensity: state === 'recording' ? 0.3 : 0,
  });

  return (
    <group ref={groupRef}>
      {/* Ambient lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.4}
        color={colors.softPlum}
        castShadow
      />
      <directionalLight
        position={[-3, -2, 2]}
        intensity={0.2}
        color={colors.warmOchre}
      />

      {/* Microphone main body (cylinder + hemisphere caps) */}
      <mesh position={[0, 0.3, 0]} material={primaryMaterial} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 1.2, 16]} />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 0.9, 0]} material={primaryMaterial} castShadow>
        <sphereGeometry args={[0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* Bottom cap */}
      <mesh position={[0, -0.3, 0]} material={primaryMaterial} castShadow>
        <sphereGeometry args={[0.4, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>

      {/* Grille details */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          position={[0, 0.3 + (i * 0.15) - 0.4, 0]}
          material={accentMaterial}
          castShadow
        >
          <torusGeometry args={[0.35, 0.02, 8, 16]} />
        </mesh>
      ))}

      {/* Stand */}
      <mesh position={[0, -0.4, 0]} material={primaryMaterial} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
      </mesh>

      {/* Base */}
      <mesh position={[0, -0.85, 0]} material={primaryMaterial} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
      </mesh>

      {/* Sound waves for recording state */}
      {state === 'recording' &&
        Array.from({ length: 3 }, (_, i) => (
          <mesh
            key={`wave-${i}`}
            ref={(el) => el && (waveRefs.current[i] = el)}
            position={[0, 0.3, 0]}
            material={recordingMaterial}
          >
            <torusGeometry args={[1 + i * 0.5, 0.02, 8, 32]} />
          </mesh>
        ))}
    </group>
  );
};

export const Microphone3D: React.FC<Microphone3DProps> = ({
  state,
  size = 200,
  autoRotate = true,
  onPress,
}) => {
  const { theme } = useTheme();

  return (
    <View style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        <MicrophoneModel
          state={state}
          autoRotate={autoRotate}
          colors={theme.colors}
        />
      </Canvas>
    </View>
  );
};

// ===================================================================

// src/components/UI/RecordingButton.tsx - Main Recording Interface
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import { Microphone3D } from '../3D/Microphone3D';
import { useTheme } from '../../design-system/ThemeProvider';
import { VoiceStatus } from '../Voice/VoiceState';

interface RecordingButtonProps {
  onRecordingStateChange?: (state: VoiceStatus) => void;
  emotionalSafetyMode?: boolean;
  maxDuration?: number;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  onRecordingStateChange,
  emotionalSafetyMode = false,
  maxDuration = 300, // 5 minutes
}) => {
  const { theme } = useTheme();
  const [voiceState, setVoiceState] = useState<VoiceStatus>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Simulate recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (voiceState === 'recording') {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            handleStateChange('processing');
            return prev;
          }
          return newTime;
        });
        
        // Simulate audio level changes
        setAudioLevel(Math.random() * 100);
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [voiceState, maxDuration]);

  // Pulse animation for recording state
  useEffect(() => {
    if (voiceState === 'recording') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [voiceState, scaleAnim]);

  const handleStateChange = useCallback((newState: VoiceStatus) => {
    setVoiceState(newState);
    onRecordingStateChange?.(newState);
    
    // Haptic feedback
    if (newState === 'recording' || newState === 'idle') {
      Vibration.vibrate(50);
    }
  }, [onRecordingStateChange]);

  const handlePress = useCallback(() => {
    switch (voiceState) {
      case 'idle':
        setRecordingTime(0);
        handleStateChange('recording');
        break;
      case 'recording':
        handleStateChange('processing');
        break;
      case 'paused':
        handleStateChange('recording');
        break;
      case 'processing':
        // Can't interrupt processing
        break;
      default:
        handleStateChange('idle');
    }
  }, [voiceState, handleStateChange]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 600);
    const secs = Math.floor((seconds % 600) / 10);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    microphoneContainer: {
      marginBottom: theme.spacing.md,
    },
    button: {
      width: theme.spacing.voice.recordingButtonSize,
      height: theme.spacing.voice.recordingButtonSize,
      borderRadius: theme.spacing.voice.recordingButtonSize / 2,
      backgroundColor: voiceState === 'recording' 
        ? theme.colors.gentleSage 
        : theme.colors.softPlum,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.softPlum,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.whisperGray,
      shadowOpacity: 0.1,
    },
    timer: {
      ...theme.typography.sizes.body,
      color: theme.colors.slateGray,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    stateText: {
      ...theme.typography.sizes.caption,
      color: theme.colors.slateGray,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
      textTransform: 'capitalize',
    },
    waveform: {
      height: theme.spacing.voice.waveformHeight,
      backgroundColor: voiceState === 'recording' 
        ? `${theme.colors.gentleSage}20` 
        : `${theme.colors.whisperGray}`,
      borderRadius: 12,
      marginTop: theme.spacing.md,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {/* 3D Microphone */}
      <Animated.View 
        style={[
          styles.microphoneContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <Microphone3D
          state={voiceState}
          size={160}
          autoRotate={voiceState !== 'recording'}
        />
      </Animated.View>

      {/* Recording Button */}
      <Pressable
        style={[
          styles.button,
          voiceState === 'processing' && styles.buttonDisabled
        ]}
        onPress={handlePress}
        disabled={voiceState === 'processing'}
        accessibilityLabel={`Recording button, currently ${voiceState}`}
        accessibilityHint="Tap to start or stop recording"
      >
        {voiceState === 'recording' && (
          <View
            style={{
              width: 24,
              height: 24,
              backgroundColor: theme.colors.parchmentWhite,
              borderRadius: 4,
            }}
          />
        )}
      </Pressable>

      {/* Timer */}
      <Text style={styles.timer}>
        {formatTime(recordingTime)}
      </Text>

      {/* State indicator */}
      <Text style={styles.stateText}>
        {voiceState === 'processing' ? 'Transcribing...' : voiceState}
      </Text>

      {/* Waveform visualization */}
      {voiceState === 'recording' && (
        <View style={styles.waveform}>
          <Text style={styles.stateText}>
            Audio Level: {Math.round(audioLevel)}%
          </Text>
        </View>
      )}
    </View>
  );
};

// ===================================================================

// src/components/Safety/SafeSpaceIndicator.tsx - Emotional Safety Component
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../design-system/ThemeProvider';

interface SafeSpaceIndicatorProps {
  isActive: boolean;
  message?: string;
  onBreakRequested?: () => void;
}

export const SafeSpaceIndicator: React.FC<SafeSpaceIndicatorProps> = ({
  isActive,
  message = 'Safe space active',
  onBreakRequested,
}) => {
  const { theme } = useTheme();

  if (!isActive) return null;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.safeSpace,
      borderRadius: 12,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.warmOchre,
      marginRight: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    title: {
      ...theme.typography.sizes.caption,
      fontWeight: '600',
      color: theme.colors.inkBlack,
      marginBottom: 2,
    },
    subtitle: {
      ...theme.typography.sizes.caption,
      color: theme.colors.slateGray,
      fontSize: 11,
    },
    breakButton: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.whisperGray,
      backgroundColor: theme.colors.parchmentWhite,
    },
    breakText: {
      ...theme.typography.sizes.caption,
      color: theme.colors.slateGray,
      fontSize: 11,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Text style={{ fontSize: 12 }}>🛡️</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Safe space active</Text>
        <Text style={styles.subtitle}>Your story is private & secure</Text>
      </View>

      {onBreakRequested && (
        <Pressable 
          style={styles.breakButton}
          onPress={onBreakRequested}
          accessibilityLabel="Take a break"
          accessibilityHint="Pause your session for self-care"
        >
          <Text style={styles.breakText}>Take a break</Text>
        </Pressable>
      )}
    </View>
  );
};

// ===================================================================

// App.tsx - Main Application Entry Point
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, SafeAreaView, Text } from 'react-native';
import { ThemeProvider, useTheme } from './src/design-system/ThemeProvider';
import { RecordingButton } from './src/components/UI/RecordingButton';
import { SafeSpaceIndicator } from './src/components/Safety/SafeSpaceIndicator';
import { VoiceStatus } from './src/components/Voice/VoiceState';

const StorylineApp: React.FC = () => {
  const { theme } = useTheme();
  const [voiceState, setVoiceState] = React.useState<VoiceStatus>('idle');

  const handleRecordingStateChange = (newState: VoiceStatus) => {
    setVoiceState(newState);
    console.log('Voice state changed to:', newState);
  };

  const handleBreakRequested = () => {
    console.log('Break requested - implement emotional safety pause');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.parchmentWhite,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    title: {
      ...theme.typography.sizes.headline,
      color: theme.colors.inkBlack,
      fontWeight: '700',
    },
    subtitle: {
      ...theme.typography.sizes.body,
      color: theme.colors.slateGray,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    mainContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Storyline</Text>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.softPlum,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ color: theme.colors.parchmentWhite, fontWeight: 'bold' }}>
              S
            </Text>
          </View>
        </View>

        {/* Safe Space Indicator */}
        <SafeSpaceIndicator
          isActive={true}
          onBreakRequested={handleBreakRequested}
        />

        <Text style={styles.subtitle}>
          Your voice. Your story. Structured.
        </Text>

        {/* Main Recording Interface */}
        <View style={styles.mainContent}>
          <RecordingButton
            onRecordingStateChange={handleRecordingStateChange}
            emotionalSafetyMode={true}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <StorylineApp />
    </ThemeProvider>
  );
}

// ===================================================================

// expo install instructions and setup commands:
/*
1. Initialize Expo project:
   npx create-expo-app storyline-app --template typescript

2. Install dependencies:
   expo install expo-gl expo-gl-cpp expo-three expo-av expo-speech
   npm install three @react-three/fiber @react-three/drei
   npm install react-native-voice @react-navigation/native @react-navigation/bottom-tabs
   npm install react-native-gesture-handler react-native-reanimated
   npm install react-native-safe-area-context react-native-screens
   npm install styled-components @types/styled-components-react-native

3. Configure app.json:
   Add permissions for microphone and speech recognition

4. Run the app:
   expo start
*/
/**
 * RecordingButton.tsx - Comprehensive Voice Recording Button Component
 * 
 * Features:
 * - Voice state animations with haptic feedback
 * - Integration with 3D microphone component
 * - Real-time recording timer and audio level visualization
 * - Emotional safety indicators and crisis detection
 * - Full accessibility support with screen reader compatibility
 * - Storyline design system integration
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Vibration,
  Platform,
  AccessibilityInfo,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useColors, useSpacing, useSafetyTheme } from '../../design-system/ThemeProvider';
import { 
  VoiceStatus, 
  VoiceState, 
  EmotionalIndicators,
  isRecordingActive,
  isProcessingState,
  getStatusDisplayName,
  getStatusColor,
  isEmotionalDistressDetected,
} from '../Voice/VoiceState';

// Props interface for the RecordingButton component
interface RecordingButtonProps {
  /** Current voice state */
  voiceState?: VoiceState;
  
  /** Callback when recording state changes */
  onRecordingStateChange?: (state: VoiceStatus) => void;
  
  /** Callback when recording starts */
  onStartRecording?: () => void;
  
  /** Callback when recording stops */
  onStopRecording?: () => void;
  
  /** Callback when recording is paused */
  onPauseRecording?: () => void;
  
  /** Callback when user requests emergency stop */
  onEmergencyStop?: () => void;
  
  /** Whether emotional safety mode is active */
  emotionalSafetyMode?: boolean;
  
  /** Maximum recording duration in seconds */
  maxDuration?: number;
  
  /** Whether to show waveform visualization */
  showWaveform?: boolean;
  
  /** Whether to enable haptic feedback */
  enableHaptics?: boolean;
  
  /** Custom button size */
  size?: number;
  
  /** Whether button is disabled */
  disabled?: boolean;
  
  /** Accessibility label override */
  accessibilityLabel?: string;
  
  /** Accessibility hint override */
  accessibilityHint?: string;
}

// Default props values
const defaultProps: Partial<RecordingButtonProps> = {
  emotionalSafetyMode: true,
  maxDuration: 300, // 5 minutes
  showWaveform: true,
  enableHaptics: true,
  size: 80,
  disabled: false,
};

export const RecordingButton: React.FC<RecordingButtonProps> = (props) => {
  const {
    voiceState,
    onRecordingStateChange,
    onStartRecording,
    onStopRecording,
    onPauseRecording,
    onEmergencyStop,
    emotionalSafetyMode,
    maxDuration,
    showWaveform,
    enableHaptics,
    size,
    disabled,
    accessibilityLabel,
    accessibilityHint,
  } = { ...defaultProps, ...props };

  // Theme and design system hooks
  const { theme } = useTheme();
  const colors = useColors();
  const spacing = useSpacing();
  const safetyTheme = useSafetyTheme();

  // Component state
  const [localVoiceState, setLocalVoiceState] = useState<VoiceStatus>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevelData, setAudioLevelData] = useState<number[]>([]);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  // Animation references
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const waveformAnims = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.1))
  ).current;

  // Timer reference for recording duration
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const waveformTimer = useRef<NodeJS.Timeout | null>(null);

  // Current voice status - use prop if available, otherwise local state
  const currentStatus = voiceState?.status || localVoiceState;
  const currentAudioLevel = voiceState?.audioLevel || 0;
  const emotionalIndicators = voiceState?.emotionalIndicators;

  // Check for screen reader on mount
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);
    
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => subscription?.remove();
  }, []);

  // Recording duration timer
  useEffect(() => {
    if (isRecordingActive(currentStatus)) {
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 0.1;
          
          // Auto-stop at max duration
          if (newDuration >= (maxDuration || 300)) {
            handleStopRecording();
            return prev;
          }
          
          return newDuration;
        });
      }, 100);
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      
      if (currentStatus === 'idle') {
        setRecordingDuration(0);
      }
    }

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [currentStatus, maxDuration]);

  // Waveform animation for audio visualization
  useEffect(() => {
    if (currentStatus === 'recording') {
      waveformTimer.current = setInterval(() => {
        // Simulate or use real audio level data
        const newLevel = currentAudioLevel || Math.random() * 100;
        
        setAudioLevelData(prev => {
          const newData = [...prev, newLevel];
          return newData.slice(-20); // Keep last 20 data points
        });

        // Animate waveform bars
        waveformAnims.forEach((anim, index) => {
          const targetValue = audioLevelData[index] ? audioLevelData[index] / 100 : 0.1;
          
          Animated.timing(anim, {
            toValue: targetValue,
            duration: 150,
            useNativeDriver: false,
          }).start();
        });
      }, 100);
    } else {
      if (waveformTimer.current) {
        clearInterval(waveformTimer.current);
        waveformTimer.current = null;
      }
      
      // Reset waveform to idle state
      waveformAnims.forEach(anim => {
        Animated.timing(anim, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      if (waveformTimer.current) {
        clearInterval(waveformTimer.current);
      }
    };
  }, [currentStatus, currentAudioLevel, audioLevelData]);

  // Main button animations based on voice state
  useEffect(() => {
    if (currentStatus === 'recording') {
      // Pulsing animation during recording
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Glow effect
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );

      pulseAnimation.start();
      glowAnimation.start();

      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
      };
    } else if (isProcessingState(currentStatus)) {
      // Gentle scale animation during processing
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      scaleAnimation.start();
      return () => scaleAnimation.stop();
    } else {
      // Reset to default state
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [currentStatus]);

  // Haptic feedback handler
  const triggerHapticFeedback = useCallback((pattern: 'light' | 'medium' | 'heavy' | 'error') => {
    if (!enableHaptics) return;

    if (Platform.OS === 'ios') {
      // iOS haptic feedback
      const { ImpactFeedbackGenerator, NotificationFeedbackGenerator } = require('expo-haptics');
      
      switch (pattern) {
        case 'light':
          ImpactFeedbackGenerator.impactAsync('light');
          break;
        case 'medium':
          ImpactFeedbackGenerator.impactAsync('medium');
          break;
        case 'heavy':
          ImpactFeedbackGenerator.impactAsync('heavy');
          break;
        case 'error':
          NotificationFeedbackGenerator.notificationAsync('error');
          break;
      }
    } else {
      // Android vibration patterns
      const patterns = {
        light: [0, 50],
        medium: [0, 100],
        heavy: [0, 200],
        error: [0, 100, 50, 100],
      };
      
      Vibration.vibrate(patterns[pattern]);
    }
  }, [enableHaptics]);

  // Handle recording state changes
  const handleStateChange = useCallback((newState: VoiceStatus) => {
    setLocalVoiceState(newState);
    onRecordingStateChange?.(newState);

    // Trigger appropriate haptic feedback
    switch (newState) {
      case 'recording':
        triggerHapticFeedback('medium');
        break;
      case 'idle':
        triggerHapticFeedback('light');
        break;
      case 'error':
        triggerHapticFeedback('error');
        break;
      default:
        triggerHapticFeedback('light');
    }
  }, [onRecordingStateChange, triggerHapticFeedback]);

  // Recording control handlers
  const handleStartRecording = useCallback(() => {
    if (disabled) return;
    
    handleStateChange('recording');
    onStartRecording?.();
  }, [disabled, handleStateChange, onStartRecording]);

  const handleStopRecording = useCallback(() => {
    if (isRecordingActive(currentStatus)) {
      handleStateChange('processing');
      onStopRecording?.();
    }
  }, [currentStatus, handleStateChange, onStopRecording]);

  const handlePauseRecording = useCallback(() => {
    if (currentStatus === 'recording') {
      handleStateChange('paused');
      onPauseRecording?.();
    } else if (currentStatus === 'paused') {
      handleStateChange('recording');
      onStartRecording?.();
    }
  }, [currentStatus, handleStateChange, onPauseRecording, onStartRecording]);

  const handleEmergencyStop = useCallback(() => {
    handleStateChange('idle');
    triggerHapticFeedback('error');
    onEmergencyStop?.();
    
    Alert.alert(
      'Recording Stopped',
      'Recording has been stopped. Take your time.',
      [{ text: 'OK', style: 'default' }]
    );
  }, [handleStateChange, triggerHapticFeedback, onEmergencyStop]);

  // Main button press handler
  const handlePress = useCallback(() => {
    if (disabled) return;

    switch (currentStatus) {
      case 'idle':
        handleStartRecording();
        break;
      case 'recording':
        handleStopRecording();
        break;
      case 'paused':
        handleStartRecording();
        break;
      case 'processing':
      case 'thinking':
      case 'speaking':
        // Cannot interrupt these states
        break;
      case 'error':
        handleStateChange('idle');
        break;
      default:
        handleStateChange('idle');
    }
  }, [disabled, currentStatus, handleStartRecording, handleStopRecording, handleStateChange]);

  // Long press handler for emergency stop
  const handleLongPress = useCallback(() => {
    if (emotionalSafetyMode && isRecordingActive(currentStatus)) {
      handleEmergencyStop();
    }
  }, [emotionalSafetyMode, currentStatus, handleEmergencyStop]);

  // Format recording time for display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Determine button colors based on state
  const getButtonColors = useCallback(() => {
    if (disabled) {
      return {
        background: colors.whisperGray,
        border: colors.whisperGray,
        glow: 'transparent',
      };
    }

    switch (currentStatus) {
      case 'recording':
        return {
          background: colors.gentleSage,
          border: colors.gentleSage,
          glow: colors.gentleSage + '40',
        };
      case 'processing':
      case 'thinking':
        return {
          background: colors.warmOchre,
          border: colors.warmOchre,
          glow: colors.warmOchre + '30',
        };
      case 'error':
        return {
          background: colors.error,
          border: colors.error,
          glow: colors.error + '40',
        };
      case 'paused':
        return {
          background: colors.slateGray,
          border: colors.slateGray,
          glow: 'transparent',
        };
      default:
        return {
          background: colors.softPlum,
          border: colors.softPlum,
          glow: colors.softPlum + '20',
        };
    }
  }, [currentStatus, disabled, colors]);

  // Check for emotional distress
  const isDistressed = emotionalSafetyMode && isEmotionalDistressDetected(emotionalIndicators);

  // Dynamic styles
  const buttonColors = getButtonColors();
  
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    buttonContainer: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    glowContainer: {
      position: 'absolute',
      width: (size || 80) + 40,
      height: (size || 80) + 40,
      borderRadius: ((size || 80) + 40) / 2,
      opacity: glowAnim,
    },
    button: {
      width: size || 80,
      height: size || 80,
      borderRadius: (size || 80) / 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: buttonColors.border,
      ...theme.shadows.lg,
    },
    buttonContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    stopIcon: {
      width: 24,
      height: 24,
      backgroundColor: colors.parchmentWhite,
      borderRadius: 4,
    },
    pauseIcon: {
      flexDirection: 'row',
      gap: 4,
    },
    pauseBar: {
      width: 6,
      height: 24,
      backgroundColor: colors.parchmentWhite,
      borderRadius: 3,
    },
    timer: {
      ...theme.typography.sizes.body,
      color: colors.text,
      marginTop: spacing.sm,
      textAlign: 'center',
      fontWeight: '600',
    },
    statusText: {
      ...theme.typography.sizes.caption,
      color: colors.slateGray,
      marginTop: spacing.xs,
      textAlign: 'center',
      textTransform: 'capitalize',
    },
    waveformContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 60,
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
      gap: 2,
    },
    waveformBar: {
      width: 3,
      backgroundColor: colors.softPlum,
      borderRadius: 1.5,
      minHeight: 4,
    },
    safetyIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: isDistressed ? safetyTheme.emotional.concern + '20' : safetyTheme.safeSpace.backgroundColor,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDistressed ? safetyTheme.emotional.concern : safetyTheme.safeSpace.borderColor,
    },
    safetyIcon: {
      marginRight: spacing.xs,
    },
    safetyText: {
      ...theme.typography.sizes.caption,
      color: isDistressed ? safetyTheme.emotional.concern : safetyTheme.safeSpace.textColor,
      fontWeight: '500',
    },
    emergencyButton: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.error + '10',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.error + '40',
    },
    emergencyText: {
      ...theme.typography.sizes.caption,
      color: colors.error,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  // Accessibility props
  const accessibilityProps = {
    accessibilityRole: 'button' as const,
    accessibilityLabel: accessibilityLabel || `Recording button, currently ${getStatusDisplayName(currentStatus)}`,
    accessibilityHint: accessibilityHint || (
      currentStatus === 'idle' 
        ? 'Tap to start recording'
        : currentStatus === 'recording'
        ? 'Tap to stop recording, long press for emergency stop'
        : currentStatus === 'paused'
        ? 'Tap to resume recording'
        : 'Button currently processing'
    ),
    accessibilityState: {
      disabled: disabled || isProcessingState(currentStatus),
      selected: isRecordingActive(currentStatus),
    },
    accessibilityActions: [
      { name: 'activate', label: 'Toggle recording' },
      ...(emotionalSafetyMode && isRecordingActive(currentStatus) 
        ? [{ name: 'longpress', label: 'Emergency stop' }] 
        : []
      ),
    ],
  };

  return (
    <View style={styles.container}>
      {/* Main Button */}
      <View style={styles.buttonContainer}>
        {/* Glow effect */}
        <Animated.View style={[styles.glowContainer]}>
          <LinearGradient
            colors={[buttonColors.glow, 'transparent']}
            style={{
              flex: 1,
              borderRadius: ((size || 80) + 40) / 2,
            }}
          />
        </Animated.View>

        {/* Main button */}
        <Animated.View
          style={[
            {
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) }
              ]
            }
          ]}
        >
          <Pressable
            style={[styles.button]}
            onPress={handlePress}
            onLongPress={handleLongPress}
            disabled={disabled || isProcessingState(currentStatus)}
            {...accessibilityProps}
          >
            <LinearGradient
              colors={[buttonColors.background, buttonColors.background + 'CC']}
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: (size || 80) / 2 }
              ]}
            />
            
            <View style={styles.buttonContent}>
              {currentStatus === 'recording' && (
                <View style={styles.stopIcon} />
              )}
              
              {currentStatus === 'paused' && (
                <View style={styles.pauseIcon}>
                  <View style={styles.pauseBar} />
                  <View style={styles.pauseBar} />
                </View>
              )}
              
              {isProcessingState(currentStatus) && (
                <Animated.View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: colors.parchmentWhite,
                    borderTopColor: 'transparent',
                    transform: [
                      {
                        rotate: pulseAnim.interpolate({
                          inputRange: [1, 1.1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  }}
                />
              )}
            </View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Timer Display */}
      <Text style={styles.timer}>
        {formatTime(recordingDuration)}
      </Text>

      {/* Status Text */}
      <Text style={styles.statusText}>
        {getStatusDisplayName(currentStatus)}
      </Text>

      {/* Waveform Visualization */}
      {showWaveform && currentStatus === 'recording' && (
        <View style={styles.waveformContainer}>
          {waveformAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, 40],
                  }),
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Emotional Safety Indicator */}
      {emotionalSafetyMode && (
        <View style={styles.safetyIndicator}>
          <Text style={styles.safetyIcon}>
            {isDistressed ? '⚠️' : '🛡️'}
          </Text>
          <Text style={styles.safetyText}>
            {isDistressed ? 'Emotional support available' : 'Safe space active'}
          </Text>
        </View>
      )}

      {/* Emergency Stop Button (when distressed) */}
      {emotionalSafetyMode && isDistressed && isRecordingActive(currentStatus) && (
        <Pressable
          style={styles.emergencyButton}
          onPress={handleEmergencyStop}
          accessibilityRole="button"
          accessibilityLabel="Emergency stop recording"
          accessibilityHint="Immediately stops recording and provides support options"
        >
          <Text style={styles.emergencyText}>Take a break</Text>
        </Pressable>
      )}
    </View>
  );
};

export default RecordingButton;
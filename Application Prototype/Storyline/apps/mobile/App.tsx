/**
 * Storyline Mobile App - Main Entry Point
 * Voice-First Book Writing Application with Emotional Safety
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar as RNStatusBar,
  SafeAreaView,
  Pressable,
  Alert,
  Dimensions,
  Platform,
  Appearance,
  ColorSchemeName,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { voiceRecorder, RecordingStatus } from './src/services/voice/VoiceRecorder';
import { AudioVisualizer } from './src/components/Voice/AudioVisualizer';
import { TranscriptionDisplay } from './src/components/Voice/TranscriptionDisplay';
import { assemblyAI } from './src/services/api/assemblyai';
import { authService } from './src/services/auth/authService';
import { isFirebaseConfigured } from './src/services/firebase/config';
import { recordingService } from './src/services/data/recordingService';
import { SignInScreen } from './src/screens/Auth/SignInScreen';
import { SignUpScreen } from './src/screens/Auth/SignUpScreen';

// Type definitions for voice and safety states
type VoiceState = 'idle' | 'listening' | 'recording' | 'processing' | 'complete' | 'error';
type SafetyState = 'safe' | 'caution' | 'concern';
type ThemeMode = 'light' | 'dark' | 'auto';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Simple theme colors
const lightColors = {
  background: '#FDFBF7',
  surface: '#F5F4F2',
  text: '#1B1C1E',
  softPlum: '#8854D0',
  warmOchre: '#E4B363',
  slateGray: '#6E7076',
  gentleSage: '#A8C090',
  whisperGray: '#F5F4F2',
  warningAmber: '#F4A261',
  softBlush: '#F2E8E5',
  safeSpace: '#F2E8E5',
  accent: '#8854D0',
  error: '#E94B3C',
  warning: '#F4A261',
  success: '#A8C090',
  border: '#E5E5E5',
};

const darkColors = {
  background: '#000000',
  surface: '#1A1A1A',
  text: '#FDFBF7',
  softPlum: '#9A6FE0',
  warmOchre: '#F2C679',
  slateGray: '#8A8A8A',
  gentleSage: '#A8C090',
  whisperGray: '#2A2A2A',
  warningAmber: '#F4A261',
  softBlush: 'rgba(242, 232, 229, 0.1)',
  safeSpace: 'rgba(242, 232, 229, 0.1)',
  accent: '#9A6FE0',
  error: '#E94B3C',
  warning: '#F4A261',
  success: '#A8C090',
  border: '#333333',
};

// Simple theme context
interface ThemeContextType {
  isDark: boolean;
  colors: typeof lightColors;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Safe Space Indicator Component
const SafeSpaceIndicator: React.FC = () => {
  const { colors } = useTheme();
  const [safetyState] = useState<SafetyState>('safe');

  const getSafetyColor = (state: SafetyState) => {
    switch (state) {
      case 'safe': return colors.success;
      case 'caution': return colors.warning;
      case 'concern': return colors.error;
      default: return colors.success;
    }
  };

  return (
    <View style={[styles.safeSpaceIndicator, { backgroundColor: colors.safeSpace, borderColor: colors.softBlush }]}>
      <View style={[styles.safetyDot, { backgroundColor: getSafetyColor(safetyState) }]} />
      <Text style={[styles.safetyText, { color: colors.text }]}>
        Safe Space Active - Your stories are protected
      </Text>
    </View>
  );
};

// 3D Microphone Placeholder Component
const MicrophoneModel: React.FC<{ isRecording: boolean; voiceState: VoiceState }> = ({ 
  isRecording, 
  voiceState 
}) => {
  const { colors } = useTheme();
  
  const microphoneColor = voiceState === 'recording' 
    ? colors.accent 
    : voiceState === 'listening' 
    ? colors.softPlum 
    : colors.slateGray;

  return (
    <View style={[
      styles.microphoneContainer,
      {
        backgroundColor: microphoneColor + '20',
        borderColor: microphoneColor,
        transform: [{ scale: isRecording ? 1.1 : 1.0 }],
      }
    ]}>
      <View style={[
        styles.microphoneIcon,
        {
          backgroundColor: microphoneColor,
          shadowColor: microphoneColor,
          shadowOpacity: isRecording ? 0.4 : 0.2,
          shadowRadius: isRecording ? 20 : 10,
          shadowOffset: { width: 0, height: isRecording ? 8 : 4 },
        }
      ]} />
      <Text style={[styles.microphoneLabel, { color: colors.text }]}>
        {voiceState === 'recording' ? 'Recording...' : 
         voiceState === 'listening' ? 'Listening...' : 
         voiceState === 'processing' ? 'Processing...' : 
         'Tap to Start'}
      </Text>
    </View>
  );
};

// Voice State Display Component
const VoiceStateDisplay: React.FC<{ voiceState: VoiceState }> = ({ voiceState }) => {
  const { colors } = useTheme();
  
  const getStateStyle = (state: VoiceState) => {
    switch (state) {
      case 'idle':
        return { color: colors.slateGray, backgroundColor: colors.background };
      case 'listening':
        return { color: colors.softPlum, backgroundColor: colors.softBlush };
      case 'recording':
        return { color: colors.error, backgroundColor: colors.error + '10' };
      case 'processing':
        return { color: colors.warning, backgroundColor: colors.warning + '10' };
      case 'complete':
        return { color: colors.success, backgroundColor: colors.success + '10' };
      default:
        return { color: colors.slateGray, backgroundColor: colors.background };
    }
  };

  const stateStyle = getStateStyle(voiceState);

  const getStateMessage = (state: VoiceState): string => {
    switch (state) {
      case 'idle':
        return 'Ready to capture your story';
      case 'listening':
        return 'Listening for your voice...';
      case 'recording':
        return 'Recording your story';
      case 'processing':
        return 'Processing your words into narrative';
      case 'complete':
        return 'Story segment captured successfully';
      case 'error':
        return 'Something went wrong - tap to retry';
      default:
        return 'Ready to begin';
    }
  };

  return (
    <View style={[styles.voiceStateContainer, { backgroundColor: stateStyle.backgroundColor }]}>
      <Text style={[styles.voiceStateText, { color: stateStyle.color }]}>
        {getStateMessage(voiceState)}
      </Text>
    </View>
  );
};

// Main Recording Interface Component
const MainRecordingInterface: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [metering, setMetering] = useState(-160);
  const [recordings, setRecordings] = useState<Array<{ 
    uri: string; 
    duration: number; 
    timestamp: Date;
    transcription?: string;
    sentiment?: { text: string; confidence: number };
    summary?: string;
  }>>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<{
    text?: string;
    sentiment?: { text: string; confidence: number };
    summary?: string;
  }>({});
  const { colors } = useTheme();

  // Set up voice recorder callbacks
  useEffect(() => {
    voiceRecorder.setCallbacks({
      onRecordingStatusUpdate: (status: RecordingStatus) => {
        setRecordingDuration(Math.floor(status.durationMillis / 1000));
        if (status.metering !== undefined) {
          setMetering(status.metering);
        }
      },
      onRecordingComplete: async (uri: string, duration: number) => {
        const newRecording = {
          uri,
          duration,
          timestamp: new Date(),
        };
        setRecordings(prev => [newRecording, ...prev]);
        
        // Save to Firebase if authenticated
        if (isFirebaseConfigured && authService.isAuthenticated()) {
          try {
            await recordingService.saveRecording({
              uri,
              duration,
              timestamp: new Date(),
              isProcessed: false,
            });
          } catch (error) {
            console.error('Failed to save recording to Firebase:', error);
          }
        }
        
        // Start transcription
        if (process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY) {
          await transcribeRecording(uri, 0);
        } else {
          console.warn('AssemblyAI API key not configured');
        }
      },
      onError: (error: Error) => {
        console.error('Recording error:', error);
        setVoiceState('error');
        Alert.alert('Recording Error', error.message);
      },
    });

    return () => {
      voiceRecorder.cleanup();
    };
  }, []);

  const handleMicrophonePress = useCallback(async () => {
    if (voiceState === 'error') {
      setVoiceState('idle');
      return;
    }

    if (isRecording) {
      // Stop recording
      setVoiceState('processing');
      const result = await voiceRecorder.stopRecording();
      setIsRecording(false);
      setMetering(-160);
      
      if (result) {
        setVoiceState('complete');
        setTimeout(() => {
          setVoiceState('idle');
        }, 2000);
      } else {
        setVoiceState('error');
      }
    } else {
      // Start recording
      try {
        setVoiceState('listening');
        await voiceRecorder.startRecording();
        setIsRecording(true);
        setVoiceState('recording');
      } catch (error) {
        console.error('Failed to start recording:', error);
        setVoiceState('error');
      }
    }
  }, [voiceState, isRecording]);

  const handleEmergencySupport = useCallback(() => {
    Alert.alert(
      'Emotional Support Resources',
      'If you need immediate help:\n\n• National Crisis Text Line: Text HOME to 741741\n• National Suicide Prevention Lifeline: 988\n• Crisis Chat: suicidepreventionlifeline.org',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 988', onPress: () => {/* Implement calling logic */} },
      ]
    );
  }, []);

  const playRecording = async (uri: string) => {
    try {
      await voiceRecorder.playRecording(uri);
    } catch (error) {
      Alert.alert('Playback Error', 'Unable to play recording');
    }
  };

  const transcribeRecording = async (uri: string, recordingIndex: number) => {
    try {
      setIsTranscribing(true);
      setCurrentTranscription({});
      
      const result = await assemblyAI.transcribeAudio(uri, {
        sentiment_analysis: true,
        summary: true,
        onProgress: (status) => {
          console.log('Transcription progress:', status);
        },
      });
      
      // Update the recording with transcription
      setRecordings(prev => {
        const updated = [...prev];
        if (updated[recordingIndex]) {
          updated[recordingIndex] = {
            ...updated[recordingIndex],
            transcription: result.text,
            sentiment: result.sentiment,
            summary: result.summary,
          };
        }
        return updated;
      });
      
      // Show current transcription
      setCurrentTranscription({
        text: result.text,
        sentiment: result.sentiment,
        summary: result.summary,
      });
      
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert('Transcription Error', 'Unable to transcribe audio. Please check your API key.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.recordingInterface}>
        <SafeSpaceIndicator />
        
        <VoiceStateDisplay voiceState={voiceState} />
        
        {/* Audio Visualizer */}
        {(isRecording || voiceState === 'listening') && (
          <View style={styles.visualizerContainer}>
            <AudioVisualizer
              metering={metering}
              isRecording={isRecording}
              color={colors.accent}
              height={80}
            />
          </View>
        )}
        
        <Pressable
          onPress={handleMicrophonePress}
          style={({ pressed }) => [
            styles.microphonePressable,
            { opacity: pressed ? 0.8 : 1.0 }
          ]}
          accessibilityLabel="Start or stop recording"
          accessibilityRole="button"
          accessibilityHint="Tap to begin recording your story, tap again to stop"
        >
          <MicrophoneModel isRecording={isRecording} voiceState={voiceState} />
        </Pressable>

        {/* Recording duration display */}
        {isRecording && (
          <Text style={[styles.durationText, { color: colors.text }]}>
            {formatDuration(recordingDuration)}
          </Text>
        )}

        <View style={styles.supportActions}>
          <Pressable
            onPress={handleEmergencySupport}
            style={[styles.supportButton, { backgroundColor: colors.softBlush }]}
            accessibilityLabel="Get emotional support resources"
            accessibilityRole="button"
          >
            <Text style={[styles.supportButtonText, { color: colors.text }]}>
              Need Support?
            </Text>
          </Pressable>
        </View>

        {/* Transcription Display */}
        {(isTranscribing || currentTranscription.text) && (
          <View style={[styles.transcriptionContainer, { backgroundColor: colors.surface }]}>
            <TranscriptionDisplay
              text={currentTranscription.text}
              isLoading={isTranscribing}
              sentiment={currentTranscription.sentiment}
              summary={currentTranscription.summary}
              textColor={colors.text}
              backgroundColor={colors.background}
            />
          </View>
        )}

        {/* Recent recordings */}
        {recordings.length > 0 && (
          <View style={[styles.recordingsSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.recordingsTitle, { color: colors.text }]}>Recent Recordings</Text>
            {recordings.slice(0, 3).map((recording, index) => (
              <Pressable
                key={index}
                onPress={() => playRecording(recording.uri)}
                style={[styles.recordingItem, { backgroundColor: colors.background }]}
              >
                <View>
                  <Text style={[styles.recordingTime, { color: colors.text }]}>
                    {recording.timestamp.toLocaleTimeString()}
                  </Text>
                  <Text style={[styles.recordingDuration, { color: colors.slateGray }]}>
                    Duration: {formatDuration(Math.floor(recording.duration / 1000))}
                  </Text>
                  {recording.transcription && (
                    <Text style={[styles.recordingTranscript, { color: colors.slateGray }]} numberOfLines={1}>
                      "{recording.transcription.substring(0, 50)}..."
                    </Text>
                  )}
                </View>
                <Text style={[styles.playButton, { color: colors.accent }]}>▶</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// App Header Component
const AppHeader: React.FC = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const user = authService.getCurrentUser();

  const handleProfilePress = () => {
    Alert.alert(
      'Profile',
      `Signed in as ${user?.email || 'Guest'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await authService.signOut();
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        Storyline
      </Text>
      <View style={styles.headerActions}>
        <Pressable
          onPress={toggleTheme}
          style={[styles.themeToggle, { backgroundColor: colors.surface }]}
          accessibilityLabel="Toggle theme"
          accessibilityRole="button"
        >
          <Text style={[styles.themeToggleText, { color: colors.text }]}>
            {isDark ? '☀️' : '🌙'}
          </Text>
        </Pressable>
        {isFirebaseConfigured && (
          <Pressable
            onPress={handleProfilePress}
            style={[styles.profileButton, { backgroundColor: colors.surface }]}
            accessibilityLabel="User profile"
            accessibilityRole="button"
          >
            <Text style={styles.profileEmoji}>👤</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

// Main App Content Component
const AppContent: React.FC = () => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader />
      <MainRecordingInterface />
    </SafeAreaView>
  );
};

// Simple Theme Provider Component
const SimpleThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });
    return () => subscription?.remove();
  }, []);

  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const contextValue: ThemeContextType = {
    isDark,
    colors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Root App Component
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<'signin' | 'signup'>('signin');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check authentication state
    const unsubscribe = authService.onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setIsCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  if (isCheckingAuth) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#8854D0" />
        <Text style={styles.loadingText}>Loading Storyline...</Text>
      </View>
    );
  }

  // If Firebase is not configured, skip auth
  if (!isFirebaseConfigured) {
    return (
      <SimpleThemeProvider>
        <AppWithTheme />
      </SimpleThemeProvider>
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (authScreen === 'signin') {
      return (
        <SignInScreen
          onSignIn={() => setIsAuthenticated(true)}
          onNavigateToSignUp={() => setAuthScreen('signup')}
        />
      );
    } else {
      return (
        <SignUpScreen
          onSignUp={() => setIsAuthenticated(true)}
          onNavigateToSignIn={() => setAuthScreen('signin')}
        />
      );
    }
  }

  return (
    <SimpleThemeProvider>
      <AppWithTheme />
    </SimpleThemeProvider>
  );
};

// App with Theme Context
const AppWithTheme: React.FC = () => {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar 
        style={isDark ? 'light' : 'dark'} 
        backgroundColor={colors.background}
      />
      {Platform.OS === 'android' && (
        <RNStatusBar
          backgroundColor={colors.background}
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />
      )}
      <AppContent />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  recordingInterface: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  visualizerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  durationText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  recordingsSection: {
    marginTop: 40,
    width: '100%',
    padding: 20,
    borderRadius: 16,
  },
  recordingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: '500',
  },
  recordingDuration: {
    fontSize: 14,
    marginTop: 4,
  },
  playButton: {
    fontSize: 24,
  },
  transcriptionContainer: {
    marginTop: 24,
    width: '100%',
    borderRadius: 16,
  },
  recordingTranscript: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  safeSpaceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 32,
  },
  safetyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  safetyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  voiceStateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 40,
    minWidth: 280,
    alignItems: 'center',
  },
  voiceStateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  microphonePressable: {
    marginBottom: 40,
  },
  microphoneContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  microphoneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    elevation: 8,
  },
  microphoneLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  supportActions: {
    marginTop: 20,
  },
  supportButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6E7076',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 18,
  },
});

export default App;

// Uncomment this line to switch to component testing mode:
// export { default } from './ComponentTesting';

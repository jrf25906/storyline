import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';

// Simple theme for testing
const testTheme = {
  colors: {
    light: {
      background: '#FDFBF7',
      text: '#1B1C1E',
      softPlum: '#8854D0',
      gentleSage: '#A8C090',
      warmOchre: '#E4B363',
      whisperGray: '#F5F4F2',
      safeSpace: '#F2E8E5',
    },
    dark: {
      background: '#1A1A1A',
      text: '#FDFBF7',
      softPlum: '#9A6FE0',
      gentleSage: '#A8C090',
      warmOchre: '#F2C679',
      whisperGray: '#2A2A2A',
      safeSpace: 'rgba(242, 232, 229, 0.1)',
    }
  }
};

type VoiceState = 'idle' | 'listening' | 'recording' | 'processing' | 'complete' | 'error';
type ThemeMode = 'light' | 'dark';
type SafetyState = 'safe' | 'caution' | 'concern';

// Test Components
const MicrophoneTestComponent: React.FC<{
  voiceState: VoiceState;
  onPress: () => void;
  isDark: boolean;
}> = ({ voiceState, onPress, isDark }) => {
  const colors = isDark ? testTheme.colors.dark : testTheme.colors.light;
  
  const getStateColor = () => {
    switch (voiceState) {
      case 'idle': return colors.softPlum;
      case 'listening': return colors.softPlum;
      case 'recording': return colors.gentleSage;
      case 'processing': return colors.warmOchre;
      case 'complete': return colors.gentleSage;
      case 'error': return '#E94B3C';
      default: return colors.softPlum;
    }
  };

  const getStateText = () => {
    switch (voiceState) {
      case 'idle': return 'Tap to start recording';
      case 'listening': return 'Listening for your voice...';
      case 'recording': return 'Recording your story';
      case 'processing': return 'Processing your words';
      case 'complete': return 'Story captured!';
      case 'error': return 'Error - Tap to retry';
      default: return 'Ready';
    }
  };

  return (
    <View style={styles.testSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        3D Microphone Component Test
      </Text>
      
      {/* Microphone Placeholder */}
      <Pressable
        style={[
          styles.microphoneButton,
          {
            backgroundColor: getStateColor(),
            transform: [{ scale: voiceState === 'recording' ? 1.1 : 1.0 }],
          }
        ]}
        onPress={onPress}
        accessibilityLabel={`Microphone button, currently ${voiceState}`}
        accessibilityHint="Tap to change voice state"
      >
        <View style={styles.microphoneIcon}>
          <Text style={styles.microphoneEmoji}>🎤</Text>
        </View>
      </Pressable>

      <Text style={[styles.stateText, { color: colors.text }]}>
        State: {voiceState}
      </Text>
      <Text style={[styles.stateDescription, { color: colors.text }]}>
        {getStateText()}
      </Text>
    </View>
  );
};

const SafeSpaceTestComponent: React.FC<{
  safetyState: SafetyState;
  isDark: boolean;
  onSupportPress: () => void;
}> = ({ safetyState, isDark, onSupportPress }) => {
  const colors = isDark ? testTheme.colors.dark : testTheme.colors.light;
  
  const getSafetyColor = () => {
    switch (safetyState) {
      case 'safe': return colors.gentleSage;
      case 'caution': return colors.warmOchre;
      case 'concern': return '#E94B3C';
      default: return colors.gentleSage;
    }
  };

  const getSafetyIcon = () => {
    switch (safetyState) {
      case 'safe': return '🛡️';
      case 'caution': return '⚠️';
      case 'concern': return '🆘';
      default: return '🛡️';
    }
  };

  return (
    <View style={styles.testSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        SafeSpace Indicator Test
      </Text>
      
      <View style={[styles.safeSpaceContainer, { backgroundColor: colors.safeSpace }]}>
        <View style={styles.safeSpaceContent}>
          <View style={[styles.safetyDot, { backgroundColor: getSafetyColor() }]}>
            <Text style={styles.safetyIcon}>{getSafetyIcon()}</Text>
          </View>
          <View style={styles.safeSpaceText}>
            <Text style={[styles.safeSpaceTitle, { color: colors.text }]}>
              Safe Space Active
            </Text>
            <Text style={[styles.safeSpaceSubtitle, { color: colors.text }]}>
              Your stories are protected
            </Text>
          </View>
        </View>
        
        <Pressable
          style={[styles.supportButton, { borderColor: colors.whisperGray }]}
          onPress={onSupportPress}
          accessibilityLabel="Request emotional support"
        >
          <Text style={[styles.supportButtonText, { color: colors.text }]}>
            Need Support?
          </Text>
        </Pressable>
      </View>
      
      <Text style={[styles.stateText, { color: colors.text }]}>
        Safety State: {safetyState}
      </Text>
    </View>
  );
};

const ThemeTestComponent: React.FC<{
  themeMode: ThemeMode;
  onToggle: () => void;
}> = ({ themeMode, onToggle }) => {
  const colors = themeMode === 'dark' ? testTheme.colors.dark : testTheme.colors.light;
  
  return (
    <View style={styles.testSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Theme System Test
      </Text>
      
      <Pressable
        style={[styles.themeButton, { backgroundColor: colors.softPlum }]}
        onPress={onToggle}
        accessibilityLabel={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
      >
        <Text style={styles.themeButtonText}>
          {themeMode === 'light' ? '🌙' : '☀️'} Toggle to {themeMode === 'light' ? 'Dark' : 'Light'} Mode
        </Text>
      </Pressable>
      
      <View style={styles.colorPalette}>
        <View style={[styles.colorSwatch, { backgroundColor: colors.softPlum }]}>
          <Text style={styles.colorLabel}>Soft Plum</Text>
        </View>
        <View style={[styles.colorSwatch, { backgroundColor: colors.gentleSage }]}>
          <Text style={styles.colorLabel}>Gentle Sage</Text>
        </View>
        <View style={[styles.colorSwatch, { backgroundColor: colors.warmOchre }]}>
          <Text style={styles.colorLabel}>Warm Ochre</Text>
        </View>
      </View>
    </View>
  );
};

export default function ComponentTesting() {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [safetyState, setSafetyState] = useState<SafetyState>('safe');
  
  const colors = themeMode === 'dark' ? testTheme.colors.dark : testTheme.colors.light;

  const cycleVoiceState = () => {
    const states: VoiceState[] = ['idle', 'listening', 'recording', 'processing', 'complete', 'error'];
    const currentIndex = states.indexOf(voiceState);
    const nextIndex = (currentIndex + 1) % states.length;
    setVoiceState(states[nextIndex]);
  };

  const cycleSafetyState = () => {
    const states: SafetyState[] = ['safe', 'caution', 'concern'];
    const currentIndex = states.indexOf(safetyState);
    const nextIndex = (currentIndex + 1) % states.length;
    setSafetyState(states[nextIndex]);
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const handleSupportPress = () => {
    Alert.alert(
      "Emotional Support",
      "Crisis resources would be shown here.\n\n• National Crisis Text Line: Text HOME to 741741\n• National Suicide Prevention Lifeline: 988\n• Crisis Chat: Available 24/7",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Storyline Component Testing
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Test all voice-first components and interactions
          </Text>
        </View>

        <MicrophoneTestComponent
          voiceState={voiceState}
          onPress={cycleVoiceState}
          isDark={themeMode === 'dark'}
        />

        <SafeSpaceTestComponent
          safetyState={safetyState}
          isDark={themeMode === 'dark'}
          onSupportPress={handleSupportPress}
        />

        <ThemeTestComponent
          themeMode={themeMode}
          onToggle={toggleTheme}
        />

        <View style={styles.testSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Interactive Testing
          </Text>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.warmOchre }]}
            onPress={cycleSafetyState}
          >
            <Text style={styles.actionButtonText}>
              Cycle Safety State ({safetyState})
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text }]}>
            Tap components to test interactions
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  testSection: {
    marginBottom: 40,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  microphoneButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  microphoneIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  microphoneEmoji: {
    fontSize: 48,
  },
  stateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  stateDescription: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  safeSpaceContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  safeSpaceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  safetyIcon: {
    fontSize: 16,
  },
  safeSpaceText: {
    flex: 1,
  },
  safeSpaceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  safeSpaceSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  supportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  supportButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  themeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  themeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  colorPalette: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorSwatch: {
    width: 80,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    opacity: 0.6,
  },
});
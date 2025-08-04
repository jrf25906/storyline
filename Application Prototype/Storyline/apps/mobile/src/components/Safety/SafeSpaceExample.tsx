/**
 * SafeSpaceExample.tsx
 * 
 * Example implementation of SafeSpaceIndicator component
 * Demonstrates trauma-informed design patterns and crisis intervention flows
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeSpaceIndicator } from './SafeSpaceIndicator';
import { useSafetyState } from '../../hooks/safety';
import { useTheme } from '../../design-system/ThemeProvider';
import type { EmotionalSupportAction, CrisisLevel } from './SafeSpaceIndicator';

export const SafeSpaceExample: React.FC = () => {
  const { theme } = useTheme();
  const [demoMessage, setDemoMessage] = useState('');
  
  const {
    safetyState,
    crisisLevel,
    isSafeSpaceActive,
    isBreakRequested,
    setSafetyState,
    setCrisisLevel,
    toggleSafeSpace,
    requestSupport,
    analyzeContent,
    resetSafetyState,
    setBreakRequested,
  } = useSafetyState({
    enableCrisisDetection: true,
    sensitivityLevel: 'medium',
    onCrisisDetected: (level: CrisisLevel, context?: string) => {
      console.log(`Crisis detected: ${level}`, context);
      setDemoMessage(`Crisis level ${level} detected. Support resources activated.`);
    },
    onSupportRequested: (action: EmotionalSupportAction) => {
      console.log('Support requested:', action);
      handleSupportRequest(action);
    },
  });

  const handleSupportRequest = (action: EmotionalSupportAction) => {
    switch (action) {
      case 'pause':
        setDemoMessage('Conversation paused. Take all the time you need.');
        break;
      case 'break':
        setDemoMessage('Taking a break. Your wellbeing comes first.');
        setBreakRequested(true);
        break;
      case 'breathing':
        setDemoMessage('Starting breathing exercise... Breathe in slowly...');
        startBreathingExercise();
        break;
      case 'resources':
        setDemoMessage('Emotional support resources are now available.');
        showEmotionalResources();
        break;
      case 'emergency':
        setDemoMessage('Connecting to crisis support resources...');
        showEmergencyResources();
        break;
    }
  };

  const startBreathingExercise = () => {
    Alert.alert(
      'Breathing Exercise',
      'Take slow, deep breaths. Breathe in for 4 counts, hold for 4, breathe out for 4.',
      [{ text: 'Start', onPress: () => setDemoMessage('Breathing exercise in progress...') }]
    );
  };

  const showEmotionalResources = () => {
    Alert.alert(
      'Emotional Resources',
      'Here are some helpful resources:\n\n• Mindfulness techniques\n• Journaling prompts\n• Emotional regulation tools',
      [{ text: 'Access Resources', onPress: () => setDemoMessage('Resources accessed.') }]
    );
  };

  const showEmergencyResources = () => {
    Alert.alert(
      'Crisis Support',
      'You deserve support. Here are immediate resources:\n\n• National Suicide Prevention Lifeline: 988\n• Crisis Text Line: Text HOME to 741741',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Get Help', onPress: () => setDemoMessage('Crisis support contacted.') }
      ]
    );
  };

  // Demo text samples for testing crisis detection
  const testCrisisDetection = (testLevel: 'safe' | 'low' | 'medium' | 'high') => {
    const testTexts = {
      safe: "I'm feeling good today and ready to write my story.",
      low: "I'm feeling a bit overwhelmed with everything going on.",
      medium: "I feel hopeless about my situation and don't know what to do.",
      high: "I don't want to be here anymore and think about ending it all."
    };
    
    const text = testTexts[testLevel];
    analyzeContent(text);
    setDemoMessage(`Analyzed: "${text}"`);
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SafeSpaceIndicator Demo</Text>
      
      {/* Main SafeSpaceIndicator */}
      <SafeSpaceIndicator
        safetyState={safetyState}
        crisisLevel={crisisLevel}
        isActive={isSafeSpaceActive}
        showControls={true}
        showDetailedSupport={crisisLevel !== 'none'}
        message={demoMessage || undefined}
        onBreakRequested={() => requestSupport('break')}
        onSupportRequested={requestSupport}
        onCrisisDetected={(level) => {
          setDemoMessage(`Crisis intervention activated: ${level}`);
        }}
        accessibilityLabel="Demo safe space indicator for testing emotional safety features"
      />

      {/* Demo Controls */}
      <View style={styles.controls}>
        <Text style={styles.sectionTitle}>Demo Controls</Text>
        
        <View style={styles.buttonRow}>
          <Text style={styles.buttonLabel}>Safety State:</Text>
          <Pressable
            style={[styles.button, safetyState === 'safe' && styles.activeButton]}
            onPress={() => setSafetyState('safe')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Safe</Text>
          </Pressable>
          <Pressable
            style={[styles.button, safetyState === 'caution' && styles.activeButton]}
            onPress={() => setSafetyState('caution')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Caution</Text>
          </Pressable>
          <Pressable
            style={[styles.button, safetyState === 'concern' && styles.activeButton]}
            onPress={() => setSafetyState('concern')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Concern</Text>
          </Pressable>
        </View>

        <View style={styles.buttonRow}>
          <Text style={styles.buttonLabel}>Crisis Level:</Text>
          <Pressable
            style={[styles.button, crisisLevel === 'none' && styles.activeButton]}
            onPress={() => setCrisisLevel('none')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>None</Text>
          </Pressable>
          <Pressable
            style={[styles.button, crisisLevel === 'low' && styles.activeButton]}
            onPress={() => setCrisisLevel('low')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Low</Text>
          </Pressable>
          <Pressable
            style={[styles.button, crisisLevel === 'medium' && styles.activeButton]}
            onPress={() => setCrisisLevel('medium')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Medium</Text>
          </Pressable>
          <Pressable
            style={[styles.button, crisisLevel === 'high' && styles.activeButton]}
            onPress={() => setCrisisLevel('high')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>High</Text>
          </Pressable>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={styles.toggleButton}
            onPress={toggleSafeSpace}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>
              {isSafeSpaceActive ? 'Deactivate Safe Space' : 'Activate Safe Space'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Test Crisis Detection</Text>
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.testButton}
            onPress={() => testCrisisDetection('safe')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Test Safe</Text>
          </Pressable>
          <Pressable
            style={styles.testButton}
            onPress={() => testCrisisDetection('low')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Test Low</Text>
          </Pressable>
          <Pressable
            style={styles.testButton}
            onPress={() => testCrisisDetection('medium')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Test Medium</Text>
          </Pressable>
          <Pressable
            style={styles.testButton}
            onPress={() => testCrisisDetection('high')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Test High</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.resetButton}
          onPress={() => {
            resetSafetyState();
            setDemoMessage('');
          }}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Reset All</Text>
        </Pressable>
      </View>

      {/* Status Display */}
      <View style={styles.status}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        <Text style={styles.statusText}>Safety State: {safetyState}</Text>
        <Text style={styles.statusText}>Crisis Level: {crisisLevel}</Text>
        <Text style={styles.statusText}>Safe Space: {isSafeSpaceActive ? 'Active' : 'Inactive'}</Text>
        <Text style={styles.statusText}>Break Requested: {isBreakRequested ? 'Yes' : 'No'}</Text>
        {demoMessage && (
          <Text style={styles.demoMessage}>{demoMessage}</Text>
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    },
    title: {
      ...theme.typography.sizes.headline,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    controls: {
      marginVertical: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
    },
    sectionTitle: {
      ...theme.typography.sizes.title,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      fontWeight: theme.typography.weights.semibold,
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    buttonLabel: {
      ...theme.typography.sizes.body,
      color: theme.colors.text,
      marginRight: theme.spacing.sm,
      minWidth: 80,
    },
    button: {
      backgroundColor: theme.colors.whisperGray,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.base,
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
      minHeight: theme.safety.a11y.minTouchTarget,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.slateGray + '30',
    },
    activeButton: {
      backgroundColor: theme.colors.softPlum,
      borderColor: theme.colors.softPlum,
    },
    toggleButton: {
      backgroundColor: theme.colors.info,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.base,
      minHeight: theme.safety.a11y.minTouchTarget,
      justifyContent: 'center',
      alignItems: 'center',
    },
    testButton: {
      backgroundColor: theme.colors.warning + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.base,
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
      minHeight: theme.safety.a11y.minTouchTarget,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.warning + '50',
    },
    resetButton: {
      backgroundColor: theme.colors.error,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.base,
      marginTop: theme.spacing.sm,
      minHeight: theme.safety.a11y.minTouchTarget,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      ...theme.typography.sizes.body,
      color: theme.colors.parchmentWhite,
      fontWeight: theme.typography.weights.medium,
      textAlign: 'center',
    },
    status: {
      marginVertical: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
    },
    statusText: {
      ...theme.typography.sizes.body,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    demoMessage: {
      ...theme.typography.sizes.body,
      color: theme.colors.softPlum,
      fontStyle: 'italic',
      marginTop: theme.spacing.sm,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.softPlum + '10',
      borderRadius: theme.borderRadius.base,
    },
  });

export default SafeSpaceExample;
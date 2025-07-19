import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';

interface CrisisResource {
  id: string;
  name: string;
  phone: string;
  description: string;
  type: 'hotline' | 'text' | 'emergency';
}

interface CrisisModeProps {
  visible: boolean;
  onClose: () => void;
  severity?: 'mild' | 'moderate' | 'severe';
}

const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'crisis-hotline',
    name: '988 Crisis Lifeline',
    phone: '988',
    description: '24/7 crisis support',
    type: 'hotline',
  },
  {
    id: 'text-crisis',
    name: 'Crisis Text Line',
    phone: '741741',
    description: 'Text HOME to 741741',
    type: 'text',
  },
  {
    id: 'emergency',
    name: 'Emergency Services',
    phone: '911',
    description: 'If you are in immediate danger',
    type: 'emergency',
  },
];

export const CrisisMode: React.FC<CrisisModeProps> = ({
  visible,
  onClose,
  severity = 'moderate',
}) => {
  const { theme } = useTheme();

  const handleCallHotline = (resource: CrisisResource) => {
    if (resource.type === 'emergency') {
      Alert.alert(
        'Emergency Services',
        'This will call 911. Are you in immediate danger?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call 911',
            style: 'destructive',
            onPress: () => Linking.openURL(`tel:${resource.phone}`),
          },
        ]
      );
    } else {
      Linking.openURL(`tel:${resource.phone}`);
    }
  };

  const handleTextCrisisLine = () => {
    Linking.openURL('sms:741741&body=HOME');
  };

  const handleBreathingExercise = () => {
    // This would typically navigate to a breathing exercise component
    Alert.alert(
      'Breathing Exercise',
      'Take slow, deep breaths:\n\n1. Breathe in for 4 counts\n2. Hold for 4 counts\n3. Breathe out for 6 counts\n\nRepeat until you feel calmer.',
      [{ text: 'OK' }]
    );
  };

  const handleClose = (resolution: string) => {
    // Log the crisis resolution for tracking
    console.log('Crisis mode closed:', { resolution, timestamp: new Date().toISOString() });
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borders.radius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.md,
      maxHeight: '80%',
      width: '90%',
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.fontSizes.headingLG,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.body,
      color: theme.colors.text,
      textAlign: 'center',
      lineHeight: 22,
    },
    resourcesContainer: {
      marginBottom: theme.spacing.lg,
    },
    resourceItem: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      marginBottom: theme.spacing.sm,
      borderLeftWidth: 4,
    },
    hotlineResource: {
      borderLeftColor: theme.colors.error,
    },
    textResource: {
      borderLeftColor: theme.colors.warning,
    },
    emergencyResource: {
      borderLeftColor: theme.colors.error,
      backgroundColor: '#FFF5F5',
    },
    resourceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    resourceName: {
      fontSize: theme.typography.fontSizes.bodyLG,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text,
    },
    resourcePhone: {
      fontSize: theme.typography.fontSizes.headingMD,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.error,
    },
    resourceDescription: {
      fontSize: theme.typography.fontSizes.body,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    callButton: {
      backgroundColor: theme.colors.error,
      padding: theme.spacing.sm,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
    },
    textButton: {
      backgroundColor: theme.colors.warning,
      padding: theme.spacing.sm,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
    },
    emergencyButton: {
      backgroundColor: theme.colors.error,
      padding: theme.spacing.sm,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
    },
    buttonText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSizes.body,
      fontWeight: theme.typography.fontWeights.bold,
    },
    breathingSection: {
      backgroundColor: theme.colors.calmBlue + '20',
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      marginBottom: theme.spacing.lg,
    },
    breathingTitle: {
      fontSize: theme.typography.fontSizes.bodyLG,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    breathingDescription: {
      fontSize: theme.typography.fontSizes.body,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    breathingButton: {
      backgroundColor: theme.colors.calmBlue,
      padding: theme.spacing.sm,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
    },
    closeSection: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.md,
    },
    closeButton: {
      backgroundColor: theme.colors.success,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    closeButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSizes.body,
      fontWeight: theme.typography.fontWeights.bold,
    },
    laterButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
    },
    laterButtonText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSizes.body,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Crisis Support</Text>
              <Text style={styles.subtitle}>
                You're not alone. Help is available 24/7.
              </Text>
            </View>

            {/* Crisis Resources */}
            <View style={styles.resourcesContainer}>
              {CRISIS_RESOURCES.map((resource) => (
                <View
                  key={resource.id}
                  style={[
                    styles.resourceItem,
                    resource.type === 'hotline' && styles.hotlineResource,
                    resource.type === 'text' && styles.textResource,
                    resource.type === 'emergency' && styles.emergencyResource,
                  ]}
                >
                  <View style={styles.resourceHeader}>
                    <Text style={styles.resourceName}>{resource.name}</Text>
                    <Text style={styles.resourcePhone}>{resource.phone}</Text>
                  </View>
                  <Text style={styles.resourceDescription}>
                    {resource.description}
                  </Text>
                  
                  {resource.type === 'hotline' && (
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => handleCallHotline(resource)}
                    >
                      <Text style={styles.buttonText}>Call {resource.phone}</Text>
                    </TouchableOpacity>
                  )}
                  
                  {resource.type === 'text' && (
                    <TouchableOpacity
                      style={styles.textButton}
                      onPress={handleTextCrisisLine}
                    >
                      <Text style={styles.buttonText}>Text {resource.phone}</Text>
                    </TouchableOpacity>
                  )}
                  
                  {resource.type === 'emergency' && severity === 'severe' && (
                    <TouchableOpacity
                      style={styles.emergencyButton}
                      onPress={() => handleCallHotline(resource)}
                    >
                      <Text style={styles.buttonText}>Call {resource.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Breathing Exercise for Mild Crisis */}
            {severity === 'mild' && (
              <View style={styles.breathingSection}>
                <Text style={styles.breathingTitle}>Breathing Exercise</Text>
                <Text style={styles.breathingDescription}>
                  Take a moment to breathe and center yourself.
                </Text>
                <TouchableOpacity
                  style={styles.breathingButton}
                  onPress={handleBreathingExercise}
                >
                  <Text style={styles.buttonText}>Start Breathing Exercise</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Close Options */}
            <View style={styles.closeSection}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => handleClose('user_reported_better')}
              >
                <Text style={styles.closeButtonText}>I'm feeling better</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.laterButton}
                onPress={() => handleClose('dismissed')}
              >
                <Text style={styles.laterButtonText}>Close for now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
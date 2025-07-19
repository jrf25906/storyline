import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { CrisisDetectionResult } from '@types';
import { useTheme } from '@context/ThemeContext';
import { Feather } from '@expo/vector-icons';

interface CrisisAlertProps {
  detection: CrisisDetectionResult;
  onDismiss: () => void;
  onContactSupport: (action: string) => void;
}

export const CrisisAlert: React.FC<CrisisAlertProps> = ({
  detection,
  onDismiss,
  onContactSupport,
}) => {
  const { theme } = useTheme();

  if (!detection.detected) {
    return null;
  }

  const handleCallCrisisLine = async () => {
    const phoneNumber = 'tel:988';
    
    try {
      const canOpen = await Linking.canOpenURL(phoneNumber);
      if (canOpen) {
        await Linking.openURL(phoneNumber);
      } else {
        Alert.alert(
          'Unable to make call',
          'Please dial 988 directly from your phone app.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Unable to make call',
        'Please dial 988 directly from your phone app.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleTextCrisisLine = async () => {
    const smsNumber = 'sms:741741&body=HELLO';
    
    try {
      await Linking.openURL(smsNumber);
    } catch (error) {
      Alert.alert(
        'Unable to send text',
        'Please text "HELLO" to 741741 from your messages app.',
        [{ text: 'OK' }]
      );
    }
  };

  const getSeverityStyles = () => {
    switch (detection.severity) {
      case 'critical':
        return {
          backgroundColor: '#FFEBEE',
          borderColor: '#EF5350',
          titleColor: '#C62828',
        };
      case 'high':
        return {
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
          titleColor: '#E65100',
        };
      case 'medium':
        return {
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          titleColor: '#1565C0',
        };
      case 'low':
        return {
          backgroundColor: '#F3E5F5',
          borderColor: '#9C27B0',
          titleColor: '#6A1B9A',
        };
    }
  };

  const getTitle = () => {
    switch (detection.severity) {
      case 'critical':
        return "You're Not Alone";
      case 'high':
        return "We're Here to Help";
      case 'medium':
        return 'Support Available';
      case 'low':
        return 'Feeling Down?';
    }
  };

  const styles = getSeverityStyles();
  const testId = detection.severity === 'critical' ? 'crisis-alert' : 'support-resources';

  return (
    <View
      style={[
        alertStyles.container,
        {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
        },
      ]}
      testID={testId}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={alertStyles.header}>
        <Text style={[alertStyles.title, { color: styles.titleColor }]}>
          {getTitle()}
        </Text>
        {detection.severity !== 'critical' && (
          <TouchableOpacity
            onPress={onDismiss}
            testID="dismiss-button"
            accessibilityLabel="Dismiss alert"
            accessibilityRole="button"
            style={alertStyles.dismissButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="x" size={24} color={styles.titleColor} />
          </TouchableOpacity>
        )}
      </View>

      {detection.severity === 'critical' && (
        <View style={alertStyles.crisisSection}>
          <TouchableOpacity
            style={[alertStyles.crisisButton, { backgroundColor: '#C62828' }]}
            onPress={handleCallCrisisLine}
            testID="crisis-hotline-button"
            accessibilityLabel="Call 988 Suicide and Crisis Lifeline"
            accessibilityRole="button"
            accessibilityHint="Double tap to call crisis hotline"
          >
            <Feather name="phone" size={20} color="#FFFFFF" />
            <View style={alertStyles.crisisButtonContent}>
              <Text style={alertStyles.crisisNumber}>988</Text>
              <Text style={alertStyles.crisisLabel}>Suicide & Crisis Lifeline</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[alertStyles.textButton, { borderColor: styles.borderColor }]}
            onPress={handleTextCrisisLine}
          >
            <Feather name="message-circle" size={18} color={styles.titleColor} />
            <Text style={[alertStyles.textButtonLabel, { color: styles.titleColor }]}>
              Text "HELLO" to 741741
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={alertStyles.actionsSection}>
        {detection.suggestedActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[alertStyles.actionButton, { borderColor: styles.borderColor }]}
            onPress={() => onContactSupport(action)}
            accessibilityLabel={`${action} button`}
            accessibilityRole="button"
          >
            <Text style={[alertStyles.actionText, { color: styles.titleColor }]}>
              {action}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {detection.severity === 'critical' && (
        <Text style={[alertStyles.disclaimer, { color: styles.titleColor }]}>
          If you are in immediate danger, please call 911 or go to your nearest emergency room.
        </Text>
      )}
    </View>
  );
};

const alertStyles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  crisisSection: {
    marginVertical: 12,
  },
  crisisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  crisisButtonContent: {
    marginLeft: 12,
  },
  crisisNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  crisisLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  textButtonLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  actionsSection: {
    marginTop: 12,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  dismissButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
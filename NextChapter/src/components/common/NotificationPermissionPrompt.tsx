import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '@components/common/NotificationPermissionPrompt.styles';
import { notificationService } from '@services/notifications/notificationService';
import { theme } from '@theme';

interface NotificationPermissionPromptProps {
  onAllow: () => void;
  onDeny: () => void;
}

export const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({
  onAllow,
  onDeny,
}) => {
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        onAllow();
      } else {
        onDeny();
      }
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: 'clock', text: 'Daily task reminders at 9 AM' },
    { icon: 'briefcase', text: 'Job application follow-ups' },
    { icon: 'dollar-sign', text: 'Budget alerts when needed' },
    { icon: 'heart', text: 'Optional mood check-ins' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="bell" size={48} color={theme.colors.primary} />
      </View>

      <Text style={styles.title}>Stay on Track with Gentle Reminders</Text>
      
      <Text style={styles.description}>
        We'll send helpful reminders at the right times to support your journey back to work.
      </Text>

      <View style={styles.benefitsList}>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <Feather
              name={benefit.icon as any}
              size={20}
              color={theme.colors.primary}
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>{benefit.text}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.privacyText}>
        You can change this anytime in Settings. We respect your quiet hours.
      </Text>

      {loading ? (
        <ActivityIndicator
          testID="loading-indicator"
          size="large"
          color={theme.colors.primary}
          style={styles.loader}
        />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.allowButton}
            onPress={handleAllow}
            accessibilityRole="button"
            accessibilityLabel="Allow notification permissions"
            accessibilityHint="Enable helpful reminders for your recovery journey"
          >
            <Text style={styles.allowButtonText}>Allow Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.denyButton}
            onPress={onDeny}
            accessibilityRole="button"
            accessibilityLabel="Deny notification permissions for now"
            accessibilityHint="You can enable notifications later in settings"
          >
            <Text style={styles.denyButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
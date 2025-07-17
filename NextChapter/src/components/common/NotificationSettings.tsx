import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from './NotificationSettings.styles';
import { notificationService, NotificationPreferences } from '../../services/notifications/notificationService';

export const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    dailyTasks: true,
    jobFollowUps: true,
    budgetAlerts: true,
    moodCheckIns: true,
    quietHoursStart: 22,
    quietHoursEnd: 8,
  });
  const [hasPermission, setHasPermission] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
    checkPermissions();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await notificationService.getPreferences();
      setPreferences(saved);
    } catch (err) {
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    setHasPermission(granted);
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      await notificationService.updatePreferences(newPreferences);
      setError(null);
    } catch (err) {
      setError('Failed to update notification settings');
    }
  };

  const requestPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    setHasPermission(granted);
    
    if (!granted) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive helpful reminders.',
        [{ text: 'OK' }]
      );
    }
  };

  const sendTestNotification = async () => {
    try {
      await notificationService.scheduleLocalNotification({
        title: 'Test Notification',
        body: 'Notifications are working! You\'ll receive helpful reminders at the right times.',
        trigger: null,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const formatTime = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {!hasPermission && (
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermissions}
          accessibilityRole="button"
          accessibilityLabel="Enable Notifications"
          accessibilityHint="Request permission to send notifications"
        >
          <Text style={styles.permissionButtonText}>Enable Notifications</Text>
        </TouchableOpacity>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Task Reminders</Text>
            <Text style={styles.settingDescription}>
              Get reminded of your daily 10-minute task
            </Text>
          </View>
          <Switch
            testID="switch-daily-tasks"
            value={preferences.dailyTasks}
            onValueChange={(value) => updatePreference('dailyTasks', value)}
            accessibilityRole="switch"
            accessibilityLabel="Daily Task Reminders"
            accessibilityHint="Toggle daily task reminder notifications"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Job Application Follow-ups</Text>
            <Text style={styles.settingDescription}>
              Reminders to follow up on job applications
            </Text>
          </View>
          <Switch
            testID="switch-job-follow-ups"
            value={preferences.jobFollowUps}
            onValueChange={(value) => updatePreference('jobFollowUps', value)}
            accessibilityRole="switch"
            accessibilityLabel="Job Application Follow-ups"
            accessibilityHint="Toggle job application follow-up notifications"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Budget Alerts</Text>
            <Text style={styles.settingDescription}>
              Alerts when your budget runway is low
            </Text>
          </View>
          <Switch
            testID="switch-budget-alerts"
            value={preferences.budgetAlerts}
            onValueChange={(value) => updatePreference('budgetAlerts', value)}
            accessibilityRole="switch"
            accessibilityLabel="Budget Alerts"
            accessibilityHint="Toggle budget alert notifications"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Mood Check-ins</Text>
            <Text style={styles.settingDescription}>
              Evening reminders to track your mood
            </Text>
          </View>
          <Switch
            testID="switch-mood-check-ins"
            value={preferences.moodCheckIns}
            onValueChange={(value) => updatePreference('moodCheckIns', value)}
            accessibilityRole="switch"
            accessibilityLabel="Mood Check-in Reminders"
            accessibilityHint="Toggle mood check-in notifications"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <Text style={styles.quietHoursDescription}>
          No notifications during these hours (except urgent alerts)
        </Text>
        
        <TouchableOpacity
          style={styles.quietHoursButton}
          onPress={() => setShowStartPicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Set quiet hours"
          accessibilityHint="Change when notifications are silenced"
        >
          <Text style={styles.quietHoursText}>
            {formatTime(preferences.quietHoursStart)} - {formatTime(preferences.quietHoursEnd)}
          </Text>
        </TouchableOpacity>
      </View>

      {showStartPicker && (
        <View testID="quiet-hours-picker">
          <DateTimePicker
            testID="quiet-hours-start-picker"
            value={new Date(2024, 0, 1, preferences.quietHoursStart)}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) {
                updatePreference('quietHoursStart', date.getHours());
              }
            }}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.pickerDoneButton}
              onPress={() => setShowStartPicker(false)}
            >
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showEndPicker && (
        <DateTimePicker
          testID="quiet-hours-end-picker"
          value={new Date(2024, 0, 1, preferences.quietHoursEnd)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) {
              updatePreference('quietHoursEnd', date.getHours());
            }
          }}
        />
      )}

      <TouchableOpacity
        style={styles.testButton}
        onPress={sendTestNotification}
        accessibilityRole="button"
        accessibilityLabel="Send test notification"
        accessibilityHint="Sends a test notification to verify settings"
      >
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
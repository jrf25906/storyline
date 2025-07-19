import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useCoachStore } from '@stores/coachStore';
import { APP_CONFIG } from '@utils/constants';

interface CoachSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export function CoachSettings({ visible, onClose }: CoachSettingsProps) {
  const { theme } = useTheme();
  const { cloudSyncEnabled, setCloudSyncEnabled, getMessageCountToday } = useCoachStore();
  const messagesUsed = getMessageCountToday();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Coach Settings
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessible={true}
            accessibilityLabel="Close settings"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Daily Usage */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Daily Usage
            </Text>
            <View style={styles.usageContainer}>
              <Text style={[styles.usageText, { color: theme.colors.textMuted }]}>
                Messages used today
              </Text>
              <Text style={[styles.usageCount, { color: theme.colors.text }]}>
                {messagesUsed} / {APP_CONFIG.FREE_COACH_MESSAGES_PER_DAY}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${(messagesUsed / APP_CONFIG.FREE_COACH_MESSAGES_PER_DAY) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.resetText, { color: theme.colors.textMuted }]}>
              Resets daily at midnight
            </Text>
          </View>

          {/* Cloud Sync */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Cloud Sync
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textMuted }]}>
                  Sync conversations across devices (encrypted)
                </Text>
              </View>
              <Switch
                value={cloudSyncEnabled}
                onValueChange={setCloudSyncEnabled}
                trackColor={{ 
                  false: theme.colors.border, 
                  true: theme.colors.primary + '80' 
                }}
                thumbColor={cloudSyncEnabled ? theme.colors.primary : theme.colors.surface}
              />
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Privacy & Security
            </Text>
            <View style={styles.privacyItem}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.privacyText, { color: theme.colors.textMuted }]}>
                Conversations are stored locally by default
              </Text>
            </View>
            <View style={styles.privacyItem}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.privacyText, { color: theme.colors.textMuted }]}>
                Financial data is never sent to AI
              </Text>
            </View>
            <View style={styles.privacyItem}>
              <Ionicons
                name="eye-off-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.privacyText, { color: theme.colors.textMuted }]}>
                No personal data is used for training
              </Text>
            </View>
          </View>

          {/* Pro Features */}
          <TouchableOpacity
            style={[styles.proSection, { backgroundColor: theme.colors.primary + '10' }]}
            accessible={true}
            accessibilityLabel="Upgrade to Pro"
            accessibilityRole="button"
          >
            <View style={styles.proHeader}>
              <Text style={[styles.proTitle, { color: theme.colors.primary }]}>
                Upgrade to Pro
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.proDescription, { color: theme.colors.text }]}>
              • Unlimited daily messages
              • Priority AI responses
              • Advanced tone customization
              • Export conversation history
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  usageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageText: {
    fontSize: 16,
  },
  usageCount: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  resetText: {
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  proSection: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  proHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  proDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { useCoachStore } from '@stores/coachStore';
import { H2, Caption } from '@components/common/Typography';
import { ToneSelector } from '@components/coach/ToneSelector';
import { CoachTone } from '@types/database';

interface CoachHeaderProps {
  currentTone: CoachTone;
  onToneChange: (tone: CoachTone) => void;
  messagesRemaining: number;
  onSettingsPress?: () => void;
}

export function CoachHeader({ 
  currentTone, 
  onToneChange, 
  messagesRemaining,
  onSettingsPress 
}: CoachHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.border 
    }]}>
      <View style={styles.leftSection}>
        <H2 style={{ color: '#4A6FA5' }}>
          Coach
        </H2>
      </View>
      
      <View style={styles.rightSection}>
        <ToneSelector
          currentTone={currentTone}
          onToneChange={onToneChange}
        />
        
        <View style={[styles.limitIndicator, { 
          backgroundColor: theme.colors.surfaceSection,
          borderColor: theme.colors.border 
        }]}>
          <Caption 
            style={{ 
              color: messagesRemaining <= 3 ? theme.colors.warning : theme.colors.textSecondary,
              fontWeight: '500'
            }}
          >
            {messagesRemaining}/10 today
          </Caption>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  limitIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
});
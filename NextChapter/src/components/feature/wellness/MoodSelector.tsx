import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { MoodValue, MOOD_EMOJIS, MOOD_DESCRIPTORS } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface MoodSelectorProps {
  selectedMood?: MoodValue;
  onSelect: (mood: MoodValue) => void;
  disabled?: boolean;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onSelect,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [pressedMood, setPressedMood] = useState<MoodValue | null>(null);
  const scaleAnims = React.useRef<Record<number, Animated.Value>>({});

  // Initialize animations for each mood
  React.useEffect(() => {
    Object.values(MoodValue).forEach((value) => {
      if (typeof value === 'number') {
        scaleAnims.current[value] = new Animated.Value(1);
      }
    });
  }, []);

  const handlePressIn = (mood: MoodValue) => {
    if (disabled) return;
    
    setPressedMood(mood);
    Animated.spring(scaleAnims.current[mood], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (mood: MoodValue) => {
    if (disabled) return;
    
    setPressedMood(null);
    Animated.spring(scaleAnims.current[mood], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (mood: MoodValue) => {
    if (disabled) return;
    
    onSelect(mood);
    // Announce selection to screen readers
    AccessibilityInfo.announceForAccessibility(`Selected ${MOOD_DESCRIPTORS[mood]} mood`);
  };

  const renderMoodOption = (mood: MoodValue) => {
    const isSelected = selectedMood === mood;
    const isPressed = pressedMood === mood;
    
    return (
      <Animated.View
        key={mood}
        style={{
          transform: [{ scale: scaleAnims.current[mood] || 1 }],
        }}
      >
        <TouchableOpacity
          testID={`mood-option-${mood}`}
          onPress={() => handlePress(mood)}
          onPressIn={() => handlePressIn(mood)}
          onPressOut={() => handlePressOut(mood)}
          disabled={disabled}
          accessibilityLabel={`Select ${MOOD_DESCRIPTORS[mood]} mood`}
          accessibilityRole="button"
          accessibilityState={{
            selected: isSelected,
            disabled,
          }}
          accessibilityHint={isSelected ? `Selected ${MOOD_DESCRIPTORS[mood]} mood` : undefined}
          style={[
            styles.moodOption,
            {
              backgroundColor: isSelected
                ? theme.colors.primary
                : theme.colors.surface,
              borderColor: isSelected
                ? theme.colors.primary
                : theme.colors.border,
              opacity: disabled ? 0.5 : isPressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={styles.moodEmoji}>{MOOD_EMOJIS[mood]}</Text>
          <Text
            style={[
              styles.moodLabel,
              {
                color: isSelected
                  ? theme.colors.background
                  : theme.colors.text,
              },
            ]}
          >
            {MOOD_DESCRIPTORS[mood]}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container} testID="mood-selector">
      <View style={styles.moodGrid}>
        {Object.values(MoodValue)
          .filter((value) => typeof value === 'number')
          .map((mood) => renderMoodOption(mood as MoodValue))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  moodOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
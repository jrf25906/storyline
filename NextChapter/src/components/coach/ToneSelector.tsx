import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { H3, Body, Caption } from '@components/common/Typography';
import { useTheme } from '@context/ThemeContext';
import { CoachTone } from '@types/database';
import { Ionicons } from '@expo/vector-icons';

interface ToneSelectorProps {
  currentTone: CoachTone;
  onToneChange: (tone: CoachTone) => void;
  disabled?: boolean;
}

interface ToneOption {
  value: CoachTone;
  label: string;
  description: string;
  color: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    value: 'hype',
    label: 'Hype',
    description: 'Energetic encouragement when you need a boost',
    color: '#8B7CA6', // Soft purple
  },
  {
    value: 'pragmatist',
    label: 'Pragmatist',
    description: 'Practical step-by-step guidance',
    color: '#4A6FA5', // Calm blue
  },
  {
    value: 'tough-love',
    label: 'Tough Love',
    description: 'Direct feedback to help you move forward',
    color: '#D4736A', // Gentle coral
  },
];

export const ToneSelector: React.FC<ToneSelectorProps> = ({
  currentTone,
  onToneChange,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentOption = TONE_OPTIONS.find(opt => opt.value === currentTone) || TONE_OPTIONS[1];

  const handleSelect = (tone: CoachTone) => {
    onToneChange(tone);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          disabled && styles.selectorDisabled
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        accessible={true}
        accessibilityLabel={`Coach tone: ${currentOption.label}`}
        accessibilityRole="button"
        accessibilityHint="Tap to change coach tone"
      >
        <View style={styles.selectorContent}>
          <View style={[styles.toneDot, { backgroundColor: currentOption.color }]} />
          <Body style={{ color: theme.colors.text, fontWeight: '500' }}>
            {currentOption.label}
          </Body>
          <Ionicons
            name="chevron-down"
            size={16}
            color={disabled ? theme.colors.textTertiary : theme.colors.textSecondary}
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                  },
                  android: {
                    elevation: 8,
                  },
                }),
              },
            ]}
          >
            <H3 style={styles.modalTitle}>
              Choose Coach Tone
            </H3>
            
            <FlatList
              data={TONE_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        item.value === currentTone
                          ? theme.colors.surfaceSection
                          : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelect(item.value)}
                  accessible={true}
                  accessibilityLabel={`${item.label}: ${item.description}`}
                  accessibilityRole="button"
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.optionDot, { backgroundColor: item.color }]} />
                    <View style={styles.optionText}>
                      <Body style={{ fontWeight: '500' }}>
                        {item.label}
                      </Body>
                      <Caption style={[styles.description, { color: theme.colors.textSecondary }]}>
                        {item.description}
                      </Caption>
                    </View>
                    {item.value === currentTone && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.checkmark}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorDisabled: {
    opacity: 0.5,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  chevron: {
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    marginBottom: 16,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  description: {
    marginTop: 2,
  },
  checkmark: {
    marginLeft: 8,
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
});
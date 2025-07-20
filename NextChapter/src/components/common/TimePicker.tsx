import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  AccessibilityInfo,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Theme-independent defaults
const DEFAULT_THEME = {
  colors: {
    primary: '#2D5A27',
    error: '#E74C3C',
    success: '#27AE60',
    warning: '#F39C12',
    text: '#000000',
    textSecondary: '#6C757D',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    border: '#E5E5E5',
    white: '#FFFFFF',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
  },
  typography: {
    fontSizes: {
      caption: 14,
      body: 16,
      headingSM: 18,
    },
  },
};

export interface TimeValue {
  hours: number;
  minutes: number;
  period?: 'AM' | 'PM'; // Only used in 12-hour format
}

export interface TimePickerProps {
  value?: TimeValue;
  onChange: (time: TimeValue) => void;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'gentle';
  size?: 'small' | 'medium' | 'large';
  format?: '12' | '24';
  minTime?: TimeValue;
  maxTime?: TimeValue;
  placeholder?: string;
  containerStyle?: ViewStyle;
  pickerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  error,
  hint,
  disabled = false,
  required = false,
  variant = 'default',
  size = 'medium',
  format = '12',
  minTime,
  maxTime,
  placeholder = 'Select time',
  containerStyle,
  pickerStyle,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
  testID = 'time-picker',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHours, setSelectedHours] = useState(value?.hours || (format === '12' ? 12 : 0));
  const [selectedMinutes, setSelectedMinutes] = useState(value?.minutes || 0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(value?.period || 'AM');
  
  const focusAnimation = useRef(new Animated.Value(0)).current;

  // Format display value
  const displayValue = useMemo(() => {
    if (!value) return placeholder;
    
    const hours = format === '12' 
      ? value.hours === 0 ? 12 : value.hours > 12 ? value.hours - 12 : value.hours
      : value.hours;
    
    const minutes = value.minutes.toString().padStart(2, '0');
    const hoursStr = hours.toString().padStart(format === '24' ? 2 : 1, '0');
    
    if (format === '12') {
      return `${hoursStr}:${minutes} ${value.period || 'AM'}`;
    }
    return `${hoursStr}:${minutes}`;
  }, [value, placeholder, format]);

  // Generate hours array based on format
  const hoursArray = useMemo(() => {
    if (format === '12') {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
    return Array.from({ length: 24 }, (_, i) => i);
  }, [format]);

  // Generate minutes array (5-minute intervals)
  const minutesArray = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i * 5);
  }, []);

  // Check if time is within constraints
  const isTimeValid = useCallback((hours: number, minutes: number, period?: 'AM' | 'PM') => {
    const timeValue: TimeValue = format === '12' 
      ? { hours, minutes, period } 
      : { hours, minutes };

    // Convert to 24-hour format for comparison
    let hours24 = hours;
    if (format === '12' && period) {
      if (period === 'PM' && hours !== 12) hours24 = hours + 12;
      if (period === 'AM' && hours === 12) hours24 = 0;
    }

    const currentTime = hours24 * 60 + minutes;

    if (minTime) {
      let minHours24 = minTime.hours;
      if (format === '12' && minTime.period) {
        if (minTime.period === 'PM' && minTime.hours !== 12) minHours24 = minTime.hours + 12;
        if (minTime.period === 'AM' && minTime.hours === 12) minHours24 = 0;
      }
      const minTimeMinutes = minHours24 * 60 + minTime.minutes;
      if (currentTime < minTimeMinutes) return false;
    }

    if (maxTime) {
      let maxHours24 = maxTime.hours;
      if (format === '12' && maxTime.period) {
        if (maxTime.period === 'PM' && maxTime.hours !== 12) maxHours24 = maxTime.hours + 12;
        if (maxTime.period === 'AM' && maxTime.hours === 12) maxHours24 = 0;
      }
      const maxTimeMinutes = maxHours24 * 60 + maxTime.minutes;
      if (currentTime > maxTimeMinutes) return false;
    }

    return true;
  }, [format, minTime, maxTime]);

  useEffect(() => {
    Animated.timing(focusAnimation, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen, focusAnimation]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    
    // Initialize with current value or defaults
    if (value) {
      setSelectedHours(value.hours);
      setSelectedMinutes(value.minutes);
      if (format === '12' && value.period) {
        setSelectedPeriod(value.period);
      }
    }
    
    setIsOpen(true);
    
    AccessibilityInfo.announceForAccessibility(
      `${label || 'Time picker'} opened. Select hours, minutes${format === '12' ? ', and AM or PM' : ''}.`
    );
  }, [disabled, value, format, label]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    AccessibilityInfo.announceForAccessibility(`${label || 'Time picker'} closed.`);
  }, [label]);

  const handleConfirm = useCallback(() => {
    const newTime: TimeValue = format === '12' 
      ? { hours: selectedHours, minutes: selectedMinutes, period: selectedPeriod }
      : { hours: selectedHours, minutes: selectedMinutes };

    if (isTimeValid(selectedHours, selectedMinutes, selectedPeriod)) {
      onChange(newTime);
      handleClose();
      
      const timeStr = format === '12' 
        ? `${selectedHours}:${selectedMinutes.toString().padStart(2, '0')} ${selectedPeriod}`
        : `${selectedHours.toString().padStart(2, '0')}:${selectedMinutes.toString().padStart(2, '0')}`;
      
      AccessibilityInfo.announceForAccessibility(`Time selected: ${timeStr}`);
    }
  }, [selectedHours, selectedMinutes, selectedPeriod, format, isTimeValid, onChange, handleClose]);

  const sizeStyles = {
    small: {
      paddingVertical: DEFAULT_THEME.spacing.xs,
      paddingHorizontal: DEFAULT_THEME.spacing.sm,
      fontSize: DEFAULT_THEME.typography.fontSizes.caption,
    },
    medium: {
      paddingVertical: DEFAULT_THEME.spacing.sm,
      paddingHorizontal: DEFAULT_THEME.spacing.md,
      fontSize: DEFAULT_THEME.typography.fontSizes.body,
    },
    large: {
      paddingVertical: DEFAULT_THEME.spacing.md,
      paddingHorizontal: DEFAULT_THEME.spacing.lg,
      fontSize: DEFAULT_THEME.typography.fontSizes.headingSM,
    },
  };

  const variantColors = {
    default: {
      border: DEFAULT_THEME.colors.border,
      focusBorder: DEFAULT_THEME.colors.primary,
      text: DEFAULT_THEME.colors.text,
    },
    success: {
      border: DEFAULT_THEME.colors.success,
      focusBorder: DEFAULT_THEME.colors.success,
      text: DEFAULT_THEME.colors.success,
    },
    warning: {
      border: DEFAULT_THEME.colors.warning,
      focusBorder: DEFAULT_THEME.colors.warning,
      text: DEFAULT_THEME.colors.warning,
    },
    gentle: {
      border: DEFAULT_THEME.colors.surface,
      focusBorder: DEFAULT_THEME.colors.primary,
      text: DEFAULT_THEME.colors.textSecondary,
    },
  };

  const currentVariant = error ? { ...variantColors.default, border: DEFAULT_THEME.colors.error } : variantColors[variant];

  const renderTimeSelector = () => (
    <View style={styles.timeSelectorContainer}>
      {/* Hours */}
      <View style={styles.timeColumn}>
        <Text style={[styles.columnLabel, { color: DEFAULT_THEME.colors.text, fontSize: sizeStyles[size].fontSize }]}>
          Hours
        </Text>
        <View style={[styles.scrollContainer, { backgroundColor: DEFAULT_THEME.colors.surface }]}>
          {hoursArray.map((hour) => {
            const isSelected = hour === selectedHours;
            const isValidTime = isTimeValid(hour, selectedMinutes, selectedPeriod);
            
            return (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.timeOption,
                  {
                    backgroundColor: isSelected ? DEFAULT_THEME.colors.primary : 'transparent',
                    opacity: isValidTime ? 1 : 0.3,
                  },
                ]}
                onPress={() => isValidTime && setSelectedHours(hour)}
                disabled={!isValidTime}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${hour} ${hour === 1 ? 'hour' : 'hours'}`}
                accessibilityState={{ selected: isSelected, disabled: !isValidTime }}
                testID={`${testID}-hour-${hour}`}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    {
                      color: isSelected ? DEFAULT_THEME.colors.white : DEFAULT_THEME.colors.text,
                      fontSize: sizeStyles[size].fontSize,
                    },
                  ]}
                >
                  {format === '24' ? hour.toString().padStart(2, '0') : hour}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Minutes */}
      <View style={styles.timeColumn}>
        <Text style={[styles.columnLabel, { color: DEFAULT_THEME.colors.text, fontSize: sizeStyles[size].fontSize }]}>
          Minutes
        </Text>
        <View style={[styles.scrollContainer, { backgroundColor: DEFAULT_THEME.colors.surface }]}>
          {minutesArray.map((minute) => {
            const isSelected = minute === selectedMinutes;
            const isValidTime = isTimeValid(selectedHours, minute, selectedPeriod);
            
            return (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.timeOption,
                  {
                    backgroundColor: isSelected ? DEFAULT_THEME.colors.primary : 'transparent',
                    opacity: isValidTime ? 1 : 0.3,
                  },
                ]}
                onPress={() => isValidTime && setSelectedMinutes(minute)}
                disabled={!isValidTime}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`${minute} ${minute === 1 ? 'minute' : 'minutes'}`}
                accessibilityState={{ selected: isSelected, disabled: !isValidTime }}
                testID={`${testID}-minute-${minute}`}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    {
                      color: isSelected ? DEFAULT_THEME.colors.white : DEFAULT_THEME.colors.text,
                      fontSize: sizeStyles[size].fontSize,
                    },
                  ]}
                >
                  {minute.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* AM/PM for 12-hour format */}
      {format === '12' && (
        <View style={styles.timeColumn}>
          <Text style={[styles.columnLabel, { color: DEFAULT_THEME.colors.text, fontSize: sizeStyles[size].fontSize }]}>
            Period
          </Text>
          <View style={[styles.scrollContainer, { backgroundColor: DEFAULT_THEME.colors.surface }]}>
            {(['AM', 'PM'] as const).map((period) => {
              const isSelected = period === selectedPeriod;
              const isValidTime = isTimeValid(selectedHours, selectedMinutes, period);
              
              return (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.timeOption,
                    {
                      backgroundColor: isSelected ? DEFAULT_THEME.colors.primary : 'transparent',
                      opacity: isValidTime ? 1 : 0.3,
                    },
                  ]}
                  onPress={() => isValidTime && setSelectedPeriod(period)}
                  disabled={!isValidTime}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={period}
                  accessibilityState={{ selected: isSelected, disabled: !isValidTime }}
                  testID={`${testID}-period-${period}`}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      {
                        color: isSelected ? DEFAULT_THEME.colors.white : DEFAULT_THEME.colors.text,
                        fontSize: sizeStyles[size].fontSize,
                      },
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              {
                color: DEFAULT_THEME.colors.text,
                fontSize: DEFAULT_THEME.typography.fontSizes.caption,
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
          {required && (
            <Text style={[styles.required, { color: DEFAULT_THEME.colors.error }]}>
              *
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.picker,
          sizeStyles[size],
          {
            borderColor: error ? DEFAULT_THEME.colors.error : currentVariant.border,
            backgroundColor: disabled 
              ? DEFAULT_THEME.colors.surface 
              : DEFAULT_THEME.colors.background,
          },
          pickerStyle,
        ]}
        onPress={handleOpen}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel || 
          `${label || 'Time picker'}, current value: ${displayValue}`
        }
        accessibilityHint={
          accessibilityHint || 
          `Double tap to open time picker and select ${format === '12' ? '12-hour' : '24-hour'} time`
        }
        accessibilityState={{
          disabled,
          expanded: isOpen,
        }}
        testID={testID}
      >
        <Text
          style={[
            styles.pickerText,
            {
              color: value 
                ? DEFAULT_THEME.colors.text 
                : DEFAULT_THEME.colors.textSecondary,
              fontSize: sizeStyles[size].fontSize,
            },
          ]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>
        
        <Ionicons
          name="time-outline"
          size={sizeStyles[size].fontSize * 1.2}
          color={DEFAULT_THEME.colors.textSecondary}
        />
      </TouchableOpacity>

      {hint && !error && (
        <Text
          style={[
            styles.hint,
            {
              color: DEFAULT_THEME.colors.textSecondary,
              fontSize: DEFAULT_THEME.typography.fontSizes.caption,
            },
          ]}
        >
          {hint}
        </Text>
      )}

      {error && (
        <Text
          style={[
            styles.error,
            {
              color: DEFAULT_THEME.colors.error,
              fontSize: DEFAULT_THEME.typography.fontSizes.caption,
            },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : undefined}
            style={styles.modalContainer}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: DEFAULT_THEME.colors.background,
                  shadowColor: DEFAULT_THEME.colors.text,
                },
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: DEFAULT_THEME.colors.border }]}>
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color: DEFAULT_THEME.colors.text,
                      fontSize: DEFAULT_THEME.typography.fontSizes.headingSM,
                    },
                  ]}
                >
                  {label || 'Select Time'}
                </Text>
              </View>

              {renderTimeSelector()}

              <View style={[styles.modalActions, { borderTopColor: DEFAULT_THEME.colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.cancelButton,
                    { borderColor: DEFAULT_THEME.colors.border },
                  ]}
                  onPress={handleClose}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Cancel time selection"
                  testID={`${testID}-cancel`}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      {
                        color: DEFAULT_THEME.colors.textSecondary,
                        fontSize: sizeStyles[size].fontSize,
                      },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.confirmButton,
                    {
                      backgroundColor: isTimeValid(selectedHours, selectedMinutes, selectedPeriod)
                        ? DEFAULT_THEME.colors.primary
                        : DEFAULT_THEME.colors.surface,
                    },
                  ]}
                  onPress={handleConfirm}
                  disabled={!isTimeValid(selectedHours, selectedMinutes, selectedPeriod)}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Confirm time selection"
                  accessibilityState={{
                    disabled: !isTimeValid(selectedHours, selectedMinutes, selectedPeriod),
                  }}
                  testID={`${testID}-confirm`}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      {
                        color: isTimeValid(selectedHours, selectedMinutes, selectedPeriod)
                          ? DEFAULT_THEME.colors.white
                          : DEFAULT_THEME.colors.textSecondary,
                        fontSize: sizeStyles[size].fontSize,
                      },
                    ]}
                  >
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: '500',
  },
  required: {
    marginLeft: 4,
    fontWeight: '600',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 8,
    position: 'relative',
    minHeight: 48,
  },
  pickerText: {
    flex: 1,
    marginRight: 8,
  },
  hint: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  error: {
    marginTop: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: '600',
  },
  timeSelectorContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollContainer: {
    maxHeight: 200,
    borderRadius: 8,
    padding: 4,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginVertical: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  timeOptionText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // Background color set dynamically
  },
  actionButtonText: {
    fontWeight: '500',
  },
});
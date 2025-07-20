import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  ViewStyle,
  TextStyle,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme';
import { useFadeInAnimation, useSlideInAnimation } from '@hooks';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DateRangePreset {
  label: string;
  value: string;
  getDates: () => DateRange;
  description?: string;
}

export interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onRangeChange: (range: DateRange) => void;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'gentle';
  size?: 'small' | 'medium' | 'large';
  placeholder?: string;
  presets?: DateRangePreset[];
  maxDate?: Date;
  minDate?: Date;
  containerStyle?: ViewStyle;
  datePickerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const defaultPresets: DateRangePreset[] = [
  {
    label: 'Last 7 days',
    value: 'last-7-days',
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { startDate: start, endDate: end };
    },
    description: 'Previous week including today',
  },
  {
    label: 'Last 30 days',
    value: 'last-30-days',
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return { startDate: start, endDate: end };
    },
    description: 'Previous month including today',
  },
  {
    label: 'Last 3 months',
    value: 'last-3-months',
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      return { startDate: start, endDate: end };
    },
    description: 'Previous 3 months including today',
  },
  {
    label: 'This month',
    value: 'this-month',
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: start, endDate: end };
    },
    description: 'Current month from first to last day',
  },
  {
    label: 'Last month',
    value: 'last-month',
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: start, endDate: end };
    },
    description: 'Previous month from first to last day',
  },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onRangeChange,
  label,
  error,
  hint,
  disabled = false,
  required = false,
  variant = 'default',
  size = 'medium',
  placeholder = 'Select date range',
  presets = defaultPresets,
  maxDate,
  minDate,
  containerStyle,
  datePickerStyle,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
  testID = 'date-range-picker',
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'presets' | 'calendar'>('presets');
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate || null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const datePickerRef = useRef<TouchableOpacity>(null);
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const modalFadeIn = useFadeInAnimation();
  const calendarSlideIn = useSlideInAnimation();

  // Reset temp dates when props change
  useEffect(() => {
    setTempStartDate(startDate || null);
    setTempEndDate(endDate || null);
  }, [startDate, endDate]);

  useEffect(() => {
    Animated.timing(focusAnimation, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen, focusAnimation]);

  const formatDateRange = useCallback(() => {
    if (!startDate && !endDate) return placeholder;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        return formatDate(startDate);
      }
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    if (startDate) {
      return `From ${formatDate(startDate)}`;
    }

    if (endDate) {
      return `Until ${formatDate(endDate)}`;
    }

    return placeholder;
  }, [startDate, endDate, placeholder]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setCurrentView('presets');
    modalFadeIn.animate();
    
    AccessibilityInfo.announceForAccessibility(
      `${label || 'Date range picker'} opened. Choose from presets or select custom dates.`
    );
  }, [disabled, label, modalFadeIn]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    modalFadeIn.fadeOut();
    AccessibilityInfo.announceForAccessibility(`${label || 'Date range picker'} closed.`);
  }, [label, modalFadeIn]);

  const handlePresetSelect = useCallback((preset: DateRangePreset) => {
    const range = preset.getDates();
    onRangeChange(range);
    handleClose();
    AccessibilityInfo.announceForAccessibility(
      `Selected ${preset.label}: ${formatDateForAccessibility(range.startDate)} to ${formatDateForAccessibility(range.endDate)}`
    );
  }, [onRangeChange, handleClose]);

  const handleCustomRange = useCallback(() => {
    setCurrentView('calendar');
    calendarSlideIn.animate();
    AccessibilityInfo.announceForAccessibility('Switched to calendar view for custom date selection');
  }, [calendarSlideIn]);

  const handleApplyRange = useCallback(() => {
    onRangeChange({ startDate: tempStartDate, endDate: tempEndDate });
    handleClose();
    AccessibilityInfo.announceForAccessibility(
      `Applied custom range: ${formatDateForAccessibility(tempStartDate)} to ${formatDateForAccessibility(tempEndDate)}`
    );
  }, [tempStartDate, tempEndDate, onRangeChange, handleClose]);

  const handleClearRange = useCallback(() => {
    setTempStartDate(null);
    setTempEndDate(null);
    onRangeChange({ startDate: null, endDate: null });
    handleClose();
    AccessibilityInfo.announceForAccessibility('Date range cleared');
  }, [onRangeChange, handleClose]);

  const formatDateForAccessibility = (date: Date | null) => {
    if (!date) return 'no date selected';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const sizeStyles = {
    small: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      fontSize: theme.typography.caption.fontSize,
    },
    medium: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.typography.body.fontSize,
    },
    large: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      fontSize: theme.typography.subtitle.fontSize,
    },
  };

  const variantColors = {
    default: {
      border: theme.colors.border,
      focusBorder: theme.colors.primary,
      text: theme.colors.text.primary,
    },
    success: {
      border: theme.colors.semantic.success,
      focusBorder: theme.colors.semantic.success,
      text: theme.colors.semantic.success,
    },
    warning: {
      border: theme.colors.semantic.warning,
      focusBorder: theme.colors.semantic.warning,
      text: theme.colors.semantic.warning,
    },
    gentle: {
      border: theme.colors.surface.secondary,
      focusBorder: theme.colors.primary,
      text: theme.colors.text.secondary,
    },
  };

  const currentVariant = error 
    ? { ...variantColors.default, border: theme.colors.semantic.error } 
    : variantColors[variant];

  const animatedBorderColor = focusAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [currentVariant.border, currentVariant.focusBorder],
  });

  const generateCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks) to fill calendar grid
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [currentMonth]);

  const isDateInRange = useCallback((date: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    return date >= tempStartDate && date <= tempEndDate;
  }, [tempStartDate, tempEndDate]);

  const isDateSelected = useCallback((date: Date) => {
    if (tempStartDate && date.toDateString() === tempStartDate.toDateString()) return true;
    if (tempEndDate && date.toDateString() === tempEndDate.toDateString()) return true;
    return false;
  }, [tempStartDate, tempEndDate]);

  const handleDatePress = useCallback((date: Date) => {
    // Check date constraints
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Start new selection
      setTempStartDate(date);
      setTempEndDate(null);
    } else {
      // Complete the range
      if (date < tempStartDate) {
        setTempStartDate(date);
        setTempEndDate(tempStartDate);
      } else {
        setTempEndDate(date);
      }
    }

    AccessibilityInfo.announceForAccessibility(
      `Selected ${formatDateForAccessibility(date)}`
    );
  }, [tempStartDate, tempEndDate, minDate, maxDate]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  }, []);

  const renderPresetItem = ({ item }: { item: DateRangePreset }) => (
    <TouchableOpacity
      style={[
        styles.presetItem,
        sizeStyles[size],
        {
          backgroundColor: theme.colors.surface.primary,
          borderBottomColor: theme.colors.border,
        },
      ]}
      onPress={() => handlePresetSelect(item)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${item.label}${item.description ? `, ${item.description}` : ''}`}
      testID={`${testID}-preset-${item.value}`}
    >
      <View style={styles.presetContent}>
        <Text
          style={[
            styles.presetLabel,
            {
              color: theme.colors.text.primary,
              fontSize: sizeStyles[size].fontSize,
            },
          ]}
        >
          {item.label}
        </Text>
        {item.description && (
          <Text
            style={[
              styles.presetDescription,
              {
                color: theme.colors.text.secondary,
                fontSize: sizeStyles[size].fontSize * 0.85,
              },
            ]}
          >
            {item.description}
          </Text>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={sizeStyles[size].fontSize * 1.2}
        color={theme.colors.text.secondary}
      />
    </TouchableOpacity>
  );

  const renderCalendarDay = (date: Date, index: number) => {
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = isDateSelected(date);
    const isInRange = isDateInRange(date);
    const isDisabled = 
      (minDate && date < minDate) || 
      (maxDate && date > maxDate) ||
      !isCurrentMonth;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          {
            backgroundColor: isSelected 
              ? theme.colors.primary 
              : isInRange 
                ? theme.colors.surface.secondary 
                : 'transparent',
            opacity: isDisabled ? 0.3 : 1,
          },
        ]}
        onPress={() => !isDisabled && handleDatePress(date)}
        disabled={isDisabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={formatDateForAccessibility(date)}
        accessibilityState={{
          selected: isSelected,
          disabled: isDisabled,
        }}
        testID={`${testID}-day-${date.getDate()}`}
      >
        <Text
          style={[
            styles.calendarDayText,
            {
              color: isSelected 
                ? theme.colors.surface.primary 
                : isToday 
                  ? theme.colors.primary 
                  : isCurrentMonth 
                    ? theme.colors.text.primary 
                    : theme.colors.text.secondary,
              fontWeight: isToday || isSelected ? '600' : '400',
            },
          ]}
        >
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.text.primary,
                fontSize: theme.typography.caption.fontSize,
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
          {required && (
            <Text style={[styles.required, { color: theme.colors.semantic.error }]}>
              *
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        ref={datePickerRef}
        style={[
          styles.datePicker,
          sizeStyles[size],
          {
            borderColor: error ? theme.colors.semantic.error : currentVariant.border,
            backgroundColor: disabled 
              ? theme.colors.surface.secondary 
              : theme.colors.surface.primary,
          },
          datePickerStyle,
        ]}
        onPress={handleOpen}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel || 
          `${label || 'Date range picker'}, current value: ${formatDateRange()}`
        }
        accessibilityHint={
          accessibilityHint || 
          'Double tap to open date range picker'
        }
        accessibilityState={{
          disabled,
          expanded: isOpen,
        }}
        testID={testID}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.focusBorder,
            {
              borderColor: animatedBorderColor,
            },
          ]}
        />
        
        <Text
          style={[
            styles.datePickerText,
            {
              color: startDate || endDate 
                ? theme.colors.text.primary 
                : theme.colors.text.secondary,
              fontSize: sizeStyles[size].fontSize,
            },
          ]}
          numberOfLines={1}
        >
          {formatDateRange()}
        </Text>
        
        <Ionicons
          name="calendar"
          size={sizeStyles[size].fontSize * 1.2}
          color={theme.colors.text.secondary}
        />
      </TouchableOpacity>

      {hint && !error && (
        <Text
          style={[
            styles.hint,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.caption.fontSize,
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
              color: theme.colors.semantic.error,
              fontSize: theme.typography.caption.fontSize,
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
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface.primary,
                shadowColor: theme.colors.text.primary,
              },
              modalFadeIn.animatedStyle,
            ]}
          >
            {currentView === 'presets' ? (
              <View>
                <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color: theme.colors.text.primary,
                        fontSize: theme.typography.subtitle.fontSize,
                      },
                    ]}
                  >
                    Quick Select
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Close date picker"
                    testID={`${testID}-close`}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.presetsList}>
                  {presets.map((preset, index) => (
                    <View key={preset.value}>
                      {renderPresetItem({ item: preset })}
                    </View>
                  ))}
                  
                  <TouchableOpacity
                    style={[
                      styles.customRangeButton,
                      {
                        backgroundColor: theme.colors.surface.secondary,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={handleCustomRange}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Select custom date range"
                    testID={`${testID}-custom-range`}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.customRangeIcon}
                    />
                    <Text
                      style={[
                        styles.customRangeText,
                        {
                          color: theme.colors.primary,
                          fontSize: sizeStyles[size].fontSize,
                        },
                      ]}
                    >
                      Custom Date Range
                    </Text>
                  </TouchableOpacity>

                  {(startDate || endDate) && (
                    <TouchableOpacity
                      style={[
                        styles.clearButton,
                        {
                          backgroundColor: theme.colors.surface.secondary,
                        },
                      ]}
                      onPress={handleClearRange}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="Clear date range"
                      testID={`${testID}-clear`}
                    >
                      <Text
                        style={[
                          styles.clearButtonText,
                          {
                            color: theme.colors.text.secondary,
                            fontSize: sizeStyles[size].fontSize,
                          },
                        ]}
                      >
                        Clear Selection
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            ) : (
              <Animated.View style={calendarSlideIn.animatedStyle}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                  <TouchableOpacity
                    onPress={() => {
                      setCurrentView('presets');
                      AccessibilityInfo.announceForAccessibility('Switched back to preset view');
                    }}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Back to presets"
                    testID={`${testID}-back`}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={24}
                      color={theme.colors.text.primary}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color: theme.colors.text.primary,
                        fontSize: theme.typography.subtitle.fontSize,
                      },
                    ]}
                  >
                    Select Dates
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Close date picker"
                    testID={`${testID}-close`}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.calendarContainer}>
                  <View style={styles.monthNavigation}>
                    <TouchableOpacity
                      onPress={() => navigateMonth('prev')}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="Previous month"
                      testID={`${testID}-prev-month`}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={24}
                        color={theme.colors.text.primary}
                      />
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.monthTitle,
                        {
                          color: theme.colors.text.primary,
                          fontSize: theme.typography.subtitle.fontSize,
                        },
                      ]}
                    >
                      {currentMonth.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigateMonth('next')}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="Next month"
                      testID={`${testID}-next-month`}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={theme.colors.text.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.weekHeader}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <Text
                        key={day}
                        style={[
                          styles.weekHeaderText,
                          {
                            color: theme.colors.text.secondary,
                            fontSize: theme.typography.caption.fontSize,
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.calendarGrid}>
                    {generateCalendarDays().map((date, index) => 
                      renderCalendarDay(date, index)
                    )}
                  </View>

                  {(tempStartDate || tempEndDate) && (
                    <View style={styles.calendarActions}>
                      <TouchableOpacity
                        style={[
                          styles.applyButton,
                          {
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                        onPress={handleApplyRange}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel="Apply selected date range"
                        testID={`${testID}-apply`}
                      >
                        <Text
                          style={[
                            styles.applyButtonText,
                            {
                              color: theme.colors.surface.primary,
                              fontSize: sizeStyles[size].fontSize,
                            },
                          ]}
                        >
                          Apply Range
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </Animated.View>
            )}
          </Animated.View>
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
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 8,
    position: 'relative',
    minHeight: 48,
  },
  focusBorder: {
    borderWidth: 2,
    borderRadius: 8,
    pointerEvents: 'none',
  },
  datePickerText: {
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
    paddingHorizontal: 16,
  },
  modalContent: {
    borderRadius: 12,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: '600',
  },
  presetsList: {
    maxHeight: 400,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 48,
  },
  presetContent: {
    flex: 1,
    marginRight: 8,
  },
  presetLabel: {
    fontWeight: '500',
    marginBottom: 2,
  },
  presetDescription: {
    marginTop: 2,
    fontStyle: 'italic',
  },
  customRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  customRangeIcon: {
    marginRight: 12,
  },
  customRangeText: {
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontWeight: '500',
  },
  calendarContainer: {
    maxHeight: 500,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  monthTitle: {
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  calendarDayText: {
    textAlign: 'center',
  },
  calendarActions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontWeight: '600',
  },
});
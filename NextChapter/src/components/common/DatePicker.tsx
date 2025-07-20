import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Animated,
  AccessibilityInfo,
  ViewStyle,
  TextStyle,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme';
import { useDropdownAnimation, useFadeInAnimation, useCardPressAnimation } from '@hooks';

export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'gentle';
  size?: 'small' | 'medium' | 'large';
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  locale?: string;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  error,
  hint,
  disabled = false,
  required = false,
  variant = 'default',
  size = 'medium',
  placeholder = 'Select a date',
  minimumDate,
  maximumDate,
  containerStyle,
  inputStyle,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
  testID = 'date-picker',
  locale = 'en-US',
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => value || new Date());
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, width: 0 });
  const inputRef = useRef<TouchableOpacity>(null);
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const { chevronRotation } = useDropdownAnimation(isOpen);
  const { animatedStyle: fadeAnimatedStyle, animate: fadeAnimate, reset: fadeReset } = useFadeInAnimation();
  const { pressIn, pressOut, animatedStyle: pressAnimatedStyle } = useCardPressAnimation();

  // Format the selected date for display
  const formatDate = useCallback((date: Date) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      // Fallback for unsupported locales
      const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
      return `${month} ${date.getDate()}, ${date.getFullYear()}`;
    }
  }, [locale]);

  // Check if a date is disabled
  const isDateDisabled = useCallback((date: Date) => {
    if (minimumDate && date < minimumDate) return true;
    if (maximumDate && date > maximumDate) return true;
    return false;
  }, [minimumDate, maximumDate]);

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startCalendar = new Date(firstDay);
    startCalendar.setDate(startCalendar.getDate() - firstDay.getDay());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days: CalendarDay[] = [];
    const current = new Date(startCalendar);
    
    // Generate 42 days (6 weeks) to fill the calendar grid
    for (let i = 0; i < 42; i++) {
      const dateForComparison = new Date(current);
      dateForComparison.setHours(0, 0, 0, 0);
      
      const selectedDateForComparison = value ? new Date(value) : null;
      if (selectedDateForComparison) {
        selectedDateForComparison.setHours(0, 0, 0, 0);
      }
      
      days.push({
        date: new Date(current),
        day: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: dateForComparison.getTime() === today.getTime(),
        isSelected: selectedDateForComparison ? dateForComparison.getTime() === selectedDateForComparison.getTime() : false,
        isDisabled: isDateDisabled(dateForComparison),
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentMonth, value, isDateDisabled]);

  useEffect(() => {
    Animated.timing(focusAnimation, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen, focusAnimation]);

  const measureInput = useCallback(() => {
    inputRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setCalendarPosition({
        top: pageY + height + 8,
        width,
      });
    });
  }, []);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    measureInput();
    setIsOpen(true);
    fadeAnimate();
    
    AccessibilityInfo.announceForAccessibility(
      `${label || 'Date picker'} opened. Use swipe gestures to navigate calendar.`
    );
  }, [disabled, measureInput, label, fadeAnimate]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    fadeReset();
    AccessibilityInfo.announceForAccessibility(`${label || 'Date picker'} closed.`);
  }, [label, fadeReset]);

  const handleDateSelect = useCallback((date: Date) => {
    if (isDateDisabled(date)) return;
    onChange(date);
    handleClose();
    AccessibilityInfo.announceForAccessibility(
      `Selected ${formatDate(date)}`
    );
  }, [onChange, handleClose, formatDate, isDateDisabled]);

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    if (!isDateDisabled(today)) {
      handleDateSelect(today);
    }
  }, [handleDateSelect, isDateDisabled]);

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

  const currentVariant = error ? { ...variantColors.default, border: theme.colors.semantic.error } : variantColors[variant];

  const animatedBorderColor = focusAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [currentVariant.border, currentVariant.focusBorder],
  });

  const renderDay = ({ item: day }: { item: CalendarDay }) => {
    const dayStyles = [
      styles.calendarDay,
      {
        backgroundColor: day.isSelected 
          ? theme.colors.primary 
          : day.isToday 
            ? theme.colors.surface.secondary 
            : 'transparent',
      },
      !day.isCurrentMonth && { opacity: 0.3 },
      day.isDisabled && { opacity: 0.5 },
    ];

    const textStyles = [
      styles.calendarDayText,
      {
        color: day.isSelected 
          ? theme.colors.text.inverse 
          : day.isToday 
            ? theme.colors.primary 
            : theme.colors.text.primary,
        fontSize: sizeStyles[size].fontSize,
        fontWeight: day.isSelected || day.isToday ? '600' : '400',
      },
    ];

    return (
      <TouchableOpacity
        style={dayStyles}
        onPress={() => handleDateSelect(day.date)}
        disabled={day.isDisabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${formatDate(day.date)}${day.isToday ? ', today' : ''}${day.isSelected ? ', selected' : ''}`}
        accessibilityState={{
          selected: day.isSelected,
          disabled: day.isDisabled,
        }}
        testID={`${testID}-day-${day.date.getTime()}`}
      >
        <Text style={textStyles}>{day.day}</Text>
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

      <Animated.View style={pressAnimatedStyle}>
        <TouchableOpacity
          ref={inputRef}
          style={[
            styles.input,
            sizeStyles[size],
            {
              borderColor: error ? theme.colors.semantic.error : currentVariant.border,
              backgroundColor: disabled 
                ? theme.colors.surface.secondary 
                : theme.colors.surface.primary,
            },
            inputStyle,
          ]}
          onPress={handleOpen}
          onPressIn={pressIn}
          onPressOut={pressOut}
          disabled={disabled}
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            accessibilityLabel || 
            `${label || 'Date picker'}, current value: ${value ? formatDate(value) : 'none selected'}`
          }
          accessibilityHint={
            accessibilityHint || 
            'Double tap to open calendar and select a date'
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
              styles.inputText,
              {
                color: value 
                  ? theme.colors.text.primary 
                  : theme.colors.text.secondary,
                fontSize: sizeStyles[size].fontSize,
              },
            ]}
            numberOfLines={1}
          >
            {value ? formatDate(value) : placeholder}
          </Text>
          
          <Animated.View
            style={{
              transform: [{ rotate: chevronRotation }],
            }}
          >
            <Ionicons
              name="calendar"
              size={sizeStyles[size].fontSize * 1.2}
              color={theme.colors.text.secondary}
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

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
              fadeAnimatedStyle,
              styles.modalContent,
              {
                top: calendarPosition.top,
                width: Math.max(calendarPosition.width, 320),
                backgroundColor: theme.colors.surface.primary,
                shadowColor: theme.colors.text.primary,
              },
            ]}
          >
            {/* Calendar Header */}
            <View style={[styles.calendarHeader, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handlePreviousMonth}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                testID={`${testID}-previous-month`}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
              
              <Text
                style={[
                  styles.monthYearText,
                  {
                    color: theme.colors.text.primary,
                    fontSize: sizeStyles[size].fontSize * 1.1,
                  },
                ]}
              >
                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleNextMonth}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Next month"
                testID={`${testID}-next-month`}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Today Button */}
            <TouchableOpacity
              style={[styles.todayButton, { backgroundColor: theme.colors.surface.secondary }]}
              onPress={handleToday}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Select today"
              testID={`${testID}-today`}
            >
              <Text
                style={[
                  styles.todayButtonText,
                  {
                    color: theme.colors.primary,
                    fontSize: sizeStyles[size].fontSize * 0.9,
                  },
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            {/* Weekday Headers */}
            <View style={styles.weekdayHeader}>
              {WEEKDAY_NAMES.map((weekday) => (
                <Text
                  key={weekday}
                  style={[
                    styles.weekdayText,
                    {
                      color: theme.colors.text.secondary,
                      fontSize: sizeStyles[size].fontSize * 0.8,
                    },
                  ]}
                >
                  {weekday}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <FlatList
              data={calendarDays}
              renderItem={renderDay}
              keyExtractor={(day) => day.date.getTime().toString()}
              numColumns={7}
              style={styles.calendarGrid}
              scrollEnabled={false}
              accessible={false}
            />
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
  input: {
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
  inputText: {
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
  },
  modalContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
  },
  monthYearText: {
    fontWeight: '600',
  },
  todayButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 8,
  },
  todayButtonText: {
    fontWeight: '500',
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  calendarGrid: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: 6,
    minHeight: 40,
  },
  calendarDayText: {
    textAlign: 'center',
  },
});
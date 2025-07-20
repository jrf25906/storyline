import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  AccessibilityInfo,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme';
import { useDropdownAnimation } from '@hooks';

export interface DropdownOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  value?: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  required?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'gentle';
  size?: 'small' | 'medium' | 'large';
  maxHeight?: number;
  containerStyle?: ViewStyle;
  dropdownStyle?: ViewStyle;
  optionStyle?: ViewStyle;
  selectedOptionStyle?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  label,
  error,
  hint,
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  required = false,
  variant = 'default',
  size = 'medium',
  maxHeight = 300,
  containerStyle,
  dropdownStyle,
  optionStyle,
  selectedOptionStyle,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
  testID = 'dropdown',
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, width: 0 });
  const dropdownRef = useRef<TouchableOpacity>(null);
  const searchInputRef = useRef<TextInput>(null);
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const { chevronRotation } = useDropdownAnimation(isOpen);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => 
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : options;

  useEffect(() => {
    Animated.timing(focusAnimation, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen, focusAnimation]);

  const measureDropdown = useCallback(() => {
    dropdownRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setDropdownPosition({
        top: pageY + height + 8,
        width,
      });
    });
  }, []);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    measureDropdown();
    setIsOpen(true);
    setSearchQuery('');
    
    if (searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    
    AccessibilityInfo.announceForAccessibility(
      `${label || 'Dropdown'} opened. ${filteredOptions.length} options available.`
    );
  }, [disabled, measureDropdown, label, filteredOptions.length, searchable]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    AccessibilityInfo.announceForAccessibility(`${label || 'Dropdown'} closed.`);
  }, [label]);

  const handleSelect = useCallback((option: DropdownOption) => {
    if (option.disabled) return;
    onChange(option.value);
    handleClose();
    AccessibilityInfo.announceForAccessibility(
      `Selected ${option.label}${option.description ? `, ${option.description}` : ''}`
    );
  }, [onChange, handleClose]);

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

  const renderOption = ({ item }: { item: DropdownOption }) => {
    const isSelected = item.value === value;
    const isDisabled = item.disabled;

    return (
      <TouchableOpacity
        style={[
          styles.option,
          sizeStyles[size],
          {
            backgroundColor: isSelected ? theme.colors.surface.secondary : theme.colors.surface.primary,
            opacity: isDisabled ? 0.5 : 1,
          },
          optionStyle,
          isSelected && selectedOptionStyle,
        ]}
        onPress={() => handleSelect(item)}
        disabled={isDisabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${item.label}${item.description ? `, ${item.description}` : ''}`}
        accessibilityState={{
          selected: isSelected,
          disabled: isDisabled,
        }}
        testID={`${testID}-option-${item.value}`}
      >
        <View style={styles.optionContent}>
          <Text
            style={[
              styles.optionLabel,
              {
                color: isSelected ? theme.colors.primary : theme.colors.text.primary,
                fontWeight: isSelected ? '600' : '400',
                fontSize: sizeStyles[size].fontSize,
              },
            ]}
          >
            {item.label}
          </Text>
          {item.description && (
            <Text
              style={[
                styles.optionDescription,
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
        {isSelected && (
          <Ionicons
            name="checkmark"
            size={sizeStyles[size].fontSize * 1.2}
            color={theme.colors.primary}
          />
        )}
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
        ref={dropdownRef}
        style={[
          styles.dropdown,
          sizeStyles[size],
          {
            borderColor: error ? theme.colors.semantic.error : currentVariant.border,
            backgroundColor: disabled 
              ? theme.colors.surface.secondary 
              : theme.colors.surface.primary,
          },
          dropdownStyle,
        ]}
        onPress={handleOpen}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel || 
          `${label || 'Dropdown'}, current value: ${selectedOption?.label || 'none selected'}`
        }
        accessibilityHint={
          accessibilityHint || 
          `Double tap to open dropdown and select from ${options.length} options`
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
            styles.dropdownText,
            {
              color: selectedOption 
                ? theme.colors.text.primary 
                : theme.colors.text.secondary,
              fontSize: sizeStyles[size].fontSize,
            },
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        
        <Animated.View
          style={{
            transform: [{ rotate: chevronRotation }],
          }}
        >
          <Ionicons
            name="chevron-down"
            size={sizeStyles[size].fontSize * 1.2}
            color={theme.colors.text.secondary}
          />
        </Animated.View>
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : undefined}
            style={[
              styles.modalContent,
              {
                top: dropdownPosition.top,
                width: dropdownPosition.width,
                maxHeight,
                backgroundColor: theme.colors.surface.primary,
                shadowColor: theme.colors.text.primary,
              },
            ]}
          >
            {searchable && (
              <View
                style={[
                  styles.searchContainer,
                  {
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color={theme.colors.text.secondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={searchInputRef}
                  style={[
                    styles.searchInput,
                    {
                      color: theme.colors.text.primary,
                      fontSize: sizeStyles[size].fontSize,
                    },
                  ]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={theme.colors.text.secondary}
                  autoCorrect={false}
                  autoCapitalize="none"
                  accessibilityLabel="Search options"
                  testID={`${testID}-search`}
                />
              </View>
            )}

            <FlatList
              data={filteredOptions}
              renderItem={renderOption}
              keyExtractor={item => item.value}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: theme.colors.text.secondary,
                      fontSize: sizeStyles[size].fontSize,
                    },
                  ]}
                >
                  {searchQuery ? 'No matching options' : 'No options available'}
                </Text>
              }
            />
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
  dropdown: {
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
  dropdownText: {
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
    borderRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
  },
  optionsList: {
    maxHeight: 250,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  optionContent: {
    flex: 1,
    marginRight: 8,
  },
  optionLabel: {
    marginBottom: 2,
  },
  optionDescription: {
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontStyle: 'italic',
  },
});
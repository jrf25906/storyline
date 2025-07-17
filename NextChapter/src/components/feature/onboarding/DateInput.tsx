import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';

interface DateInputProps {
  value: string;
  onChangeText: (date: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChangeText,
  placeholder = 'MM/DD/YYYY',
  label,
  error,
}) => {
  const { theme } = useTheme();
  const [displayValue, setDisplayValue] = useState(value);

  const formatDate = (input: string) => {
    // Remove non-numeric characters
    const numbers = input.replace(/\D/g, '');
    
    // Apply MM/DD/YYYY format
    let formatted = '';
    if (numbers.length >= 2) {
      formatted = numbers.slice(0, 2);
      if (numbers.length > 2) {
        formatted += '/' + numbers.slice(2, 4);
        if (numbers.length > 4) {
          formatted += '/' + numbers.slice(4, 8);
        }
      }
    } else {
      formatted = numbers;
    }
    
    return formatted;
  };

  const handleDateChange = (text: string) => {
    const formatted = formatDate(text);
    setDisplayValue(formatted);
    
    // Convert to YYYY-MM-DD format for storage if complete
    if (formatted.length === 10) {
      const [month, day, year] = formatted.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      onChangeText(isoDate);
    } else {
      onChangeText('');
    }
  };

  const validateDate = (dateStr: string): boolean => {
    if (dateStr.length !== 10) return false;
    
    const [month, day, year] = dateStr.split('/').map(Number);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    // Check for valid day in month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return false;
    
    return true;
  };

  const isValid = displayValue === '' || validateDate(displayValue);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: theme.colors.surface, 
            color: theme.colors.text,
            borderColor: error || !isValid ? theme.colors.error : 'transparent',
            borderWidth: error || !isValid ? 1 : 0,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        value={displayValue}
        onChangeText={handleDateChange}
        keyboardType="numeric"
        maxLength={10}
      />
      {(error || !isValid) && displayValue !== '' && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error || 'Please enter a valid date'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
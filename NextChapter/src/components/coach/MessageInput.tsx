import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography } from '../common/Typography';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  messagesRemaining?: number;
}

export function MessageInput({
  onSend,
  disabled = false,
  isLoading = false,
  messagesRemaining,
}: MessageInputProps) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (message.trim() && !disabled && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const showLimitWarning = messagesRemaining !== undefined && messagesRemaining <= 3 && messagesRemaining > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {showLimitWarning && (
          <View
            style={[
              styles.warningContainer,
              { backgroundColor: theme.colors.warning + '20' },
            ]}
          >
            <Typography variant="caption" color={theme.colors.warning} style={styles.warningText}>
              {messagesRemaining} message{messagesRemaining !== 1 ? 's' : ''} remaining today
            </Typography>
          </View>
        )}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                color: theme.colors.text,
              },
            ]}
            placeholder={
              disabled
                ? 'Daily message limit reached'
                : 'Type your message...'
            }
            placeholderTextColor={theme.colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            editable={!disabled && !isLoading}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            accessible={true}
            accessibilityLabel="Message input"
            accessibilityHint="Type your message to the coach"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  message.trim() && !disabled && !isLoading
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
            onPress={handleSend}
            disabled={!message.trim() || disabled || isLoading}
            accessible={true}
            accessibilityLabel="Send message"
            accessibilityRole="button"
            accessibilityState={{ disabled: !message.trim() || disabled || isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={theme.colors.white}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  warningContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  warningText: {
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    width: 48, // Increased from 36 to meet WCAG minimum
    height: 48, // Increased from 36 to meet WCAG minimum
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
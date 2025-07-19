import React from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Typography } from '@components/common/Typography';
import { useTheme } from '@context/ThemeContext';
import { CoachMessage } from '@types/coach';

interface MessageBubbleProps {
  message: CoachMessage;
  animatedValue?: Animated.Value;
}

export function MessageBubble({ message, animatedValue }: MessageBubbleProps) {
  const { theme } = useTheme();
  const isUser = message.role === 'user';

  const getBubbleColor = () => {
    if (isUser) {
      return theme.colors.surfaceSection; // Light gray for user messages
    }
    
    // Coach messages use calm blue by default
    return theme.colors.calmBlue;
  };

  const getTextColor = () => {
    if (isUser) {
      return theme.colors.text;
    }
    // White text on colored coach bubbles
    return theme.colors.white;
  };

  const containerStyle = [
    styles.container,
    isUser ? styles.userContainer : styles.coachContainer,
  ];

  const bubbleStyle = [
    styles.bubble,
    {
      backgroundColor: getBubbleColor(),
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    isUser ? styles.userBubble : styles.coachBubble,
  ];

  const AnimatedContainer = animatedValue ? Animated.View : View;
  const animatedStyle = animatedValue
    ? {
      opacity: animatedValue,
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    }
    : {};

  return (
    <AnimatedContainer style={[containerStyle, animatedStyle]}>
      <View style={bubbleStyle}>
        <Typography
          variant="body"
          color={getTextColor()}
          style={styles.messageText}
          accessible={true}
          accessibilityLabel={`${isUser ? 'You' : 'Coach'} said: ${message.content}`}
        >
          {message.content}
        </Typography>
        <Typography
          variant="caption"
          color={getTextColor()}
          style={[styles.timestamp, { opacity: 0.7 }]}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      </View>
      {!isUser && message.tone && (
        <Typography
          variant="caption"
          color="secondary"
          style={styles.toneLabel}
          accessible={true}
          accessibilityLabel={`Coach tone: ${message.tone}`}
        >
          {message.tone === 'tough-love' ? 'tough love' : message.tone}
        </Typography>
      )}
    </AnimatedContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  coachContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  coachBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    lineHeight: 22,
  },
  timestamp: {
    marginTop: 4,
  },
  toneLabel: {
    marginTop: 4,
    marginLeft: 16,
    fontStyle: 'italic',
  },
});
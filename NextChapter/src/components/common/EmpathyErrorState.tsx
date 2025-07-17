import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography, Borders } from '../../theme';

interface EmpathyErrorStateProps {
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  details?: string;
  recoveryAction?: () => void;
  recoveryLabel?: string;
  showSupportLink?: boolean;
  onContactSupport?: () => void;
  fullScreen?: boolean;
  showProgressiveDisclosure?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const EmpathyErrorState: React.FC<EmpathyErrorStateProps> = ({
  title,
  message,
  type = 'error',
  details,
  recoveryAction,
  recoveryLabel = 'Try Again',
  showSupportLink = false,
  onContactSupport,
  fullScreen = false,
  showProgressiveDisclosure = false,
  style,
  testID = 'empathy-error-state',
}) => {
  const { theme } = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '🌟'; // Star instead of warning triangle
      case 'info':
        return '💡'; // Lightbulb for information
      default:
        return '💙'; // Heart instead of red X for errors
    }
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: Borders.radius.lg,
      padding: Spacing.xl,
      margin: Spacing.md,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    };

    if (fullScreen) {
      return {
        ...baseStyle,
        flex: 1,
        margin: 0,
        borderRadius: 0,
        justifyContent: 'center',
      };
    }

    return baseStyle;
  };

  const shouldShowDetails = __DEV__ || showProgressiveDisclosure;

  const content = (
    <View
      style={[getContainerStyle(), style]}
      testID={testID}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${type} alert: ${title}. ${message}`}
    >
      {/* Icon */}
      <Text style={styles.icon} accessibilityLabel={`${type} icon`}>
        {getIcon()}
      </Text>

      {/* Title */}
      <Text
        style={[
          styles.title,
          { color: theme.colors.textPrimary },
        ]}
        accessible={true}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Message */}
      <Text
        style={[
          styles.message,
          { color: theme.colors.textSecondary },
        ]}
      >
        {message}
      </Text>

      {/* Progressive disclosure for details */}
      {details && shouldShowDetails && showProgressiveDisclosure && (
        <TouchableOpacity
          onPress={() => setShowDetails(!showDetails)}
          style={styles.detailsToggle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={showDetails ? 'Hide details' : 'Show details'}
        >
          <Text style={[styles.detailsToggleText, { color: theme.colors.primary }]}>
            {showDetails ? 'Hide details' : 'Show details'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Details (Dev mode or when toggled) */}
      {details && (shouldShowDetails || showDetails) && (
        <View style={styles.detailsContainer}>
          <Text
            style={[
              styles.details,
              { color: theme.colors.textTertiary },
            ]}
          >
            {details}
          </Text>
        </View>
      )}

      {/* Recovery Action Button */}
      {recoveryAction && (
        <TouchableOpacity
          onPress={recoveryAction}
          style={[
            styles.recoveryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={recoveryLabel}
        >
          <Text style={styles.recoveryButtonText}>{recoveryLabel}</Text>
        </TouchableOpacity>
      )}

      {/* Support Link */}
      {showSupportLink && onContactSupport && (
        <TouchableOpacity
          onPress={onContactSupport}
          style={styles.supportLink}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityRole="link"
          accessibilityLabel="Contact support"
        >
          <Text
            style={[
              styles.supportLinkText,
              { color: theme.colors.calmBlue },
            ]}
          >
            Need help? We're here for you
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <ScrollView
        contentContainerStyle={styles.fullScreenScroll}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.fontSizes.body,
    lineHeight: Typography.lineHeights.relaxed,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  detailsToggle: {
    marginBottom: Spacing.sm,
  },
  detailsToggleText: {
    fontSize: Typography.fontSizes.bodySM,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  detailsContainer: {
    backgroundColor: Colors.neutral[100],
    borderRadius: Borders.radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  details: {
    fontSize: Typography.fontSizes.bodySM,
    fontFamily: 'monospace',
    lineHeight: Typography.lineHeights.relaxed,
  },
  recoveryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Borders.radius.full,
    minHeight: 48, // Minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
  recoveryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
  },
  supportLink: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  supportLinkText: {
    fontSize: Typography.fontSizes.bodySM,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  fullScreenScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
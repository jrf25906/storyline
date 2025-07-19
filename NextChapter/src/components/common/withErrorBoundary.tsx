import React, { ComponentType, ReactNode, ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { Theme } from '@theme';
import { useTheme } from '@context/ThemeContext';

interface ErrorMessageConfig {
  title?: string;
  message?: string;
}

interface WithErrorBoundaryOptions {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  errorMessage?: ErrorMessageConfig;
}

const DEFAULT_ERROR_MESSAGE: ErrorMessageConfig = {
  title: 'Oops, something unexpected happened',
  message: "We're working on it. Please try again in a moment."
};

/**
 * Higher-order component that wraps a component with an ErrorBoundary.
 * Provides stress-friendly error handling with calming, empathetic messages.
 * 
 * @param Component - The component to wrap
 * @param options - Configuration options for error handling
 * @returns Wrapped component with error boundary
 * 
 * @example
 * // Basic usage
 * export default withErrorBoundary(MyScreen);
 * 
 * // With custom error message
 * export default withErrorBoundary(MyScreen, {
 *   errorMessage: {
 *     title: 'Unable to load your data',
 *     message: 'Please check your connection and try again.'
 *   }
 * });
 * 
 * // With error tracking
 * export default withErrorBoundary(MyScreen, {
 *   onError: (error, errorInfo) => {
 *     analyticsService.trackError(error, errorInfo);
 *   }
 * });
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const { fallback, onError, errorMessage = DEFAULT_ERROR_MESSAGE } = options;
    const [errorKey, setErrorKey] = React.useState(0);

    // Custom fallback component with theme support
    const ErrorFallback = () => {
      const { theme } = useTheme();
      const styles = createStyles(theme);

      return (
        <View style={styles.container} accessibilityRole="alert">
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>💙</Text>
          </View>
          
          <Text style={styles.title}>{errorMessage.title}</Text>
          <Text style={styles.message}>{errorMessage.message}</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              // Force re-render by incrementing key
              setErrorKey(prev => prev + 1);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            accessibilityHint="Attempts to reload the screen"
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          
          <Text style={styles.supportText}>
            If this keeps happening, you can reach out to support
          </Text>
        </View>
      );
    };

    return (
      <ErrorBoundary 
        key={errorKey}
        fallback={fallback || <ErrorFallback />} 
        onError={onError}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  // Preserve component name for debugging
  const componentName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withErrorBoundary(${componentName})`;

  return WrappedComponent;
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.sizes.body * 1.5,
    paddingHorizontal: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl * 1.5,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: 150,
    minHeight: 48, // Accessibility minimum touch target
  },
  buttonText: {
    fontSize: theme.typography.sizes.button,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.buttonText,
    textAlign: 'center',
  },
  supportText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontStyle: 'italic',
  },
});
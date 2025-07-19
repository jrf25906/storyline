import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View } from 'react-native';
import { useUIStore } from '@stores/uiStore';
import { EmpathyErrorState } from '@components/common/EmpathyErrorState';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  feature?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Helper component to bridge class component with hooks
const ErrorFallback: React.FC<{ 
  error: Error; 
  onReset: () => void;
  feature?: string;
}> = ({ error, onReset, feature }) => {
  const { setGlobalError } = useUIStore();

  React.useEffect(() => {
    // Report to global error handler for critical errors
    if (!feature) {
      setGlobalError(
        error,
        "Something unexpected happened. We're working on fixing it.",
        'error',
        onReset
      );
    }
  }, [error, feature, setGlobalError, onReset]);

  if (!feature) {
    // For app-level errors, the global handler will display the error
    return null;
  }

  // For feature-level errors, show inline error state
  return (
    <EmpathyErrorState
      title="This feature needs a moment"
      message="We're having trouble loading this section. Let's try again."
      type="error"
      details={__DEV__ ? error.message : undefined}
      recoveryAction={onReset}
      recoveryLabel="Refresh"
      showProgressiveDisclosure={true}
    />
  );
};

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // Log to crash reporting service (e.g., Sentry)
    if (!__DEV__) {
      // TODO: Send to crash reporting
      console.log('Would send to crash reporting:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
    
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          feature={this.props.feature}
        />
      );
    }

    return this.props.children;
  }
}
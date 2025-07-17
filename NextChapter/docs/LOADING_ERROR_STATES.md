# Loading & Error States Documentation

## Overview

The Next Chapter app implements a comprehensive, stress-friendly loading and error state management system designed specifically for users in a vulnerable emotional state (recently laid off professionals).

## Key Principles

1. **Empathetic Communication**: All messages use supportive, non-judgmental language
2. **Calming Visuals**: Gentle animations, warm colors, no harsh red alerts
3. **Progressive Disclosure**: Technical details hidden by default
4. **Large Touch Targets**: Minimum 48x48dp for all interactive elements
5. **Offline Resilience**: Graceful degradation with local data persistence

## Architecture

### State Management (UIStore)

The `uiStore` manages all loading and error states centrally:

```typescript
import { useUIStore } from '@/stores/uiStore';

// Global states
const { 
  globalLoading,
  globalError,
  networkStatus,
  offlineQueue 
} = useUIStore();
```

### Component Hierarchy

```
AppStateProvider
├── App Content
├── GlobalLoadingOverlay
├── GlobalErrorHandler
└── NetworkStatusIndicator
```

## Usage Examples

### 1. Feature-Level Loading States

Use `useLoadingState` hook for feature-specific loading:

```typescript
import { useLoadingState } from '@/hooks/useLoadingState';

function BudgetScreen() {
  const { isLoading, error, execute, clearError } = useLoadingState('budget');

  const loadBudgetData = async () => {
    await execute(async () => {
      const data = await budgetService.fetchBudget();
      // Process data
    });
  };

  if (error) {
    return (
      <EmpathyErrorState
        title="Budget data is taking a break"
        message={error}
        recoveryAction={loadBudgetData}
      />
    );
  }

  if (isLoading) {
    return <CalmingLoadingIndicator message="Getting your budget ready..." />;
  }

  // Render content
}
```

### 2. Global Loading States

Use `useGlobalLoading` for app-wide operations:

```typescript
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

function OnboardingScreen() {
  const { executeWithGlobalLoading } = useGlobalLoading();

  const completeOnboarding = async () => {
    await executeWithGlobalLoading(
      async () => {
        await onboardingService.complete(userData);
        navigation.navigate('Home');
      },
      'Setting up your personalized experience...',
      'We hit a snag setting things up. Let\'s try again.'
    );
  };
}
```

### 3. Error Boundaries

Wrap screens with `EnhancedErrorBoundary`:

```typescript
<EnhancedErrorBoundary feature="budget">
  <BudgetScreen />
</EnhancedErrorBoundary>
```

### 4. Network Status Handling

The `NetworkStatusIndicator` automatically shows when offline:

```typescript
// Check network status in components
const { isOffline, networkStatus } = useUIStore();

if (isOffline()) {
  // Show offline-friendly UI
}
```

## Component Reference

### CalmingLoadingIndicator

A stress-friendly loading indicator with breathing animation:

```typescript
<CalmingLoadingIndicator
  message="Saving your progress..."
  messages={['Step 1...', 'Step 2...', 'Almost done...']} // Multi-step
  size="large"
  showTip={true} // Shows encouraging tips after delay
  tipDelay={3000}
  fullScreen={false}
/>
```

### EmpathyErrorState

Non-threatening error display with recovery options:

```typescript
<EmpathyErrorState
  title="We hit a small bump"
  message="Your data is safe. Let's try refreshing."
  type="error" // 'error' | 'warning' | 'info'
  details={errorDetails} // Hidden by default
  recoveryAction={handleRetry}
  recoveryLabel="Try Again"
  showSupportLink={true}
  onContactSupport={handleSupport}
  showProgressiveDisclosure={true}
/>
```

### GlobalLoadingOverlay

Full-screen loading overlay for critical operations:
- Automatically shown when `globalLoading` is true
- Includes calming animations and encouraging tips
- Prevents user interaction during loading

### GlobalErrorHandler

App-wide error display modal:
- Automatically shown for unhandled errors
- Provides recovery options
- Logs errors for debugging (dev mode)

### NetworkStatusIndicator

Unobtrusive network status banner:
- Shows when offline or slow connection detected
- Displays offline queue count
- Auto-hides after timeout (configurable)

## Best Practices

### 1. Loading Messages

```typescript
// ✅ Good: Supportive and clear
"Getting your tasks ready..."
"Saving your progress..."
"Almost there..."

// ❌ Bad: Technical or cold
"Loading data..."
"Processing request..."
"Please wait..."
```

### 2. Error Messages

```typescript
// ✅ Good: Empathetic and actionable
"We couldn't connect right now. Your data is safe, and we'll sync when you're back online."
"This is taking longer than expected. Let's give it another try."

// ❌ Bad: Technical or alarming
"Network error: ERR_CONNECTION_REFUSED"
"Fatal error occurred"
```

### 3. Progressive Enhancement

Always provide offline fallbacks:

```typescript
const { isOffline } = useUIStore();

if (isOffline()) {
  // Show cached data with sync indicator
  return <OfflineContent data={cachedData} />;
}

// Normal online flow
```

### 4. Touch Targets

Ensure all interactive elements meet minimum size:

```typescript
<TouchableOpacity
  style={{
    minHeight: 48,
    minWidth: 48,
    padding: 12,
  }}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
  <Text>Retry</Text>
</TouchableOpacity>
```

## Testing

### Unit Tests

Test loading and error states:

```typescript
it('should show empathetic error message', async () => {
  const { getByText } = render(<BudgetScreen />);
  
  // Simulate error
  mockBudgetService.fetchBudget.mockRejectedValue(new Error('Network error'));
  
  await waitFor(() => {
    expect(getByText(/couldn't connect right now/i)).toBeTruthy();
  });
});
```

### Accessibility Tests

Verify screen reader support:

```typescript
it('should announce loading state', () => {
  const { getByRole } = render(
    <CalmingLoadingIndicator message="Loading tasks..." />
  );
  
  const progressbar = getByRole('progressbar');
  expect(progressbar.props.accessibilityLabel).toBe('Loading tasks...');
  expect(progressbar.props.accessibilityState.busy).toBe(true);
});
```

## Migration Guide

To integrate these components into existing screens:

1. Wrap your app with `AppStateProvider`:
```typescript
<AppStateProvider>
  <NavigationContainer>
    <AppNavigator />
  </NavigationContainer>
</AppStateProvider>
```

2. Replace existing loading states:
```typescript
// Before
{isLoading && <ActivityIndicator />}

// After
{isLoading && <CalmingLoadingIndicator message="Loading your data..." />}
```

3. Replace error states:
```typescript
// Before
{error && <Text style={{ color: 'red' }}>{error}</Text>}

// After
{error && (
  <EmpathyErrorState
    title="Let's try that again"
    message={error}
    recoveryAction={retry}
  />
)}
```

4. Add error boundaries to screens:
```typescript
// Before
export default MyScreen;

// After
export default function MyScreenWithBoundary(props) {
  return (
    <EnhancedErrorBoundary feature="myFeature">
      <MyScreen {...props} />
    </EnhancedErrorBoundary>
  );
}
```

## Performance Considerations

1. **Animations**: All animations use `useNativeDriver` for 60fps performance
2. **Lazy Loading**: Heavy components loaded on-demand
3. **Memoization**: Error messages and loading states memoized to prevent re-renders
4. **Debouncing**: Network status updates debounced to prevent flashing

## Accessibility Features

- All components support VoiceOver/TalkBack
- Dynamic font scaling
- High contrast mode support
- Keyboard navigation
- Screen reader announcements for state changes
- WCAG 2.1 AA compliant color contrasts

## Future Enhancements

1. **Haptic Feedback**: Gentle vibrations for state changes
2. **Sound Effects**: Optional calming sounds for completions
3. **Animations**: More sophisticated breathing/pulsing effects
4. **Personalization**: User-preferred loading messages
5. **Analytics**: Track error recovery success rates
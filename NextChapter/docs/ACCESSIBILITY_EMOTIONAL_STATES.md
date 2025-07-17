# Next Chapter - Accessibility & Emotional States Documentation

## Phase 5 Implementation Guide

This document details the accessibility features and emotional state adaptations implemented in the Next Chapter app, completed on January 14, 2025.

## Overview

The Next Chapter app now includes comprehensive accessibility features and an intelligent emotional state system that adapts the UI based on user behavior and needs. This ensures the app remains supportive and accessible during the stressful job search process.

## Emotional State System

### Core States

1. **Normal Mode** - Default "Grounded Optimism" design
2. **Crisis Mode** - Simplified UI for overwhelmed users
3. **Success Mode** - Celebratory UI for achievements
4. **Struggling Mode** - Extra gentle support

### Implementation

#### EmotionalStateContext (`/src/context/EmotionalStateContext.tsx`)

```typescript
import { useEmotionalState } from '@/context/EmotionalStateContext';

function MyComponent() {
  const { 
    emotionalState,           // Current state
    setEmotionalState,        // Manual override
    autoDetectedState,        // AI-detected state
    isAutoDetectionEnabled,   // Auto-detection toggle
    stressLevel,             // 0-10 scale
    recentAchievements       // Success mode triggers
  } = useEmotionalState();
}
```

### Auto-Detection Logic

The system automatically detects emotional states based on:

- **Task Completion Rate**: < 20% triggers crisis mode
- **Job Applications**: No applications in 7 days suggests struggling
- **Interview Count**: 3+ interviews triggers success mode
- **Job Offers**: Any offer triggers success mode
- **Mood Tracking**: Average mood < 3 suggests crisis mode

## Crisis Mode Adaptations

### UI Changes

1. **Increased Spacing**
   - Screen padding: 32px (2x normal)
   - Component gaps: 32px
   - Touch targets: 64px minimum

2. **Simplified Interface**
   - Non-essential features hidden
   - Reduced cognitive load
   - Focus on primary actions only

3. **Enhanced Visibility**
   - Thicker borders (3px)
   - Higher contrast
   - Larger fonts (+2px)

### Usage

```typescript
import { CrisisModeWrapper, CrisisModeHidden } from '@/components/emotional/CrisisModeWrapper';

// Wrap content that needs crisis adaptations
<CrisisModeWrapper enableLargerSpacing enableSimplification>
  <YourContent />
</CrisisModeWrapper>

// Hide non-essential content in crisis mode
<CrisisModeHidden>
  <OptionalFeature />
</CrisisModeHidden>
```

### Style Adaptations

```typescript
import { getEmotionalAdaptations } from '@/theme/emotionalAdaptations';

const adaptations = getEmotionalAdaptations(emotionalState);
const buttonStyle = applyEmotionalAdaptations(baseStyle, adaptations?.button);
```

## Success Mode Celebrations

### Components

#### SuccessCelebration (`/src/components/emotional/SuccessCelebration.tsx`)

```typescript
<SuccessCelebration
  achievement="3 interviews scheduled!"
  onDismiss={() => {}}
  showConfetti={true}
/>

// Pre-built milestone celebrations
<MilestoneAchievement
  type="interviews" // or 'applications', 'offers', 'tasks'
  count={3}
  onDismiss={() => {}}
/>
```

#### Success Mode Badge

```typescript
// Automatically shows when in success mode
<SuccessModeBadge style={customStyle} />
```

### Visual Changes

- Accent color becomes primary (Soft Amber)
- Bouncier animations
- Celebratory confetti for major achievements
- Pulsing "On Fire!" badge

## Accessibility Features

### 1. Focus Management (`/src/utils/focusManager.ts`)

#### Auto-focus on Mount
```typescript
const ref = useFocusOnMount(shouldFocus, delay);
<View ref={ref}>Content</View>
```

#### Focus Manager
```typescript
const { registerFocusTarget, focusOn, focusNext, focusPrevious } = useFocusManager();

// Register elements
<TextInput ref={(el) => registerFocusTarget('email', el)} />

// Programmatic focus
focusOn('email');
focusNext('email');
```

#### Form Focus Management
```typescript
const focusManager = new FormFocusManager();

// Register fields
focusManager.register('email', emailRef.current);
focusManager.register('password', passwordRef.current);

// Focus first error
focusManager.focusFirstError(validationErrors);
```

### 2. Skip Links (`/src/components/accessibility/SkipLinks.tsx`)

```typescript
<MainContentWrapper
  skipLinks={[
    { id: 'main', label: 'Skip to main content' },
    { id: 'navigation', label: 'Skip to navigation' },
  ]}
>
  <Landmark type="main" label="Main content" skipLinkId="main">
    <YourMainContent />
  </Landmark>
</MainContentWrapper>
```

### 3. Screen Reader Announcements (`/src/components/accessibility/ScreenReaderAnnouncer.tsx`)

#### Provider Setup
```typescript
// In App.tsx
<ScreenReaderProvider>
  <YourApp />
</ScreenReaderProvider>
```

#### Usage
```typescript
const { 
  announce, 
  announceStateChange, 
  announceProgress,
  announceError,
  announceSuccess 
} = useScreenReader();

// Examples
announceStateChange('Task list', 'loading');
announceProgress(3, 10, 'Tasks completed');
announceError('Invalid email address');
announceSuccess('Application submitted');
```

#### Automatic Announcements
```typescript
// Loading states
useLoadingAnnouncement(isLoading, 'Job applications');

// Value changes
useValueChangeAnnouncement(
  taskCount,
  (count) => `${count} tasks`,
  'Daily tasks'
);

// Task completion
<TaskCompletionAnnouncer 
  taskName="Update resume" 
  isCompleted={task.completed} 
/>

// Navigation
<NavigationAnnouncer 
  screenName="Coach Chat" 
  screenType="screen" 
/>
```

## Implementation Checklist

### For New Screens

- [ ] Wrap in `CrisisModeWrapper` if simplification needed
- [ ] Add skip links for major sections
- [ ] Use semantic landmarks
- [ ] Implement focus management
- [ ] Add screen reader announcements
- [ ] Test with VoiceOver/TalkBack
- [ ] Verify keyboard navigation
- [ ] Check touch target sizes (56px normal, 64px crisis)

### For Existing Components

- [ ] Add `accessibilityLabel` and `accessibilityHint`
- [ ] Implement `accessibilityRole`
- [ ] Add focus indicators
- [ ] Ensure color contrast (4.5:1 minimum)
- [ ] Test with reduced motion enabled
- [ ] Verify crisis mode adaptations

## Testing

### Manual Testing

1. **Screen Reader Testing**
   - iOS: Settings → Accessibility → VoiceOver
   - Android: Settings → Accessibility → TalkBack
   - Navigate entire app with gestures only

2. **Keyboard Testing** (iPad/Android tablets)
   - Tab through all interactive elements
   - Verify focus indicators visible
   - Test skip links functionality

3. **Crisis Mode Testing**
   - Manually set to crisis mode in settings
   - Verify UI simplification
   - Check increased touch targets
   - Ensure only essential features visible

4. **Success Mode Testing**
   - Complete multiple tasks
   - Add job interviews
   - Verify celebrations trigger appropriately

### Automated Testing

```typescript
// Example test for crisis mode
describe('Crisis Mode', () => {
  it('should increase touch targets in crisis mode', () => {
    const { getByRole } = render(
      <EmotionalStateProvider>
        <Button title="Test" onPress={() => {}} />
      </EmotionalStateProvider>
    );
    
    // Set crisis mode
    act(() => {
      useEmotionalState.setState({ emotionalState: 'crisis' });
    });
    
    const button = getByRole('button');
    expect(button.props.style.minHeight).toBe(64);
  });
});
```

## Best Practices

1. **Always Test with Assistive Technology**
   - Don't assume - actually use VoiceOver/TalkBack
   - Test with keyboard navigation
   - Verify with high contrast mode

2. **Announce Important State Changes**
   - Loading/loaded states
   - Success/error messages
   - Navigation changes
   - Progress updates

3. **Respect User Preferences**
   - Check `isAutoDetectionEnabled` before auto-switching modes
   - Honor reduced motion settings
   - Allow manual override of detected states

4. **Design for Crisis First**
   - If it works in crisis mode, it works everywhere
   - Prioritize essential actions
   - Reduce cognitive load

## Performance Considerations

- Emotional state detection runs every 60 seconds
- Announcements are queued to prevent overwhelming users
- Animations use native driver where possible
- Crisis mode reduces animations for better performance

## Future Enhancements

1. **Haptic Feedback** (Phase 6)
   - Success celebrations
   - Error notifications
   - Task completions

2. **Voice Control**
   - Voice commands for navigation
   - Dictation for text input

3. **Enhanced Personalization**
   - Learn user patterns
   - Predictive state switching
   - Customizable triggers

## Resources

- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
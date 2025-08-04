# Safety Components

Emotional safety and trauma-informed UI components for the Storyline mobile app.

## Overview

The Safety components provide a comprehensive emotional safety system designed with trauma-informed principles. These components create safe spaces for users, detect crisis situations, and provide appropriate intervention and support options.

## Components

### SafeSpaceIndicator

The primary component for emotional safety UI patterns. It provides:

- **Safe space status indication** with gentle, trauma-informed design
- **Break/pause functionality** for emotional self-care
- **Crisis detection and intervention flows**
- **Encouraging messages and emotional support options**
- **Full accessibility support** with screen reader compatibility
- **Haptic feedback** for appropriate user interactions

## Usage

### Basic Implementation

```typescript
import React from 'react';
import { SafeSpaceIndicator } from '../components/Safety';

function MyScreen() {
  return (
    <SafeSpaceIndicator
      safetyState="safe"
      isActive={true}
      showControls={true}
      onBreakRequested={() => {
        // Handle break request
        console.log('User requested a break');
      }}
      onSupportRequested={(action) => {
        // Handle support request
        console.log('Support requested:', action);
      }}
    />
  );
}
```

### Advanced Implementation with Crisis Detection

```typescript
import React from 'react';
import { SafeSpaceIndicator } from '../components/Safety';
import { useSafetyState } from '../hooks/safety';

function ConversationScreen() {
  const {
    safetyState,
    crisisLevel,
    isSafeSpaceActive,
    requestSupport,
    analyzeContent,
  } = useSafetyState({
    enableCrisisDetection: true,
    sensitivityLevel: 'medium',
    onCrisisDetected: (level, context) => {
      console.log(`Crisis detected: ${level}`, context);
    },
  });

  const handleUserMessage = (message: string) => {
    // Analyze user input for crisis keywords
    analyzeContent(message);
  };

  return (
    <SafeSpaceIndicator
      safetyState={safetyState}
      crisisLevel={crisisLevel}
      isActive={isSafeSpaceActive}
      showControls={true}
      showDetailedSupport={crisisLevel !== 'none'}
      onBreakRequested={() => {
        requestSupport('break');
      }}
      onSupportRequested={(action) => {
        requestSupport(action);
      }}
      onCrisisDetected={(level) => {
        // Additional crisis handling
        console.log('Crisis intervention needed:', level);
      }}
    />
  );
}
```

### Custom Styling with Theme Integration

```typescript
import React from 'react';
import { SafeSpaceIndicator } from '../components/Safety';
import { useTheme } from '../design-system';

function CustomSafetyIndicator() {
  const { theme } = useTheme();
  
  return (
    <SafeSpaceIndicator
      safetyState="caution"
      message="Take your time. You're in control of this conversation."
      showControls={true}
      accessibilityLabel="Custom safe space with caution level"
      onSupportRequested={(action) => {
        if (action === 'breathing') {
          // Launch breathing exercise
          startBreathingExercise();
        } else if (action === 'resources') {
          // Show emotional resources
          showEmotionalResources();
        }
      }}
    />
  );
}
```

## Props Reference

### SafeSpaceIndicator Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `safetyState` | `'safe' \| 'caution' \| 'concern'` | `'safe'` | Current emotional safety state |
| `crisisLevel` | `'none' \| 'low' \| 'medium' \| 'high'` | `'none'` | Crisis detection level |
| `isActive` | `boolean` | `true` | Whether the indicator is visible |
| `showControls` | `boolean` | `true` | Show break/pause controls |
| `message` | `string` | Auto-generated | Custom encouraging message |
| `onBreakRequested` | `() => void` | - | Callback when user needs a break |
| `onSupportRequested` | `(action: EmotionalSupportAction) => void` | - | Callback for support requests |
| `onCrisisDetected` | `(level: CrisisLevel) => void` | - | Callback for crisis detection |
| `showDetailedSupport` | `boolean` | `false` | Show detailed support options |
| `accessibilityLabel` | `string` | Auto-generated | Custom accessibility label |

## Safety States

### Safe State
- **Color**: Gentle Sage (`#A8C090`)
- **Message**: "You're in a safe space. Take your time."
- **Icon**: 🛡️
- **Behavior**: Normal operation with standard controls

### Caution State
- **Color**: Warning Amber (`#F4A261`)
- **Message**: "Remember, you're in control. Take a breath if needed."
- **Icon**: ⚡
- **Behavior**: Enhanced support options, gentle reminders

### Concern State
- **Color**: Error Red (`#E94B3C`)
- **Message**: "It's okay to pause. Your wellbeing comes first."
- **Icon**: ❤️
- **Behavior**: Priority support access, crisis resources

## Crisis Levels

### Low Crisis
- **Trigger**: Words like "overwhelmed", "stressed", "anxious"
- **Response**: Gentle support options
- **Icon**: ⚠️

### Medium Crisis
- **Trigger**: Words like "hopeless", "worthless", "giving up"
- **Response**: Enhanced support with resources
- **Icon**: 🚨
- **Behavior**: Automatic safety state elevation

### High Crisis
- **Trigger**: Words like "suicide", "kill myself", "want to die"
- **Response**: Immediate intervention with emergency resources
- **Icon**: 🆘
- **Behavior**: Pulse animation, haptic feedback, emergency protocols

## Emotional Support Actions

- **`pause`**: Temporarily pause conversation
- **`break`**: Take a longer break from conversation
- **`breathing`**: Access breathing exercises
- **`resources`**: View emotional support resources
- **`emergency`**: Access crisis intervention resources

## Accessibility Features

- **Screen Reader Support**: Full ARIA compliance with descriptive labels
- **High Contrast**: Automatic adaptation to system accessibility settings
- **Touch Targets**: Minimum 44pt touch targets for all interactive elements
- **Haptic Feedback**: Appropriate tactile feedback for safety actions
- **Voice Announcements**: Safety state changes announced to screen readers

## Integration with Design System

The SafeSpaceIndicator integrates seamlessly with the Storyline design system:

- **Theme Support**: Automatic light/dark mode adaptation
- **Color Tokens**: Uses semantic safety colors from design tokens
- **Typography**: Consistent with app typography scale
- **Spacing**: Follows design system spacing guidelines
- **Animations**: Trauma-informed, gentle animations

## Best Practices

### Implementation
1. **Always provide callbacks** for support requests and crisis detection
2. **Test with screen readers** to ensure accessibility
3. **Consider context** when setting safety states
4. **Respect user autonomy** in all interactions

### Content Analysis
1. **Use crisis detection responsibly** with appropriate sensitivity levels
2. **Provide immediate support** for high crisis situations
3. **Don't over-trigger** crisis detection to avoid alarm fatigue
4. **Offer gradual support escalation** based on severity

### User Experience
1. **Make safe spaces obvious** and easily accessible
2. **Provide clear exit strategies** from difficult conversations
3. **Offer multiple support options** to meet diverse needs
4. **Maintain consistent safety messaging** throughout the app

## Crisis Intervention Protocol

When high crisis levels are detected:

1. **Immediate Response**: Show emergency support options
2. **Professional Resources**: Provide access to crisis hotlines
3. **User Choice**: Always respect user autonomy
4. **Follow-up**: Offer continued support and check-ins
5. **Documentation**: Log incidents for safety improvement (anonymized)

## Testing

The Safety components include comprehensive testing for:

- **Accessibility compliance** (WCAG 2.1 AA)
- **Crisis detection accuracy** with keyword analysis
- **Animation performance** across devices
- **Theme adaptation** in light/dark modes
- **Touch target sizing** for usability

## Integration Examples

### With Voice Components
```typescript
// Monitor voice conversation for crisis keywords
const handleVoiceTranscript = (transcript: string) => {
  analyzeContent(transcript);
};
```

### With Memory System
```typescript
// Store safety preferences in user memory
const saveSafetyPreferences = (preferences: SafetyPreferences) => {
  // Save to memory system
};
```

### With Navigation
```typescript
// Navigate to safe space when break requested
const handleBreakRequest = () => {
  navigation.navigate('SafeSpace');
};
```

The Safety components are designed to be a foundational part of Storyline's trauma-informed approach to AI-assisted writing, ensuring user wellbeing is always the top priority.
# Storyline Design System

Voice-first, emotionally safe design system for the Storyline mobile app.

## Overview

The Storyline design system embodies the principle of **"Voice-First, Safety-Always"** - prioritizing voice interactions while maintaining emotional safety throughout the user experience.

## Core Philosophy

- **Voice-First Interface**: Every component is designed with voice interaction as the primary interface
- **Emotional Safety**: Trauma-informed design with built-in crisis detection and safe space indicators  
- **Accessibility**: WCAG-compliant with enhanced touch targets and high contrast options
- **Brand Consistency**: Warm, literary-inspired color palette that feels safe and inviting

## Getting Started

```typescript
import { ThemeProvider, useTheme } from '../design-system';

// Wrap your app with the ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}

// Use theme in components
function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={theme.typography.sizes.body}>Hello World</Text>
    </View>
  );
}
```

## Design Tokens

### Colors

The color system uses a warm, literary-inspired palette:

- **Ink Black** (`#1B1C1E`): Primary text and UI elements
- **Parchment White** (`#FDFBF7`): Background and surface colors
- **Soft Plum** (`#8854D0`): Primary brand color for interactive elements
- **Warm Ochre** (`#E4B363`): Secondary accent for highlights
- **Gentle Sage** (`#A8C090`): Success states and safe indicators
- **Soft Blush** (`#F2E8E5`): Safe space backgrounds

### Typography

Based on Inter for UI and Playfair Display for literary elements:

```typescript
import { typography } from '../design-system';

// Usage
<Text style={typography.sizes.headline}>Chapter Title</Text>
<Text style={typography.sizes.body}>Body text</Text>
```

### Spacing

Consistent spacing scale optimized for voice UI:

```typescript
import { spacing } from '../design-system';

// Usage
<View style={{ padding: spacing.md, margin: spacing.lg }}>
```

## Voice Interface Components

### Voice State Management

```typescript
import { voiceTokens } from '../design-system';

const voiceState = voiceTokens.states.recording; // 'recording'
const recordingColor = voiceTokens.feedback.error; // Error state color
```

### Recording Button Styles

```typescript
import { commonStyles } from '../design-system';

<Pressable style={commonStyles.voice.recordingButton}>
  <MicrophoneIcon />
</Pressable>
```

## Safety Features

### Safe Space Indicators

```typescript
import { safetyTokens } from '../design-system';

<View style={{
  backgroundColor: safetyTokens.safeSpace.backgroundColor,
  borderColor: safetyTokens.safeSpace.borderColor,
}}>
  <Text style={{ color: safetyTokens.safeSpace.textColor }}>
    Safe space active
  </Text>
</View>
```

### Emotional State Theming

```typescript
import { safetyStateThemes } from '../design-system';

const safeTheme = safetyStateThemes.safe(theme);
const cautionTheme = safetyStateThemes.caution(theme);
```

## Dark Mode Support

The design system automatically adapts to system appearance:

```typescript
import { useTheme } from '../design-system';

function MyComponent() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <View style={{ 
      backgroundColor: theme.colors.background,
      color: theme.colors.text 
    }}>
      <Button onPress={toggleTheme} title="Toggle Theme" />
    </View>
  );
}
```

## Accessibility

### Touch Targets

All interactive elements use minimum touch target sizes:

```typescript
import { a11yHelpers } from '../design-system';

<Pressable style={{
  minHeight: a11yHelpers.minTouchTarget, // 44px minimum
  minWidth: a11yHelpers.minTouchTarget,
}}>
```

### High Contrast

```typescript
import { a11yHelpers } from '../design-system';

const highContrastStyle = {
  color: a11yHelpers.highContrast.text,
  backgroundColor: a11yHelpers.highContrast.background,
};
```

## Animation System

Thoughtful animations that respect emotional safety:

```typescript
import { animations } from '../design-system';

// Usage with React Native Animated
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: animations.duration.emotional, // 800ms for emotional content
  easing: animations.easing.gentle,
}).start();
```

## Crisis Detection Integration

The design system includes built-in crisis detection theming:

```typescript
import { safety } from '../design-system';

const crisisLevel = 'medium'; // low, medium, high
const crisisColor = safety.crisis[crisisLevel];
```

## File Structure

```
src/design-system/
├── tokens.ts          # Core design tokens
├── ThemeProvider.tsx  # Theme context and provider
├── index.ts          # Main exports
└── README.md         # This documentation
```

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Test in both light and dark modes** for all components
3. **Consider voice interaction** when designing touch interfaces
4. **Respect emotional safety** by using appropriate theming for sensitive content
5. **Test accessibility** with screen readers and high contrast modes
6. **Use semantic colors** (success, warning, error) for appropriate contexts

## Contributing

When extending the design system:

1. Add new tokens to `tokens.ts`
2. Update TypeScript interfaces for type safety
3. Test across light/dark modes
4. Validate accessibility compliance
5. Update this documentation

## Voice-First Principles

- **Primary actions** should be voice-activated with visual fallbacks
- **Visual feedback** should confirm voice commands
- **Error states** should provide both visual and haptic feedback
- **Processing states** should show clear visual indicators
- **Safe spaces** should be clearly marked and easily accessible

This design system enables Storyline to deliver on its mission of empowering users to write books through voice while maintaining the highest standards of emotional safety and accessibility.
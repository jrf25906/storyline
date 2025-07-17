# Typography Component

The Typography component is a comprehensive text system for the Next Chapter app, implementing the "Grounded Optimism" design language. It provides consistent text styling while prioritizing readability and accessibility for users in stressful situations.

## Design Principles

- **Stress-Friendly**: Minimum 16px body text, comfortable line heights
- **Clear Hierarchy**: Distinct visual differences between text levels
- **Accessibility First**: Full screen reader support, WCAG 2.1 AA compliant
- **No Light Weights**: Light (300) font weights are disabled for better readability

## Basic Usage

```tsx
import { Typography } from '@/components/common';

// Default body text
<Typography>Your journey starts here</Typography>

// Page title
<Typography variant="h1">Daily Tasks</Typography>

// Success message
<Typography color="success" weight="semiBold">
  Great job completing your task!
</Typography>
```

## Variants

### Display (28px)
For major celebrations and welcome screens:
```tsx
<Typography variant="display">
  Welcome to Your Next Chapter!
</Typography>
```

### H1 (24px)
For page titles and day headers:
```tsx
<Typography variant="h1">Day 5 - Building Momentum</Typography>
```

### H2 (20px)
For section headers and task titles:
```tsx
<Typography variant="h2">Morning Routine</Typography>
```

### H3 (18px)
For subsection headers:
```tsx
<Typography variant="h3">Task Details</Typography>
```

### Body (16px) - Default
Standard body text with minimum 16px for accessibility:
```tsx
<Typography>
  Take 10 minutes to review your accomplishments from yesterday.
</Typography>
```

### BodyLarge (18px)
For important body text that needs emphasis:
```tsx
<Typography variant="bodyLarge">
  You've completed 5 tasks this week. Keep up the great work!
</Typography>
```

### Caption (14px)
For metadata and supporting information:
```tsx
<Typography variant="caption">
  Last updated 2 hours ago
</Typography>
```

### Button (16px)
For CTAs and interactive elements:
```tsx
<Typography variant="button">Continue</Typography>
```

## Colors

The component supports theme colors and custom color strings:

```tsx
// Theme colors
<Typography color="primary">Primary text</Typography>
<Typography color="secondary">Secondary text</Typography>
<Typography color="tertiary">Tertiary text</Typography>
<Typography color="error">Error message</Typography>
<Typography color="success">Success message</Typography>
<Typography color="warning">Warning text</Typography>
<Typography color="info">Information</Typography>
<Typography color="muted">Muted text</Typography>

// Custom colors
<Typography color="#007AFF">Custom blue text</Typography>
```

## Font Weights

Never use light (300) weight - it's too thin for stressed users:

```tsx
<Typography weight="regular">Regular text (400)</Typography>
<Typography weight="medium">Medium emphasis (500)</Typography>
<Typography weight="semiBold">Strong emphasis (600)</Typography>
<Typography weight="bold">Critical alerts only (700)</Typography>

// Light weight automatically converts to regular
<Typography weight="light">This will render as regular weight</Typography>
```

## Text Alignment

```tsx
<Typography align="left">Left aligned (default)</Typography>
<Typography align="center">Center aligned</Typography>
<Typography align="right">Right aligned</Typography>
<Typography align="justify">Justified text</Typography>
```

## Advanced Examples

### Error Message
```tsx
<Typography 
  variant="body" 
  color="error" 
  weight="medium"
  testID="error-message"
>
  Please check your internet connection
</Typography>
```

### Success Celebration
```tsx
<Typography 
  variant="display" 
  color="success" 
  align="center"
  accessibilityRole="header"
>
  First Week Complete! 🎉
</Typography>
```

### Truncated Text
```tsx
<Typography 
  variant="body" 
  numberOfLines={2}
  style={typographyStyles.truncate}
>
  Long description that will be truncated after two lines...
</Typography>
```

### Task Status
```tsx
<Typography 
  variant="caption" 
  color="muted"
  style={typographyStyles.strikethrough}
>
  Completed: Update resume
</Typography>
```

## Accessibility

All Typography components include proper accessibility support:

```tsx
// Headings automatically get proper roles and levels
<Typography variant="h1">Main Title</Typography>
// Renders with: accessibilityRole="header" accessibilityLevel={1}

// Custom accessibility props
<Typography
  variant="body"
  accessibilityHint="Tap to learn more"
  accessibilityLabel="Task description"
>
  Review job listings
</Typography>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'display' \| 'h1' \| 'h2' \| 'h3' \| 'body' \| 'bodyLarge' \| 'caption' \| 'button'` | `'body'` | Typography variant |
| color | `'primary' \| 'secondary' \| 'tertiary' \| 'error' \| 'success' \| 'warning' \| 'info' \| 'muted' \| string` | `'primary'` | Text color |
| weight | `'regular' \| 'medium' \| 'semiBold' \| 'bold' \| 'light'` | Variant default | Font weight (light converts to regular) |
| align | `'left' \| 'center' \| 'right' \| 'justify'` | `'left'` | Text alignment |
| children | `React.ReactNode` | - | Content to display |
| style | `StyleProp<TextStyle>` | - | Custom styles |
| numberOfLines | `number` | - | Limit text to n lines |
| testID | `string` | - | Test identifier |
| ...TextProps | - | - | All React Native Text props |

## Utility Styles

Import additional styles for common patterns:

```tsx
import { typographyStyles } from '@/components/common/Typography.styles';

// Truncate with ellipsis
<Typography style={typographyStyles.truncate} numberOfLines={1}>
  Very long text...
</Typography>

// Link appearance
<Typography style={typographyStyles.link}>
  Terms of Service
</Typography>

// Strikethrough for completed items
<Typography style={typographyStyles.strikethrough}>
  Completed task
</Typography>

// Uppercase for buttons
<Typography variant="button" style={typographyStyles.uppercase}>
  Get Started
</Typography>

// High contrast mode support
<Typography style={typographyStyles.highContrast}>
  Important information
</Typography>
```

## Best Practices

1. **One H1 per screen** - Maintain clear page hierarchy
2. **Minimum 16px body text** - Never go smaller for accessibility
3. **Avoid light weights** - They're too thin for stressed users
4. **Use semantic variants** - Don't override sizes with custom styles
5. **Provide proper contrast** - Use theme colors for consistency
6. **Test with screen readers** - Ensure all text is accessible

## Migration Guide

If migrating from plain Text components:

```tsx
// Before
<Text style={{ fontSize: 24, fontWeight: 'bold' }}>
  Page Title
</Text>

// After
<Typography variant="h1">Page Title</Typography>

// Before
<Text style={{ fontSize: 14, color: '#666' }}>
  Last updated
</Text>

// After
<Typography variant="caption" color="secondary">
  Last updated
</Typography>
```
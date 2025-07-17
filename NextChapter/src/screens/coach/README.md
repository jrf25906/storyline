# Coach Interface - Grounded Optimism Design

## Overview
The Coach interface has been updated to match the "Grounded Optimism" design system, providing a calm and supportive chat experience for users navigating career transitions.

## Design Updates

### Visual Design
- **Color Scheme**: Uses calm blue (#4A6FA5) for coach messages and light gray for user messages
- **Typography**: Utilizes the new Typography component with proper hierarchy
- **Shadows**: Gentle shadows on message bubbles for depth without harshness
- **Animations**: Smooth message entry animations and typing indicator

### Components

#### CoachHeader
- Displays "Coach" title with tone selector dropdown
- Shows daily message limit indicator (e.g., "7/10 today")
- Tone selector allows switching between Hype, Pragmatist, and Tough-Love modes

#### MessageBubble
- Coach messages: Calm blue background with white text
- User messages: Light gray background with dark text
- Subtle tone indicator below coach messages in italic
- Rounded corners with slight tail for speech bubble effect
- Timestamps in smaller, muted text

#### MessageInput
- Rounded input field with send button
- Shows warning when approaching daily limit (≤3 messages)
- Disabled state when daily limit reached
- Smooth keyboard avoidance on iOS

#### ToneSelector
- Dropdown with three tone options:
  - **Hype** (Soft Purple): Energetic encouragement
  - **Pragmatist** (Calm Blue): Practical guidance
  - **Tough Love** (Gentle Coral): Direct feedback
- Visual indicators with colored dots
- Modal presentation with smooth animations

#### TypingIndicator
- Three animated dots indicating coach is "typing"
- Matches coach message bubble styling
- Smooth wave animation

### Accessibility
- All interactive elements have proper labels
- Screen reader announcements for new messages
- Keyboard navigation support for tone selector
- High contrast maintained on all text

### Edge Cases
- **Daily Limit Reached**: Input disabled with clear message
- **Network Errors**: Graceful error handling with retry options
- **Long Messages**: Proper text wrapping and scrolling
- **Empty State**: Helpful prompt to start conversation

## Usage

```tsx
import { CoachChatScreen } from './screens/coach/CoachChatScreen';

// In your navigation
<Stack.Screen 
  name="CoachChat" 
  component={CoachChatScreen}
  options={{ title: 'Coach' }}
/>
```

## Testing
All components include comprehensive test coverage:
- `ToneSelector.test.tsx`: Tests tone switching and modal behavior
- `MessageBubble.test.tsx`: Tests message rendering and accessibility
- `TypingIndicator.test.tsx`: Tests animation rendering
- `CoachHeader.test.tsx`: Tests header functionality

## Future Enhancements
- Voice message support
- Quick reply suggestions
- Message reactions
- Session summaries
- Export conversation feature
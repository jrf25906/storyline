# Figma Voice Interface Design Guide
*Complete tutorial for designing Storyline's voice-first UI/UX*

## Overview

This guide walks you through designing voice interface components in Figma, specifically for Storyline's trauma-informed, voice-first book writing application. The focus is on creating ambient, supportive visual elements that enhance conversation rather than competing with it.

---

## Figma Setup & Workspace Structure

### Essential Figma Plugins

Install these plugins before starting:

1. **Auto-Animate** - For smooth voice state transitions
2. **LottieFiles** - For advanced voice wave animations  
3. **Protopie Connect** - For complex micro-interactions
4. **Material Design** - Voice state component references
5. **Figmotion** - Breathing animations and organic motion
6. **Stark** - Accessibility and contrast checking
7. **Design Tokens** - For exporting to React Native

### Recommended Figma Workspace Structure

```
Storyline Design System
├── 📱 Foundations
│   ├── 🎨 Colors (Trauma-informed palette)
│   ├── 📝 Typography (Readable, calming fonts)
│   ├── 📏 Spacing (Generous, comfortable)
│   ├── 🎭 Motion Tokens (Gentle, organic timing)
│   └── 🎙️ Voice State Tokens (Colors, animations)
├── 🎙️ Voice Components
│   ├── Voice State Indicators
│   ├── Conversation Bubbles  
│   ├── Transcript Views
│   └── Crisis Support UI
├── 📖 Content Components (Future)
│   ├── Chapter Organizer
│   ├── Memory Visualizer
│   └── Narrative Structure
├── 🔧 Prototypes
│   ├── Voice Flow Testing
│   ├── State Transition Testing
│   └── Crisis Scenario Testing
└── 📋 Documentation
    ├── Design Principles
    ├── Component Guidelines  
    └── Accessibility Notes
```

---

## Trauma-Informed Design Foundations

### Color Psychology & Palette

**Primary Voice State Colors:**
```css
/* Trauma-informed voice state colors */
--listening: #4A90E2;    /* Calm blue - attentive, safe */
--processing: #8B7ED8;   /* Soft purple - thinking, patient */
--speaking: #6CB169;     /* Warm green - active, growth */
--error: #E6A76B;        /* Gentle orange - supportive, not alarming */
--crisis: #7BA7BC;       /* Soft teal - supportive, professional */
--background: #F8F9FA;   /* Soft white - clean, peaceful */
--text-primary: #2C3E50; /* Dark blue-gray - readable, calm */
--text-secondary: #7F8C8D; /* Medium gray - supportive text */
```

**Avoid These Colors:**
- Harsh reds (triggering, alarming)
- Bright oranges (anxiety-inducing)  
- Stark blacks (harsh, intimidating)
- Neon/fluorescent colors (overstimulating)

### Typography Guidelines

**Font Recommendations:**
- **Primary**: SF Pro (iOS) / Roboto (Android) - System fonts for performance
- **Secondary**: Inter or Source Sans Pro - Clean, readable alternatives
- **Avoid**: Serif fonts in small sizes, decorative fonts, condensed fonts

**Size Scale:**
```css
--font-size-xs: 12px;   /* Helper text */
--font-size-sm: 14px;   /* Secondary text */
--font-size-base: 16px; /* Body text */
--font-size-lg: 18px;   /* Emphasis */
--font-size-xl: 24px;   /* Headings */
--font-size-2xl: 32px;  /* Large headings */
```

### Motion & Animation Principles

**Trauma-Informed Motion Guidelines:**
- **Gentle**: No sudden movements or jarring transitions
- **Predictable**: Consistent timing and easing
- **Organic**: Use natural rhythms (breathing, heartbeat)
- **Reversible**: Users can always pause or stop animations
- **Accessible**: Respect prefers-reduced-motion settings

**Standard Timing:**
```css
--duration-fast: 200ms;     /* Micro-interactions */
--duration-normal: 300ms;   /* Standard transitions */
--duration-slow: 500ms;     /* Complex state changes */
--duration-breathing: 3000ms; /* Organic breathing rhythm */

--easing-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Ease-out */
--easing-organic: cubic-bezier(0.4, 0.0, 0.2, 1);      /* Material */
```

---

## Voice State Indicator Design

### Core Voice States

Storyline has 5 primary voice states that need visual representation:

1. **Listening** - User is speaking, AI is listening
2. **Processing** - AI is thinking/processing speech
3. **Speaking** - AI is responding (text-to-speech)
4. **Error** - Something went wrong (gentle, supportive)
5. **Crisis** - Crisis detected, offering support resources

### Step-by-Step: Creating Voice State Components

#### Step 1: Base Component Setup

1. **Create New Figma File**: "Storyline Voice Components"

2. **Set up Grid System:**
   - Base unit: 8px
   - Component sizes: 40px, 60px, 80px (small, medium, large)

3. **Create Base Frame:**
   ```
   Frame: 200x200px (design space)
   Name: "Voice State Indicator"
   ```

#### Step 2: Listening State Design

**Visual Design:**
```
Component: "Voice State / Listening"
├── Background Circle: 60x60px
│   ├── Fill: #4A90E2 (listening blue)
│   ├── Opacity: 100%
│   └── Border Radius: 50% (perfect circle)
├── Pulse Ring 1: 80x80px  
│   ├── Fill: #4A90E2
│   ├── Opacity: 60%
│   └── Border Radius: 50%
└── Pulse Ring 2: 100x100px
    ├── Fill: #4A90E2  
    ├── Opacity: 30%
    └── Border Radius: 50%
```

**Animation Setup:**
1. Select all pulse rings
2. Right-click → "Create Component"
3. Add variant: "State" property with "Listening" value
4. Use Auto-Animate plugin:
   - Scale from 100% to 120% 
   - Duration: 1200ms
   - Easing: Ease-in-out
   - Loop: Infinite

#### Step 3: Processing State Design

**Visual Design:**
```
Component: "Voice State / Processing"  
├── Dot 1: 8x8px circle, #8B7ED8
├── Dot 2: 8x8px circle, #8B7ED8 (16px right of Dot 1)  
├── Dot 3: 8x8px circle, #8B7ED8 (16px right of Dot 2)
└── Container: Auto-layout horizontal, 8px gap
```

**Animation Setup:**
1. Create 3 animation frames showing sequential opacity
2. Frame 1: Dot 1 (100%), Dot 2 (30%), Dot 3 (30%)
3. Frame 2: Dot 1 (30%), Dot 2 (100%), Dot 3 (30%)  
4. Frame 3: Dot 1 (30%), Dot 2 (30%), Dot 3 (100%)
5. Duration: 500ms per frame, continuous loop

#### Step 4: Speaking State Design

**Visual Design:**
```
Component: "Voice State / Speaking"
├── Wave Bar 1: 4x12px rectangle, #6CB169
├── Wave Bar 2: 4x20px rectangle, #6CB169  
├── Wave Bar 3: 4x16px rectangle, #6CB169
├── Wave Bar 4: 4x24px rectangle, #6CB169
├── Wave Bar 5: 4x18px rectangle, #6CB169
└── Container: Auto-layout horizontal, 2px gap
```

**Animation Setup:**
1. Create variant frames with different bar heights
2. Simulate audio waveform with random height changes
3. Duration: 150ms per frame for responsive feel
4. Use organic timing (not perfectly regular)

#### Step 5: Error State Design

**Visual Design:**
```
Component: "Voice State / Error"
├── Background Circle: 60x60px, #E6A76B (gentle orange)
├── Icon: Exclamation mark or refresh symbol
│   ├── Size: 24x24px  
│   ├── Color: White
│   └── Style: Rounded, friendly
└── Gentle shake animation (2px left/right)
```

#### Step 6: Crisis State Design

**Visual Design:**
```
Component: "Voice State / Crisis"
├── Background Circle: 60x60px, #7BA7BC (supportive teal)
├── Heart Icon: 24x24px, White
│   └── Style: Soft, caring heart shape
└── Gentle pulse animation (calming, not urgent)
```

### Creating Component Variants

1. **Select base component**
2. **Right-click → "Add Variant"**
3. **Create property**: "State" with values:
   - Listening
   - Processing  
   - Speaking
   - Error
   - Crisis
4. **Add size variants**: Small (40px), Medium (60px), Large (80px)

---

## Advanced Animation Techniques

### Using LottieFiles for Complex Animations

**When to Use Lottie:**
- Complex voice wave animations
- Organic breathing effects
- Multi-layer compositions
- File size optimization needed

**Lottie Animation Setup:**
1. Install LottieFiles plugin
2. Browse community animations for "voice", "pulse", "speaking"
3. Customize colors to match trauma-informed palette
4. Export as JSON for React Native implementation

**Recommended Lottie Animations:**
```
Voice State Animations:
├── gentle_pulse.json (Listening state)
├── thinking_dots.json (Processing state)  
├── voice_waves.json (Speaking state)
├── gentle_shake.json (Error state)
└── supportive_pulse.json (Crisis state)
```

### Breathing Animation Pattern

**Natural Breathing Rhythm:**
```
Animation Keyframes:
0%:   Scale 100%, Opacity 100%
25%:  Scale 105%, Opacity 90%
50%:  Scale 110%, Opacity 80%  
75%:  Scale 105%, Opacity 90%
100%: Scale 100%, Opacity 100%

Duration: 4000ms (natural breathing)
Easing: ease-in-out
Loop: Infinite
```

### Micro-Interaction Timing

**Interaction Response Times:**
- **Immediate feedback**: <100ms (button press acknowledgment)
- **System response**: 200-500ms (processing indication)
- **State changes**: 300-600ms (listening → processing)
- **Error recovery**: 800-1000ms (gentle, not rushed)

---

## Conversation Interface Components

### Conversation Bubble Design

**User Bubble:**
```
Component: "Conversation / User"
├── Background: #F1F3F4 (Light gray)
├── Text: #2C3E50 (Dark blue-gray)
├── Padding: 12px 16px
├── Border Radius: 18px 18px 4px 18px
├── Max Width: 280px
└── Font: 16px, line-height 1.4
```

**AI Bubble:**
```
Component: "Conversation / AI"  
├── Background: #4A90E2 (Primary blue)
├── Text: White
├── Padding: 12px 16px
├── Border Radius: 18px 18px 18px 4px
├── Max Width: 280px
├── Font: 16px, line-height 1.4
└── Typing Indicator: Three dots with sequential fade
```

### Transcript View Component

**Design Specifications:**
```
Component: "Transcript View"
├── Container: Full width, auto height
├── Background: #FAFBFC (Very light gray)
├── Padding: 16px
├── Text: 14px, #2C3E50, line-height 1.6
├── Timestamp: 12px, #7F8C8D, right-aligned
└── Edit Controls: Subtle, appear on hover/tap
```

---

## Crisis Support UI Design

### Crisis Detection Response Interface

**Immediate Response Screen:**
```
Component: "Crisis Support"
├── Background: Soft gradient (#F8F9FA → #E8F4FD)
├── Heart Icon: 48x48px, #7BA7BC
├── Headline: "I'm here to support you"
│   ├── Font: 24px, #2C3E50
│   └── Weight: Medium (not bold - less aggressive)
├── Support Text: "You're not alone. Let's take this step by step."
│   ├── Font: 16px, #34495E  
│   └── Line height: 1.5
├── Action Buttons:
│   ├── "Continue Talking" (Primary, #7BA7BC)
│   ├── "Take a Break" (Secondary, #95A5A6)
│   └── "Get Support Resources" (Tertiary, #6CB169)
└── Privacy Note: "This conversation remains private"
```

**Design Principles for Crisis UI:**
- **Immediate calm**: Soft colors, gentle spacing
- **Clear options**: No more than 3 choices
- **Non-judgmental language**: Supportive, not clinical
- **Easy exit**: Always provide a way to continue or pause
- **Privacy assurance**: Clear statements about data handling

---

## Accessibility & Compliance

### WCAG 2.2 AA Compliance Checklist

**Color & Contrast:**
- [ ] 4.5:1 contrast ratio for normal text
- [ ] 3:1 contrast ratio for large text (18px+)
- [ ] Color not the only way to convey information
- [ ] Test with color blindness simulators

**Motion & Animation:**
- [ ] Respect `prefers-reduced-motion` setting
- [ ] No flashing content (3+ flashes per second)
- [ ] Animations can be paused or disabled
- [ ] Essential animations have static alternatives

**Voice Interface Accessibility:**
- [ ] Screen reader compatible voice state announcements
- [ ] Keyboard navigation for all voice controls
- [ ] Alternative text input for voice features
- [ ] Clear audio quality indicators

### Screen Reader Support

**Voice State Announcements:**
```
Listening: "Listening for your voice"
Processing: "Processing your message" 
Speaking: "AI is responding"
Error: "Connection issue, trying again"
Crisis: "Support resources available"
```

**Implementation Notes:**
- Use `accessibilityLabel` in React Native
- Provide context for state changes
- Announce important transitions
- Keep announcements brief and clear

---

## Performance Optimization

### Mobile Performance Guidelines

**Animation Performance:**
- Use `transform` and `opacity` only (GPU accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Keep frame rate at 60fps
- Use `will-change` sparingly

**File Size Optimization:**
- SVG for simple icons and shapes
- Lottie for complex animations (smaller than GIF/video)
- Optimize images at 2x resolution max
- Use system fonts when possible

**Battery & CPU Considerations:**
- Reduce animation complexity when battery low
- Pause non-essential animations in background
- Use efficient color formats (avoid gradients in animations)
- Implement smart animation queuing

---

## Implementation Bridge: Figma to React Native

### Design Token Export

**Color Tokens:**
```javascript
export const colors = {
  voice: {
    listening: '#4A90E2',
    processing: '#8B7ED8', 
    speaking: '#6CB169',
    error: '#E6A76B',
    crisis: '#7BA7BC'
  },
  background: {
    primary: '#F8F9FA',
    secondary: '#FAFBFC',
    accent: '#E8F4FD'
  },
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    accent: '#34495E'
  }
}
```

**Animation Tokens:**
```javascript
export const animations = {
  duration: {
    fast: 200,
    normal: 300,  
    slow: 500,
    breathing: 4000
  },
  easing: {
    gentle: [0.25, 0.46, 0.45, 0.94],
    organic: [0.4, 0.0, 0.2, 1]
  }
}
```

### Component Implementation Preview

**Voice State Indicator:**
```jsx
import { VoiceStateIndicator } from './components/voice';

<VoiceStateIndicator
  state={currentVoiceState} // 'listening' | 'processing' | 'speaking'
  size="medium" // 'small' | 'medium' | 'large'
  theme="trauma-informed"
  onStateChange={handleStateChange}
  accessibilityLabel={getStateLabel(currentVoiceState)}
  reduceMotion={prefersReducedMotion}
/>
```

---

## Testing & Validation

### User Testing Protocol

**Voice State Testing:**
1. **Audio-only test**: Can users understand states without looking?
2. **Visual-only test**: Are states clear without audio cues?  
3. **Combined test**: Do visual and audio work together harmoniously?
4. **Accessibility test**: Screen reader and voice control compatibility

**Emotional Response Testing:**
1. Show crisis support UI to trauma survivors (with professional supervision)
2. Validate color choices don't trigger anxiety responses
3. Test animation speeds aren't overwhelming
4. Confirm language feels supportive, not clinical

### A/B Testing Scenarios

**Color Variations:**
- Test different blue shades for listening state
- Compare warm vs cool colors for processing
- Validate crisis support color reduces anxiety

**Animation Timing:**
- Fast vs slow pulse animations
- Sequential vs synchronized dot animations  
- Breathing rhythm variations (3s vs 4s vs 5s)

**Layout Options:**
- Central vs corner voice state placement
- Large vs small voice indicators
- Minimal vs detailed transcript views

---

## Quick Start Checklist

### Phase 1: Setup (Day 1)
- [ ] Install required Figma plugins
- [ ] Create workspace structure
- [ ] Set up trauma-informed color palette
- [ ] Create typography scale

### Phase 2: Core Components (Days 2-3)
- [ ] Design 5 voice state indicators
- [ ] Create component variants (sizes, states)
- [ ] Add basic animations with Auto-Animate
- [ ] Test accessibility contrast ratios

### Phase 3: Conversation UI (Days 4-5)  
- [ ] Design conversation bubbles
- [ ] Create transcript view component
- [ ] Design crisis support interface
- [ ] Set up prototyping connections

### Phase 4: Advanced Features (Days 6-7)
- [ ] Add complex animations with Lottie
- [ ] Create micro-interaction details
- [ ] Set up component documentation
- [ ] Export design tokens for development

---

## Resources & References

### Figma Learning Resources
- **Figma Academy**: Free courses on component design and prototyping
- **Config 2023 Voice UI Talk**: Advanced voice interface design patterns
- **Material Design Voice**: Google's voice interface guidelines
- **Apple HIG Audio**: iOS voice interface best practices

### Trauma-Informed Design Resources
- **SAMHSA Guidelines**: Official trauma-informed care principles
- **PTSD Foundation**: Design guidelines for trauma survivors
- **Inclusive Design Research**: Microsoft's trauma-informed design research
- **Color Psychology Research**: Academic papers on color and emotional response

### Voice Interface Inspiration
- **Google Assistant**: Clean, minimal voice state indicators
- **Amazon Alexa**: Effective use of breathing animations
- **Apple Siri**: Organic waveform visualizations
- **Speechly**: Real-time voice processing UI patterns

### React Native Implementation
- **React Native Voice**: Voice recording and recognition library
- **React Native Reanimated**: High-performance animations
- **Lottie React Native**: Lottie animation implementation
- **React Native Accessibility**: Screen reader and accessibility APIs

---

## Troubleshooting Common Issues

### Figma Performance Issues
**Problem**: Animations lag or stutter
**Solution**: Reduce complexity, use fewer layers, optimize component structure

**Problem**: Auto-Animate not working smoothly  
**Solution**: Ensure consistent layer names, use Smart Animate, check timing curves

### Design System Maintenance
**Problem**: Components getting inconsistent across files
**Solution**: Use Figma libraries, establish clear naming conventions, regular audits

**Problem**: Color accessibility failures
**Solution**: Use Stark plugin, test with simulators, maintain contrast ratio spreadsheet

### Animation Export Issues  
**Problem**: Lottie animations look different in app vs Figma
**Solution**: Test early with developers, use Lottie preview tools, optimize for mobile

---

*This guide should be updated as you develop and refine the voice interface components. Focus on trauma-informed design principles and user testing throughout the process.*

**Document Version**: 1.0  
**Last Updated**: July 29, 2025  
**Next Review**: Weekly during design phase
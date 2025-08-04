/**
 * Design tokens for the Storyline mobile app
 * Voice-first, emotionally safe design system
 */

export const colors = {
  light: {
    // Primary Brand Colors
    inkBlack: '#1B1C1E',
    parchmentWhite: '#FDFBF7',
    softPlum: '#8854D0',
    warmOchre: '#E4B363',
    slateGray: '#6E7076',
    
    // Supporting Colors
    gentleSage: '#A8C090',
    whisperGray: '#F5F4F2',
    deepPlum: '#6B3FA0',
    warningAmber: '#F4A261',
    softBlush: '#F2E8E5',
    
    // Semantic Colors
    success: '#A8C090',
    warning: '#F4A261',
    error: '#E94B3C',
    info: '#8854D0',
    safeSpace: '#F2E8E5',

    // Common interface colors
    background: '#FDFBF7',
    surface: '#F5F4F2',
    text: '#1B1C1E',
  },
  
  dark: {
    inkBlack: '#000000',
    parchmentWhite: '#1A1A1A',
    softPlum: '#9A6FE0',
    warmOchre: '#F2C679',
    slateGray: '#8A8A8A',
    gentleSage: '#A8C090',
    whisperGray: '#2A2A2A',
    deepPlum: '#9A6FE0',
    warningAmber: '#F4A261',
    softBlush: 'rgba(242, 232, 229, 0.1)',
    accentGlow: 'rgba(154, 111, 224, 0.3)',
    success: '#A8C090',
    warning: '#F4A261',
    error: '#E94B3C',
    info: '#9A6FE0',
    safeSpace: 'rgba(242, 232, 229, 0.1)',

    // Common interface colors
    background: '#000000',
    surface: '#1A1A1A',
    text: '#FDFBF7',
  },

  // Voice interface specific colors (mode-agnostic)
  voice: {
    recording: '#E94B3C',
    processing: '#F4A261',
    ready: '#A8C090',
    speaking: '#8854D0',
    idle: '#6E7076',
  },
};

export const typography = {
  families: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    display: 'Playfair Display, Georgia, serif',
    monospace: 'SF Mono, Monaco, Inconsolata, monospace',
  },
  
  sizes: {
    display: { fontSize: 34, fontWeight: '700' as const, lineHeight: 40.8 },
    headline: { fontSize: 28, fontWeight: '600' as const, lineHeight: 36.4 },
    title: { fontSize: 22, fontWeight: '600' as const, lineHeight: 30.8 },
    bodyLarge: { fontSize: 17, fontWeight: '400' as const, lineHeight: 25.5 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
    caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18.2 },
    label: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14.3 },
  },
  
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  components: {
    buttonPadding: { horizontal: 16, vertical: 12 },
    cardPadding: { horizontal: 16, vertical: 16 },
    screenMargin: { horizontal: 16, vertical: 0 },
    safeAreaPadding: { top: 44, bottom: 34 },
  },
  
  voice: {
    recordingButtonSize: 80,
    waveformHeight: 60,
    conversationBubbleSpacing: 12,
    voiceCommandMargin: 8,
  }
};

export const borderRadius = {
  none: 0,
  sm: 2,
  base: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 8,
  },
};

export const animations = {
  duration: {
    immediate: 100,
    fast: 200,
    moderate: 300,
    slow: 500,
    emotional: 800,
  },
  
  easing: {
    linear: 'linear',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  }
};

// Voice-specific design tokens
export const voice = {
  // Waveform visualization
  waveform: {
    color: colors.light.softPlum,
    activeColor: colors.voice.recording,
    backgroundColor: colors.light.whisperGray,
  },
  
  // Voice command feedback
  feedback: {
    success: colors.voice.ready,
    error: colors.voice.recording,
    processing: colors.voice.processing,
    idle: colors.voice.idle,
  },
  
  // Speech bubble styling
  bubble: {
    user: {
      backgroundColor: colors.light.softPlum,
      textColor: colors.light.parchmentWhite,
    },
    ai: {
      backgroundColor: colors.light.whisperGray,
      textColor: colors.light.inkBlack,
    },
  },
};

// Safety and accessibility tokens
export const safety = {
  // Crisis detection colors
  crisis: {
    low: colors.light.warningAmber,
    medium: colors.light.error,
    high: '#dc2626',
  },
  
  // Emotional safety indicators
  emotional: {
    safe: colors.light.gentleSage,
    caution: colors.light.warningAmber,
    concern: colors.light.error,
  },
  
  // Safe space theming
  safeSpace: {
    backgroundColor: colors.light.safeSpace,
    borderColor: colors.light.softBlush,
    textColor: colors.light.inkBlack,
  },
  
  // Accessibility
  a11y: {
    minTouchTarget: 44,
    focusRingWidth: 2,
    focusRingColor: colors.light.softPlum,
    highContrast: {
      text: colors.light.inkBlack,
      background: colors.light.parchmentWhite,
    },
  },
};
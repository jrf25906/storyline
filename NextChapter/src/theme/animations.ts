// Next Chapter - Animation System
// "Grounded Optimism" Motion Design

export const Motion = {
  duration: {
    instant: 0,
    fast: 150,          // Micro-interactions, hovers
    standard: 200,      // Standard transitions
    slow: 300,          // Complex state changes
    celebration: 500,   // Success animations
    // Legacy support
    normal: 200,
    slower: 500,
  },
  
  easing: {
    // CSS easing strings
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    
    // Custom cubic-bezier curves from design system
    standard: 'cubic-bezier(0.2, 0, 0.2, 1)',      // Standard transitions
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',      // Entering elements
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',      // Exiting elements
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Celebrations only
    
    // React Native specific configs
    standardNative: {
      type: 'timing',
      duration: 200,
      useNativeDriver: true,
    },
    accelerateNative: {
      type: 'timing',
      duration: 150,
      useNativeDriver: true,
    },
    decelerateNative: {
      type: 'timing',
      duration: 300,
      useNativeDriver: true,
    },
  },
  
  spring: {
    // Gentle, calming springs
    default: {
      type: 'spring',
      useNativeDriver: true,
      damping: 20,      // Increased damping for calmer motion
      stiffness: 90,    // Reduced stiffness for gentler feel
    },
    gentle: {
      type: 'spring',
      useNativeDriver: true,
      damping: 25,      // Very calm motion
      stiffness: 70,
    },
    // Only for celebrations and positive moments
    bouncy: {
      type: 'spring',
      useNativeDriver: true,
      damping: 10,
      stiffness: 120,
    },
    // For task completion animations
    success: {
      type: 'spring',
      useNativeDriver: true,
      damping: 15,
      stiffness: 100,
      velocity: 2,
    },
  },
  
  // Predefined animation sequences
  animations: {
    // Gentle fade in for new content
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      duration: 300,
      easing: 'decelerate',
    },
    // Slide in from bottom with fade
    slideInGentle: {
      from: { 
        opacity: 0,
        translateY: 20,
      },
      to: { 
        opacity: 1,
        translateY: 0,
      },
      duration: 300,
      easing: 'decelerate',
    },
    // Task completion animation
    taskComplete: {
      keyframes: [
        { scale: 1, backgroundColor: '#FFFFFF' },
        { scale: 1.05, backgroundColor: '#A8DADC' },
        { scale: 1, backgroundColor: '#A8DADC' },
      ],
      duration: 300,
      easing: 'standard',
    },
  },
};

export type DurationKey = keyof typeof Motion.duration;
export type EasingKey = keyof typeof Motion.easing;
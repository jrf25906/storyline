// Next Chapter - Typography System
// "Grounded Optimism" Design Language

export const Typography = {
  fontFamily: {
    // Primary typeface - Inter for modern, clean readability
    primary: 'Inter',
    // Body text - Platform native for comfort
    body: 'System',
    // Monospace for data/technical content
    mono: 'Courier',
    // Specific font weights with Inter
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    // Fallback for system fonts
    system: 'System',
  },
  
  fontSizes: {
    // Display Typography (rem values commented for reference)
    display: 28,        // 2.8rem - Major celebrations, welcome
    displayXL: 28,      // Alias for backward compatibility
    displayLG: 24,      // 2.4rem - Page titles, day headers
    
    // Heading sizes
    h1: 24,             // 2.4rem - Page titles
    h2: 20,             // 2.0rem - Section headers, task titles
    h3: 18,             // 1.8rem - Subsection headers
    headingLG: 24,      // Backward compatibility
    headingMD: 20,      // Backward compatibility
    headingSM: 18,      // Backward compatibility
    
    // Body Typography
    bodyLG: 18,         // 1.8rem - Important body text
    body: 16,           // 1.6rem - Standard body text (minimum)
    bodySM: 14,         // 1.4rem - Caption, metadata
    button: 16,         // 1.6rem - Button text, CTAs
    
    // Caption & labels
    caption: 14,        // Updated from 12 for better readability
    tiny: 12,           // Only for very specific use cases
  },
  
  fontWeights: {
    light: '300' as const,     // Never use - too thin for stressed users
    regular: '400' as const,   // Body text, secondary information
    medium: '500' as const,    // Emphasis, section headers
    semiBold: '600' as const,  // Primary CTAs, important headers
    bold: '700' as const,      // Sparingly - only for critical alerts
  },
  
  lineHeights: {
    heading: 1.2,       // Display text
    subheading: 1.3,    // H1
    section: 1.4,       // H2, H3
    body: 1.6,          // Body text (improved readability under stress)
    tight: 1.25,        // Compact UI elements
    normal: 1.5,        // General use
    relaxed: 1.6,       // Body text
    loose: 2,           // Extra spacing for stress reduction
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    heading: -0.02,     // Slight tightening for headers
    body: 0,            // Normal spacing for body
  },
};

export type FontSize = keyof typeof Typography.fontSizes;
export type FontWeight = keyof typeof Typography.fontWeights;
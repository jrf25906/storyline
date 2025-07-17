import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';
import { Colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export type IconName = 
  // Navigation
  | 'home'
  | 'coach'
  | 'tools'
  | 'progress'
  | 'more'
  // Actions
  | 'check'
  | 'close'
  | 'add'
  | 'edit'
  | 'delete'
  | 'share'
  | 'save'
  // Status
  | 'time'
  | 'calendar'
  | 'alert'
  | 'info'
  | 'success'
  | 'error'
  | 'lock'
  // Features
  | 'task'
  | 'chat'
  | 'upload'
  | 'analytics'
  | 'link'
  | 'star'
  | 'heart'
  | 'trophy'
  | 'lightbulb'
  | 'briefcase'
  | 'document'
  | 'folder'
  | 'profile'
  | 'settings'
  | 'arrow-back'
  | 'arrow-forward'
  | 'chevron-down'
  | 'chevron-up';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Custom icon component with hand-drawn aesthetic
 * Following the "Grounded Optimism" design system
 */
export function Icon({
  name,
  size = 24,
  color,
  strokeWidth = 2,
  style,
  testID,
}: IconProps) {
  const { theme } = useTheme();
  const iconColor = color || theme.colors.text;
  
  // Add slight irregularity for hand-drawn feel
  const wobble = 0.5;
  const getWobbledPath = (d: string) => {
    // This is a simplified wobble - in production, you might want to use a path morphing library
    return d;
  };

  const renderIcon = () => {
    switch (name) {
      // Navigation Icons
      case 'home':
        return (
          <G>
            <Path
              d={getWobbledPath('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6')}
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );

      case 'coach':
        return (
          <G>
            <Path
              d={getWobbledPath('M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z')}
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );

      case 'tools':
        return (
          <G>
            <Path
              d={getWobbledPath('M21 21l-6-6m6 6v-4.8m0 4.8h-4.8')}
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d={getWobbledPath('M3 16.2V21m0 0h4.8M3 21l6-6')}
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d={getWobbledPath('M21 7.8V3m0 0h-4.8M21 3l-6 6')}
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d={getWobbledPath('M3 7.8V3m0 0h4.8M3 3l6 6')}
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );

      case 'progress':
        return (
          <G>
            <Path
              d={getWobbledPath('M13 7h8m0 0v8m0-8l-8 8-4-4-6 6')}
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );

      case 'more':
        return (
          <G>
            <Circle cx="5" cy="12" r="1.5" fill={iconColor} />
            <Circle cx="12" cy="12" r="1.5" fill={iconColor} />
            <Circle cx="19" cy="12" r="1.5" fill={iconColor} />
          </G>
        );

      // Action Icons
      case 'check':
        return (
          <Path
            d={getWobbledPath('M5 13l4 4L19 7')}
            stroke={iconColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );

      case 'close':
        return (
          <G>
            <Line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <Line
              x1="6"
              y1="18"
              x2="18"
              y2="6"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </G>
        );

      case 'add':
        return (
          <G>
            <Line
              x1="12"
              y1="5"
              x2="12"
              y2="19"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <Line
              x1="5"
              y1="12"
              x2="19"
              y2="12"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </G>
        );

      case 'time':
        return (
          <G>
            <Circle
              cx="12"
              cy="12"
              r="9"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Path
              d={getWobbledPath('M12 6v6l4 2')}
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );

      case 'calendar':
        return (
          <G>
            <Rect
              x="3"
              y="4"
              width="18"
              height="18"
              rx="2"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Line
              x1="16"
              y1="2"
              x2="16"
              y2="6"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <Line
              x1="8"
              y1="2"
              x2="8"
              y2="6"
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <Line
              x1="3"
              y1="10"
              x2="21"
              y2="10"
              stroke={iconColor}
              strokeWidth={strokeWidth}
            />
          </G>
        );

      case 'star':
        return (
          <Path
            d={getWobbledPath('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z')}
            stroke={iconColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            fill="none"
          />
        );

      case 'heart':
        return (
          <Path
            d={getWobbledPath('M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z')}
            stroke={iconColor}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            fill="none"
          />
        );

      case 'trophy':
        return (
          <G>
            <Path
              d={getWobbledPath('M8 21h8m-4-4v4m0-4a4 4 0 01-4-4V7m4 10a4 4 0 004-4V7M6 7V4a1 1 0 011-1h10a1 1 0 011 1v3')}
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d={getWobbledPath('M6 7a2 2 0 01-2 2H3a1 1 0 01-1-1V6a1 1 0 011-1h3m12 0a2 2 0 002 2h1a1 1 0 001-1V6a1 1 0 00-1-1h-3')}
              stroke={iconColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );

      case 'arrow-back':
        return (
          <Path
            d={getWobbledPath('M15 19l-7-7 7-7')}
            stroke={iconColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );

      case 'arrow-forward':
        return (
          <Path
            d={getWobbledPath('M9 5l7 7-7 7')}
            stroke={iconColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );

      case 'chevron-down':
        return (
          <Path
            d={getWobbledPath('M6 9l6 6 6-6')}
            stroke={iconColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );

      case 'chevron-up':
        return (
          <Path
            d={getWobbledPath('M18 15l-6-6-6 6')}
            stroke={iconColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );

      default:
        // Return a placeholder for unimplemented icons
        return (
          <Rect
            x="3"
            y="3"
            width="18"
            height="18"
            stroke={iconColor}
            strokeWidth={strokeWidth}
            strokeDasharray="3 3"
            fill="none"
          />
        );
    }
  };

  return (
    <View style={[{ width: size, height: size }, style]} testID={testID}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {renderIcon()}
      </Svg>
    </View>
  );
}
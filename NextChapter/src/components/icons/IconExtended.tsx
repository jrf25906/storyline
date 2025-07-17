import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, G, Rect, Ellipse } from 'react-native-svg';
import { Icon, IconProps } from './Icon';

// Extended icon set for specific features
export type ExtendedIconName = 
  // Bounce Plan specific
  | 'task-complete'
  | 'task-skip'
  | 'weekend'
  | 'milestone'
  // Job Tracker
  | 'application'
  | 'interview'
  | 'offer'
  | 'rejected'
  // Budget
  | 'wallet'
  | 'chart'
  | 'alert-triangle'
  // Mood
  | 'mood-happy'
  | 'mood-neutral'
  | 'mood-sad'
  // Coach tones
  | 'hype'
  | 'pragmatist'
  | 'tough-love';

interface ExtendedIconProps extends Omit<IconProps, 'name'> {
  name: ExtendedIconName;
}

/**
 * Extended icon set with more specialized icons
 */
export function ExtendedIcon({
  name,
  size = 24,
  color,
  strokeWidth = 2,
  style,
  testID,
}: ExtendedIconProps) {
  const renderIcon = () => {
    switch (name) {
      // Bounce Plan Icons
      case 'task-complete':
        return (
          <G>
            <Circle
              cx="12"
              cy="12"
              r="9"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Path
              d="M8 12l2 2 4-4"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );

      case 'task-skip':
        return (
          <G>
            <Circle
              cx="12"
              cy="12"
              r="9"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Path
              d="M9 9l6 6m0-6l-6 6"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );

      case 'weekend':
        return (
          <G>
            {/* Sun with rays */}
            <Circle
              cx="12"
              cy="12"
              r="4"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Path
              d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'milestone':
        return (
          <G>
            <Path
              d="M5 12l5 5L20 7"
              stroke={color}
              strokeWidth={strokeWidth + 0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Circle cx="20" cy="7" r="2" fill={color} />
          </G>
        );

      // Job Tracker Icons
      case 'application':
        return (
          <G>
            <Rect
              x="5"
              y="3"
              width="14"
              height="18"
              rx="2"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Path
              d="M9 7h6m-6 4h6m-6 4h4"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'interview':
        return (
          <G>
            <Circle cx="9" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Circle cx="15" cy="7" r="3" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Path
              d="M7 12c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v7a2 2 0 01-2 2H9a2 2 0 01-2-2v-7z"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
          </G>
        );

      case 'offer':
        return (
          <G>
            <Path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              fill="none"
            />
            <Circle cx="12" cy="12" r="2" fill={color} />
          </G>
        );

      case 'rejected':
        return (
          <G>
            <Path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              fill="none"
              strokeDasharray="2 2"
              opacity={0.5}
            />
          </G>
        );

      // Budget Icons
      case 'wallet':
        return (
          <G>
            <Path
              d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2v-2"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Path
              d="M3 11h14a2 2 0 012 2v1a2 2 0 01-2 2H3"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle cx="14" cy="13.5" r="1" fill={color} />
          </G>
        );

      case 'chart':
        return (
          <G>
            <Path
              d="M3 3v18h18"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M7 13l3-3 3 3 5-5"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );

      // Mood Icons
      case 'mood-happy':
        return (
          <G>
            <Circle
              cx="12"
              cy="12"
              r="9"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle cx="8" cy="9" r="1" fill={color} />
            <Circle cx="16" cy="9" r="1" fill={color} />
            <Path
              d="M8 14c0 2.21 1.79 4 4 4s4-1.79 4-4"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'mood-neutral':
        return (
          <G>
            <Circle
              cx="12"
              cy="12"
              r="9"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle cx="8" cy="9" r="1" fill={color} />
            <Circle cx="16" cy="9" r="1" fill={color} />
            <Path
              d="M8 15h8"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'mood-sad':
        return (
          <G>
            <Circle
              cx="12"
              cy="12"
              r="9"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle cx="8" cy="9" r="1" fill={color} />
            <Circle cx="16" cy="9" r="1" fill={color} />
            <Path
              d="M16 16c0-2.21-1.79-4-4-4s-4 1.79-4 4"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      // Coach Tone Icons
      case 'hype':
        return (
          <G>
            {/* Fire/flame icon */}
            <Path
              d="M12 2c0 5-2 6-2 9s2 5 4 5 4-2 4-5c0-2-1-3-1-6 0 3-1 4-1.5 5-.5-1-1.5-2-1.5-5-1 2-2 3-2 4z"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M8 21c0-2 1.5-3 4-3s4 1 4 3"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );

      case 'pragmatist':
        return (
          <G>
            {/* Scales/balance icon */}
            <Path
              d="M12 2v20m-7-9l2-5h10l2 5"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M5 11h4c0 1.66-1.34 3-3 3s-3-1.34-3-3m12 0h4c0 1.66-1.34 3-3 3s-3-1.34-3-3"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
          </G>
        );

      case 'tough-love':
        return (
          <G>
            {/* Strong arm/muscle icon */}
            <Path
              d="M9 11c0-1.66 1.34-3 3-3s3 1.34 3 3v5c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-3c0-3.31-2.69-6-6-6h-2c-3.31 0-6 2.69-6 6v3c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-5z"
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle cx="7" cy="13" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Circle cx="17" cy="13" r="2" stroke={color} strokeWidth={strokeWidth} fill="none" />
          </G>
        );

      default:
        return null;
    }
  };

  const content = renderIcon();
  
  if (!content) {
    // Fallback to base Icon component
    return <Icon name="info" size={size} color={color} strokeWidth={strokeWidth} style={style} testID={testID} />;
  }

  return (
    <View style={[{ width: size, height: size }, style]} testID={testID}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {content}
      </Svg>
    </View>
  );
}
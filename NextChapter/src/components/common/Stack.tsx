import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Spacing } from '../../theme';

interface StackProps {
  children: React.ReactNode;
  spacing?: keyof typeof Spacing;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  horizontal?: boolean;
  wrap?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  justify = 'flex-start',
  horizontal = false,
  wrap = false,
  style,
  testID,
}) => {
  const spacingValue = Spacing[spacing];
  
  const stackStyle: ViewStyle = {
    flexDirection: horizontal ? 'row' : 'column',
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : 'nowrap',
  };

  // Add spacing between children
  const childrenWithSpacing = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;
    
    const isLast = index === React.Children.count(children) - 1;
    if (isLast) return child;
    
    const spacingStyle: ViewStyle = horizontal 
      ? { marginRight: spacingValue }
      : { marginBottom: spacingValue };
    
    return React.cloneElement(child, {
      style: [child.props.style, spacingStyle],
    });
  });

  return (
    <View style={[stackStyle, style]} testID={testID}>
      {childrenWithSpacing}
    </View>
  );
};
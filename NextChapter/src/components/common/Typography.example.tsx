import React from 'react';
import { View, ScrollView } from 'react-native';
import { Typography } from './Typography';
import { typographyStyles } from './Typography.styles';

/**
 * Typography Usage Examples
 * 
 * This file demonstrates all the ways to use the Typography component
 * following the "Grounded Optimism" design system.
 */

export const TypographyExamples = () => {
  return (
    <ScrollView style={{ padding: 20 }}>
      {/* Heading Examples */}
      <View style={{ marginBottom: 40 }}>
        <Typography variant="display" color="primary">
          Welcome Back!
        </Typography>
        <Typography variant="caption" color="secondary">
          Display variant - 28px for major celebrations
        </Typography>
      </View>

      <View style={{ marginBottom: 40 }}>
        <Typography variant="h1">
          Your Daily Tasks
        </Typography>
        <Typography variant="caption" color="secondary">
          H1 variant - 24px for page titles
        </Typography>
      </View>

      <View style={{ marginBottom: 40 }}>
        <Typography variant="h2">
          Morning Routine
        </Typography>
        <Typography variant="caption" color="secondary">
          H2 variant - 20px for section headers
        </Typography>
      </View>

      <View style={{ marginBottom: 40 }}>
        <Typography variant="h3">
          Task Details
        </Typography>
        <Typography variant="caption" color="secondary">
          H3 variant - 18px for subsections
        </Typography>
      </View>

      {/* Body Text Examples */}
      <View style={{ marginBottom: 40 }}>
        <Typography variant="bodyLarge">
          This is important body text that needs emphasis. Perfect for 
          introductions or key information.
        </Typography>
        <Typography variant="caption" color="secondary">
          BodyLarge variant - 18px for important text
        </Typography>
      </View>

      <View style={{ marginBottom: 40 }}>
        <Typography>
          This is standard body text with a minimum size of 16px for 
          accessibility. The line height is optimized for readability 
          under stress with a 1.6 ratio.
        </Typography>
        <Typography variant="caption" color="secondary">
          Body variant (default) - 16px minimum
        </Typography>
      </View>

      <View style={{ marginBottom: 40 }}>
        <Typography variant="caption">
          Last updated: Today at 9:00 AM
        </Typography>
        <Typography variant="caption" color="secondary">
          Caption variant - 14px for metadata
        </Typography>
      </View>

      {/* Button Text */}
      <View style={{ marginBottom: 40 }}>
        <Typography variant="button" style={typographyStyles.uppercase}>
          Continue to Next Step
        </Typography>
        <Typography variant="caption" color="secondary">
          Button variant - 16px for CTAs
        </Typography>
      </View>

      {/* Color Examples */}
      <View style={{ marginBottom: 40 }}>
        <Typography variant="h2">Color Options</Typography>
        
        <Typography color="primary">Primary text color</Typography>
        <Typography color="secondary">Secondary text color</Typography>
        <Typography color="tertiary">Tertiary text color</Typography>
        <Typography color="error">Error text color</Typography>
        <Typography color="success">Success text color</Typography>
        <Typography color="warning">Warning text color</Typography>
        <Typography color="info">Info text color</Typography>
        <Typography color="muted">Muted text color</Typography>
        <Typography color="#007AFF">Custom color string</Typography>
      </View>

      {/* Weight Examples */}
      <View style={{ marginBottom: 40 }}>
        <Typography variant="h2">Font Weights</Typography>
        
        <Typography weight="regular">Regular weight (400)</Typography>
        <Typography weight="medium">Medium weight (500)</Typography>
        <Typography weight="semiBold">SemiBold weight (600)</Typography>
        <Typography weight="bold">Bold weight (700) - use sparingly</Typography>
        <Typography weight="light">
          Light weight (300) - automatically converted to regular
        </Typography>
      </View>

      {/* Alignment Examples */}
      <View style={{ marginBottom: 40 }}>
        <Typography variant="h2">Text Alignment</Typography>
        
        <Typography align="left">Left aligned text (default)</Typography>
        <Typography align="center">Center aligned text</Typography>
        <Typography align="right">Right aligned text</Typography>
        <Typography align="justify">
          Justified text alignment can be useful for longer paragraphs where 
          you want even edges on both sides.
        </Typography>
      </View>

      {/* Combined Examples */}
      <View style={{ marginBottom: 40 }}>
        <Typography variant="h2">Combined Styling</Typography>
        
        <Typography 
          variant="h3" 
          color="success" 
          weight="semiBold"
          align="center"
        >
          Task Completed!
        </Typography>
        
        <Typography 
          variant="bodyLarge" 
          color="error" 
          numberOfLines={2}
          style={{ marginTop: 20 }}
        >
          This is an error message that might be very long but will be 
          truncated after two lines to prevent overwhelming the user 
          during stressful situations.
        </Typography>
        
        <Typography 
          variant="button" 
          color="primary" 
          style={[typographyStyles.uppercase, { marginTop: 20 }]}
        >
          Try Again
        </Typography>
      </View>

      {/* Accessibility Examples */}
      <View style={{ marginBottom: 40 }}>
        <Typography variant="h2">Accessibility</Typography>
        
        <Typography 
          variant="h1"
          accessibilityRole="header"
          accessibilityLevel={1}
        >
          Main Page Title
        </Typography>
        
        <Typography 
          variant="body"
          accessibilityHint="This text provides important context"
        >
          All typography components support accessibility props for 
          screen readers and assistive technologies.
        </Typography>
      </View>

      {/* Utility Styles */}
      <View style={{ marginBottom: 40 }}>
        <Typography variant="h2">Utility Styles</Typography>
        
        <Typography style={typographyStyles.link}>
          This looks like a link
        </Typography>
        
        <Typography style={typographyStyles.strikethrough}>
          Completed task with strikethrough
        </Typography>
        
        <Typography style={typographyStyles.capitalize}>
          this text will be capitalized
        </Typography>
        
        <Typography 
          numberOfLines={1}
          style={typographyStyles.truncate}
        >
          This very long text will be truncated with an ellipsis at the end
        </Typography>
      </View>
    </ScrollView>
  );
};
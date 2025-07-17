import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import Button from '../Button';
import { Colors, Spacing, Typography } from '../../../theme';

/**
 * Button Component Examples
 * 
 * This file demonstrates the usage of the updated Button component
 * with the new "Grounded Optimism" design system.
 */
export default function ButtonExamples() {
  const handlePress = () => console.log('Button pressed');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button Variants</Text>
        
        {/* Primary Button - Deep Forest green */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Get Started"
            onPress={handlePress}
            variant="primary"
            accessibilityHint="Tap to begin your journey"
          />
          <Text style={styles.description}>
            Primary: Main actions like "Start Task", "Save Progress"
          </Text>
        </View>

        {/* Secondary Button - Transparent with border */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Skip for Now"
            onPress={handlePress}
            variant="secondary"
            accessibilityHint="Tap to skip this step"
          />
          <Text style={styles.description}>
            Secondary: Alternative actions like "Skip", "Cancel"
          </Text>
        </View>

        {/* Support Button - Calm Blue for coach/help */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Talk to Coach"
            onPress={handlePress}
            variant="support"
            accessibilityHint="Tap to open the AI coach"
          />
          <Text style={styles.description}>
            Support: Coach interactions, help, emotional support
          </Text>
        </View>

        {/* Ghost Button - Minimal style */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Learn More"
            onPress={handlePress}
            variant="ghost"
            accessibilityHint="Tap to read more information"
          />
          <Text style={styles.description}>
            Ghost: Tertiary actions, links
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button Sizes</Text>
        
        <View style={styles.buttonWrapper}>
          <Button
            title="Small Button"
            onPress={handlePress}
            size="small"
          />
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            title="Medium Button (Default)"
            onPress={handlePress}
            size="medium"
          />
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            title="Large Button"
            onPress={handlePress}
            size="large"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button States</Text>
        
        <View style={styles.buttonWrapper}>
          <Button
            title="Loading State"
            onPress={handlePress}
            loading={true}
            accessibilityHint="Please wait while loading"
          />
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            title="Disabled State"
            onPress={handlePress}
            disabled={true}
            accessibilityHint="This action is currently unavailable"
          />
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            title="Full Width Button"
            onPress={handlePress}
            fullWidth={true}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Real-World Examples</Text>
        
        {/* Onboarding flow */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Complete Setup"
            onPress={handlePress}
            variant="primary"
            size="large"
            fullWidth={true}
            accessibilityLabel="Complete onboarding setup"
            accessibilityHint="Tap to finish setting up your profile"
          />
        </View>

        {/* Task completion */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Mark as Complete"
            onPress={handlePress}
            variant="primary"
            accessibilityLabel="Mark task as complete"
            accessibilityHint="Tap to mark this task as done"
          />
        </View>

        {/* Crisis support */}
        <View style={styles.buttonWrapper}>
          <Button
            title="I Need Help"
            onPress={handlePress}
            variant="support"
            accessibilityLabel="Get immediate help"
            accessibilityHint="Tap to access crisis support resources"
          />
        </View>

        {/* Job application */}
        <View style={styles.buttonWrapper}>
          <Button
            title="Add Application"
            onPress={handlePress}
            variant="secondary"
            accessibilityLabel="Add new job application"
            accessibilityHint="Tap to track a new job application"
          />
        </View>
      </View>

      {/* Backward Compatibility Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backward Compatibility</Text>
        
        <View style={styles.buttonWrapper}>
          <Button
            title="Outline Variant (Legacy)"
            onPress={handlePress}
            variant="outline" // Maps to secondary
          />
          <Text style={styles.description}>
            'outline' variant maps to 'secondary' for compatibility
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  buttonWrapper: {
    marginVertical: Spacing.sm,
  },
  description: {
    fontSize: Typography.fontSizes.bodySM,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
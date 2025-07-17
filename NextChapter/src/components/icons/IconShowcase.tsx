import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Icon, IconName } from './Icon';
import { ExtendedIcon, ExtendedIconName } from './IconExtended';
import { Colors, Typography, Spacing, Borders } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../common/Card';

interface IconShowcaseProps {
  onIconPress?: (name: string) => void;
}

/**
 * Showcase component displaying all available icons
 * Useful for development and documentation
 */
export function IconShowcase({ onIconPress }: IconShowcaseProps) {
  const { theme } = useTheme();

  const baseIcons: IconName[] = [
    'home', 'coach', 'tools', 'progress', 'more',
    'check', 'close', 'add', 'edit', 'delete', 'share', 'save',
    'time', 'calendar', 'alert', 'info', 'success', 'error', 'lock',
    'task', 'chat', 'upload', 'analytics', 'link', 'star', 'heart',
    'trophy', 'lightbulb', 'briefcase', 'document', 'folder',
    'profile', 'settings', 'arrow-back', 'arrow-forward',
    'chevron-down', 'chevron-up',
  ];

  const extendedIcons: ExtendedIconName[] = [
    'task-complete', 'task-skip', 'weekend', 'milestone',
    'application', 'interview', 'offer', 'rejected',
    'wallet', 'chart', 'alert-triangle',
    'mood-happy', 'mood-neutral', 'mood-sad',
    'hype', 'pragmatist', 'tough-love',
  ];

  const renderIconSection = (
    title: string,
    icons: string[],
    Component: typeof Icon | typeof ExtendedIcon
  ) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <View style={styles.iconGrid}>
        {icons.map((name) => (
          <TouchableOpacity
            key={name}
            style={styles.iconCard}
            onPress={() => onIconPress?.(name)}
            activeOpacity={0.7}
          >
            <Card variant="outlined" style={styles.iconCardInner}>
              <Component
                name={name as any}
                size={32}
                color={theme.colors.primary}
                strokeWidth={2}
              />
              <Text style={[styles.iconName, { color: theme.colors.textSecondary }]}>
                {name}
              </Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Icon System
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Hand-drawn style icons following the "Grounded Optimism" design
        </Text>
      </View>

      {renderIconSection('Base Icons', baseIcons, Icon)}
      {renderIconSection('Extended Icons', extendedIcons, ExtendedIcon)}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Icon Variants
        </Text>
        <View style={styles.variantGrid}>
          <View style={styles.variantCard}>
            <Text style={[styles.variantLabel, { color: theme.colors.textSecondary }]}>
              Sizes
            </Text>
            <View style={styles.variantRow}>
              <Icon name="heart" size={16} color={theme.colors.primary} />
              <Icon name="heart" size={24} color={theme.colors.primary} />
              <Icon name="heart" size={32} color={theme.colors.primary} />
              <Icon name="heart" size={48} color={theme.colors.primary} />
            </View>
          </View>

          <View style={styles.variantCard}>
            <Text style={[styles.variantLabel, { color: theme.colors.textSecondary }]}>
              Colors
            </Text>
            <View style={styles.variantRow}>
              <Icon name="star" size={24} color={Colors.primary} />
              <Icon name="star" size={24} color={Colors.secondary} />
              <Icon name="star" size={24} color={Colors.accent} />
              <Icon name="star" size={24} color={Colors.calmBlue} />
              <Icon name="star" size={24} color={Colors.successMint} />
            </View>
          </View>

          <View style={styles.variantCard}>
            <Text style={[styles.variantLabel, { color: theme.colors.textSecondary }]}>
              Stroke Widths
            </Text>
            <View style={styles.variantRow}>
              <Icon name="circle" size={32} color={theme.colors.primary} strokeWidth={1} />
              <Icon name="circle" size={32} color={theme.colors.primary} strokeWidth={2} />
              <Icon name="circle" size={32} color={theme.colors.primary} strokeWidth={3} />
              <Icon name="circle" size={32} color={theme.colors.primary} strokeWidth={4} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.usageSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Usage Examples
        </Text>
        <Card style={styles.codeBlock}>
          <Text style={[styles.codeText, { color: theme.colors.textPrimary }]}>
            {`import { Icon } from '@/components/icons';

// Basic usage
<Icon name="home" size={24} />

// With custom color
<Icon 
  name="heart" 
  size={32} 
  color={Colors.accent} 
/>

// Extended icons
import { ExtendedIcon } from '@/components/icons';

<ExtendedIcon 
  name="mood-happy" 
  size={48} 
/>`}
          </Text>
        </Card>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSizes.h1,
    fontWeight: Typography.fontWeights.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSizes.body,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.h2,
    fontWeight: Typography.fontWeights.semiBold,
    marginBottom: Spacing.md,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  iconCard: {
    width: '25%',
    padding: Spacing.xs,
  },
  iconCardInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    minHeight: 80,
  },
  iconName: {
    fontSize: Typography.fontSizes.caption,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  variantGrid: {
    gap: Spacing.md,
  },
  variantCard: {
    marginBottom: Spacing.md,
  },
  variantLabel: {
    fontSize: Typography.fontSizes.caption,
    marginBottom: Spacing.sm,
    fontWeight: Typography.fontWeights.medium,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  usageSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  codeBlock: {
    backgroundColor: Colors.neutral[100],
    padding: Spacing.md,
    borderRadius: Borders.radius.md,
  },
  codeText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSizes.bodySM,
    lineHeight: Typography.lineHeights.relaxed,
  },
  footer: {
    height: Spacing.xxl,
  },
});
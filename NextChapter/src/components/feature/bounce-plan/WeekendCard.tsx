import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../common/Card';
import { useTheme } from '../../../context/ThemeContext';
import { Typography, Spacing, Colors } from '../../../theme';

interface WeekendCardProps {
  dayNumber: number;
}

export default function WeekendCard({ dayNumber }: WeekendCardProps) {
  const { theme } = useTheme();

  return (
    <Card variant="filled" style={styles.weekendCard}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.calmBlue + '20' }]}>
          <Ionicons name="sunny-outline" size={32} color={theme.colors.calmBlue} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Weekend Recharge
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Day {dayNumber} • Take time to rest
        </Text>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          Your bounce back includes rest. Enjoy your weekend - you'll come back stronger Monday!
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  weekendCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  content: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSizes.bodySM,
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.fontSizes.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: Typography.fontSizes.body * 1.5,
  },
});
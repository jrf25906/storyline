import { StyleSheet } from 'react-native';
import { Spacing, Typography, Borders, Colors } from '../../theme';

export const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: Borders.radius.md,
    overflow: 'hidden',
    minHeight: Spacing.minTouchTarget,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    fontSize: Typography.fontSizes.headingMD,
    marginRight: Spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: Typography.fontSizes.bodySM,
    color: Colors.white,
    lineHeight: Typography.fontSizes.bodySM * Typography.lineHeights.normal,
  },
  dismissButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  dismissText: {
    fontSize: Typography.fontSizes.body,
    color: Colors.white,
    fontWeight: Typography.fontWeights.semiBold,
  },
});
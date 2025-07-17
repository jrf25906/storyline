import { StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background + 'F0',
    borderRadius: 16,
    minHeight: 120,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  indicatorContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    zIndex: 2,
  },
  calmingCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    zIndex: 1,
  },
  message: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  tipContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    maxWidth: 300,
  },
  tipText: {
    fontSize: Typography.fontSizes.bodySM,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: Typography.lineHeights.relaxed,
  },
});
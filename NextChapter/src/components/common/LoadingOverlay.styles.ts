import { StyleSheet } from 'react-native';
import { Spacing, Typography, Borders, Shadows } from '@theme';

export const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingBox: {
    padding: Spacing.xl,
    borderRadius: Borders.radius.md,
    alignItems: 'center',
    ...Shadows.card,
    minWidth: 120,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSizes.body,
    textAlign: 'center',
    maxWidth: 200,
  },
});
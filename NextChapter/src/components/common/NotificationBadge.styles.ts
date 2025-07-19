import { StyleSheet } from 'react-native';
import { theme } from '@theme';

export const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -8,
    right: -8,
  },
  count: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
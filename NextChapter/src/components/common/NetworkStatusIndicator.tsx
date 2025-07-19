import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useUIStore } from '@stores/uiStore';
import { useTheme } from '@context/ThemeContext';
import { Colors, Spacing, Typography, Motion } from '@theme';

interface NetworkStatusIndicatorProps {
  autoHide?: boolean;
  autoHideDelay?: number;
  style?: ViewStyle;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  autoHide = false,
  autoHideDelay = 5000,
  style,
}) => {
  const { theme } = useTheme();
  const { networkStatus, setNetworkStatus, offlineQueue } = useUIStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Set up network listener
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        setNetworkStatus('offline');
      } else if (state.isInternetReachable === false) {
        setNetworkStatus('slow');
      } else {
        setNetworkStatus('online');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setNetworkStatus]);

  useEffect(() => {
    // Show/hide based on network status
    if (networkStatus !== 'online') {
      setIsVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: Motion.duration.normal,
        useNativeDriver: true,
      }).start();

      // Auto-hide if enabled
      if (autoHide && networkStatus === 'slow') {
        const timer = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: Motion.duration.normal,
            useNativeDriver: true,
          }).start(() => setIsVisible(false));
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: Motion.duration.normal,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [networkStatus, fadeAnim, autoHide, autoHideDelay]);

  if (!isVisible) {
    return null;
  }

  const getStatusConfig = () => {
    switch (networkStatus) {
      case 'offline':
        return {
          icon: '🌙',
          title: "You're offline",
          message: "Don't worry, your changes are saved locally",
          backgroundColor: theme.colors.gentleCoral,
        };
      case 'slow':
        return {
          icon: '🐢',
          title: 'Slow connection',
          message: 'Things might take a bit longer',
          backgroundColor: theme.colors.warning,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: config.backgroundColor + '20',
          borderColor: config.backgroundColor,
        },
        style,
      ]}
      testID="network-status-indicator"
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Network status: ${networkStatus}. ${config.message}`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{config.icon}</Text>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.textPrimary },
            ]}
          >
            {config.title}
          </Text>
          <Text
            style={[
              styles.message,
              { color: theme.colors.textSecondary },
            ]}
          >
            {config.message}
          </Text>
          {networkStatus === 'offline' && offlineQueue.length > 0 && (
            <Text
              style={[
                styles.queueCount,
                { color: theme.colors.textTertiary },
              ]}
            >
              {offlineQueue.length} changes waiting to sync
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: Spacing.md,
    right: Spacing.md,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
  },
  message: {
    fontSize: Typography.fontSizes.bodySM,
    marginTop: 2,
  },
  queueCount: {
    fontSize: Typography.fontSizes.caption,
    marginTop: 4,
  },
});
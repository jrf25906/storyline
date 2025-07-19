import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useOffline } from '@context/OfflineContext';

interface NetworkStatusBarProps {
  onPress?: () => void;
}

export default function NetworkStatusBar({ onPress }: NetworkStatusBarProps) {
  const { theme } = useTheme();
  const { isConnected, hasPendingSyncs, syncInProgress, triggerSync } = useOffline();
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const slideAnim = useState(new Animated.Value(-60))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Show/hide bar based on network status
  useEffect(() => {
    const shouldShow = !isConnected || hasPendingSyncs || syncInProgress;
    setIsVisible(shouldShow);

    if (shouldShow) {
      // Slide down and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setHasAnimated(true));
    } else {
      // Slide up and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setHasAnimated(false));
    }
  }, [isConnected, hasPendingSyncs, syncInProgress]);

  if (!isVisible && !hasAnimated) {
    return null;
  }

  // Determine bar color and message
  let barColor = theme.colors.success;
  let message = 'Connected';
  let icon = 'wifi' as keyof typeof Ionicons.glyphMap;
  let showSyncButton = false;

  if (!isConnected) {
    barColor = theme.colors.error;
    message = 'No internet connection';
    icon = 'cloud-offline';
  } else if (syncInProgress) {
    barColor = theme.colors.primary;
    message = 'Syncing...';
    icon = 'sync';
  } else if (hasPendingSyncs) {
    barColor = theme.colors.warning;
    message = 'Changes pending sync';
    icon = 'cloud-upload';
    showSyncButton = true;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (showSyncButton && isConnected) {
      triggerSync();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: barColor,
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        disabled={!showSyncButton && !onPress}
        activeOpacity={0.8}
      >
        <View style={styles.leftContent}>
          {syncInProgress ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name={icon} size={20} color="white" />
          )}
          <Text style={styles.text}>{message}</Text>
        </View>
        {showSyncButton && (
          <View style={styles.syncButton}>
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
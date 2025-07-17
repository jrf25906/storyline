import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useUIStore } from '../../stores/uiStore';
import { CalmingLoadingIndicator } from './CalmingLoadingIndicator';
import { Colors } from '../../theme';

export const GlobalLoadingOverlay: React.FC = () => {
  const { globalLoading, loadingMessage } = useUIStore();

  if (!globalLoading) {
    return null;
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={globalLoading}
      statusBarTranslucent
    >
      <View
        style={styles.overlay}
        testID="global-loading-overlay"
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel={loadingMessage || 'Loading'}
        accessibilityState={{ busy: true }}
        pointerEvents="auto"
      >
        <View style={styles.contentContainer}>
          <CalmingLoadingIndicator
            message={loadingMessage}
            size="large"
            showTip={true}
            tipDelay={5000}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    margin: 40,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 280,
  },
});
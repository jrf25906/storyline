import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useUIStore } from '@stores/uiStore';
import { EmpathyErrorState } from '@components/common/EmpathyErrorState';
import { Colors } from '@theme';

export const GlobalErrorHandler: React.FC = () => {
  const { globalError, clearGlobalError } = useUIStore();

  if (!globalError) {
    return null;
  }

  const getTitle = () => {
    switch (globalError.type) {
      case 'warning':
        return 'Heads up';
      case 'info':
        return 'Just so you know';
      default:
        return 'We hit a small bump';
    }
  };

  const handleRecovery = () => {
    if (globalError.recoveryAction) {
      globalError.recoveryAction();
    }
    clearGlobalError();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!globalError}
      statusBarTranslucent
    >
      <View
        style={styles.overlay}
        testID="global-error-handler"
      >
        <View style={styles.contentContainer}>
          <EmpathyErrorState
            title={getTitle()}
            message={globalError.message}
            type={globalError.type}
            details={__DEV__ ? globalError.error.message : undefined}
            recoveryAction={globalError.recoveryAction ? handleRecovery : clearGlobalError}
            recoveryLabel={globalError.recoveryAction ? 'Try Again' : 'Dismiss'}
            showSupportLink={globalError.type === 'error'}
            onContactSupport={() => {
              // TODO: Implement contact support
              console.log('Contact support');
            }}
            showProgressiveDisclosure={true}
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
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
});
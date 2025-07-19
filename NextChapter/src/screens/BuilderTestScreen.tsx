import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { withErrorBoundary } from '@components/common/withErrorBoundary';
import { BuilderTest } from '@components/test/BuilderTest';

const BuilderTestScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BuilderTest />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default withErrorBoundary(BuilderTestScreen);
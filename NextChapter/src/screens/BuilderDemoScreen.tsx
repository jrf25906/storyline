import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { withErrorBoundary } from '@components/common/withErrorBoundary';
import { BuilderContent } from '@components/common/BuilderContent';

const BuilderDemoScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Builder.io Demo</Text>
          <Text style={styles.subtitle}>
            This content is managed through Builder.io
          </Text>
        </View>

        {/* This will render content from Builder.io */}
        <BuilderContent 
          model="page" 
          urlPath="/home"
          fallback={
            <View style={styles.fallback}>
              <Text style={styles.fallbackTitle}>No content yet!</Text>
              <Text style={styles.fallbackText}>
                1. Open Builder.io Visual Editor{'\n'}
                2. Create a new page with URL path "/home"{'\n'}
                3. Add some content and publish{'\n'}
                4. Pull to refresh this screen
              </Text>
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  fallback: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 22,
  },
});

export default withErrorBoundary(BuilderDemoScreen);
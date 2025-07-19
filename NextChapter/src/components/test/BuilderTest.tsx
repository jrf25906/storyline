import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BuilderContent } from '@components/common/BuilderContent';
import { useBuilderContent } from '@hooks/useBuilderContent';

export const BuilderTest: React.FC = () => {
  const { content, isLoading, error, refetch } = useBuilderContent({
    model: 'page',
    urlPath: '/test'
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Builder.io Integration Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status:</Text>
        <Text style={styles.status}>
          {isLoading ? 'Loading...' : error ? `Error: ${error}` : 'Connected ✅'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content:</Text>
        <Text style={styles.content}>
          {content ? JSON.stringify(content, null, 2) : 'No content found'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={refetch}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Builder Component Test:</Text>
      <BuilderContent 
        model="page" 
        urlPath="/test"
        fallback={
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>
              No Builder.io content found for '/test' path.
              Create content in your Builder.io dashboard!
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    fontSize: 12,
    color: '#333',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  fallback: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  fallbackText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { BuilderComponent } from '@builder.io/sdk-react-native';
import { builderService } from '../../services/builderService';

interface BuilderContentProps {
  model: string;
  urlPath?: string;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export const BuilderContent: React.FC<BuilderContentProps> = ({
  model,
  urlPath = '/',
  fallback,
  loading
}) => {
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!builderService.isConfigured()) {
          setError('Builder.io is not properly configured');
          return;
        }
        
        const builderContent = await builderService.getContent(model, urlPath);
        setContent(builderContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [model, urlPath]);

  if (isLoading) {
    return loading || (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  if (error || !content) {
    return fallback || (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Content not found'}
        </Text>
      </View>
    );
  }

  return <BuilderComponent model={model} content={content} />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
});
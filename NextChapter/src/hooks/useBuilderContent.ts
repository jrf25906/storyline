import { useState, useEffect } from 'react';
import { builderService } from '@services/builderService';

interface UseBuilderContentOptions {
  model: string;
  urlPath?: string;
  enabled?: boolean;
}

interface UseBuilderContentReturn {
  content: any;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useBuilderContent = ({
  model,
  urlPath = '/',
  enabled = true
}: UseBuilderContentOptions): UseBuilderContentReturn => {
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    if (!enabled) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!builderService.isConfigured()) {
        throw new Error('Builder.io is not properly configured');
      }
      
      const builderContent = await builderService.getContent(model, urlPath);
      setContent(builderContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [model, urlPath, enabled]);

  return {
    content,
    isLoading,
    error,
    refetch: fetchContent
  };
};
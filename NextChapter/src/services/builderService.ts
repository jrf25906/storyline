import { builder } from '@builder.io/sdk-react-native';

// Initialize Builder.io with your API key
const BUILDER_API_KEY = process.env.EXPO_PUBLIC_BUILDER_API_KEY || 'YOUR_BUILDER_API_KEY';

export class BuilderService {
  private static instance: BuilderService;
  
  private constructor() {
    builder.init(BUILDER_API_KEY);
  }
  
  public static getInstance(): BuilderService {
    if (!BuilderService.instance) {
      BuilderService.instance = new BuilderService();
    }
    return BuilderService.instance;
  }
  
  /**
   * Get content from Builder.io by model name and URL path
   */
  async getContent(model: string, urlPath: string = '/') {
    try {
      const content = await builder.get(model, {
        url: urlPath,
        // Add any additional targeting options here
      }).promise();
      
      return content;
    } catch (error) {
      console.error(`Failed to fetch Builder.io content for model: ${model}`, error);
      return null;
    }
  }
  
  /**
   * Get page content specifically
   */
  async getPage(urlPath: string = '/') {
    return this.getContent('page', urlPath);
  }
  
  /**
   * Get component/section content
   */
  async getSection(name: string) {
    return this.getContent('section', `/${name}`);
  }
  
  /**
   * Check if Builder.io is properly configured
   */
  isConfigured(): boolean {
    return BUILDER_API_KEY !== 'YOUR_BUILDER_API_KEY' && BUILDER_API_KEY.length > 0;
  }
}

export const builderService = BuilderService.getInstance();
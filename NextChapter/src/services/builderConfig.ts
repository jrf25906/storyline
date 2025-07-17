import { builder } from '@builder.io/sdk-react-native';

// Your Builder.io public API key
export const BUILDER_API_KEY = 'bpk-1180d4cd172c47beaf9c49f09e39eebb';

// Initialize Builder.io
builder.init(BUILDER_API_KEY);

// Set up the preview URL for local development
if (__DEV__) {
  // This tells Builder.io where your app is running locally
  builder.setUserAttributes({
    urlPath: '/',
    device: 'mobile',
    locale: 'en-US',
  });
}

// Register all components
import '../builder/registerComponents';

export { builder };
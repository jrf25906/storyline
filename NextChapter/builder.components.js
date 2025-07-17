// Builder.io Component Registration
// This file tells Builder.io about your custom components

import { Builder } from '@builder.io/sdk-react-native';

// Register a simple test component first
Builder.registerComponent(
  ({ text = 'Hello from NextChapter!' }) => {
    return <div style={{ padding: 20, background: '#f0f0f0', borderRadius: 8 }}>
      <h2>{text}</h2>
    </div>;
  },
  {
    name: 'NextChapterTest',
    inputs: [{ name: 'text', type: 'string' }],
  }
);

// Export for Builder.io to find
if (typeof window !== 'undefined' && window.Builder) {
  console.log('Builder.io components registered!');
}
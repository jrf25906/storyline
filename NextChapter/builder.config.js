module.exports = {
  // Your Builder.io public API key
  apiKey: 'bpk-1180d4cd172c47beaf9c49f09e39eebb',
  
  // Models to sync with Builder.io
  models: {
    page: {
      name: 'page',
      kind: 'page',
      hideFromUI: false,
      allowHeatmap: true,
      showTargeting: true,
      showScheduling: true,
      showAbTests: true,
      fields: [
        {
          name: 'title',
          type: 'string',
          required: true,
          defaultValue: 'New Page',
        },
        {
          name: 'description',
          type: 'string',
          helperText: 'SEO description',
        },
      ],
    },
    section: {
      name: 'section',
      kind: 'component',
      hideFromUI: false,
      fields: [
        {
          name: 'title',
          type: 'string',
          required: true,
        },
      ],
    },
  },
  
  // Custom components directory
  componentsDir: './src/components',
  
  // Register components from these directories
  componentDirs: [
    './src/components/common',
    './src/components/app',
    './src/components/features',
  ],
  
  // Preview URL for local development
  previewUrl: 'http://localhost:8081',
  
  // Enable React Native mode
  reactNative: true,
  
  // Custom targeting attributes
  customTargetingAttributes: [
    {
      name: 'screenName',
      type: 'string',
      enum: ['home', 'bounceplan', 'coach', 'tracker', 'budget'],
    },
    {
      name: 'userType',
      type: 'string',
      enum: ['free', 'pro'],
    },
  ],
};
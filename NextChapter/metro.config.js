const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Define path aliases that match babel.config.js and tsconfig.json
const aliases = {
  '@': './src',
  '@components': './src/components',
  '@screens': './src/screens',
  '@services': './src/services',
  '@utils': './src/utils',
  '@hooks': './src/hooks',
  '@context': './src/context',
  '@types': './src/types',
  '@styles': './src/styles',
  '@navigation': './src/navigation',
  '@config': './src/config',
  '@stores': './src/stores',
  '@constants': './src/constants',
  '@test-utils': './src/test-utils',
  '@theme': './src/theme',
};

// Add custom resolver for path aliases
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'cjs'],
  resolveRequest: (context, moduleName, platform) => {
    // Check if this is an aliased import
    for (const [alias, aliasPath] of Object.entries(aliases)) {
      if (moduleName === alias || moduleName.startsWith(alias + '/')) {
        const resolvedPath = moduleName.replace(alias, aliasPath);
        const absolutePath = path.resolve(__dirname, resolvedPath);
        
        // Use Metro's default resolver with the resolved path
        return context.resolveRequest(context, absolutePath, platform);
      }
    }
    
    // Fall back to default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Ensure src directory is watched
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, 'src'),
];

module.exports = config;
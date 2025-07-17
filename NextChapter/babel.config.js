module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@context': './src/context',
            '@types': './src/types',
            '@styles': './src/styles',
            '@theme': './src/theme',
            '@navigation': './src/navigation',
            '@config': './src/config',
            '@stores': './src/stores',
            '@constants': './src/constants',
            '@test-utils': './src/test-utils'
          }
        }
      ],
      'react-native-reanimated/plugin',
      [
        '@babel/plugin-proposal-decorators',
        {
          legacy: true,
        },
      ],
    ],
  };
};
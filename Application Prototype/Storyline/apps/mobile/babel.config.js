module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);
  
  const isTest = process.env.NODE_ENV === 'test';
  
  if (isTest) {
    return {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' }
        }],
        '@babel/preset-typescript',
        '@babel/preset-react'
      ],
      plugins: [
        '@babel/plugin-transform-flow-strip-types',
        ['@babel/plugin-proposal-class-properties', { loose: true }],
        ['@babel/plugin-proposal-object-rest-spread', { loose: true }],
        ['@babel/plugin-transform-private-methods', { loose: true }]
      ]
    };
  }
  
  return {
    presets: ['babel-preset-expo'],
  };
};
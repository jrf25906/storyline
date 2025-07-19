module.exports = {
  extends: [
    '@react-native',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
    'react-native',
  ],
  rules: {
    // Import Rules - Enforce path aliases for consistency (warn during migration)
    'import/no-relative-parent-imports': 'warn',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
      },
    ],
    
    // TypeScript Rules - Progressive strictness during migration
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-as-const': 'error',
    
    // React Rules - Best practices
    'react/prop-types': 'off', // We use TypeScript
    'react/react-in-jsx-scope': 'off', // React 17+ doesn't need this
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // React Native specific
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off',
    
    // General Code Quality
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    
    // Error Handling - Critical for crisis intervention app
    'no-empty-pattern': 'error',
    'no-implicit-coercion': 'error',
    'no-throw-literal': 'error',
    
    // Add max-line-length rule
    'max-len': ['warn', { code: 120, ignoreComments: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
    
    // Accessibility - Required for inclusive design
    'jsx-a11y/accessible-emoji': 'error',
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/no-access-key': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    react: {
      version: 'detect',
    },
  },
  env: {
    'react-native/react-native': true,
    node: true,
    jest: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'android/',
    'ios/',
    '*.config.js',
    'metro.config.js',
  ],
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'import/no-relative-parent-imports': 'off',
      },
    },
    {
      files: ['e2e/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'import/no-relative-parent-imports': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  ],
};
const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const reactNative = require('@react-native/eslint-config');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      globals: {
        __DEV__: 'readonly',
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'import': importPlugin,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      
      // React specific rules
      'react/prop-types': 'off', // We use TypeScript for prop validation
      'react/display-name': 'off',
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Import rules - enforce path aliases
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['../src/*', '../../src/*', '../../../src/*'],
            message: 'Use path aliases (@/*) instead of relative imports to src/',
          },
          {
            group: ['../components/*', '../../components/*', '../../../components/*'],
            message: 'Use @components/* instead of relative imports to components/',
          },
          {
            group: ['../screens/*', '../../screens/*', '../../../screens/*'],
            message: 'Use @screens/* instead of relative imports to screens/',
          },
          {
            group: ['../services/*', '../../services/*', '../../../services/*'],
            message: 'Use @services/* instead of relative imports to services/',
          },
          {
            group: ['../stores/*', '../../stores/*', '../../../stores/*'],
            message: 'Use @stores/* instead of relative imports to stores/',
          },
          {
            group: ['../hooks/*', '../../hooks/*', '../../../hooks/*'],
            message: 'Use @hooks/* instead of relative imports to hooks/',
          },
          {
            group: ['../utils/*', '../../utils/*', '../../../utils/*'],
            message: 'Use @utils/* instead of relative imports to utils/',
          },
          {
            group: ['../context/*', '../../context/*', '../../../context/*'],
            message: 'Use @context/* instead of relative imports to context/',
          },
          {
            group: ['../theme/*', '../../theme/*', '../../../theme/*'],
            message: 'Use @theme/* instead of relative imports to theme/',
          },
          {
            group: ['../navigation/*', '../../navigation/*', '../../../navigation/*'],
            message: 'Use @navigation/* instead of relative imports to navigation/',
          },
          {
            group: ['../types/*', '../../types/*', '../../../types/*'],
            message: 'Use @types/* instead of relative imports to types/',
          },
        ],
      }],
      'import/order': ['error', {
        groups: [
          'builtin',   // Node.js built-in modules
          'external',  // npm packages
          'internal',  // Path aliases (@/*)
          ['parent', 'sibling', 'index'], // Relative imports
        ],
        'newlines-between': 'never',
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
      }],
      
      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off', // Using TypeScript's version
      'no-undef': 'off', // TypeScript handles this
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'max-len': ['error', { code: 100, ignoreComments: true, ignoreStrings: true }],
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      'coverage/**',
      '.expo/**',
      'dist/**',
      '**/*.config.js',
      'src/utils/documentation/**',
    ],
  },
];
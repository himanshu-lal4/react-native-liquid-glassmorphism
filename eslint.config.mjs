// eslint.config.mjs - ESLint v9+ flat config for react-native-tour-guide

import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import jestPlugin from 'eslint-plugin-jest';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/', 'lib/', 'example/'],
  },

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.es2021,
        ...globals.browser,
        __DEV__: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      react: reactPlugin,
      'react-native': reactNativePlugin,
      import: importPlugin,
      prettier: prettierPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // ---------------------------------------------------------
      // REACT NATIVE - Library-appropriate rules
      // ---------------------------------------------------------
      // Note: no-inline-styles, no-color-literals, no-raw-text are OFF
      // because this is a library — components need inline styles and defaults
      'react-native/no-unused-styles': 'error',

      // ---------------------------------------------------------
      // REACT - Component Best Practices
      // ---------------------------------------------------------
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-unescaped-entities': 'error',
      'react/jsx-uses-react': 'warn',

      // React - prevent real bugs
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-unstable-nested-components': 'error',
      'react/jsx-no-constructed-context-values': 'error',

      // React - prevent leaked renders
      'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary', 'coerce'] }],

      // React - clean components
      'react/self-closing-comp': 'error',
      'react/jsx-fragments': ['error', 'syntax'],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-no-bind': [
        'error',
        {
          allowArrowFunctions: true,
          allowBind: false,
          allowFunctions: false,
          ignoreDOMComponents: true,
        },
      ],
      'react/no-danger': 'error',
      'react/no-deprecated': 'error',
      'react/no-string-refs': 'error',
      'react/no-this-in-sfc': 'error',
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
      'react/jsx-pascal-case': 'error',
      'react/hook-use-state': 'warn',
      'react/display-name': 'warn',
      'react/no-object-type-as-default-prop': 'error',

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ---------------------------------------------------------
      // TYPESCRIPT - Type Safety
      // ---------------------------------------------------------
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-shadow': 'error',
      'no-implicit-coercion': 'error',

      // ---------------------------------------------------------
      // IMPORTS - Clean Dependencies
      // ---------------------------------------------------------
      'import/no-unresolved': 'off',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      'import/no-duplicates': 'error',

      // ---------------------------------------------------------
      // FORMATTING - Prettier
      // ---------------------------------------------------------
      'prettier/prettier': [
        'warn',
        {
          arrowParens: 'always',
          bracketSpacing: true,
          bracketSameLine: false,
          jsxSingleQuote: false,
          quoteProps: 'as-needed',
          singleQuote: true,
          semi: true,
          printWidth: 100,
          useTabs: false,
          tabWidth: 2,
          trailingComma: 'es5',
        },
      ],

      // ---------------------------------------------------------
      // SOLID / CLEAN CODE
      // ---------------------------------------------------------
      complexity: ['warn', { max: 15 }],
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', { max: 4 }],
      'max-params': ['warn', { max: 4 }],

      'no-duplicate-case': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-nested-ternary': 'error',
      'no-else-return': 'error',

      curly: ['error', 'multi-line'],
      'default-case': 'error',
      'no-fallthrough': 'error',
      'no-return-assign': 'error',
      'no-sequences': 'error',

      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSTypeReference[typeName.name="Function"]',
          message:
            'Do not use Function as a type. Specify the exact signature: (args: Type) => ReturnType.',
        },
        {
          selector: 'TSTypeReference[typeName.name="Object"]',
          message:
            'Do not use Object as a type. Use Record<string, unknown> or a specific interface.',
        },
        {
          selector: 'TSTypeReference[typeName.name="String"]',
          message: 'Use string (lowercase) instead of String (the wrapper object).',
        },
        {
          selector: 'TSTypeReference[typeName.name="Number"]',
          message: 'Use number (lowercase) instead of Number (the wrapper object).',
        },
        {
          selector: 'TSTypeReference[typeName.name="Boolean"]',
          message: 'Use boolean (lowercase) instead of Boolean (the wrapper object).',
        },
      ],

      // General clean code
      'no-shadow': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-return-await': 'error',
      'prefer-template': 'error',
      'no-useless-concat': 'error',
      'no-lonely-if': 'error',
      'no-unneeded-ternary': 'error',
      'prefer-destructuring': [
        'warn',
        {
          object: true,
          array: false,
        },
      ],
      'object-shorthand': ['error', 'always'],
      'prefer-spread': 'error',
      'prefer-rest-params': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-extend-native': 'error',
      'no-iterator': 'error',
      'no-label-var': 'error',
      'no-multi-assign': 'error',
      'no-new-wrappers': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-await-in-loop': 'error',
    },
  },

  // ---------------------------------------------------------
  // TEST FILES — Jest & Testing Library rules
  // ---------------------------------------------------------
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/test-utils/**/*.{ts,tsx}',
      'src/__mocks__/**/*.js',
    ],
    plugins: {
      jest: jestPlugin,
      'testing-library': testingLibraryPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // Relax source-code rules for tests
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines-per-function': 'off',
      complexity: 'off',
      'max-depth': 'off',
      'no-restricted-syntax': 'off',
      'no-console': 'off',

      // Jest
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/no-conditional-expect': 'error',
      'jest/no-standalone-expect': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/prefer-to-be': 'warn',
      'jest/valid-expect': 'error',
      'jest/valid-title': 'error',
      'jest/no-alias-methods': 'warn',
      'jest/expect-expect': ['error', { assertFunctionNames: ['expect'] }],
      'jest/no-duplicate-hooks': 'error',
      'jest/no-export': 'error',
      'jest/no-mocks-import': 'error',
      'jest/prefer-spy-on': 'warn',
      'jest/prefer-strict-equal': 'warn',
      'jest/no-test-return-statement': 'error',

      // Testing Library
      'testing-library/await-async-queries': 'error',
      'testing-library/no-await-sync-queries': 'error',
      'testing-library/no-debugging-utils': 'warn',
      'testing-library/no-dom-import': ['error', 'react-native'],
      'testing-library/prefer-screen-queries': 'warn',
      'testing-library/prefer-find-by': 'warn',
      'testing-library/no-container': 'error',
      'testing-library/no-node-access': 'warn',
      'testing-library/prefer-presence-queries': 'warn',
      'testing-library/no-wait-for-multiple-assertions': 'warn',
      'testing-library/no-wait-for-side-effects': 'error',
      'testing-library/no-unnecessary-act': 'warn',
      'testing-library/prefer-explicit-assert': 'warn',
      'testing-library/render-result-naming-convention': 'warn',
    },
  },
];

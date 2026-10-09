// @ts-check

const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      'documentation/**',
      'playwright-report/**',
      'test-results/**',
      'validation-artifacts/**',
      'coverage/**',
      '.angular/**',
      'node_modules/**',
    ],
  },

  {
    files: ['**/*.ts'],

    extends: [
      eslint.configs.recommended,

      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,

      angular.configs.tsRecommended,
    ],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },

    processor: angular.processInlineTemplates,

    rules: {
      /*
       * Angular
       */

      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],

      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],

      '@angular-eslint/prefer-standalone': 'error',

      /*
       * TypeScript
       */

      '@typescript-eslint/no-explicit-any': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      /*
       * JavaScript / general
       */

      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },

  {
    files: ['**/*.html'],

    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],

    rules: {
      '@angular-eslint/template/eqeqeq': 'error',
    },
  },
]);

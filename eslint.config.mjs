import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import airbnbBase from 'eslint-config-airbnb-base';
import importPlugin from 'eslint-plugin-import';
import airbnbTs from 'eslint-config-airbnb-typescript';
import stylistic from '@stylistic/eslint-plugin';

/**
 * ESLint 9 flat configuration.
 *
 * It keeps the type-safety rules that matter for a library and the line-length limit,
 * but intentionally does not enforce a formatter-style rule set (the existing code follows
 * the historical AirBnB style). See the sibling repositories for the same approach.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [
  {
    ignores: [
      'build/*',
      'node_modules/*',
      'coverage/*',
    ],
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      'airbnb': airbnbBase,
      'airbnb-typescript': airbnbTs,
      '@typescript-eslint': tseslint,
      'import': importPlugin,
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/max-len': ['error', { code: 120 }],
      'no-continue': 'error',
      'import/prefer-default-export': 'off',
      'import/no-absolute-path': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
        },
        {
          selector: 'LabeledStatement',
          message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
        },
        {
          selector: 'WithStatement',
          message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
        },
      ],
      // Forbid @ts-ignore statements
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      // Allow explicit any where the existing public API requires it
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow defining using functions before their declaration
      '@typescript-eslint/no-use-before-define': ['error', {
        functions: false,
      }],
    },
  },
];

// @ts-check

import { sxzz } from '@sxzz/eslint-config'

export default sxzz({
  vue: true,
  astro: true,
  prettier: false,
  baseline: {
    ignoreFeatures: ['top-level-await'],
  },
})
  .append({
    files: ['**/*.md/**', '**/*.md'],
    rules: {
      'yml/no-empty-document': 'off',
    },
  })
  .append({
    files: ['src/scripts/**'],
    rules: {
      'no-console': 'error',
    },
  })
  .append({
    files: ['src/content/**'],
    /// keep-sorted
    rules: {
      '@typescript-eslint/method-signature-style': 'off',
      'perfectionist/sort-imports': 'off',
      'prefer-template': 'off',
      'unicorn/no-new-array': 'off',
      'unicorn/prefer-code-point': 'off',
      'unicorn/prefer-number-properties': 'off',
      'unicorn/prefer-string-raw': 'off',
      'vue/valid-define-emits': 'off',
    },
  })

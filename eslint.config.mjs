import antfu from '@antfu/eslint-config'

export default antfu(
  {},
  {
    ignores: [
      'dist',
      'node_modules',
      '.astro',
      '.output',
      '.nuxt',
      'src/content/posts',
      'data',
    ],
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
    },
  },
  {
    files: [
      '*.d.ts',
    ],
    rules: {
      'unused-imports/no-unused-vars': 'off',
      'eslint-comments/no-unlimited-disable': 'off',
    },
  },
)

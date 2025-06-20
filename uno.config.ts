import { defineUsefulConfig } from 'unocss-preset-useful'

export default defineUsefulConfig(
  {
    typography: true,
    icons: {
      scale: 1.2,
      extraProperties: {
        display: 'inline-block',
        verticalAlign: 'middle',
      },
    },
  },
  {
    shortcuts: {
      'btn': 'py-2 px-4 font-semibold rounded-lg shadow-md',
      'btn-primary': 'bg-indigo-500 text-white border-none hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-800',
    },
    theme: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e0fd',
          300: '#b9c8fb',
          400: '#99abf7',
          500: '#738bf2',
          600: '#5c6ee8',
          700: '#4a5bd3',
          800: '#3e4db0',
          900: '#37438d',
          950: '#232852',
        },
      },
    },
  },
)

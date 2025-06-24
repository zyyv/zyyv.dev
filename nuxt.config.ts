import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devServer: {
    port: 4321,
  },

  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxt/image',
  ],

  experimental: {
    viewTransition: true,
    renderJsonPayloads: true,
  },

  css: [
    '~/styles/vars.css',
    '~/styles/fonts.css',
    '~/styles/prose.css',
    '~/styles/main.css',
  ],

  vite: {
    define: {
      'import.meta.env.__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
      '__DEV__': process.env.NODE_ENV !== 'production',
    },
    build: {
      target: 'esnext',
    },
  },

  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-09-05',
})

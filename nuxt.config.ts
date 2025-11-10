import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devServer: {
    port: 4321,
  },

  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxt/image',
    '@nuxt/content',
  ],

  nitro: {
    routeRules: {
      // 静态资源缓存配置
      '/images/**': { headers: { 'cache-control': 'max-age=31536000' } },
      '/photos/**': { headers: { 'cache-control': 'max-age=31536000' } },
      '/logos/**': { headers: { 'cache-control': 'max-age=31536000' } },
      '/avatar.png': { headers: { 'cache-control': 'max-age=31536000' } },
      '/og.png': { headers: { 'cache-control': 'max-age=31536000' } },
      // 其他静态资源
      '/**/*.{png,jpg,jpeg,gif,webp,svg,ico}': { headers: { 'cache-control': 'max-age=31536000' } },
    },
  },

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

import { execSync } from 'node:child_process'

function getBuildCommit() {
  const deploymentCommit =
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.COMMIT_SHA

  if (deploymentCommit) return deploymentCommit

  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'local'
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2026-07-10',

  modules: ['@nuxt/content', '@unocss/nuxt', '@vueuse/nuxt'],

  experimental: {
    viewTransition: true,
  },

  runtimeConfig: {
    adminPassword: process.env.NUXT_ADMIN_PASSWORD || '',
    sessionSecret: process.env.NUXT_SESSION_SECRET || '',

    public: {
      buildCommit: getBuildCommit(),
    },
  },

  css: ['~/styles/vars.css', '~/styles/fonts.css', '~/styles/prose.css', '~/styles/main.css'],

  devServer: {
    port: 4321,
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'vitesse-light',
            dark: 'vitesse-dark',
          },
        },
        toc: {
          depth: 3,
          searchDepth: 3,
        },
      },
    },
  },

  nitro: {
    routeRules: {
      '/admin/**': { ssr: false },
    },
    prerender: {
      crawlLinks: true,
      routes: ['/', '/posts', '/photos', '/projects'],
    },
  },

  vite: {
    optimizeDeps: {
      include: ['exifr'],
    },
    build: {
      target: 'esnext',
    },
    define: {
      'import.meta.env.__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    },
  },

  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0',
        },
        { name: 'author', content: 'Chris' },
        { name: 'keywords', content: 'Chris, Blog, Portfolio' },
        { name: 'theme-color', content: '#f5f5f5' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@chris_zyyv' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/avatar.png' }],
      script: [
        {
          innerHTML:
            "const mode=localStorage.getItem('vueuse-color-scheme')||'auto';const dark=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',mode==='dark'||(mode==='auto'&&dark));",
        },
      ],
    },
  },
})

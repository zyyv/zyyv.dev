import { fileURLToPath } from 'node:url'
import netlify from '@astrojs/netlify'
import vue from '@astrojs/vue'
import { defineConfig } from 'astro/config'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [vue()],
  server: {
    port: 4321,
  },
  vite: {
    plugins: [
      UnoCSS() as any,
      AutoImport({
        imports: [
          'vue',
          '@vueuse/core',
        ],
        dirs: [
          './app/composables',
        ],
        vueTemplate: true,
      }),
      Components({
        dirs: ['./app/components'],
        extensions: ['vue'],
        deep: true,
        directoryAsNamespace: true,
        collapseSamePrefixes: true,
        dts: true,
      }),
    ],
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./app', import.meta.url)),
      },
    },
    define: {
      'import.meta.env.__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
      '__DEV__': JSON.stringify(process.env.NODE_ENV !== 'production'),
    },
    build: {
      target: 'esnext',
    },
  },
})

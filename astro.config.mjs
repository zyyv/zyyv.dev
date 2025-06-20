import vue from '@astrojs/vue'
import UnoCSS from '@unocss/astro'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://zyyv.dev',
  compressHTML: true,
  output: 'static',
  integrations: [
    UnoCSS(),
    vue(),
  ],
})

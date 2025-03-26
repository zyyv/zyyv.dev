import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import UnoCSS from '@unocss/astro';

export default defineConfig({
  site: 'https://zyyv.dev',
  compressHTML: true,
  output: 'static',
  integrations: [
    UnoCSS(),
    vue(),
  ],
});

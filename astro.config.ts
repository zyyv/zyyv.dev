import sitemap from "@astrojs/sitemap";
import UnoCSS from "@unocss/astro";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import remarkGithubBlockquoteAlert from "remark-github-blockquote-alert";

// https://astro.build/config
export default defineConfig({
  site: "https://zyyv.dev",
  output: "static",
  prefetch: true,
  integrations: [UnoCSS(), sitemap()],
  markdown: {
    remarkPlugins: [remarkGithubBlockquoteAlert],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["noopener", "noreferrer"],
        },
      ],
    ],
    shikiConfig: {
      themes: {
        light: "vitesse-light",
        dark: "vitesse-dark",
      },
      defaultColor: false,
    },
  },
  devToolbar: {
    enabled: false,
  },
});

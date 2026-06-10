import { symbols } from "@unocss/core";
import { defineConfig, presetIcons, presetTypography, presetWebFonts, presetWind4 } from "unocss";
import type { Theme } from "@unocss/preset-wind4";
import { FileSystemIconLoader } from "@iconify/utils/lib/loader/node-loaders";

export default defineConfig<Theme>({
  presets: [
    presetWind4(),
    presetIcons({
      extraProperties: {
        display: "inline-block",
        height: "1em",
        width: "1em",
        "vertical-align": "text-bottom",
      },
      collections: {
        custom: FileSystemIconLoader("./src/assets/icons"),
      },
    }),
    presetWebFonts(),
    presetTypography({
      colorScheme: {
        body: ["#3f3f46", "#d6d3d1"],
        headings: ["#18181b", "#fafaf9"],
        lead: ["#52525b", "#a8a29e"],
        links: ["#0f766e", "#d66b72"],
        bold: ["#27272a", "#f5f5f4"],
        counters: ["#71717a", "#a8a29e"],
        bullets: ["#a1a1aa", "#78716c"],
        hr: ["#d4d4d8", "#44403c"],
        quotes: ["#27272a", "#e7e5e4"],
        "quote-borders": ["#14b8a6", "#b16ff2"],
        captions: ["#71717a", "#a8a29e"],
        kbd: ["#27272a", "#fafaf9"],
        "kbd-shadows": ["#18181b", "#000000"],
        code: ["#1c6b48", "#4d9375"],
        "pre-code": ["#393a34", "#dbd7caee"],
        "pre-bg": ["#ffffff", "#121212"],
        "th-borders": ["#d4d4d8", "#57534e"],
        "td-borders": ["#e4e4e7", "#44403c"],
      },
    }),
  ],
  rules: [
    // 隐藏滚动条
    [
      "scroll-none",
      [
        {
          "scrollbar-width": "unset",
          "-ms-overflow-style": "none",
        },
        {
          [symbols.selector]: (s: string) => `${s}::-webkit-scrollbar`,
          display: "none",
        } as any,
      ],
    ],
  ],
  shortcuts: [["bg-basecolor", "bg-light-300 dark:bg-dark-800"]],
  theme: {
    font: {
      dank: "dank",
      dm: "DM Sans",
    },
  },
});

import { defineConfig, presetIcons, presetTypography, presetWebFonts, presetWind4 } from "unocss";

export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons(),
    presetWebFonts({
      fonts: {
        sans: "Outfit:300,400,500,600",
        serif: [
          { name: "Newsreader", weights: [400, 500, 600, 700] },
          { name: "Noto Serif SC", weights: [400, 500, 600, 700] },
        ],
        mono: "JetBrains Mono:400",
      },
    }),
    presetTypography({
      colorScheme: {
        body: ["#3f3f46", "#d6d3d1"],
        headings: ["#18181b", "#fafaf9"],
        lead: ["#52525b", "#a8a29e"],
        links: ["#0f766e", "#5eead4"],
        bold: ["#27272a", "#f5f5f4"],
        counters: ["#71717a", "#a8a29e"],
        bullets: ["#a1a1aa", "#78716c"],
        hr: ["#d4d4d8", "#44403c"],
        quotes: ["#27272a", "#e7e5e4"],
        "quote-borders": ["#14b8a6", "#2dd4bf"],
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
  shortcuts: [["bg-basecolor", "bg-light-300 dark:bg-dark-800"]],
});

/* @unocss-include */
import type { Lang } from "../i18n/utils";

type Localized<T> = Record<Lang, T>;
export type LocalizedString = string | Localized<string>;

interface AuthorSchema {
  "@type": "Person";
  name: string;
  url: string;
  alternateName?: string;
  sameAs?: readonly string[];
}

export const siteMeta = {
  domain: "zyyv.dev",
  url: "https://zyyv.dev",
} as const;

export const siteCopy = {
  author: {
    canonicalName: "Chris",
    alternateName: "Chris",
    displayName: {
      en: "Chris",
      zh: "Chris",
    },
    tag: {
      en: ["Developer"],
      zh: ["开发者"],
    },
    bio: {
      en: "Regardless of the past, do not ask the future.",
      zh: "无论过去，不问将来。",
    },
    titleRole: {
      en: "Developer",
      zh: "开发者",
    },
    sameAs: {
      en: [
        "https://github.com/zyyv",
        "https://x.com/chris_zyyv",
        "https://bsky.app/profile/zyyv.dev",
      ],
      zh: [
        "https://github.com/zyyv",
        "https://x.com/chris_zyyv",
        "https://bsky.app/profile/zyyv.dev",
      ],
    },
  },
  rss: {
    en: {
      title: "Chris",
      description: "Blog posts by Chris.",
    },
    zh: {
      title: "Chris",
      description: "Chris 的博客文章。",
    },
  },
} as const satisfies {
  author: {
    canonicalName: string;
    alternateName: string;
    displayName: Localized<string>;
    tag: Localized<string[]>;
    bio: Localized<string>;
    titleRole: Localized<string>;
    sameAs: Localized<readonly string[]>;
  };
  rss: Localized<{ title: string; description: string }>;
};

export function getAuthorSchema(
  lang: Lang,
  options: { includeAlternate?: boolean; includeSameAs?: boolean } = {},
): AuthorSchema {
  const includeAlternate = options.includeAlternate ?? false;
  const schema: AuthorSchema = {
    "@type": "Person",
    name: siteCopy.author.canonicalName,
    url: siteMeta.url,
    ...(includeAlternate && { alternateName: siteCopy.author.alternateName }),
    ...(options.includeSameAs && { sameAs: siteCopy.author.sameAs[lang] }),
  };
  return schema;
}

interface Link {
  name: string;
  href: string;
  icon: string;
}

export interface Friend {
  name: LocalizedString;
  bio: LocalizedString;
  avatar: LocalizedString;
  href: LocalizedString;
}

interface HomeLinks {
  creator: Link[];
  team: Link[];
  contributor: Link[];
  social: Link[];
}

export const homeLinks: Readonly<HomeLinks> = {
  team: [
    {
      name: "UnoCSS",
      href: "https://unocss.dev",
      icon: "i-catppuccin:unocss",
    },
    {
      name: "Elk",
      href: "https://elk.zone",
      icon: "i-custom:elk",
    },
  ],
  creator: [
    {
      name: "Onu-UI",
      href: "https://onu.zyyv.dev",
      icon: "i-custom:onu",
    },
    {
      name: "UnoCSS Community",
      href: "https://github.com/unocss-community",
      icon: "i-custom:unocss-community",
    },
  ],
  contributor: [
    {
      name: "Vite",
      href: "https://vitejs.dev",
      icon: "i-catppuccin:vite",
    },
    {
      name: "Vue",
      href: "https://vuejs.org",
      icon: "i-catppuccin:vue",
    },
    {
      name: "Nuxt",
      href: "https://nuxtjs.org",
      icon: "i-catppuccin:nuxt",
    },
  ],
  social: [
    {
      icon: "i-hugeicons:github",
      href: "https://github.com/zyyv",
      name: "GitHub",
    },
    {
      icon: "i-hugeicons:bluesky",
      href: "https://bsky.app/profile/zyyv.dev",
      name: "Bluesky",
    },
    {
      icon: "i-hugeicons:new-twitter",
      href: "https://x.com/chris_zyyv",
      name: "X",
    },
    {
      icon: "i-ri:bilibili-line",
      href: "https://space.bilibili.com/402454160",
      name: "Bilibili",
    },
  ],
};

export const friends: Friend[] = [
  // TODO: Add your friends here
];

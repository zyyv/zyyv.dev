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
  domain: "chris.me",
  url: "https://chris.me",
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
        "https://github.com/chris-me",
        "https://x.com/chris_me",
        "https://bsky.app/profile/chris.me",
      ],
      zh: [
        "https://github.com/chris-me",
        "https://x.com/chris_me",
        "https://bsky.app/profile/chris.me",
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
}

export const homeLinks: HomeLinks = {
  creator: [
    // TODO: Add your projects here
  ],
  team: [
    // TODO: Add team projects here
  ],
};

export const friends: Friend[] = [
  // TODO: Add your friends here
];

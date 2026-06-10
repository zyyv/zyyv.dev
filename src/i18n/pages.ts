import { siteCopy, siteMeta } from "../data/site";
import { defaultLang } from "./ui";
import { getUrlPrefix, type Lang } from "./utils.ts";
import type { RSSOptions } from "@astrojs/rss";

interface HomeCopy {
  title: string;
  description: string;
  name: string;
  avatar: {
    avif: string;
    fallback: string;
  };
  tag: string[];
  bio: string;
  bioCharDelay?: number;
  nameSerif: boolean;
  schema: {
    name: string;
    url: string;
  };
}

interface AboutCopy {
  title: string;
  description: string;
  heading: string;
  paragraphs: string[];
}

interface LinksCopy {
  title: string;
  description: string;
  heading: string;
  subheading: string;
}

interface PostsCopy {
  title: string;
  description: string;
  heading: string;
}

interface PostCopy {
  backLabel: string;
  titleSuffix: string;
}

interface PageCopy {
  home: Record<Lang, HomeCopy>;
  about: Record<Lang, AboutCopy>;
  links: Record<Lang, LinksCopy>;
  posts: Record<Lang, PostsCopy>;
  post: Record<Lang, PostCopy>;
}

const authorName = siteCopy.author.displayName;
const authorTagline = siteCopy.author.bio;
const authorTitleRole = siteCopy.author.titleRole;

export const pageCopy: PageCopy = {
  home: {
    en: {
      title: `${authorName.en} - ${authorTitleRole.en}`,
      description: `${authorName.en}'s personal blog and portfolio.`,
      name: authorName.en,
      avatar: {
        avif: "/avatar.avif",
        fallback: "/avatar.jpg",
      },
      tag: siteCopy.author.tag.en,
      bio: authorTagline.en,
      nameSerif: false,
      schema: {
        name: authorName.en,
        url: `${siteMeta.url}${getUrlPrefix("en")}`,
      },
    },
    zh: {
      title: `${authorName.zh} - ${authorTitleRole.zh}`,
      description: `${authorName.zh} 的个人博客与作品集。`,
      name: authorName.zh,
      avatar: {
        avif: "/avatar.avif",
        fallback: "/avatar.jpg",
      },
      tag: siteCopy.author.tag.zh,
      bio: authorTagline.zh,
      bioCharDelay: 160,
      nameSerif: false,
      schema: {
        name: authorName.zh,
        url: `${siteMeta.url}${getUrlPrefix("zh")}`,
      },
    },
  },
  about: {
    en: {
      title: `About - ${authorName.en}`,
      description: `About ${authorName.en}.`,
      heading: "About",
      paragraphs: [
        `Hi, I'm ${authorName.en}. A developer and open-source enthusiast.`,
        "This is my personal blog and portfolio.",
      ],
    },
    zh: {
      title: `关于 - ${authorName.zh}`,
      description: `关于 ${authorName.zh}。`,
      heading: "关于",
      paragraphs: [
        `你好，我是 ${authorName.zh}，一名开发者和开源爱好者。`,
        "这是我的个人博客与作品集。",
      ],
    },
  },
  links: {
    en: {
      title: `Links - ${authorName.en}`,
      description: `Friends and links from ${authorName.en}.`,
      heading: "Links",
      subheading: "Friends across the internet.",
    },
    zh: {
      title: `友链 - ${authorName.zh}`,
      description: `${authorName.zh} 的朋友与链接。`,
      heading: "友链",
      subheading: "互联网的朋友们。",
    },
  },
  posts: {
    en: {
      title: `Posts - ${authorName.en}`,
      description: `Blog posts by ${authorName.en}.`,
      heading: "Posts",
    },
    zh: {
      title: `文章 - ${authorName.zh}`,
      description: `${authorName.zh} 的博客文章。`,
      heading: "文章",
    },
  },
  post: {
    en: {
      backLabel: "Back to posts",
      titleSuffix: authorName.en,
    },
    zh: {
      backLabel: "返回文章列表",
      titleSuffix: authorName.zh,
    },
  },
};

export function getPageCopy<K extends keyof typeof pageCopy>(
  key: K,
  lang: Lang,
): (typeof pageCopy)[K][typeof defaultLang] {
  return (pageCopy[key][lang] ??
    pageCopy[key][defaultLang]) as (typeof pageCopy)[K][typeof defaultLang];
}

export function getRssOptions(
  lang: Lang,
  site: URL,
): Pick<RSSOptions, "title" | "description" | "site" | "xmlns" | "customData"> {
  const rssCopy = siteCopy.rss[lang];
  const prefix = getUrlPrefix(lang);
  const { avatar } = getPageCopy("home", lang);
  return {
    title: rssCopy.title,
    description: rssCopy.description,
    site,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: [
      `<language>${lang}</language>`,
      `<atom:link href="${siteMeta.url}${prefix}/rss.xml" rel="self" type="application/rss+xml"/>`,
      `<image>`,
      `  <url>${siteMeta.url}${avatar.fallback}</url>`,
      `  <title>${rssCopy.title}</title>`,
      `  <link>${siteMeta.url}${prefix}</link>`,
      `</image>`,
    ].join("\n"),
  };
}

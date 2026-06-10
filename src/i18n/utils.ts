import { defaultLang, localeByLang, showDefaultLang, ui } from './ui.ts'

export type Lang = keyof typeof ui

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/')
  if (lang in ui) return lang as Lang
  return defaultLang
}

export function useTranslations(lang: Lang) {
  return function t(
    key: keyof (typeof ui)[typeof defaultLang],
  ) {
    return ui[lang][key] ?? ui[defaultLang][key]
  }
}

export function useTranslatedPath(lang: Lang) {
  return function translatePath(path: string, l: Lang = lang) {
    if (path === '/') {
      if (!showDefaultLang && l === defaultLang) return '/'
      return `/${l}`
    }
    if (!showDefaultLang && l === defaultLang) return path
    return `/${l}${path}`
  }
}

export function getLocaleFromLang(lang: Lang) {
  return localeByLang[lang] ?? localeByLang[defaultLang]
}

export function getUrlPrefix(lang: Lang): string {
  return !showDefaultLang && lang === defaultLang ? '' : `/${lang}`
}

export function getAllLangPrefixes(): string[] {
  return (Object.keys(ui) as Lang[]).map((lang) => getUrlPrefix(lang))
}

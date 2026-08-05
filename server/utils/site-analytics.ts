interface UserAgentSummary {
  browser: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  operatingSystem: string
}

const SEARCH_HOSTS = [
  'baidu.com',
  'bing.com',
  'duckduckgo.com',
  'google.com',
  'google.com.hk',
  'sogou.com',
  'yahoo.com',
]

const SOCIAL_HOSTS = [
  'bilibili.com',
  'bsky.app',
  'facebook.com',
  'github.com',
  'instagram.com',
  'linkedin.com',
  'reddit.com',
  't.co',
  'twitter.com',
  'weibo.com',
  'x.com',
  'zhihu.com',
]

function includesHost(host: string, candidates: string[]) {
  return candidates.some((candidate) => host === candidate || host.endsWith(`.${candidate}`))
}

export function classifyTrafficSource(options: {
  hostname: string
  referrerHost: string | null
  hasCampaign: boolean
}) {
  if (options.hasCampaign) return 'campaign'
  if (!options.referrerHost) return 'direct'
  if (includesHost(options.referrerHost, [options.hostname])) return 'internal'
  if (includesHost(options.referrerHost, SEARCH_HOSTS)) return 'search'
  if (includesHost(options.referrerHost, SOCIAL_HOSTS)) return 'social'
  return 'referral'
}

export function parseUserAgent(userAgent: string): UserAgentSummary {
  const deviceType = /iPad|Tablet|PlayBook|Silk/i.test(userAgent)
    ? 'tablet'
    : /Mobi|Android|iPhone|iPod/i.test(userAgent)
      ? 'mobile'
      : 'desktop'

  const operatingSystem = /Windows NT/i.test(userAgent)
    ? 'Windows'
    : /Android/i.test(userAgent)
      ? 'Android'
      : /iPhone|iPad|iPod/i.test(userAgent)
        ? 'iOS'
        : /Mac OS X|Macintosh/i.test(userAgent)
          ? 'macOS'
          : /CrOS/i.test(userAgent)
            ? 'ChromeOS'
            : /Linux/i.test(userAgent)
              ? 'Linux'
              : 'Other'

  const browser = /EdgA|EdgiOS|Edg\//i.test(userAgent)
    ? 'Edge'
    : /OPR\//i.test(userAgent)
      ? 'Opera'
      : /Firefox\/|FxiOS/i.test(userAgent)
        ? 'Firefox'
        : /CriOS|Chrome\//i.test(userAgent)
          ? 'Chrome'
          : /Safari\//i.test(userAgent)
            ? 'Safari'
            : 'Other'

  return { browser, deviceType, operatingSystem }
}

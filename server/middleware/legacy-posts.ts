const legacyPostRedirects = new Map([
  ['/posts/unocss@0.65.0 upgrade guide', '/posts/unocss@0.65.0-upgrade-guide'],
  ['/posts/unocss@0.65.0 upgrade guide.zh-cn', '/posts/unocss@0.65.0-upgrade-guide.zh-cn'],
])

export default defineEventHandler((event) => {
  const encodedPath = getRequestURL(event).pathname
  let path = encodedPath

  try {
    path = decodeURIComponent(encodedPath)
  } catch {
    // Leave malformed paths untouched and let Nuxt return its normal response.
  }

  const redirect = legacyPostRedirects.get(path)
  if (redirect) return sendRedirect(event, redirect, 301)
})

export function initToc() {
  const toc = document.querySelector<HTMLElement>('#toc')

  if (!toc) return
  if (toc.dataset.tocInitialized === 'true') return
  toc.dataset.tocInitialized = 'true'

  const links = toc.querySelectorAll<HTMLAnchorElement>('.toc-link')
  const headingElements: HTMLElement[] = []

  links.forEach((link) => {
    link.dataset.active = 'false'
    link.removeAttribute('aria-current')
    const slug = link.dataset.headingSlug
    if (slug) {
      const heading = document.querySelector<HTMLElement>(
        `#${CSS.escape(slug)}`,
      )
      if (heading) headingElements.push(heading)
    }
  })

  const slugs = new Set(
    Array.from(links)
      .map((link) => link.dataset.headingSlug)
      .filter(Boolean) as string[],
  )

  const prefersReducedMotion = globalThis.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  let currentActiveSlug = ''

  const scrollActiveIntoView = (
    activeLink: HTMLAnchorElement,
    behavior: ScrollBehavior,
  ) => {
    const visibleTop = toc.scrollTop
    const visibleBottom = visibleTop + toc.clientHeight
    const linkTop = activeLink.offsetTop
    const linkBottom = linkTop + activeLink.offsetHeight
    const edgePadding = 10
    const isVisible = linkTop >= visibleTop + edgePadding
      && linkBottom <= visibleBottom - edgePadding
    if (isVisible) return

    const targetTop = linkTop - toc.clientHeight / 2
      + activeLink.offsetHeight / 2
    toc.scrollTo({
      top: Math.max(0, targetTop),
      behavior: prefersReducedMotion ? 'auto' : behavior,
    })
  }

  const setActive = (slug: string, behavior: ScrollBehavior = 'smooth') => {
    if (!slugs.has(slug) || currentActiveSlug === slug) return
    currentActiveSlug = slug

    let activeLink: HTMLAnchorElement | null = null
    links.forEach((link) => {
      const isActive = link.dataset.headingSlug === slug
      link.dataset.active = isActive ? 'true' : 'false'
      if (isActive) {
        link.setAttribute('aria-current', 'true')
        activeLink = link
      } else {
        link.removeAttribute('aria-current')
      }
    })

    if (activeLink) {
      scrollActiveIntoView(activeLink, behavior)
    }
  }

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const slug = link.dataset.headingSlug
      if (slug) setActive(slug, 'smooth')
    })
  })

  const hashSlug = decodeURIComponent(globalThis.location.hash.slice(1))
  const initialSlug = (hashSlug && slugs.has(hashSlug) && hashSlug)
    || links[0]?.dataset.headingSlug
  if (initialSlug) setActive(initialSlug, 'auto')

  if (headingElements.length === 0) return

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActive(entry.target.id)
          break
        }
      }
    },
    { rootMargin: '-80px 0px -70% 0px' },
  )

  headingElements.forEach((el) => observer.observe(el))
}

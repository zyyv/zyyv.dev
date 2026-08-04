<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const year = new Date().getFullYear()
const isHome = computed(() => route.path === '/')
const commitHash = computed(() => String(config.public.buildCommit || 'local'))
const shortCommit = computed(() =>
  commitHash.value === 'local' ? 'local' : commitHash.value.slice(0, 7),
)
const commitUrl = computed(() =>
  commitHash.value === 'local'
    ? 'https://github.com/zyyv/zyyv.dev'
    : `https://github.com/zyyv/zyyv.dev/commit/${commitHash.value}`,
)
const { stats } = useSiteStats()
const totalViews = computed(() => stats.value.totalViews?.toLocaleString('en-US') ?? '—')
const onlineVisitors = computed(() => stats.value.onlineVisitors?.toLocaleString('en-US') ?? '—')

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/zyyv', external: true },
  { label: 'Bluesky', href: 'https://bsky.app/profile/zyyv.dev', external: true },
  { label: 'X', href: 'https://x.com/chris_zyyv', external: true },
  { label: 'Email', href: 'mailto:hizyyv@gmail.com', external: false },
] as const

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="site-footer" :class="{ 'site-footer--home': isHome }">
    <p class="site-footer__statement">
      <span>You found the edge</span>
      <span>of the page. Nothing fell off.</span>
    </p>

    <div class="site-footer__base">
      <div class="site-footer__identity">
        <p>© {{ year }} Chris</p>
        <dl class="site-footer__stats" aria-label="Site activity">
          <div>
            <dt>Views</dt>
            <dd>{{ totalViews }}</dd>
          </div>
          <div>
            <dt><span class="site-footer__live-dot" aria-hidden="true" /> Online</dt>
            <dd>{{ onlineVisitors }}</dd>
          </div>
        </dl>
        <nav class="site-footer__links" aria-label="Social links">
          <a
            v-for="link in socialLinks"
            :key="link.label"
            :href="link.href"
            :target="link.external ? '_blank' : undefined"
            :rel="link.external ? 'noreferrer' : undefined"
          >
            {{ link.label }}
          </a>
        </nav>
      </div>

      <div class="site-footer__actions">
        <a :href="commitUrl" target="_blank" rel="noreferrer" :title="`Open commit ${commitHash}`">
          <span>Last dispatch</span>
          <code>{{ shortCommit }}</code>
          <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
        </a>

        <button type="button" aria-label="Back to top" @click="backToTop">
          <span>Back to top</span>
          <i class="i-hugeicons:arrow-up-01" aria-hidden="true" />
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  width: 100%;
  padding: clamp(3.5rem, 6vw, 6rem) clamp(1rem, 4vw, 4rem) clamp(1.5rem, 3vw, 3rem);
  border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  color: inherit;
  font-family: 'DM Sans', sans-serif;
}

.site-footer__base {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  font-size: 0.68rem;
  line-height: 1.2;
  text-transform: uppercase;
}

.site-footer__base p,
.site-footer__statement {
  margin: 0;
}

.site-footer__statement {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3em;
  margin: clamp(2.5rem, 4vw, 4rem) 0 clamp(3rem, 5vw, 4.5rem);
  font-size: clamp(1.15rem, 2.2vw, 1.7rem);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.site-footer__statement span {
  display: block;
}

.site-footer__statement span:last-child {
  color: color-mix(in srgb, currentColor 46%, transparent);
}

.site-footer--home .site-footer__statement {
  margin: clamp(2.75rem, 5vw, 4.5rem) 0 clamp(3.25rem, 6vw, 5rem);
  font-size: clamp(2.1rem, 5vw, 5.25rem);
  line-height: 0.92;
  letter-spacing: -0.065em;
}

.site-footer--home .site-footer__statement span:last-child {
  margin-left: clamp(1.5rem, 5vw, 5rem);
}

.site-footer__base {
  align-items: end;
  padding-top: 1rem;
  border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
}

.site-footer__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: clamp(1.25rem, 3vw, 3rem);
}

.site-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem clamp(0.85rem, 1.8vw, 1.5rem);
}

.site-footer__stats {
  display: flex;
  gap: 0.5rem clamp(0.9rem, 1.8vw, 1.5rem);
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.site-footer__stats div {
  display: flex;
  gap: 0.35rem;
}

.site-footer__stats dt,
.site-footer__stats dd {
  margin: 0;
}

.site-footer__stats dt {
  color: color-mix(in srgb, currentColor 48%, transparent);
}

.site-footer__live-dot {
  display: inline-block;
  width: 0.38rem;
  height: 0.38rem;
  margin-right: 0.18rem;
  border-radius: 50%;
  background: #4f9a68;
  box-shadow: 0 0 0 0.18rem color-mix(in srgb, #4f9a68 18%, transparent);
  vertical-align: 0.04rem;
}

.site-footer__links a {
  color: inherit;
  text-decoration: none;
  transition:
    opacity 240ms ease,
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.site-footer__links a:hover {
  opacity: 0.5;
  transform: translateY(-1px);
}

.site-footer__links a:active {
  transform: translateY(1px);
}

.site-footer__links a:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 0.35rem;
}

.site-footer__identity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem clamp(1rem, 2.5vw, 2rem);
}

.site-footer__actions a,
.site-footer__actions button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0 0.2rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.site-footer__actions a::after,
.site-footer__actions button::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: currentColor;
  content: '';
  transform: scaleX(0);
  transform-origin: right center;
  transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.site-footer__actions code {
  font-family: inherit;
  font-size: inherit;
  opacity: 0.48;
}

.site-footer__actions a:hover,
.site-footer__actions button:hover {
  transform: translateY(-1px);
}

.site-footer__actions a:hover::after,
.site-footer__actions button:hover::after,
.site-footer__actions a:focus-visible::after,
.site-footer__actions button:focus-visible::after {
  transform: scaleX(1);
  transform-origin: left center;
}

.site-footer__actions a:active,
.site-footer__actions button:active {
  transform: translateY(1px);
}

.site-footer__actions a:focus-visible,
.site-footer__actions button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 0.35rem;
}

@media (max-width: 767.9px) {
  .site-footer {
    padding-top: 3.5rem;
    padding-bottom: 4.5rem;
  }

  .site-footer__statement {
    margin: 3rem 0 4rem;
    font-size: 1.1rem;
    line-height: 1.2;
  }

  .site-footer--home .site-footer__statement {
    margin: 3rem 0 4rem;
    font-size: clamp(2.65rem, 13vw, 4.5rem);
    line-height: 0.9;
  }

  .site-footer--home .site-footer__statement span:last-child {
    margin-left: 0;
  }

  .site-footer__base {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1rem;
  }

  .site-footer__actions {
    justify-content: flex-end;
    gap: 1rem;
  }

  .site-footer__actions a span,
  .site-footer__actions button span {
    display: none;
  }

  .site-footer__identity {
    gap: 0.75rem 1rem;
  }

  .site-footer__stats {
    order: 3;
    width: 100%;
  }

  .site-footer__links {
    gap: 0.45rem 0.85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-footer__actions a,
  .site-footer__actions button,
  .site-footer__actions a::after,
  .site-footer__actions button::after,
  .site-footer__links a {
    transition: none;
  }
}
</style>

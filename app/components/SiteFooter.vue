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
    <div class="site-footer__meta">
      <p>Chris / Front-end developer</p>
      <p>End of transmission</p>
    </div>

    <p class="site-footer__statement">
      <span>You found the edge</span>
      <span>of the page. Nothing fell off.</span>
    </p>

    <div class="site-footer__base">
      <div class="site-footer__identity">
        <p>© {{ year }} Chris</p>
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
  padding: clamp(5rem, 10vw, 10rem) clamp(1rem, 4vw, 4rem) clamp(1.5rem, 3vw, 3rem);
  border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  color: inherit;
  font-family: 'DM Sans', sans-serif;
}

.site-footer__meta,
.site-footer__base {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  font-size: 0.68rem;
  line-height: 1.2;
  text-transform: uppercase;
}

.site-footer__meta p,
.site-footer__base p,
.site-footer__statement {
  margin: 0;
}

.site-footer__meta p:last-child {
  text-align: right;
}

.site-footer__statement {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3em;
  margin: clamp(3rem, 6vw, 5rem) 0 clamp(3.5rem, 7vw, 6rem);
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
  display: grid;
  margin: clamp(4.5rem, 10vw, 9rem) 0 clamp(5rem, 11vw, 10rem);
  font-size: clamp(3.9rem, 10.2vw, 10rem);
  line-height: 0.78;
  letter-spacing: -0.085em;
}

.site-footer--home .site-footer__statement span:last-child {
  margin-left: 8vw;
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
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0 0.2rem;
  border: 0;
  border-bottom: 1px solid currentColor;
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition:
    opacity 240ms ease,
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.site-footer__actions code {
  font-family: inherit;
  font-size: inherit;
  opacity: 0.48;
}

.site-footer__actions a:hover,
.site-footer__actions button:hover {
  opacity: 0.55;
  transform: translateY(-1px);
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
    padding-top: 5rem;
    padding-bottom: 5.5rem;
  }

  .site-footer__meta {
    font-size: 0.62rem;
  }

  .site-footer__statement {
    margin: 3rem 0 4rem;
    font-size: 1.1rem;
    line-height: 1.2;
  }

  .site-footer--home .site-footer__statement {
    margin: 4.75rem 0 6rem;
    font-size: clamp(3.65rem, 18.5vw, 6rem);
    line-height: 0.82;
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

  .site-footer__links {
    gap: 0.45rem 0.85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-footer__actions a,
  .site-footer__actions button,
  .site-footer__links a {
    transition: none;
  }
}
</style>

<script setup lang="ts">
const config = useRuntimeConfig()
const year = new Date().getFullYear()
const commitHash = computed(() => String(config.public.buildCommit || 'local'))
const shortCommit = computed(() =>
  commitHash.value === 'local' ? 'local' : commitHash.value.slice(0, 7),
)
const commitUrl = computed(() =>
  commitHash.value === 'local'
    ? 'https://github.com/zyyv/zyyv.dev'
    : `https://github.com/zyyv/zyyv.dev/commit/${commitHash.value}`,
)

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer-rule" aria-hidden="true">
      <span />
      <i class="i-hugeicons:git-commit-horizontal" />
      <span />
    </div>

    <div class="site-footer-content">
      <div>
        <p class="site-footer-note">You found the edge of the page. Nothing fell off.</p>
        <p class="site-footer-meta">© {{ year }} Chris · Built somewhere between coffee and git.</p>
      </div>

      <div class="site-footer-actions">
        <a
          :href="commitUrl"
          target="_blank"
          rel="noreferrer"
          class="site-footer-commit"
          :title="`Open commit ${commitHash}`"
        >
          <span>Last dispatch</span>
          <code>{{ shortCommit }}</code>
          <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
        </a>
        <button type="button" class="site-footer-top" aria-label="Back to top" @click="backToTop">
          <i class="i-hugeicons:arrow-up-01" aria-hidden="true" />
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  width: min(calc(100% - clamp(2rem, 8vw, 8rem)), 68rem);
  margin-inline: auto;
  padding-block: 1.5rem clamp(2rem, 5vw, 4rem);
}

.site-footer-rule {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  opacity: 0.3;
}

.site-footer-rule span {
  border-top: 1px dashed currentColor;
}

.site-footer-rule i {
  font-size: 1.1rem;
}

.site-footer-content {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
}

.site-footer-note,
.site-footer-meta {
  margin: 0;
}

.site-footer-note {
  font-family: dank, monospace;
  font-size: clamp(0.9rem, 1.8vw, 1.05rem);
  font-style: italic;
}

.site-footer-meta {
  margin-top: 0.4rem;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  opacity: 0.42;
}

.site-footer-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.6rem;
}

.site-footer-commit,
.site-footer-top {
  border: 1px dashed rgb(120 120 120 / 28%);
  color: inherit;
  background: rgb(120 120 120 / 5%);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
}

.site-footer-commit {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.4rem;
  padding-inline: 0.8rem;
  border-radius: 0.7rem;
  font-size: 0.72rem;
  text-decoration: none;
}

.site-footer-commit span {
  opacity: 0.52;
}

.site-footer-commit code {
  font-family: dank, monospace;
  font-size: 0.75rem;
}

.site-footer-top {
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  cursor: pointer;
  place-items: center;
  border-radius: 50%;
}

.site-footer-commit:hover,
.site-footer-top:hover {
  border-color: rgb(120 120 120 / 48%);
  background: rgb(120 120 120 / 11%);
  transform: translateY(-2px);
}

.site-footer-commit:active,
.site-footer-top:active {
  transform: scale(0.97);
}

.site-footer-commit:focus-visible,
.site-footer-top:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .site-footer {
    width: calc(100% - 2rem);
  }

  .site-footer-content {
    align-items: flex-start;
    flex-direction: column;
  }

  .site-footer-actions {
    width: 100%;
  }

  .site-footer-commit {
    flex: 1;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-footer-commit,
  .site-footer-top {
    transition: none;
  }
}
</style>

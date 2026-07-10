<script setup lang="ts">
const route = useRoute()

const navigation = [
  { label: 'Home', to: '/', icon: null },
  { label: 'Photos', to: '/photos', icon: 'i-hugeicons:image-03' },
  { label: 'Projects', to: '/projects', icon: 'i-hugeicons:package-search' },
  { label: 'Posts', to: '/posts', icon: 'i-hugeicons:note-edit' },
] as const

const isHome = computed(() => route.path === '/')

function isActive(path: string) {
  if (path === '/') return route.path === path
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <header class="site-header">
    <nav class="site-controls" aria-label="Site navigation">
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="site-control"
        :class="{ 'site-control-active': isActive(item.to) }"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        :aria-label="item.label"
        :title="item.label"
      >
        <MeAvatar v-if="item.to === '/'" navigation :shared="!isHome" />
        <i v-else class="site-control-icon" :class="item.icon" aria-hidden="true" />
        <span class="visually-hidden">{{ item.label }}</span>
      </NuxtLink>

      <span class="site-controls-divider" aria-hidden="true" />
      <div class="site-theme-slot">
        <DarkToggle />
      </div>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  position: fixed;
  z-index: 30;
  top: 50%;
  left: clamp(0.65rem, 1.6vw, 1rem);
  color: inherit;
  pointer-events: none;
  transform: translateY(-50%);
}

.site-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.3rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.85rem;
  background-color: color-mix(in srgb, currentColor 6%, transparent);
  box-shadow: 0 0.75rem 2.5rem color-mix(in srgb, currentColor 8%, transparent);
  backdrop-filter: blur(18px) saturate(135%);
  -webkit-backdrop-filter: blur(18px) saturate(135%);
  pointer-events: auto;
}

.site-control,
.site-theme-slot {
  width: 2.35rem;
  height: 2.35rem;
}

.site-control {
  position: relative;
  display: grid;
  place-items: center;
  border-radius: 0.65rem;
  color: currentColor;
  font-size: 1.12rem;
  opacity: 0.52;
  text-decoration: none;
  transition:
    background-color 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
}

.site-control-icon {
  color: currentColor;
}

.site-control:hover {
  background-color: color-mix(in srgb, currentColor 9%, transparent);
  opacity: 0.92;
  transform: translateY(-1px);
}

.site-control:active {
  transform: scale(0.96);
}

.site-control-active {
  background-color: color-mix(in srgb, currentColor 14%, transparent);
  opacity: 1;
}

.site-controls-divider {
  width: 1.25rem;
  height: 1px;
  margin-block: 0.12rem;
  background-color: color-mix(in srgb, currentColor 18%, transparent);
}

.site-theme-slot {
  display: grid;
  place-items: center;
}

.site-control:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 767px) {
  .site-header {
    top: auto;
    bottom: 0.65rem;
    left: 50%;
    transform: translateX(-50%);
  }

  .site-controls {
    flex-direction: row;
  }

  .site-controls-divider {
    width: 1px;
    height: 1.25rem;
    margin-block: 0;
    margin-inline: 0.12rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-control {
    transition: none;
  }
}
</style>

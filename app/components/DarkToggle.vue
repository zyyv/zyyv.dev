<script setup lang="ts">
const mode = useColorMode({
  emitAuto: true,
})
const { state, next } = useCycleList(['light', 'dark'] as const, { initialValue: mode })

watchEffect(() => {
  mode.value = state.value
  if (typeof document !== 'undefined') {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', state.value === 'dark' ? '#1e1e20' : '#f5f5f5')
  }
})

function enableTransitions() {
  return (
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

async function toggleDark(event: MouseEvent) {
  if (!enableTransitions()) {
    next()
    return
  }

  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]

  await document.startViewTransition(async () => {
    next()
    await nextTick()
  }).ready

  document.documentElement.animate(
    {
      clipPath: state.value === 'dark' ? [...clipPath].reverse() : clipPath,
    },
    {
      duration: 300,
      easing: 'ease-in',
      fill: 'forwards',
      pseudoElement:
        state.value === 'dark' ? '::view-transition-old(root)' : '::view-transition-new(root)',
    },
  )
}

const icon = computed(() => {
  switch (state.value) {
    case 'dark':
      return 'i-hugeicons:moon-slow-wind'
    case 'light':
      return 'i-hugeicons:sun-03'
    case 'auto':
      return 'i-hugeicons:computer-phone-sync'
    default:
      return ''
  }
})

const toggleLabel = computed(() =>
  state.value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
)
</script>

<template>
  <ClientOnly>
    <button
      type="button"
      class="theme-toggle-button"
      :aria-label="toggleLabel"
      :title="toggleLabel"
      @click="toggleDark"
    >
      <i class="theme-toggle-icon" :class="icon" aria-hidden="true" />
    </button>
  </ClientOnly>
</template>

<style scoped>
.theme-toggle-button {
  display: grid;
  width: 100%;
  height: 100%;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 0.65rem;
  background: transparent;
  color: currentColor;
  cursor: pointer;
  font: inherit;
  font-size: 1.12rem;
  opacity: 0.52;
  transition:
    background-color 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
}

.theme-toggle-button:hover {
  background-color: color-mix(in srgb, currentColor 9%, transparent);
  opacity: 0.92;
  transform: translateY(-1px);
}

.theme-toggle-button:active {
  transform: scale(0.96);
}

.theme-toggle-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.theme-toggle-icon {
  color: currentColor;
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle-button {
    transition: none;
  }
}
</style>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
::view-transition-old(root) {
  z-index: 1;
}
::view-transition-new(root) {
  z-index: 2147483646;
}
.dark::view-transition-old(root) {
  z-index: 2147483646;
}
.dark::view-transition-new(root) {
  z-index: 1;
}
</style>

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
      class="grid size-full cursor-pointer place-items-center border-0 rounded-[0.65rem] bg-transparent p-0 color-inherit text-[1.12rem] op-52 transition-[background-color,opacity,transform] duration-180 ease [font:inherit] hover:(-translate-y-px op-92 [background-color:color-mix(in_srgb,currentColor_9%,transparent)]) active:scale-96 focus-visible:(outline-2 outline-current outline-offset-2) motion-reduce:transition-none"
      :aria-label="toggleLabel"
      :title="toggleLabel"
      @click="toggleDark"
    >
      <i class="color-inherit" :class="icon" aria-hidden="true" />
    </button>
  </ClientOnly>
</template>

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

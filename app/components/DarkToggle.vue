<script setup lang="ts">
const mode = useColorMode({
  emitAuto: true,
})
const { state, next } = useCycleList(['light', 'dark', 'auto'] as const, { initialValue: mode })

watchEffect(() => mode.value = state.value)

useHead({
  meta: [{
    id: 'theme-color',
    name: 'theme-color',
    content: () => state.value === 'dark' ? '#222222' : '#3c3c43',
  }],
})

function enableTransitions() {
  return typeof document.startViewTransition === 'function'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function toggleDark(event: MouseEvent) {
  if (!enableTransitions()) {
    return
  }

  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  )
  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${endRadius}px at ${x}px ${y}px)`,
  ]

  await document.startViewTransition(async () => {
    next()
    await nextTick()
  }).ready

  document.documentElement.animate(
    {
      clipPath: state.value === 'dark'
        ? [...clipPath].reverse()
        : clipPath,
    },
    {
      duration: 300,
      easing: 'ease-in',
      pseudoElement: state.value === 'dark'
        ? '::view-transition-old(root)'
        : '::view-transition-new(root)',
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
</script>

<template>
  <ClientOnly>
    <button class="hover:animate-rubber-band fcc cursor-pointer" @click="toggleDark">
      <i :class="icon" />
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

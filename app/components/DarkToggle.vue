<script setup lang="ts">
const mode = useColorMode()
const state = mode.state
const consecutiveClicks = shallowRef(0)
let resetClicksTimer: number | undefined

const SECRET_CLICK_COUNT = 4
const CLICK_SEQUENCE_TIMEOUT_MS = 1_500

function toggleDark() {
  mode.value = state.value === 'dark' ? 'light' : 'dark'

  consecutiveClicks.value += 1
  if (resetClicksTimer) window.clearTimeout(resetClicksTimer)

  if (consecutiveClicks.value === SECRET_CLICK_COUNT) {
    consecutiveClicks.value = 0
    void navigateTo('/admin')
    return
  }

  resetClicksTimer = window.setTimeout(() => {
    consecutiveClicks.value = 0
  }, CLICK_SEQUENCE_TIMEOUT_MS)
}

onBeforeUnmount(() => {
  if (resetClicksTimer) window.clearTimeout(resetClicksTimer)
})

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', state.value === 'dark' ? '#1e1e20' : '#f5f5f5')
  }
})

const icon = computed(() =>
  state.value === 'dark' ? 'i-hugeicons:moon-slow-wind' : 'i-hugeicons:sun-03',
)

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

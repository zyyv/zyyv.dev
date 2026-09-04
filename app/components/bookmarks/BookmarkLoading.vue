<script setup lang="ts">
const props = defineProps<{
  ready: boolean
}>()

const emit = defineEmits<{
  complete: []
}>()

const progress = shallowRef(0)
const displayProgress = computed(() => Math.min(100, Math.round(progress.value)))
let intervalId: ReturnType<typeof setInterval> | null = null
let completionId: ReturnType<typeof setTimeout> | null = null

function stopProgress() {
  if (!intervalId) return
  clearInterval(intervalId)
  intervalId = null
}

function updateProgress() {
  const ceiling = props.ready ? 100 : 92
  const remaining = ceiling - progress.value
  const minimumStep = props.ready ? 2.8 : 0.35
  const ratio = props.ready ? 0.22 : 0.035

  progress.value = Math.min(ceiling, progress.value + Math.max(minimumStep, remaining * ratio))
  if (!props.ready || progress.value < 100) return

  stopProgress()
  completionId = setTimeout(() => emit('complete'), 280)
}

onMounted(() => {
  intervalId = setInterval(updateProgress, 40)
  updateProgress()
})

onBeforeUnmount(() => {
  stopProgress()
  if (completionId) clearTimeout(completionId)
})
</script>

<template>
  <section class="bookmark-loading" aria-label="Loading bookmarks">
    <div class="bookmark-loading__content">
      <i class="i-hugeicons:book-open-02 bookmark-loading__icon" aria-hidden="true" />

      <div class="bookmark-loading__copy">
        <h1 class="bookmark-loading__title">Turn your bookmarks into a map you can explore.</h1>
      </div>

      <div class="bookmark-loading__status">
        <div
          class="bookmark-loading__track"
          role="progressbar"
          aria-label="Bookmark loading progress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="displayProgress"
        >
          <span :style="{ width: `${displayProgress}%` }" />
        </div>
        <div class="bookmark-loading__meta">
          <span>{{ ready ? 'Almost ready' : 'Mapping connections' }}</span>
          <strong>{{ displayProgress }}%</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bookmark-loading {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: grid;
  min-height: 36rem;
  padding: clamp(2rem, 7vw, 7rem);
  box-sizing: border-box;
  place-items: center;
}

.bookmark-loading__content {
  width: min(36rem, 100%);
}
.bookmark-loading__icon {
  display: block;
  width: 1em;
  height: 1em;
  margin-inline: auto;
  margin-bottom: clamp(2.2rem, 6vh, 4.5rem);
  color: #ef6259;
  font-size: clamp(1.8rem, 4vw, 2.7rem);
}
.bookmark-loading__title {
  max-width: 16ch;
  margin: 0;
  font-size: clamp(1.8rem, 4.5vw, 3.65rem);
  font-weight: 620;
  line-height: 1.12;
  letter-spacing: -0.055em;
}
.bookmark-loading__status {
  margin-top: clamp(3rem, 9vh, 6rem);
}
.bookmark-loading__track {
  height: 2px;
  overflow: hidden;
  background: color-mix(in srgb, currentColor 14%, transparent);
}
.bookmark-loading__track span {
  display: block;
  height: 100%;
  background: #ef6259;
  transition: width 120ms linear;
}
.bookmark-loading__meta {
  display: flex;
  justify-content: space-between;
  margin-top: 0.75rem;
  font:
    0.56rem ui-monospace,
    monospace;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.bookmark-loading__meta span {
  opacity: 0.42;
}
.bookmark-loading__meta strong {
  font-weight: 580;
}
@media (max-width: 600px) {
  .bookmark-loading {
    padding: 2rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bookmark-loading__track span {
    transition: none;
  }
}
</style>

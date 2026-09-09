<script setup lang="ts">
import type { ImageColor, ImageColorsStatus } from '~/composables/useImageColors'

interface Props {
  colors: readonly ImageColor[]
  status: ImageColorsStatus
  error: string | null
}

interface Emits {
  retry: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const activeColor = shallowRef<string | null>(null)

const colorCountLabel = computed(() =>
  props.colors.length ? `${props.colors.length} sampled` : 'Pixel analysis',
)
const barColors = computed(() => {
  const totalShare = props.colors.reduce((total, color) => total + color.share, 0)

  return props.colors.map((color) => ({
    color,
    share: totalShare ? (color.share / totalShare) * 100 : 0,
  }))
})

function colorLabel(color: ImageColor) {
  return `${color.hex}, ${color.share}% of sampled pixels`
}

function setActiveColor(hex: string) {
  activeColor.value = hex
}

function clearActiveColor() {
  activeColor.value = null
}
</script>

<template>
  <section class="photo-color-palette" aria-labelledby="photo-palette-title">
    <div class="photo-color-palette__heading">
      <h3 id="photo-palette-title">Palette</h3>
      <span>{{ colorCountLabel }}</span>
    </div>

    <div v-if="status === 'analyzing'" class="photo-color-palette__loading" role="status">
      <span v-for="index in 5" :key="index" class="photo-color-palette__loading-swatch" />
      <span class="photo-color-palette__loading-label">Sampling image colors…</span>
    </div>

    <div v-else-if="colors.length" class="photo-color-palette__content">
      <div class="photo-color-palette__bar" aria-label="Dominant color proportions" role="img">
        <span
          v-for="item in barColors"
          :key="item.color.hex"
          class="photo-color-palette__bar-segment"
          :class="{
            'is-active': activeColor === item.color.hex,
            'is-muted': activeColor && activeColor !== item.color.hex,
          }"
          :style="{ backgroundColor: item.color.hex, flex: `0 0 ${item.share}%` }"
          :aria-label="colorLabel(item.color)"
          @mouseenter="setActiveColor(item.color.hex)"
          @mouseleave="clearActiveColor"
        />
      </div>

      <div class="photo-color-palette__swatches" role="list" aria-label="Sampled colors">
        <div
          v-for="color in colors"
          :key="`${color.hex}-detail`"
          class="photo-color-palette__swatch"
          :class="{
            'is-active': activeColor === color.hex,
            'is-muted': activeColor && activeColor !== color.hex,
          }"
          role="listitem"
          @mouseenter="setActiveColor(color.hex)"
          @mouseleave="clearActiveColor"
        >
          <span
            class="photo-color-palette__swatch-chip"
            :style="{
              backgroundColor: color.hex,
              borderRadius: activeColor === color.hex ? '0.2rem' : '50%',
            }"
            :aria-label="colorLabel(color)"
          />
          <span class="photo-color-palette__swatch-info">
            <code>{{ color.hex }}</code>
            <small>{{ color.share }}%</small>
          </span>
        </div>
      </div>
    </div>

    <div v-else class="photo-color-palette__error" role="status">
      <span>{{ error || 'Color analysis is unavailable.' }}</span>
      <button type="button" @click="emit('retry')">Retry</button>
    </div>
  </section>
</template>

<style scoped>
.photo-color-palette__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.photo-color-palette__heading h3 {
  color: var(--dialog-muted);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.photo-color-palette__heading > span {
  color: var(--dialog-muted);
  font-size: 0.54rem;
  letter-spacing: 0.04em;
}

.photo-color-palette__bar {
  display: flex;
  height: 0.7rem;
  overflow: hidden;
  border-radius: 0.18rem;
  background: var(--dialog-line);
}

.photo-color-palette__bar-segment {
  min-width: 0.6rem;
  transition:
    flex-basis 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 180ms ease;
}

.photo-color-palette__bar-segment.is-muted,
.photo-color-palette__swatch.is-muted {
  opacity: 0.22;
}

.photo-color-palette__swatches {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem 0.7rem;
  margin-top: 0.9rem;
}

.photo-color-palette__swatch {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 0.45rem;
  transition: opacity 180ms ease;
}

.photo-color-palette__swatch-chip {
  position: relative;
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  transition: border-radius 180ms ease;
}

.photo-color-palette__swatch-info {
  display: flex;
  min-width: 0;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem;
}

.photo-color-palette__swatch-info code,
.photo-color-palette__swatch-info small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-color-palette__swatch-info code {
  color: var(--dialog-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.59rem;
}

.photo-color-palette__swatch-info small {
  color: var(--dialog-muted);
  font-size: 0.52rem;
  font-variant-numeric: tabular-nums;
}

.photo-color-palette__loading,
.photo-color-palette__error {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.35rem;
}

.photo-color-palette__loading-swatch {
  height: 1.8rem;
  border-radius: 0.2rem;
  background: color-mix(in srgb, var(--dialog-text) 8%, transparent);
  animation: photo-color-palette-pulse 1.2s ease-in-out infinite alternate;
}

.photo-color-palette__loading-swatch:nth-child(2) {
  animation-delay: 80ms;
}

.photo-color-palette__loading-swatch:nth-child(3) {
  animation-delay: 160ms;
}

.photo-color-palette__loading-swatch:nth-child(4) {
  animation-delay: 240ms;
}

.photo-color-palette__loading-swatch:nth-child(5) {
  animation-delay: 320ms;
}

.photo-color-palette__loading-label,
.photo-color-palette__error span {
  grid-column: 1 / -1;
  color: var(--dialog-muted);
  font-size: 0.6rem;
  line-height: 1.45;
}

.photo-color-palette__error {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.photo-color-palette__error button {
  padding: 0;
  border: 0;
  border-bottom: 1px dashed var(--dialog-muted);
  background: transparent;
  color: var(--dialog-text);
  font: inherit;
  font-size: 0.58rem;
  cursor: pointer;
}

.photo-color-palette__error button:focus-visible {
  outline: 1px dashed var(--dialog-text);
  outline-offset: 0.3rem;
}

@keyframes photo-color-palette-pulse {
  from {
    opacity: 0.48;
  }

  to {
    opacity: 1;
  }
}

@media (hover: hover) and (pointer: fine) {
  .photo-color-palette__error button:hover {
    border-bottom-color: var(--dialog-text);
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-color-palette__bar-segment,
  .photo-color-palette__swatch,
  .photo-color-palette__loading-swatch {
    animation: none;
    transition-duration: 1ms;
  }
}
</style>

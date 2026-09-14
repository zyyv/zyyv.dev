<script setup lang="ts">
import type { Photo } from '~/types'
import { useImageHistogram, type HistogramChannel } from '~/composables/useImageHistogram'
import PhotoHistogramAxis from './PhotoHistogramAxis.vue'
import PhotoHistogramChart from './PhotoHistogramChart.vue'

interface Props {
  photo: Photo
}

const props = defineProps<Props>()
const { histogram, status, error, analyze } = useImageHistogram(() => props.photo)

const channelOptions: readonly { key: HistogramChannel; label: string; shortLabel: string }[] = [
  { key: 'red', label: 'Red', shortLabel: 'R' },
  { key: 'green', label: 'Green', shortLabel: 'G' },
  { key: 'blue', label: 'Blue', shortLabel: 'B' },
  { key: 'luminance', label: 'Luminance', shortLabel: 'L' },
]
const activeChannels = shallowRef<HistogramChannel[]>(['red', 'green', 'blue'])
const loadingStatLabels = ['Shadows', 'Highlights', 'Levels'] as const

const sampleCountLabel = computed(() => {
  if (!histogram.value) return 'Pixel analysis'
  return `${formatSampleCount(histogram.value.sampleCount)} sampled`
})

function isChannelActive(channel: HistogramChannel) {
  return activeChannels.value.includes(channel)
}

function toggleChannel(channel: HistogramChannel) {
  if (isChannelActive(channel)) {
    if (activeChannels.value.length === 1) return
    activeChannels.value = activeChannels.value.filter((item) => item !== channel)
    return
  }

  activeChannels.value = [...activeChannels.value, channel]
}

function formatSampleCount(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}
</script>

<template>
  <section class="photo-histogram-panel" aria-labelledby="photo-histogram-title">
    <div class="photo-histogram-panel__heading">
      <h3 id="photo-histogram-title">Histogram</h3>
      <span>{{ sampleCountLabel }}</span>
    </div>

    <div class="photo-histogram-panel__channels" role="group" aria-label="Histogram channels">
      <button
        v-for="channel in channelOptions"
        :key="channel.key"
        type="button"
        class="photo-histogram-panel__channel"
        :class="[`is-${channel.key}`, { 'is-active': isChannelActive(channel.key) }]"
        :aria-label="`${isChannelActive(channel.key) ? 'Hide' : 'Show'} ${channel.label} channel`"
        :aria-pressed="isChannelActive(channel.key)"
        data-cuelume-hover="tick"
        data-cuelume-toggle="toggle"
        @click="toggleChannel(channel.key)"
      >
        <span class="photo-histogram-panel__channel-dot" aria-hidden="true" />
        <span class="photo-histogram-panel__channel-label">{{ channel.label }}</span>
      </button>
    </div>

    <div
      class="photo-histogram-panel__state"
      :class="{
        'photo-histogram-panel__state--chart':
          status === 'analyzing' || (status === 'ready' && histogram),
      }"
    >
      <Transition name="photo-histogram-state" mode="out-in">
        <div v-if="status === 'analyzing'" key="analyzing" class="photo-histogram-panel__content">
          <div
            class="photo-histogram-panel__loading"
            role="status"
            aria-live="polite"
            aria-label="Sampling pixels. Analyzing."
          >
            <div class="photo-histogram-panel__loading-chart" aria-hidden="true">
              <div class="photo-histogram-panel__loading-header">
                <span class="photo-histogram-panel__loading-signal" />
                <span class="photo-histogram-panel__loading-label">Sampling pixels</span>
                <span class="photo-histogram-panel__loading-phase">Analyzing</span>
              </div>

              <svg
                class="photo-histogram-panel__loading-lines"
                viewBox="0 0 256 144"
                preserveAspectRatio="none"
              >
                <path
                  class="photo-histogram-panel__loading-line is-red"
                  d="M0 137 C18 135 24 108 34 120 S56 133 70 130 S94 134 110 126 S126 119 140 127 S156 90 168 104 S183 72 194 112 S214 113 228 120 S244 106 256 110"
                />
                <path
                  class="photo-histogram-panel__loading-line is-green"
                  d="M0 135 C14 128 22 72 34 94 S54 128 71 126 S94 130 110 124 S128 118 142 121 S157 52 170 72 S183 86 194 101 S212 118 226 115 S242 104 256 109"
                />
                <path
                  class="photo-histogram-panel__loading-line is-blue"
                  d="M0 138 C17 132 24 101 37 112 S58 131 76 128 S99 134 115 125 S129 121 144 123 S159 83 170 96 S185 30 194 70 S207 111 220 116 S240 107 256 112"
                />
              </svg>

              <PhotoHistogramAxis />
            </div>
          </div>

          <dl
            class="photo-histogram-panel__stats photo-histogram-panel__stats--loading"
            aria-hidden="true"
          >
            <div v-for="label in loadingStatLabels" :key="label">
              <dt>{{ label }}</dt>
              <dd><span class="photo-histogram-panel__loading-value">xx</span></dd>
            </div>
          </dl>
        </div>

        <div
          v-else-if="status === 'ready' && histogram"
          key="ready"
          class="photo-histogram-panel__content"
        >
          <div class="photo-histogram-panel__chart">
            <PhotoHistogramChart :histogram="histogram" :channels="activeChannels" />
            <PhotoHistogramAxis />
          </div>

          <dl class="photo-histogram-panel__stats">
            <div>
              <dt>Shadows</dt>
              <dd>{{ formatPercentage(histogram.shadowClipping) }}</dd>
            </div>
            <div>
              <dt>Highlights</dt>
              <dd>{{ formatPercentage(histogram.highlightClipping) }}</dd>
            </div>
            <div>
              <dt>Levels</dt>
              <dd>0—255</dd>
            </div>
          </dl>
        </div>

        <div v-else key="error" class="photo-histogram-panel__error" role="status">
          <div>
            <i class="i-hugeicons:alert-diamond mr-1" />
            <span>{{ error || 'Histogram analysis is unavailable.' }}</span>
          </div>
          <button
            type="button"
            data-cuelume-hover="tick"
            data-cuelume-toggle="pulse"
            @click="analyze"
          >
            Retry
          </button>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.photo-histogram-panel {
  --photo-histogram-chart-height: 9rem;
  --photo-histogram-stats-height: 2rem;
  --photo-histogram-content-gap: 0.7rem;
}

.photo-histogram-panel__state--chart {
  height: calc(
    var(--photo-histogram-chart-height) + var(--photo-histogram-content-gap) +
      var(--photo-histogram-stats-height)
  );
}

.photo-histogram-panel__content {
  display: grid;
  grid-template-rows: var(--photo-histogram-chart-height) var(--photo-histogram-stats-height);
  height: 100%;
  row-gap: var(--photo-histogram-content-gap);
}

.photo-histogram-state-enter-active,
.photo-histogram-state-leave-active {
  transition:
    opacity 120ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-histogram-state-enter-from {
  opacity: 0;
  transform: translateY(0.3rem);
}

.photo-histogram-state-leave-to {
  opacity: 0;
  transform: translateY(-0.2rem);
}

.photo-histogram-panel__heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.photo-histogram-panel__heading h3 {
  margin: 0;
  color: var(--dialog-muted);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.photo-histogram-panel__heading > span,
.photo-histogram-panel__stats dt {
  color: var(--dialog-muted);
  font-size: 0.54rem;
  letter-spacing: 0.04em;
}

.photo-histogram-panel__channels {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.3rem;
  margin-bottom: 0.65rem;
}

.photo-histogram-panel__channel {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.25rem;
  background: transparent;
  color: var(--dialog-muted);
  font: inherit;
  font-size: 0.56rem;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    color 180ms ease,
    opacity 180ms ease;
}

.photo-histogram-panel__channel-dot {
  flex: 0 0 auto;
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: currentColor;
}

.photo-histogram-panel__channel-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-histogram-panel__channel-short {
  display: none;
  margin-left: auto;
  font-size: 0.52rem;
}

.photo-histogram-panel__channel.is-red.is-active {
  color: #ee7777;
}

.photo-histogram-panel__channel.is-green.is-active {
  color: #70c992;
}

.photo-histogram-panel__channel.is-blue.is-active {
  color: #79aee8;
}

.photo-histogram-panel__channel.is-luminance.is-active {
  color: #aaa99f;
}

.photo-histogram-panel__channel:not(.is-active) {
  opacity: 0.55;
}

.photo-histogram-panel__channel:focus-visible {
  /* outline: 1px dashed var(--dialog-text); */
  outline-offset: 0.15rem;
}

.photo-histogram-panel__chart {
  position: relative;
  height: 100%;
  min-height: 0;
  padding: 0.25rem 0 0;
  box-sizing: border-box;
}

.photo-histogram-panel__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  height: 100%;
  margin: 0;
  box-sizing: border-box;
}

.photo-histogram-panel__stats > div {
  display: grid;
  gap: 0.2rem;
}

.photo-histogram-panel__stats dt,
.photo-histogram-panel__stats dd {
  margin: 0;
}

.photo-histogram-panel__stats dd {
  color: var(--dialog-text);
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
}

.photo-histogram-panel__loading {
  height: 100%;
  min-height: 0;
  color: var(--dialog-muted);
  font-size: 0.58rem;
}

.photo-histogram-panel__loading-chart {
  position: relative;
  display: block;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.photo-histogram-panel__loading-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 1rem;
  position: absolute;
  z-index: 1;
  top: 0.45rem;
  right: 0.4rem;
  left: 0.4rem;
}

.photo-histogram-panel__loading-signal {
  position: relative;
  display: block;
  flex: 0 0 auto;
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: var(--dialog-text);
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, var(--dialog-text) 8%, transparent);
  animation: photo-histogram-pulse 1.4s ease-in-out infinite;
}

.photo-histogram-panel__loading-label {
  color: var(--dialog-text);
  font-size: 0.57rem;
}

.photo-histogram-panel__loading-phase {
  margin-left: auto;
  color: var(--dialog-muted);
  font-size: 0.48rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.photo-histogram-panel__loading-lines {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0 0.1rem;
  box-sizing: border-box;
  opacity: 0.46;
}

.photo-histogram-panel__loading-line {
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.photo-histogram-panel__loading-line.is-red {
  stroke: #ee7777;
}

.photo-histogram-panel__loading-line.is-green {
  stroke: #70c992;
}

.photo-histogram-panel__loading-line.is-blue {
  stroke: #79aee8;
}

.photo-histogram-panel__stats--loading .photo-histogram-panel__loading-value {
  display: block;
  width: max-content;
  height: 0.75rem;
  box-sizing: border-box;
  color: var(--dialog-muted);
  font-size: 0.62rem;
  line-height: 1;
  letter-spacing: 0.04em;
  opacity: 0.72;
}

@keyframes photo-histogram-pulse {
  0%,
  100% {
    opacity: 0.42;
    transform: scale(0.86);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.photo-histogram-panel__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--dialog-muted);
  font-size: 0.58rem;
}

.photo-histogram-panel__error button {
  flex: 0 0 auto;
  padding: 0.3rem 0.45rem;
  border: 1px dashed var(--dialog-line);
  color: var(--dialog-text);
  font: inherit;
  cursor: pointer;
}

@media (max-width: 767.9px) {
  .photo-histogram-panel {
    --photo-histogram-chart-height: 7.5rem;
  }

  .photo-histogram-panel__channels {
    gap: 0.2rem;
  }

  .photo-histogram-panel__channel {
    justify-content: center;
    padding: 0.32rem 0.2rem;
  }

  .photo-histogram-panel__channel-short {
    display: inline;
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-histogram-panel__channel {
    transition-duration: 1ms;
  }

  .photo-histogram-state-enter-active,
  .photo-histogram-state-leave-active {
    transition-duration: 1ms;
  }

  .photo-histogram-panel__loading-signal {
    animation: none;
  }
}
</style>

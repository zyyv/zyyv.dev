<script setup lang="ts">
import type { Photo } from '~/types'
import { useImageHistogram, type HistogramChannel } from '~/composables/useImageHistogram'
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
        <span class="photo-histogram-panel__channel-short" aria-hidden="true">
          {{ channel.shortLabel }}
        </span>
      </button>
    </div>

    <div v-if="status === 'analyzing'" class="photo-histogram-panel__loading" role="status">
      <span class="photo-histogram-panel__loading-chart" />
      <span>Sampling pixels…</span>
    </div>

    <div v-else-if="status === 'ready' && histogram" class="photo-histogram-panel__content">
      <div class="photo-histogram-panel__chart">
        <PhotoHistogramChart :histogram="histogram" :channels="activeChannels" />
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

    <div v-else class="photo-histogram-panel__error" role="status">
      <span>{{ error || 'Histogram analysis is unavailable.' }}</span>
      <button type="button" data-cuelume-hover="tick" data-cuelume-toggle="pulse" @click="analyze">
        Retry
      </button>
    </div>
  </section>
</template>

<style scoped>
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
  border: 1px dashed transparent;
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
  outline: 1px dashed var(--dialog-text);
  outline-offset: 0.15rem;
}

.photo-histogram-panel__chart {
  height: 9rem;
  min-height: 7rem;
  padding: 0.25rem 0 0;
  border-top: 1px dashed var(--dialog-line);
  border-bottom: 1px dashed var(--dialog-line);
}

.photo-histogram-panel__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  margin: 0.7rem 0 0;
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
  display: grid;
  gap: 0.55rem;
  color: var(--dialog-muted);
  font-size: 0.58rem;
}

.photo-histogram-panel__loading-chart {
  display: block;
  height: 9rem;
  border-top: 1px dashed var(--dialog-line);
  border-bottom: 1px dashed var(--dialog-line);
  background:
    linear-gradient(
        135deg,
        transparent 48%,
        color-mix(in srgb, var(--dialog-text) 10%, transparent) 49%,
        transparent 50%
      )
      0 0 / 100% 100%,
    repeating-linear-gradient(to top, transparent 0 1.7rem, var(--dialog-line) 1.7rem 1.75rem);
  opacity: 0.72;
}

.photo-histogram-panel__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--dialog-muted);
  font-size: 0.58rem;
}

.photo-histogram-panel__error button {
  flex: 0 0 auto;
  padding: 0.3rem 0.45rem;
  border: 1px dashed var(--dialog-line);
  background: transparent;
  color: var(--dialog-text);
  font: inherit;
  cursor: pointer;
}

.photo-histogram-panel__error button:focus-visible {
  outline: 1px dashed var(--dialog-text);
  outline-offset: 0.15rem;
}

@media (hover: hover) and (pointer: fine) {
  .photo-histogram-panel__channel:hover {
    border-color: var(--dialog-line);
  }

  .photo-histogram-panel__channel.is-active:hover {
    border-color: transparent;
  }

  .photo-histogram-panel__error button:hover {
    border-color: var(--dialog-text);
  }
}

@media (max-width: 767.9px) {
  .photo-histogram-panel__channels {
    gap: 0.2rem;
  }

  .photo-histogram-panel__channel {
    justify-content: center;
    padding: 0.32rem 0.2rem;
  }

  .photo-histogram-panel__channel-label {
    display: none;
  }

  .photo-histogram-panel__channel-short {
    display: inline;
    margin-left: 0;
  }

  .photo-histogram-panel__chart,
  .photo-histogram-panel__loading-chart {
    height: 7.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-histogram-panel__channel {
    transition-duration: 1ms;
  }
}
</style>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import type { Chart as ChartInstance, ChartConfiguration } from 'chart.js'
import type { HistogramChannel, ImageHistogram } from '~/composables/useImageHistogram'

interface Props {
  histogram: ImageHistogram
  channels: readonly HistogramChannel[]
}

const props = defineProps<Props>()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const chart = shallowRef<ChartInstance<'line'> | null>(null)
let renderToken = 0

const channelStyles: Record<HistogramChannel, { label: string; color: string; fill: string }> = {
  red: { label: 'Red', color: '#ee7777cc', fill: 'rgba(238, 119, 119, 0.24)' },
  green: { label: 'Green', color: '#70c992cc', fill: 'rgba(112, 201, 146, 0.24)' },
  blue: { label: 'Blue', color: '#79aee8cc', fill: 'rgba(121, 174, 232, 0.24)' },
  luminance: { label: 'Luminance', color: '#aaa99fcc', fill: 'rgba(170, 169, 159, 0.14)' },
}

async function renderChart() {
  const currentCanvas = canvas.value
  if (!currentCanvas) return

  const currentToken = ++renderToken
  const {
    Chart,
    CategoryScale,
    Filler,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
  } = await import('chart.js')
  if (currentToken !== renderToken || !canvas.value) return

  Chart.register(
    CategoryScale,
    Filler,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
  )

  const configuration = createChartConfiguration()
  if (!chart.value) {
    chart.value = new Chart(currentCanvas, configuration)
    return
  }

  chart.value.data = configuration.data
  chart.value.options = configuration.options ?? {}
  chart.value.update('none')
}

function createChartConfiguration(): ChartConfiguration<'line'> {
  const labels = Array.from({ length: 256 }, (_, value) => String(value))
  const datasets = props.channels.map((channel) => {
    const style = channelStyles[channel]
    return {
      label: style.label,
      data: props.histogram[channel].slice(),
      borderColor: style.color,
      backgroundColor: style.fill,
      borderWidth: 1.35,
      pointRadius: 0,
      pointHoverRadius: 2,
      fill: true,
      tension: 0.16,
    }
  })

  const lineColor = getCssVariable('--dialog-line', 'rgb(17 17 15 / 16%)')

  return {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      normalized: true,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 3, right: 2, bottom: 16, left: 0 } },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { display: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: lineColor, drawTicks: false },
          border: { display: false, dash: [0, 1] },
          ticks: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: true,
          usePointStyle: true,
          boxWidth: 4,
          boxHeight: 4,
          boxPadding: 4,
          intersect: false,
          mode: 'index',
          titleFont: { family: 'DM Sans, sans-serif', size: 11 },
          bodyFont: { family: 'DM Sans, sans-serif', size: 11 },
          callbacks: {
            title: (items) => `Level ${items[0]?.label ?? '—'}`,
            label: (item) => `${item.dataset.label}: ${item.formattedValue} px`,
            labelColor: (item) => {
              const channel = item.dataset.label?.toLowerCase() as HistogramChannel
              const style = channelStyles[channel]
              const color = style?.color ?? '#aaa99f'

              return { backgroundColor: color, borderColor: color, borderWidth: 0 }
            },
            labelPointStyle: () => ({ pointStyle: 'circle', rotation: 0 }),
          },
        },
      },
    },
  }
}

function getCssVariable(name: string, fallback: string) {
  return getComputedStyle(canvas.value!).getPropertyValue(name).trim() || fallback
}

watch([() => props.histogram, () => props.channels], () => void renderChart())
onMounted(() => void renderChart())

onBeforeUnmount(() => {
  renderToken += 1
  chart.value?.destroy()
  chart.value = null
})
</script>

<template>
  <canvas
    ref="canvas"
    class="photo-histogram-chart__canvas"
    role="img"
    aria-label="RGB and luminance histogram"
  />
</template>

<style scoped>
.photo-histogram-chart__canvas {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 100%;
}
</style>

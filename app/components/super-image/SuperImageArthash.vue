<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, shallowRef, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { Codec } from '~/utils/arthash'
import { decodeArthashToImageData, supportsArthashSvg } from '~/utils/arthash'
import type { SuperImageArthashOptions } from './types'

const props = withDefaults(
  defineProps<{
    arthash?: string | null
    arthashCodec?: Codec
    arthashOptions?: SuperImageArthashOptions
    assetStyle?: CSSProperties
    revealed?: boolean
    animateReveal?: boolean
  }>(),
  {
    arthash: null,
    revealed: false,
    animateReveal: true,
  },
)

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const bitmap = shallowRef<ImageData | null>(null)
const isBitmap = computed(() => !supportsArthashSvg(props.arthashCodec))
let renderId = 0

const svgOptions = computed(() => {
  const { aa: _aa, pixelSmooth: _pixelSmooth, ...options } = props.arthashOptions ?? {}
  return options
})

const bitmapOptions = computed(() => {
  const { blur: _blur, ...options } = props.arthashOptions ?? {}
  return {
    ...options,
    codec: props.arthashCodec,
  }
})

async function renderBitmap() {
  const currentRenderId = ++renderId
  bitmap.value = null
  if (!isBitmap.value || !props.arthash || !import.meta.client) return

  const nextBitmap = await decodeArthashToImageData(props.arthash, bitmapOptions.value)
  if (currentRenderId !== renderId) return
  bitmap.value = nextBitmap
  await nextTick()
  drawBitmap()
}

function drawBitmap() {
  const target = canvas.value
  const value = bitmap.value
  if (!target || !value) return

  target.width = value.width
  target.height = value.height
  target.getContext('2d')?.putImageData(value, 0, 0)
}

watch(
  [() => props.arthash, () => props.arthashCodec, () => props.arthashOptions, isBitmap],
  () => {
    void renderBitmap()
  },
  { immediate: true, deep: true },
)

watch(bitmap, () => {
  void nextTick(drawBitmap)
})

onBeforeUnmount(() => {
  renderId += 1
})
</script>

<template>
  <ArthashPlaceholder
    v-if="!isBitmap"
    class="super-image__arthash"
    :arthash="props.arthash"
    :arthash-codec="props.arthashCodec"
    :arthash-options="svgOptions"
    :style="props.assetStyle"
    :revealed="props.revealed"
    :animate-reveal="props.animateReveal"
  />
  <canvas
    v-else-if="bitmap"
    ref="canvas"
    class="super-image__arthash super-image__arthash--bitmap"
    :class="{ 'is-revealed': props.revealed }"
    :style="props.assetStyle"
    aria-hidden="true"
  />
</template>

<style scoped>
.super-image__arthash {
  position: absolute;
  inset: 0;
  /* Keep SVG shapes above the real image until their staggered exit finishes. */
  z-index: 3;
  display: block;
  max-width: 100%;
  max-height: 100%;
  margin: auto;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.super-image__arthash--bitmap {
  z-index: 1;
  object-fit: fill;
  opacity: 1;
  transition: opacity 320ms ease;
}

.super-image__arthash--bitmap.is-revealed {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .super-image__arthash--bitmap {
    transition: none;
  }
}
</style>

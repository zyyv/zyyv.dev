<script setup lang="ts">
import { decode } from 'blurhash'
import type { CSSProperties } from 'vue'

interface Props {
  hash: string
  width: number
  height: number
  style?: CSSProperties
}

const props = defineProps<Props>()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

function renderBlurhash() {
  const target = canvas.value
  if (!target || !props.hash || !props.width || !props.height) return

  try {
    const renderWidth = 64
    const renderHeight = Math.max(1, Math.round(renderWidth * (props.height / props.width)))
    const context = target.getContext('2d')
    if (!context) return

    target.width = renderWidth
    target.height = renderHeight
    const pixels = context.createImageData(renderWidth, renderHeight)
    pixels.data.set(decode(props.hash, renderWidth, renderHeight))
    context.putImageData(pixels, 0, 0)
  } catch {
    // Invalid metadata is rendered as an empty preview instead of breaking the detail view.
  }
}

watch(() => [props.hash, props.width, props.height], renderBlurhash, { flush: 'post' })
onMounted(renderBlurhash)
</script>

<template>
  <canvas
    ref="canvas"
    class="photo-detail-canvas__preview-blurhash"
    :style="props.style"
    :aria-label="`BlurHash preview for ${width} × ${height} image`"
    role="img"
  />
</template>

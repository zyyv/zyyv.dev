<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { decodeArthash } from '~/utils/arthash'

interface Props {
  arthash: string
  width: number
  height: number
  style?: CSSProperties
}

const props = defineProps<Props>()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
let renderRequest = 0

async function renderArthash() {
  const target = canvas.value
  const request = ++renderRequest
  if (!target || !props.arthash || !props.width || !props.height) return

  try {
    const { w, h, rgba } = await decodeArthash(props.arthash, 256)
    if (request !== renderRequest) return

    const context = target.getContext('2d')
    if (!context) return
    target.width = w
    target.height = h
    context.putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0)
  } catch {
    // Invalid metadata is rendered as an empty preview instead of breaking the detail view.
  }
}

watch(
  () => [props.arthash, props.width, props.height],
  () => void renderArthash(),
  {
    flush: 'post',
  },
)
onMounted(renderArthash)
</script>

<template>
  <canvas
    ref="canvas"
    class="photo-detail-canvas__preview-arthash"
    :style="props.style"
    :aria-label="`Arthash preview for ${width} × ${height} image`"
    role="img"
  />
</template>

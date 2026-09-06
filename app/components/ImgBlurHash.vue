<script setup lang="ts">
import { decode } from 'blurhash'

interface Props {
  blurhash?: string
  src: string
  srcset?: string
  aspectRatio?: number
  loading?: 'lazy' | 'eager'
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: 1,
  loading: 'lazy',
  alt: '',
})
const image = useTemplateRef<HTMLImageElement>('image')
const visible = useElementVisibility(image)
const placeholder = shallowRef<string>()
const loaded = shallowRef(false)

watch(
  () => props.src,
  () => {
    loaded.value = false
  },
)
watch([visible, () => props.blurhash], ([isVisible, hash]) => {
  placeholder.value = undefined
  if (!isVisible || !hash || loaded.value || image.value?.complete) return
  try {
    const width = 32
    const height = Math.max(1, Math.min(64, Math.round(width / props.aspectRatio)))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return
    const pixels = context.createImageData(width, height)
    pixels.data.set(decode(hash, width, height))
    context.putImageData(pixels, 0, 0)
    placeholder.value = canvas.toDataURL()
  } catch {
    // Invalid optional metadata must never prevent the real image from loading.
  }
})
</script>

<template>
  <img
    ref="image"
    :src="src"
    :srcset="srcset"
    :alt="alt"
    :loading="loading"
    decoding="async"
    class="object-cover"
    :style="{
      aspectRatio,
      backgroundImage: !loaded && placeholder ? `url(${placeholder})` : undefined,
      backgroundSize: 'cover',
    }"
    @load="loaded = true"
  />
</template>

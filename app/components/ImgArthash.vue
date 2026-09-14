<script setup lang="ts">
import { decodeArthash } from '~/utils/arthash'
import { usePhotoImage } from '~/composables/usePhotoImageLoadState'

interface Props {
  arthash?: string
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
const imageLoad = usePhotoImage(() => props.src)
let renderRequest = 0

async function renderPlaceholder() {
  const request = ++renderRequest
  placeholder.value = undefined
  if (
    !import.meta.client ||
    !visible.value ||
    !props.arthash ||
    imageLoad.isLoaded.value ||
    image.value?.complete
  ) {
    return
  }

  try {
    const { w, h, rgba } = await decodeArthash(props.arthash, 64)
    if (request !== renderRequest) return

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const context = canvas.getContext('2d')
    if (!context) return
    context.putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0)
    placeholder.value = canvas.toDataURL()
  } catch {
    // Invalid optional metadata must never prevent the real image from loading.
  }
}

watch([visible, () => props.arthash, imageLoad.status], () => void renderPlaceholder(), {
  immediate: true,
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
      backgroundImage: !imageLoad.isLoaded && placeholder ? `url(${placeholder})` : undefined,
      backgroundSize: 'cover',
    }"
    @load="imageLoad.markLoaded"
    @error="imageLoad.markError"
  />
</template>

<script setup lang="ts">
import { usePhotoImage } from '~/composables/usePhotoImageLoadState'

defineOptions({ inheritAttrs: false })

type ImageDecoding = 'async' | 'sync' | 'auto'
type ImageFetchPriority = 'high' | 'low' | 'auto'

interface Props {
  arthash?: string | null
  src: string
  srcset?: string
  aspectRatio?: number
  loading?: 'lazy' | 'eager'
  alt?: string
  width?: number | string
  height?: number | string
  decoding?: ImageDecoding
  draggable?: boolean | 'true' | 'false'
  fetchpriority?: ImageFetchPriority
}

const props = withDefaults(defineProps<Props>(), {
  arthash: null,
  aspectRatio: 1,
  loading: 'lazy',
  alt: '',
})
const image = useTemplateRef<HTMLImageElement>('image')
const imageLoad = usePhotoImage(() => props.src)
const loaded = shallowRef(false)
const hasError = shallowRef(false)
const revealed = computed(() => loaded.value || hasError.value)

function markLoaded() {
  hasError.value = false
  loaded.value = true
  imageLoad.markLoaded()
}

function markError() {
  hasError.value = true
  imageLoad.markError()
}

function syncCompletedImage() {
  const currentImage = image.value
  if (!currentImage?.complete) return

  if (currentImage.naturalWidth > 0) markLoaded()
  else markError()
}

watch(
  () => props.src,
  () => {
    loaded.value = false
    hasError.value = false
    void nextTick(syncCompletedImage)
  },
)

onMounted(syncCompletedImage)
</script>

<template>
  <span
    class="img-arthash"
    v-bind="$attrs"
    :style="[{ aspectRatio: props.aspectRatio }, $attrs.style]"
  >
    <img
      ref="image"
      class="img-arthash__image"
      :src="props.src"
      :srcset="props.srcset"
      :alt="props.alt"
      :loading="props.loading"
      :width="props.width"
      :height="props.height"
      :decoding="props.decoding"
      :draggable="props.draggable"
      :fetchpriority="props.fetchpriority"
      @load="markLoaded"
      @error="markError"
    />
    <ArthashPlaceholder :arthash="props.arthash" :revealed="revealed" />
  </span>
</template>

<style scoped>
:where(.img-arthash) {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.img-arthash__image {
  position: relative;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

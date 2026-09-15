<script setup lang="ts">
import { computed } from 'vue'
import { useSuperImage } from './useSuperImage'
import type { SuperImageMode, SuperImageProps } from './types'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<SuperImageProps>(), {
  resources: () => ({}),
  loading: 'lazy',
  alt: '',
  progressive: true,
  objectFit: 'cover',
})

const mode = defineModel<SuperImageMode>('mode', { default: 'arthash' })
const emit = defineEmits<{
  load: [mode: SuperImageMode, source: string]
  error: [mode: SuperImageMode, source: string]
}>()

const container = useTemplateRef<HTMLElement>('container')
const resources = computed(() => props.resources)
const imageStyle = computed(() => ({
  objectFit: props.objectFit,
  objectPosition: props.objectPosition,
}))

const image = useSuperImage(resources, mode, {
  element: container,
  loading: () => props.loading,
  progressive: () => props.progressive,
  fetchPriority: () => props.fetchpriority,
})
const { activeMode, activeSource, hasVisibleAsset } = image

function handleImageLoad(source: string) {
  image.markNativeImageLoaded(source)
  emit('load', activeMode.value, source)
}

function handleImageError(source: string) {
  image.markNativeImageError(source)
  emit('error', activeMode.value, source)
}
</script>

<template>
  <span
    ref="container"
    class="super-image"
    :class="{ 'super-image--loading': !hasVisibleAsset }"
    :style="[{ aspectRatio: props.aspectRatio }, $attrs.style]"
    v-bind="$attrs"
  >
    <SuperImageArthash
      :arthash="resources.arthash"
      :arthash-codec="props.arthashCodec"
      :arthash-options="props.arthashOptions"
      :revealed="hasVisibleAsset"
    />

    <Transition name="super-image-asset">
      <img
        v-if="hasVisibleAsset"
        :key="`${activeMode}-${activeSource}`"
        class="super-image__image"
        :src="activeSource"
        :srcset="props.srcset"
        :sizes="props.sizes"
        :alt="props.alt"
        :loading="props.loading"
        :width="props.width"
        :height="props.height"
        :decoding="props.decoding"
        :draggable="props.draggable"
        :fetchpriority="props.fetchpriority"
        :style="imageStyle"
        @load="handleImageLoad(activeSource)"
        @error="handleImageError(activeSource)"
      />
    </Transition>
  </span>
</template>

<style scoped>
.super-image {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  isolation: isolate;
}

.super-image__image {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.super-image-asset-enter-active,
.super-image-asset-leave-active {
  transition: opacity 260ms ease;
}

.super-image-asset-enter-from,
.super-image-asset-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .super-image-asset-enter-active,
  .super-image-asset-leave-active {
    transition: none;
  }
}
</style>

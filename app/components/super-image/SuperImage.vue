<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, shallowRef, watch } from 'vue'
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
  'active-mode': [mode: SuperImageMode]
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
const {
  activeMode,
  activeSource,
  hasImageResource,
  hasVisibleAsset,
  isResourceCached,
  resourceVersion,
  fallbackAfterError,
} = image

type ImageMode = Exclude<SuperImageMode, 'arthash'>

interface VisualAsset {
  mode: ImageMode
  source: string
}

interface RenderedAsset {
  asset: VisualAsset
  role: 'current' | 'incoming'
}

const VISUAL_FADE_MS = 260
const visibleAsset = shallowRef<VisualAsset | null>(null)
const incomingAsset = shallowRef<VisualAsset | null>(null)
const incomingReady = shallowRef(false)
const visibleAssetVisible = shallowRef(false)
let visualTransitionId = 0
let visualTransitionTimer: ReturnType<typeof setTimeout> | undefined
let syncedResourceVersion = 0

const targetAsset = computed<VisualAsset | null>(() => {
  if (!hasVisibleAsset.value || !activeSource.value) return null
  return {
    mode: activeMode.value as ImageMode,
    source: activeSource.value,
  }
})
const hasRenderedImage = computed(() =>
  Boolean((visibleAsset.value && visibleAssetVisible.value) || incomingReady.value),
)
const keepVisibleAssetDuringResourceChange = computed(
  () =>
    mode.value !== 'arthash' &&
    hasImageResource.value &&
    Boolean(visibleAsset.value) &&
    !targetAsset.value,
)
const arthashRevealed = computed(() =>
  Boolean(
    (targetAsset.value || keepVisibleAssetDuringResourceChange.value) && hasRenderedImage.value,
  ),
)
const transitionAssetSource = computed(() => {
  if (!props.viewTransitionName) return null
  if (visibleAsset.value && visibleAssetVisible.value) return visibleAsset.value.source
  return incomingAsset.value?.source ?? visibleAsset.value?.source ?? null
})
const viewTransitionStyle = computed(() =>
  props.viewTransitionName ? { viewTransitionName: props.viewTransitionName } : undefined,
)
const renderedAssets = computed<RenderedAsset[]>(() => {
  const current = visibleAsset.value
  const incoming = incomingAsset.value
  const assets: RenderedAsset[] = []

  if (current) assets.push({ asset: current, role: 'current' })
  if (incoming && incoming.source !== current?.source) {
    assets.push({ asset: incoming, role: 'incoming' })
  }
  return assets
})

function clearVisualTransition() {
  if (!visualTransitionTimer) return
  clearTimeout(visualTransitionTimer)
  visualTransitionTimer = undefined
}

function removeCurrentAssetAfterFade(transitionId: number) {
  clearVisualTransition()
  visualTransitionTimer = setTimeout(() => {
    visualTransitionTimer = undefined
    if (visualTransitionId !== transitionId || targetAsset.value) return
    visibleAsset.value = null
    visibleAssetVisible.value = false
  }, VISUAL_FADE_MS)
}

function commitIncomingAsset(asset: VisualAsset, transitionId: number) {
  clearVisualTransition()
  visualTransitionTimer = setTimeout(() => {
    visualTransitionTimer = undefined
    if (
      visualTransitionId !== transitionId ||
      incomingAsset.value?.source !== asset.source ||
      !incomingReady.value
    ) {
      return
    }

    visibleAsset.value = asset
    visibleAssetVisible.value = true
    incomingAsset.value = null
    incomingReady.value = false
  }, VISUAL_FADE_MS)
}

function queueIncomingFade(asset: VisualAsset) {
  const transitionId = ++visualTransitionId
  void nextTick(() => {
    requestAnimationFrame(() => {
      if (
        visualTransitionId !== transitionId ||
        incomingAsset.value?.source !== asset.source ||
        !incomingReady.value
      ) {
        return
      }

      // Keep the previous layer mounted while the decoded target fades in.
      visibleAssetVisible.value = false
      commitIncomingAsset(asset, transitionId)
    })
  })
}

function syncVisualAsset(target: VisualAsset | null, nextResourceVersion: number) {
  const resourcesChanged = syncedResourceVersion !== nextResourceVersion
  syncedResourceVersion = nextResourceVersion
  visualTransitionId += 1
  clearVisualTransition()

  if (!target) {
    if (resourcesChanged && keepVisibleAssetDuringResourceChange.value) {
      incomingAsset.value = null
      incomingReady.value = false
      return
    }

    incomingAsset.value = null
    incomingReady.value = false
    if (!visibleAsset.value) {
      visibleAssetVisible.value = false
      return
    }

    visibleAssetVisible.value = false
    removeCurrentAssetAfterFade(visualTransitionId)
    return
  }

  if (!visibleAsset.value && isResourceCached(target.source)) {
    visibleAsset.value = target
    visibleAssetVisible.value = false
    incomingAsset.value = null
    incomingReady.value = false
    return
  }

  if (visibleAsset.value?.source === target.source) {
    incomingAsset.value = null
    incomingReady.value = false
    visibleAsset.value = target
    return
  }

  if (incomingAsset.value?.source === target.source) {
    incomingAsset.value = target
    return
  }

  // A fast second switch must restore the old layer before replacing the
  // pending target; otherwise both layers can be transparent for one frame.
  if (visibleAsset.value && !visibleAssetVisible.value && incomingReady.value) {
    visibleAssetVisible.value = true
  }
  incomingAsset.value = target
  incomingReady.value = false
}

function handleImageLoad(rendered: RenderedAsset) {
  image.markNativeImageLoaded(rendered.asset.source)
  emit('load', rendered.asset.mode, rendered.asset.source)

  if (rendered.role === 'current') {
    if (visibleAsset.value?.source === rendered.asset.source) {
      visibleAssetVisible.value = true
    }
    return
  }
  if (incomingAsset.value?.source !== rendered.asset.source) return

  incomingReady.value = true
  queueIncomingFade(rendered.asset)
}

function handleImageError(rendered: RenderedAsset) {
  image.markNativeImageError(rendered.asset.source)
  emit('error', rendered.asset.mode, rendered.asset.source)

  if (rendered.role === 'current') {
    if (visibleAsset.value?.source === rendered.asset.source) {
      visualTransitionId += 1
      clearVisualTransition()
      visibleAsset.value = null
      visibleAssetVisible.value = false
    }

    if (activeSource.value === rendered.asset.source) void fallbackAfterError(rendered.asset.source)
    return
  }
  if (incomingAsset.value?.source !== rendered.asset.source) return

  visualTransitionId += 1
  clearVisualTransition()
  incomingAsset.value = null
  incomingReady.value = false
}

watch(
  [targetAsset, resourceVersion],
  ([target, nextResourceVersion]) => {
    syncVisualAsset(target, nextResourceVersion)
  },
  { immediate: true },
)
watch(activeMode, (nextMode) => emit('active-mode', nextMode), { immediate: true })

onBeforeUnmount(() => {
  visualTransitionId += 1
  clearVisualTransition()
})
</script>

<template>
  <span
    ref="container"
    class="super-image"
    :class="{ 'super-image--loading': !hasRenderedImage }"
    :style="[{ aspectRatio: props.aspectRatio }, $attrs.style]"
    v-bind="$attrs"
  >
    <SuperImageArthash
      :arthash="resources.arthash"
      :arthash-codec="props.arthashCodec"
      :arthash-options="props.arthashOptions"
      :asset-style="props.assetStyle"
      :revealed="arthashRevealed"
      :animate-reveal="false"
    />

    <span class="super-image__asset-stack">
      <img
        v-for="rendered in renderedAssets"
        :key="rendered.asset.source"
        class="super-image__image"
        :class="{
          'super-image__image--current': rendered.role === 'current',
          'super-image__image--incoming': rendered.role === 'incoming',
          'is-visible': rendered.role === 'current' ? visibleAssetVisible : incomingReady,
        }"
        :src="rendered.asset.source"
        :srcset="props.srcset"
        :sizes="props.sizes"
        :alt="props.alt"
        :aria-hidden="rendered.role === 'incoming' ? true : undefined"
        :loading="props.loading"
        :width="props.width"
        :height="props.height"
        :decoding="props.decoding"
        :draggable="props.draggable"
        :fetchpriority="props.fetchpriority"
        :style="[
          imageStyle,
          props.assetStyle,
          transitionAssetSource === rendered.asset.source ? viewTransitionStyle : undefined,
        ]"
        @load="handleImageLoad(rendered)"
        @error="handleImageError(rendered)"
      />
    </span>
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

.super-image__asset-stack {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.super-image__image {
  position: absolute;
  inset: 0;
  display: block;
  max-width: 100%;
  max-height: 100%;
  margin: auto;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 260ms ease;
}

.super-image__image--current {
  z-index: 0;
}

.super-image__image--incoming {
  z-index: 1;
}

.super-image__image.is-visible {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .super-image__image {
    transition-duration: 1ms;
  }
}
</style>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { usePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import { usePhotoImageLoadState } from '~/composables/usePhotoImageLoadState'
import {
  getPhotoFilmstripCacheKey,
  usePhotoFilmstripScroll,
} from '~/composables/usePhotoFilmstripScroll'

const PRELOAD_RADIUS = 2
const SCROLL_SAVE_THROTTLE = 120

const { photos, photo: selectedPhoto, actions } = usePhotoDetailContext()
const filmstripRef = useTemplateRef<HTMLElement>('filmstrip')
const thumbnailRefs = new Map<string, HTMLElement>()
const imageLoadState = usePhotoImageLoadState()
const scrollCache = usePhotoFilmstripScroll()
const hasRestoredScroll = shallowRef(false)
const collectionKey = computed(() =>
  getPhotoFilmstripCacheKey(photos.value.map((photo) => photo.id)),
)
const activeIndex = computed(() =>
  photos.value.findIndex((photo) => photo.id === selectedPhoto.value?.id),
)
const activePhotoId = computed(() => selectedPhoto.value?.id ?? '')

let scrollFrame: number | undefined
let preloadTimer: ReturnType<typeof setTimeout> | undefined

function setThumbnailRef(element: Element | ComponentPublicInstance | null, photoId: string) {
  if (element instanceof HTMLElement) thumbnailRefs.set(photoId, element)
  else thumbnailRefs.delete(photoId)
}

function scrollActivePhoto(behavior: ScrollBehavior = 'smooth') {
  thumbnailRefs.get(activePhotoId.value)?.scrollIntoView({
    behavior,
    block: 'nearest',
    inline: 'center',
  })
}

function clampScrollLeft(scrollLeft: number, element: HTMLElement) {
  const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)
  return Math.min(Math.max(0, scrollLeft), maxScrollLeft)
}

async function restoreScroll() {
  await nextTick()

  const element = filmstripRef.value
  if (!element) return

  const cachedScrollLeft = scrollCache.read(collectionKey.value)
  if (cachedScrollLeft === null) {
    element.scrollLeft = 0
    scrollActivePhoto('auto')
  } else {
    element.scrollLeft = clampScrollLeft(cachedScrollLeft, element)
  }

  hasRestoredScroll.value = true
  scheduleThumbnailPreload()
}

function saveCurrentScroll() {
  const element = filmstripRef.value
  if (element) scrollCache.save(collectionKey.value, element.scrollLeft)
}

function handleScroll() {
  if (scrollFrame !== undefined) return

  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined
    saveCurrentScroll()
  })
}

function scheduleThumbnailPreload() {
  if (preloadTimer) clearTimeout(preloadTimer)

  preloadTimer = setTimeout(() => {
    preloadTimer = undefined

    const index = activeIndex.value
    if (index < 0) return

    const start = Math.max(0, index - PRELOAD_RADIUS)
    const end = Math.min(photos.value.length, index + PRELOAD_RADIUS + 1)
    for (const photo of photos.value.slice(start, end)) {
      if (photo.id === activePhotoId.value) continue
      if (imageLoadState.isLoaded(photo.thumbnail)) continue
      void imageLoadState.preload(photo.thumbnail, { expectedBytes: photo.thumbnailSize })
    }
  }, SCROLL_SAVE_THROTTLE)
}

watch(
  collectionKey,
  () => {
    hasRestoredScroll.value = false
    void restoreScroll()
  },
  { flush: 'post' },
)

watch(
  activePhotoId,
  async (_photoId, previousPhotoId) => {
    scheduleThumbnailPreload()
    if (!hasRestoredScroll.value || previousPhotoId === undefined) return

    await nextTick()
    scrollActivePhoto()
  },
  { flush: 'post' },
)

onMounted(() => {
  void restoreScroll()
})

onBeforeUnmount(() => {
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
  if (preloadTimer) clearTimeout(preloadTimer)
  saveCurrentScroll()
  scrollCache.flush(collectionKey.value)
})
</script>

<template>
  <footer
    ref="filmstrip"
    class="photo-dialog__filmstrip"
    aria-label="Photo navigation"
    @scroll.passive="handleScroll"
  >
    <button
      v-for="item in photos"
      :key="item.id"
      v-memo="[item.id, item.thumbnail, item.arthash, item.mediaType, item.id === activePhotoId]"
      :ref="(element) => setThumbnailRef(element, item.id)"
      type="button"
      class="photo-dialog__filmstrip-item"
      :class="{ 'is-active': item.id === activePhotoId }"
      :aria-label="`View ${item.filename || item.id}`"
      :aria-current="item.id === activePhotoId ? 'true' : undefined"
      data-cuelume-toggle="page"
      @click="actions.select(item)"
    >
      <SuperImage
        :resources="{
          arthash: item.arthash,
          thumbnail: item.thumbnail,
        }"
        mode="thumbnail"
        :progressive="false"
        :alt="item.filename"
        :fetchpriority="item.id === activePhotoId ? 'high' : 'low'"
        :loading="item.id === activePhotoId ? 'eager' : 'lazy'"
        class="photo-dialog__filmstrip-image"
        object-fit="cover"
        draggable="false"
      />
      <i v-if="item.mediaType === 'video'" class="i-hugeicons:play" aria-hidden="true" />
    </button>
  </footer>
</template>

<style scoped>
.photo-dialog__filmstrip {
  --filmstrip-thumb-height: 4.375rem;

  display: flex;
  align-items: center;
  min-height: 5.25rem;
  gap: clamp(0.45rem, 0.8vw, 0.8rem);
  padding: 0.7rem clamp(1rem, 3vw, 3rem);
  overflow-x: auto;
  border-top: 1px dashed var(--dialog-line);
  box-sizing: border-box;
  scrollbar-width: none;
  contain: layout;
  overscroll-behavior-x: contain;
}

.photo-dialog__filmstrip::-webkit-scrollbar {
  display: none;
}

.photo-dialog__filmstrip-item {
  position: relative;
  height: var(--filmstrip-thumb-height);
  aspect-ratio: 3 / 4;
  padding: 0;
  border: 0;
  border-radius: 0.35rem;
  background: transparent;
  opacity: 0.34;
  cursor: pointer;
  filter: grayscale(1) contrast(1.03);
  transform: translateY(0);
  contain: layout;
  transition:
    flex-basis 420ms cubic-bezier(0.16, 1, 0.3, 1),
    width 420ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 320ms ease,
    opacity 320ms ease,
    transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-dialog__filmstrip-item.is-active {
  width: var(--filmstrip-thumb-height);
  aspect-ratio: 1 / 1;
  opacity: 1;
  filter: grayscale(0) contrast(1);
}

.photo-dialog__filmstrip-image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.photo-dialog__filmstrip-item > i {
  position: absolute;
  inset: 50% auto auto 50%;
  width: 1rem;
  height: 1rem;
  padding: 0.32rem;
  color: white;
  transform: translate(-50%, -50%);
}

@media (hover: hover) and (pointer: fine) {
  .photo-dialog__filmstrip-item:hover {
    opacity: 0.74;
    filter: grayscale(0.2) contrast(1);
    transform: translateY(-0.12rem);
  }
}

.photo-dialog__filmstrip-item:active {
  transform: scale(0.97);
}

.photo-dialog__filmstrip-item:focus-visible {
  outline: 1px dashed var(--dialog-text);
  outline-offset: 0.35rem;
}

@media (max-width: 767.9px) {
  .photo-dialog__filmstrip {
    --filmstrip-thumb-height: 3.4rem;
    /* --filmstrip-thumb-width: 2.25rem; */

    min-height: 4.75rem;
    padding-inline: 1rem;
  }

  .photo-dialog__filmstrip-item {
    border-radius: 0.42rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-dialog__filmstrip-item,
  .photo-dialog__filmstrip-item::after {
    transition-duration: 1ms;
  }
}
</style>

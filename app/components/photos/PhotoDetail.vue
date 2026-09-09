<script setup lang="ts">
import type { ComponentPublicInstance, CSSProperties } from 'vue'
import type { Photo } from '~/types'
import PhotoDetailCanvas from './PhotoDetailCanvas.vue'
import PhotoDetailMetadata from './photo-detail-metadata/PhotoDetailMetadata.vue'

interface Props {
  photo: Photo | null
  photos: Photo[]
  visible: boolean
  transitioning?: boolean
}

interface Emits {
  close: []
  prev: []
  next: []
  select: [photo: Photo]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const dialogRef = useTemplateRef<HTMLElement>('dialog')
const thumbnailRefs: HTMLElement[] = []
const displayedPhoto = shallowRef<Photo | null>(null)

const currentIndex = computed(() => {
  if (!props.photo || !props.photos.length) return -1
  return props.photos.findIndex((photo) => photo.id === props.photo?.id)
})
const detailPhoto = computed(() => displayedPhoto.value ?? props.photo)
const {
  counts: reactionCounts,
  saving: reactionSaving,
  error: reactionError,
  react,
} = usePhotoReactions(detailPhoto)
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.photos.length - 1)

watch(
  [currentIndex, () => props.visible],
  async ([index, visible], [, wasVisible]) => {
    if (!visible || index < 0) {
      displayedPhoto.value = null
      return
    }
    if (!wasVisible) displayedPhoto.value = props.photo

    await nextTick()
    dialogRef.value?.focus({ preventScroll: true })
    thumbnailRefs[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  },
  { flush: 'post' },
)

function handleKeydown(event: KeyboardEvent) {
  if (!props.visible) return

  if (event.key === 'Escape') emit('close')
  if (event.key === 'ArrowLeft' && hasPrev.value) emit('prev')
  if (event.key === 'ArrowRight' && hasNext.value) emit('next')
}

function thumbnailStyle(item: Photo): CSSProperties {
  return { aspectRatio: `${item.width} / ${item.height}` }
}

function setThumbnailRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (el instanceof HTMLElement) thumbnailRefs[index] = el
}

function handleDisplayedChange(photo: Photo) {
  displayedPhoto.value = photo
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="photo-dialog" :css="!transitioning">
      <div v-if="visible && photo" class="photo-dialog__backdrop" @mousedown.self="emit('close')">
        <section
          ref="dialog"
          class="photo-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="photo-dialog-title"
          tabindex="-1"
          @click.stop
        >
          <header class="photo-dialog__header">
            <div class="photo-dialog__identity">
              <p v-if="currentIndex >= 0">
                {{ String(currentIndex + 1).padStart(2, '0') }} / {{ photos.length }}
              </p>
              <h2 id="photo-dialog-title">
                {{ detailPhoto?.filename || detailPhoto?.id }}
              </h2>
            </div>

            <div class="photo-dialog__actions">
              <button
                type="button"
                class="photo-dialog__close"
                aria-label="Close photo details"
                title="Close"
                @click="emit('close')"
              >
                <i class="i-hugeicons:cancel-01" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div class="photo-dialog__body">
            <div class="photo-dialog__stage">
              <button
                v-if="hasPrev"
                type="button"
                class="photo-dialog__nav photo-dialog__nav--prev"
                aria-label="Previous photo"
                @click="emit('prev')"
              >
                <i class="i-hugeicons:arrow-left-01" aria-hidden="true" />
              </button>

              <PhotoDetailCanvas
                :photo="photo"
                :photos="photos"
                :reaction-error="reactionError"
                :reaction-saving="reactionSaving"
                @displayed-change="handleDisplayedChange"
                @react="react"
              />

              <button
                v-if="hasNext"
                type="button"
                class="photo-dialog__nav photo-dialog__nav--next"
                aria-label="Next photo"
                @click="emit('next')"
              >
                <i class="i-hugeicons:arrow-right-01" aria-hidden="true" />
              </button>
            </div>

            <PhotoDetailMetadata
              v-if="detailPhoto"
              :photo="detailPhoto"
              :reaction-counts="reactionCounts"
            />
          </div>

          <footer class="photo-dialog__filmstrip" aria-label="Photo navigation">
            <button
              v-for="(item, index) in photos"
              :key="item.id"
              :ref="(el) => setThumbnailRef(el, index)"
              type="button"
              :class="{ 'is-active': item.id === photo.id }"
              :style="thumbnailStyle(item)"
              :aria-label="`View ${item.filename || item.id}`"
              :aria-current="item.id === photo.id ? 'true' : undefined"
              @click="emit('select', item)"
            >
              <img :src="item.thumbnail" :alt="item.filename" loading="lazy" decoding="async" />
              <i v-if="item.mediaType === 'video'" class="i-hugeicons:play" aria-hidden="true" />
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.photo-dialog__backdrop {
  --dialog-bg: #e9e9e5;
  --dialog-text: #11110f;
  --dialog-muted: rgb(17 17 15 / 46%);
  --dialog-line: rgb(17 17 15 / 16%);
  --dialog-canvas: #d9d9d4;
  --dialog-checker: rgb(17 17 15 / 5.5%);
  --dialog-control: rgb(233 233 229 / 88%);

  position: fixed;
  z-index: 2147483647;
  inset: 0;
  display: grid;
  background: rgb(233 233 229 / 94%);
  color: var(--dialog-text);
  backdrop-filter: blur(1.25rem) saturate(0.65);
  view-transition-name: photo-detail-surface;
}

:global(.dark .photo-dialog__backdrop) {
  --dialog-bg: #11110f;
  --dialog-text: #e9e9e5;
  --dialog-muted: rgb(233 233 229 / 46%);
  --dialog-line: rgb(233 233 229 / 16%);
  --dialog-canvas: #181816;
  --dialog-checker: rgb(233 233 229 / 5.5%);
  --dialog-control: rgb(17 17 15 / 88%);

  background: rgb(17 17 15 / 94%);
}

.photo-dialog {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: none;
  background: var(--dialog-bg);
  color: var(--dialog-text);
  font-family: 'DM Sans', sans-serif;
}

.photo-dialog__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 4.4rem;
  gap: 2rem;
  padding: 0 clamp(1rem, 3vw, 3rem);
  border-bottom: 1px dashed var(--dialog-line);
}

.photo-dialog__identity {
  display: flex;
  align-items: baseline;
  min-width: 0;
  gap: clamp(1rem, 3vw, 3rem);
}

.photo-dialog__identity p,
.photo-dialog__identity h2 {
  margin: 0;
}

.photo-dialog__identity p {
  flex: 0 0 auto;
  color: var(--dialog-muted);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
}

.photo-dialog__identity h2 {
  overflow: hidden;
  font-size: 0.78rem;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-dialog__actions {
  display: flex;
  align-items: center;
  gap: clamp(1rem, 2.4vw, 2.5rem);
}

.photo-dialog__close,
.photo-dialog__nav {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.photo-dialog__close {
  display: grid;
  width: 2rem;
  height: 2rem;
  color: var(--dialog-muted);
  font-size: 1.12rem;
  place-items: center;
  transition:
    color 220ms ease,
    transform 220ms ease;
}

.photo-dialog__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 19vw);
  min-height: 0;
}

.photo-dialog__stage {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--dialog-canvas);
  place-items: center;
}

.photo-dialog__nav {
  position: absolute;
  z-index: 1;
  top: 50%;
  display: grid;
  width: 2.5rem;
  height: 4rem;
  color: var(--dialog-muted);
  font-size: 1.25rem;
  place-items: center;
  transform: translateY(-50%);
  transition:
    color 220ms ease,
    transform 220ms ease;
}

.photo-dialog__nav--prev {
  left: clamp(0.25rem, 1.5vw, 1.5rem);
}

.photo-dialog__nav--next {
  right: clamp(0.25rem, 1.5vw, 1.5rem);
}

.photo-dialog__details {
  min-height: 0;
  overflow-y: auto;
  padding: clamp(1.5rem, 2.5vw, 2.75rem) clamp(1rem, 2vw, 2rem);
  scrollbar-width: thin;
}

.photo-dialog__filmstrip {
  display: flex;
  align-items: center;
  min-height: 5.25rem;
  gap: clamp(0.45rem, 0.8vw, 0.8rem);
  padding: 0.7rem clamp(1rem, 3vw, 3rem);
  overflow-x: auto;
  border-top: 1px dashed var(--dialog-line);
  box-sizing: border-box;
  scrollbar-width: none;
}

.photo-dialog__filmstrip::-webkit-scrollbar {
  display: none;
}

.photo-dialog__filmstrip button {
  position: relative;
  flex: 0 0 auto;
  height: 3.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  opacity: 0.34;
  cursor: pointer;
  filter: grayscale(1) contrast(1.03);
  transform: translateY(0);
  transition:
    filter 320ms ease,
    opacity 320ms ease,
    transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-dialog__filmstrip button::after {
  position: absolute;
  right: 0;
  bottom: -0.48rem;
  left: 0;
  height: 1px;
  background: var(--dialog-text);
  content: '';
  opacity: 0;
  transform: scaleX(0);
  transition:
    opacity 220ms ease,
    transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-dialog__filmstrip button.is-active {
  opacity: 1;
  filter: grayscale(0) contrast(1);
  transform: translateY(-0.2rem);
}

.photo-dialog__filmstrip button.is-active::after {
  opacity: 0.82;
  transform: scaleX(1);
}

.photo-dialog__filmstrip img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-dialog__filmstrip button > i {
  position: absolute;
  inset: 50% auto auto 50%;
  width: 1rem;
  height: 1rem;
  padding: 0.32rem;
  border-radius: 50%;
  color: white;
  transform: translate(-50%, -50%);
}

@media (hover: hover) and (pointer: fine) {
  .photo-dialog__close:hover,
  .photo-dialog__nav:hover {
    color: var(--dialog-text);
  }

  .photo-dialog__nav--prev:hover {
    transform: translate(-0.18rem, -50%);
  }

  .photo-dialog__nav--next:hover {
    transform: translate(0.18rem, -50%);
  }

  .photo-dialog__filmstrip button:hover {
    opacity: 0.74;
    filter: grayscale(0.2) contrast(1);
    transform: translateY(-0.12rem);
  }
}

.photo-dialog__close:active,
.photo-dialog__filmstrip button:active {
  transform: scale(0.97);
}

.photo-dialog__close:focus-visible,
.photo-dialog__nav:focus-visible,
.photo-dialog__filmstrip button:focus-visible {
  outline: 1px dashed var(--dialog-text);
  outline-offset: 0.35rem;
}

.photo-dialog-enter-active,
.photo-dialog-leave-active {
  transition: opacity 240ms ease;
}

.photo-dialog-enter-active .photo-detail-canvas,
.photo-dialog-leave-active .photo-detail-canvas {
  transition:
    opacity 320ms ease,
    transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-dialog-enter-from,
.photo-dialog-leave-to,
.photo-dialog-enter-from .photo-detail-canvas,
.photo-dialog-leave-to .photo-detail-canvas {
  opacity: 0;
}

.photo-dialog-enter-from .photo-detail-canvas,
.photo-dialog-leave-to .photo-detail-canvas {
  transform: translateY(1rem) scale(0.99);
}

@media (max-width: 767.9px) {
  .photo-dialog__header {
    min-height: 4rem;
    gap: 0.75rem;
    padding: 0 0.75rem 0 1rem;
  }

  .photo-dialog__identity {
    display: grid;
    gap: 0.1rem;
  }

  .photo-dialog__identity p {
    font-size: 0.55rem;
  }

  .photo-dialog__identity h2 {
    max-width: 8rem;
    font-size: 0.68rem;
  }

  .photo-dialog__actions {
    gap: 0.8rem;
  }

  .photo-dialog__body {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(46dvh, 1fr) minmax(0, 31dvh);
  }

  .photo-dialog__details {
    padding: 1.25rem 1rem;
    border-top: 1px dashed var(--dialog-line);
    border-left: 0;
  }

  .photo-dialog__filmstrip {
    min-height: 4.75rem;
    padding-inline: 1rem;
  }

  .photo-dialog__filmstrip button {
    height: 2.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-dialog-enter-active,
  .photo-dialog-leave-active,
  .photo-dialog-enter-active .photo-detail-canvas,
  .photo-dialog-leave-active .photo-detail-canvas,
  .photo-dialog__close,
  .photo-dialog__nav,
  .photo-dialog__filmstrip button,
  .photo-dialog__filmstrip button::after {
    transition-duration: 1ms;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .photo-dialog__backdrop,
  :global(.dark .photo-dialog__backdrop) {
    background: var(--dialog-bg);
    backdrop-filter: none;
  }
}
</style>

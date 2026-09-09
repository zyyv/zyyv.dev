<script setup lang="ts">
import { play } from 'cuelume'
import type { Photo } from '~/types'
import { providePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import { providePhotoImageLoadState } from '~/composables/usePhotoImageLoadState'
import PhotoDetailCanvas from './PhotoDetailCanvas.vue'
import PhotoDetailControls from './photo-detail-controls/PhotoDetailControls.vue'
import PhotoDetailFilmstrip from './PhotoDetailFilmstrip.vue'
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
const detailContext = providePhotoDetailContext({
  photo: () => props.photo,
  photos: () => props.photos,
  visible: () => props.visible,
  onClose: () => emit('close'),
  onPrevious: () => emit('prev'),
  onNext: () => emit('next'),
  onSelect: (photo) => emit('select', photo),
})
const {
  photo: selectedPhoto,
  photos,
  detailPhoto,
  currentIndex,
  hasPrev,
  hasNext,
  visible,
  actions,
} = detailContext
providePhotoImageLoadState()
const dialogRef = useTemplateRef<HTMLElement>('dialog')

watch(
  [currentIndex, visible],
  async ([index, isVisible]) => {
    if (!isVisible || index < 0) {
      actions.setDisplayedPhoto(null)
      return
    }

    await nextTick()
    dialogRef.value?.focus({ preventScroll: true })
  },
  { flush: 'post' },
)

function handleKeydown(event: KeyboardEvent) {
  if (!visible.value) return

  if (event.key === 'Escape') {
    play('droplet')
    actions.close()
    return
  }
  if (event.key === 'ArrowLeft' && hasPrev.value) {
    play('page')
    actions.previous()
    return
  }
  if (event.key === 'ArrowRight' && hasNext.value) {
    play('page')
    actions.next()
  }
}

function handleBackdropMouseDown() {
  play('droplet')
  actions.close()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="photo-dialog" :css="!transitioning">
      <div
        v-if="visible && selectedPhoto"
        class="photo-dialog__backdrop"
        @mousedown.self="handleBackdropMouseDown"
      >
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
                data-cuelume-hover="tick"
                data-cuelume-toggle="droplet"
                @click="actions.close"
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
                data-cuelume-hover="tick"
                data-cuelume-toggle="page"
                @click="actions.previous"
              >
                <i class="i-hugeicons:arrow-left-01" aria-hidden="true" />
              </button>

              <PhotoDetailCanvas />

              <button
                v-if="hasNext"
                type="button"
                class="photo-dialog__nav photo-dialog__nav--next"
                aria-label="Next photo"
                data-cuelume-hover="tick"
                data-cuelume-toggle="page"
                @click="actions.next"
              >
                <i class="i-hugeicons:arrow-right-01" aria-hidden="true" />
              </button>
            </div>

            <div
              v-if="detailPhoto && detailPhoto.mediaType !== 'video'"
              class="photo-dialog__controls"
            >
              <PhotoDetailControls />
            </div>

            <PhotoDetailMetadata v-if="detailPhoto" />
          </div>

          <PhotoDetailFilmstrip />
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
  grid-column: 1;
  grid-row: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--dialog-canvas);
  place-items: center;
}

.photo-dialog__controls {
  z-index: 4;
  grid-column: 1;
  grid-row: 1;
  min-width: 0;
  align-self: end;
  justify-self: center;
  margin-bottom: 1rem;
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
  grid-column: 2;
  grid-row: 1;
  min-height: 0;
  overflow-y: auto;
  padding: clamp(1.25rem, 2vw, 2rem) clamp(0.75rem, 1.5vw, 1.5rem);
  scrollbar-width: thin;
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
}

.photo-dialog__close:active {
  transform: scale(0.97);
}

.photo-dialog__close:focus-visible,
.photo-dialog__nav:focus-visible {
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
    min-height: 3rem;
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
    grid-template-rows: minmax(46dvh, 1fr) auto minmax(0, 31dvh);
  }

  .photo-dialog__stage {
    grid-column: 1;
    grid-row: 1;
  }

  .photo-dialog__controls {
    display: flex;
    grid-column: 1;
    grid-row: 2;
    align-self: stretch;
    justify-self: stretch;
    margin-bottom: 0;
    padding: 0 0.75rem 0;
    margin-top: -1px;
    /* margin-bottom: -1px; */
    /* border-top: 1px dashed var(--dialog-line); */
    background: var(--dialog-bg);
    box-sizing: border-box;
    justify-content: center;
  }

  .photo-dialog__details {
    grid-column: 1;
    grid-row: 3;
    padding: 0.75rem 0.625rem;
    border-top: 1px dashed var(--dialog-line);
    border-left: 0;
    position: relative;
    top: -1px;
    z-index: 10;
  }

  .photo-dialog__nav {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-dialog-enter-active,
  .photo-dialog-leave-active,
  .photo-dialog-enter-active .photo-detail-canvas,
  .photo-dialog-leave-active .photo-detail-canvas,
  .photo-dialog__close,
  .photo-dialog__nav {
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

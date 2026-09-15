<script setup lang="ts">
import { play } from 'cuelume'
import type { Photo } from '~/types'
import { providePhotoDetailContext } from '~/composables/usePhotoDetailContext'
import { providePhotoImageLoadState } from '~/composables/usePhotoImageLoadState'
import PhotoDetailCanvas from './media/PhotoDetailCanvas.vue'
import PhotoDetailControls from './controls/PhotoDetailControls.vue'
import PhotoDetailFilmstrip from './PhotoDetailFilmstrip.vue'
import PhotoDetailMetadata from './metadata/PhotoDetailMetadata.vue'

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
const detailsOpen = shallowRef(false)
const detailsSwipeStart = shallowRef<{
  pointerId: number
  x: number
  y: number
} | null>(null)
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
      detailsOpen.value = false
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
    if (detailsOpen.value) {
      closeDetails()
      return
    }
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

function toggleDetails() {
  detailsOpen.value = !detailsOpen.value
}

function closeDetails() {
  if (!detailsOpen.value) return
  play('droplet')
  detailsOpen.value = false
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button, a, input, select, textarea'))
}

function handleDialogPointerDown(event: PointerEvent) {
  if (!detailsOpen.value || event.pointerType === 'mouse') return
  const target = event.target
  if (isInteractiveTarget(target)) return
  if (target instanceof Element && target.closest('.photo-detail-canvas')) return

  detailsSwipeStart.value = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
  }
}

function handleDialogPointerEnd(event: PointerEvent) {
  const start = detailsSwipeStart.value
  detailsSwipeStart.value = null
  if (!start || start.pointerId !== event.pointerId) return

  const deltaX = event.clientX - start.x
  const deltaY = event.clientY - start.y
  const horizontalSwipe = Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2
  const downwardSwipe = deltaY >= 48 && deltaY > Math.abs(deltaX) * 1.1

  if (downwardSwipe) {
    closeDetails()
    return
  }

  if (!horizontalSwipe) return

  const direction = deltaX > 0 ? 'prev' : 'next'
  const canNavigate = direction === 'prev' ? hasPrev.value : hasNext.value
  if (!canNavigate) return

  play('page')
  if (direction === 'prev') actions.previous()
  else actions.next()
}

function handleDialogPointerCancel() {
  detailsSwipeStart.value = null
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
          :class="{ 'is-details-open': detailsOpen }"
          role="dialog"
          aria-modal="true"
          aria-label="Photo details"
          tabindex="-1"
          @click.stop
          @pointerdown="handleDialogPointerDown"
          @pointerup="handleDialogPointerEnd"
          @pointercancel="handleDialogPointerCancel"
        >
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

              <PhotoDetailCanvas :transitioning="props.transitioning" />

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

              <div
                v-if="detailPhoto && detailPhoto.mediaType !== 'video'"
                class="photo-dialog__controls"
              >
                <PhotoDetailControls
                  :details-open="detailsOpen"
                  show-details-toggle
                  @toggle-details="toggleDetails"
                />
              </div>
            </div>

            <div v-if="detailPhoto" class="photo-dialog__details-layer" :aria-hidden="!detailsOpen">
              <PhotoDetailMetadata />
            </div>
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
  grid-template-rows: minmax(0, 1fr) var(--dialog-filmstrip-height);
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  outline: none;
  background: var(--dialog-bg);
  color: var(--dialog-text);
  font-family: 'DM Sans', sans-serif;
  --dialog-filmstrip-height: 5.25rem;
  --dialog-details-width: clamp(16rem, 19vw, 24rem);
}

.photo-dialog__nav {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.photo-dialog__body {
  display: grid;
  grid-column: 1;
  grid-row: 1;
  grid-template-columns: minmax(0, 1fr) 0px;
  grid-template-rows: minmax(0, 1fr);
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  transition: grid-template-columns 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-dialog.is-details-open .photo-dialog__body {
  grid-template-columns: minmax(0, 1fr) var(--dialog-details-width);
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
  position: absolute;
  z-index: 10;
  display: flex;
  top: clamp(0.9rem, 2vw, 1.5rem);
  right: clamp(0.9rem, 2vw, 1.5rem);
  width: max-content;
  min-height: 0;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  padding: 0;
  pointer-events: auto;
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

.photo-dialog__details-layer {
  display: grid;
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 180ms ease,
    visibility 0s linear 360ms;
}

.photo-dialog.is-details-open .photo-dialog__details-layer {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transition:
    opacity 180ms ease 120ms,
    visibility 0s linear;
}

:deep(.photo-dialog__details) {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  max-width: none;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: clamp(1.25rem, 2vw, 2rem) clamp(0.75rem, 1.5vw, 1.5rem);
  box-sizing: border-box;
  border-left: 1px dashed var(--dialog-line);
  background: var(--dialog-bg);
  box-shadow: -1.5rem 0 3rem rgb(0 0 0 / 10%);
  pointer-events: auto;
  scrollbar-width: none;
}

:deep(.photo-dialog__details::-webkit-scrollbar) {
  display: none;
}

:deep(.photo-dialog__filmstrip) {
  grid-column: 1 / -1;
  grid-row: 2;
  position: relative;
  z-index: 1;
}

@media (hover: hover) and (pointer: fine) {
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
  .photo-dialog {
    grid-template-columns: 1fr;
    --dialog-filmstrip-height: 4.75rem;
    transition: grid-template-rows 360ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .photo-dialog.is-details-open {
    grid-template-rows: minmax(0, 1fr) 0px;
  }

  .photo-dialog__body {
    grid-template-columns: 1fr;
    grid-template-rows: calc(100% - 0px) 0px;
    transition: grid-template-rows 360ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .photo-dialog.is-details-open .photo-dialog__body {
    grid-template-columns: 1fr;
    grid-template-rows: 55dvh calc(100% - 55dvh);
  }

  .photo-dialog__body {
    grid-column: 1;
    grid-row: 1;
  }

  .photo-dialog__stage {
    grid-column: 1;
    grid-row: 1;
  }

  .photo-dialog__nav {
    display: none;
  }

  .photo-dialog.is-details-open :deep(.photo-dialog__filmstrip) {
    display: none;
  }

  .photo-dialog__details-layer {
    grid-column: 1;
    grid-row: 2;
  }

  :deep(.photo-dialog__details) {
    top: auto;
    right: auto;
    bottom: auto;
    left: auto;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    min-width: 0;
    padding: 0.75rem 0.625rem;
    border-top: 1px dashed var(--dialog-line);
    border-right: 0;
    border-left: 0;
    border-radius: 1rem 1rem 0 0;
    box-shadow: 0 -1.5rem 3rem rgb(0 0 0 / 16%);
  }

  :deep(.photo-dialog__details::before) {
    position: absolute;
    top: 0.55rem;
    left: 50%;
    width: 2.5rem;
    height: 0.22rem;
    border-radius: 999px;
    background: var(--dialog-muted);
    content: '';
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-dialog-enter-active,
  .photo-dialog-leave-active,
  .photo-dialog-enter-active .photo-detail-canvas,
  .photo-dialog-leave-active .photo-detail-canvas,
  .photo-dialog__body,
  .photo-dialog__details-layer,
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

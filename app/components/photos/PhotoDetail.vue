<script setup lang="ts">
import type { ComponentPublicInstance, CSSProperties } from 'vue'
import type { Photo } from '~/types'
import dayjs from 'dayjs'

interface Props {
  photo: Photo | null
  photos: Photo[]
  visible: boolean
}

interface Emits {
  close: []
  prev: []
  next: []
  select: [photo: Photo]
}

interface DetailRow {
  icon: string
  label: string
  value: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const dialogRef = useTemplateRef<HTMLElement>('dialog')
const thumbnailRefs: HTMLElement[] = []
const {
  imageStyle,
  isDragging,
  zoomLabel,
  zoomIn,
  zoomOut,
  resetCanvas,
  handleWheel,
  handlePointerDown,
  handlePointerMove,
  handlePointerEnd,
} = useImageCanvas()

const currentIndex = computed(() => {
  if (!props.photo || !props.photos.length) return -1
  return props.photos.findIndex((photo) => photo.id === props.photo?.id)
})
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.photos.length - 1)
const basicDetails = computed<DetailRow[]>(() => {
  if (!props.photo) return []

  return [
    { icon: 'i-hugeicons:file-01', label: 'Filename', value: props.photo.filename },
    {
      icon: 'i-hugeicons:maximize-01',
      label: 'Dimensions',
      value: `${props.photo.width} x ${props.photo.height}`,
    },
    { icon: 'i-hugeicons:database-01', label: 'Original size', value: props.photo.sizeFormatted },
    {
      icon: 'i-hugeicons:image-03',
      label: 'Preview size',
      value: props.photo.thumbnailSizeFormatted,
    },
    {
      icon: 'i-hugeicons:calendar-03',
      label: 'Modified',
      value: formatDate(props.photo.modifiedAt),
    },
  ]
})
const captureDetails = computed<DetailRow[]>(() => {
  const exif = props.photo?.exif
  if (!exif) return []

  return [
    exif.make && exif.model
      ? { icon: 'i-hugeicons:camera-01', label: 'Camera', value: `${exif.make} ${exif.model}` }
      : null,
    exif.lens ? { icon: 'i-hugeicons:camera-lens', label: 'Lens', value: exif.lens } : null,
    exif.focalLength
      ? { icon: 'i-hugeicons:zoom-in-area', label: 'Focal length', value: `${exif.focalLength}mm` }
      : null,
    exif.fNumber
      ? { icon: 'i-hugeicons:iris-scan', label: 'Aperture', value: `f/${exif.fNumber}` }
      : null,
    exif.exposureTime
      ? {
          icon: 'i-hugeicons:timer-01',
          label: 'Shutter',
          value: formatExposureTime(exif.exposureTime),
        }
      : null,
    exif.iso ? { icon: 'i-hugeicons:settings-05', label: 'ISO', value: String(exif.iso) } : null,
    exif.dateTime
      ? { icon: 'i-hugeicons:clock-01', label: 'Captured', value: formatDate(exif.dateTime) }
      : null,
  ].filter((detail): detail is DetailRow => detail !== null)
})

watch(
  [currentIndex, () => props.visible],
  async ([index, visible]) => {
    resetCanvas()
    if (!visible || index < 0) return

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

function formatDate(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function formatExposureTime(time: number): string {
  if (time >= 1) return `${time}s`
  return `1/${Math.round(1 / time)}s`
}

function thumbnailStyle(item: Photo): CSSProperties {
  return { aspectRatio: `${item.width} / ${item.height}` }
}

function setThumbnailRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (el instanceof HTMLElement) thumbnailRefs[index] = el
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="photo-dialog">
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
              <p>{{ String(currentIndex + 1).padStart(2, '0') }} / {{ photos.length }}</p>
              <h2 id="photo-dialog-title">{{ photo.filename || photo.id }}</h2>
            </div>

            <div class="photo-dialog__actions">
              <a
                class="photo-dialog__text-action"
                :href="photo.src"
                :download="photo.filename"
                title="Download original image"
              >
                <span>Download</span>
                <i class="i-hugeicons:download-04" aria-hidden="true" />
              </a>

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

              <figure
                ref="imageCanvas"
                class="photo-dialog__figure"
                :class="{ 'is-dragging': isDragging }"
                @wheel="handleWheel"
                @pointerdown="handlePointerDown"
                @pointermove="handlePointerMove"
                @pointerup="handlePointerEnd"
                @pointercancel="handlePointerEnd"
              >
                <img
                  :key="photo.id"
                  ref="canvasImage"
                  :src="photo.src"
                  :alt="photo.filename"
                  decoding="async"
                  draggable="false"
                  :style="imageStyle"
                  @load="resetCanvas"
                />

                <figcaption>Scroll to zoom · Drag to move</figcaption>

                <div
                  class="photo-dialog__canvas-controls"
                  aria-label="Image zoom controls"
                  @pointerdown.stop
                >
                  <button
                    type="button"
                    aria-label="Zoom out"
                    title="Zoom out"
                    @click.stop="zoomOut"
                  >
                    <i class="i-hugeicons:zoom-out-area" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="photo-dialog__zoom-value"
                    aria-label="Reset image view"
                    title="Reset image view"
                    @click.stop="resetCanvas"
                  >
                    {{ zoomLabel }}
                  </button>
                  <button type="button" aria-label="Zoom in" title="Zoom in" @click.stop="zoomIn">
                    <i class="i-hugeicons:zoom-in-area" aria-hidden="true" />
                  </button>
                </div>
              </figure>

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

            <aside class="photo-dialog__details" aria-label="Photo details">
              <section class="photo-dialog__detail-group">
                <h3>File</h3>
                <dl>
                  <div v-for="detail in basicDetails" :key="detail.label">
                    <dt>
                      <i :class="detail.icon" aria-hidden="true" />
                      <span>{{ detail.label }}</span>
                    </dt>
                    <dd>{{ detail.value }}</dd>
                  </div>
                </dl>
              </section>

              <section v-if="captureDetails.length" class="photo-dialog__detail-group">
                <h3>Capture</h3>
                <dl>
                  <div v-for="detail in captureDetails" :key="detail.label">
                    <dt>
                      <i :class="detail.icon" aria-hidden="true" />
                      <span>{{ detail.label }}</span>
                    </dt>
                    <dd>{{ detail.value }}</dd>
                  </div>
                </dl>
              </section>
            </aside>
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
.photo-dialog__identity h2,
.photo-dialog__detail-group h3,
.photo-dialog__detail-group dl,
.photo-dialog__detail-group dd,
.photo-dialog__figure {
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

.photo-dialog__text-action,
.photo-dialog__close,
.photo-dialog__nav {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.photo-dialog__text-action {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.4rem;
  color: var(--dialog-text);
  font-size: 0.67rem;
  text-decoration: none;
  white-space: nowrap;
}

.photo-dialog__text-action::after {
  position: absolute;
  right: 0;
  bottom: 0.32rem;
  left: 0;
  height: 1px;
  background: currentColor;
  content: '';
  opacity: 0.32;
  transform-origin: right;
  transition:
    opacity 220ms ease,
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-dialog__text-action i {
  font-size: 0.9rem;
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

.photo-dialog__figure {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background-color: var(--dialog-canvas);
  background-image:
    linear-gradient(45deg, var(--dialog-checker) 25%, transparent 25%),
    linear-gradient(-45deg, var(--dialog-checker) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--dialog-checker) 75%),
    linear-gradient(-45deg, transparent 75%, var(--dialog-checker) 75%);
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
  background-size: 20px 20px;
  cursor: grab;
  place-items: center;
  touch-action: none;
}

.photo-dialog__figure.is-dragging {
  cursor: grabbing;
}

.photo-dialog__figure img {
  position: absolute;
  inset: 0;
  display: block;
  width: auto;
  height: auto;
  margin: auto;
  max-width: calc(100% - clamp(5rem, 12vw, 10rem));
  max-height: calc(100% - clamp(5.5rem, 15vh, 8rem));
  object-fit: contain;
  pointer-events: none;
  transform-origin: center;
  user-select: none;
  will-change: transform;
}

.photo-dialog__figure figcaption {
  position: absolute;
  top: 1rem;
  left: 1.1rem;
  margin: 0;
  color: var(--dialog-muted);
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  pointer-events: none;
  text-transform: uppercase;
  user-select: none;
}

.photo-dialog__canvas-controls {
  position: absolute;
  z-index: 2;
  bottom: 1rem;
  left: 50%;
  display: grid;
  grid-template-columns: 2rem 3.6rem 2rem;
  min-height: 2rem;
  overflow: hidden;
  border: 1px dashed var(--dialog-line);
  /* background: var(--dialog-control); */
  backdrop-filter: blur(0.75rem);
  transform: translateX(-50%);
}

.photo-dialog__canvas-controls button {
  display: grid;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dialog-text);
  font: inherit;
  cursor: pointer;
  place-items: center;
}

.photo-dialog__canvas-controls button + button {
  border-left: 1px dashed var(--dialog-line);
}

.photo-dialog__canvas-controls i {
  font-size: 0.82rem;
}

.photo-dialog__canvas-controls .photo-dialog__zoom-value {
  color: var(--dialog-muted);
  font-size: 0.56rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  user-select: none;
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
  border-left: 1px dashed var(--dialog-line);
  scrollbar-width: thin;
}

.photo-dialog__detail-group + .photo-dialog__detail-group {
  margin-top: clamp(2rem, 4vh, 3.5rem);
}

.photo-dialog__detail-group h3 {
  margin-bottom: 1rem;
  color: var(--dialog-muted);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.photo-dialog__detail-group dl > div {
  display: grid;
  grid-template-columns: minmax(4.8rem, 0.75fr) minmax(0, 1fr);
  align-items: start;
  gap: 0.75rem;
  padding: 0.45rem 0;
}

.photo-dialog__detail-group dt,
.photo-dialog__detail-group dd {
  font-size: 0.66rem;
  line-height: 1.45;
}

.photo-dialog__detail-group dt {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--dialog-muted);
}

.photo-dialog__detail-group dt i {
  flex: 0 0 auto;
  font-size: 0.78rem;
}

.photo-dialog__detail-group dd {
  overflow-wrap: anywhere;
  color: var(--dialog-text);
  text-align: right;
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

@media (hover: hover) and (pointer: fine) {
  .photo-dialog__text-action:hover::after {
    opacity: 0.8;
    transform: scaleX(0.45);
  }

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

  .photo-dialog__canvas-controls button:hover {
    background: var(--dialog-checker);
  }
}

.photo-dialog__text-action:active,
.photo-dialog__close:active,
.photo-dialog__filmstrip button:active {
  transform: scale(0.97);
}

.photo-dialog__text-action:focus-visible,
.photo-dialog__close:focus-visible,
.photo-dialog__nav:focus-visible,
.photo-dialog__canvas-controls button:focus-visible,
.photo-dialog__filmstrip button:focus-visible {
  outline: 1px dashed var(--dialog-text);
  outline-offset: 0.35rem;
}

.photo-dialog-enter-active,
.photo-dialog-leave-active {
  transition: opacity 240ms ease;
}

.photo-dialog-enter-active .photo-dialog__figure,
.photo-dialog-leave-active .photo-dialog__figure {
  transition:
    opacity 320ms ease,
    transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-dialog-enter-from,
.photo-dialog-leave-to,
.photo-dialog-enter-from .photo-dialog__figure,
.photo-dialog-leave-to .photo-dialog__figure {
  opacity: 0;
}

.photo-dialog-enter-from .photo-dialog__figure,
.photo-dialog-leave-to .photo-dialog__figure {
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

  .photo-dialog__text-action {
    font-size: 0.6rem;
  }

  .photo-dialog__body {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(46dvh, 1fr) minmax(0, 31dvh);
  }

  .photo-dialog__figure {
    min-height: 0;
  }

  .photo-dialog__figure img {
    max-width: calc(100% - 4rem);
    max-height: calc(100% - 4.5rem);
  }

  .photo-dialog__figure figcaption {
    top: 0.75rem;
    left: 0.8rem;
    font-size: 0.5rem;
  }

  .photo-dialog__canvas-controls {
    bottom: 0.75rem;
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
  .photo-dialog-enter-active .photo-dialog__figure,
  .photo-dialog-leave-active .photo-dialog__figure,
  .photo-dialog__text-action,
  .photo-dialog__text-action::after,
  .photo-dialog__close,
  .photo-dialog__nav,
  .photo-dialog__canvas-controls button,
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

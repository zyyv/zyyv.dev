<script setup lang="ts">
import type { Photo } from '~/types'

const props = defineProps<{
  photos: readonly Photo[]
  focusedPhoto?: Photo | null
}>()

const orbitDefinitions = [
  { id: 'one', className: 'photo-field__orbit--one' },
  { id: 'two', className: 'photo-field__orbit--two' },
  { id: 'three', className: 'photo-field__orbit--three' },
  { id: 'four', className: 'photo-field__orbit--four' },
] as const

const fieldRef = useTemplateRef<HTMLButtonElement>('field')
const pulseId = shallowRef(0)
const activePhotoId = shallowRef<string | null>(props.focusedPhoto?.id ?? null)
const activePhotoIndex = computed(() => {
  if (!props.photos.length) return -1
  const index = props.photos.findIndex((photo) => photo.id === activePhotoId.value)
  return index >= 0 ? index : 0
})
const activePhoto = computed(() => {
  if (activePhotoIndex.value < 0) return undefined
  return props.photos[activePhotoIndex.value]
})
const orbitPhotos = computed(() => {
  const { length } = props.photos
  if (!length) return []

  const offsets = Array.from({ length: 5 }, (_, index) =>
    Math.max(1, Math.round((length / 6) * (index + 1))),
  )
  return offsets.map((offset) => props.photos[(activePhotoIndex.value + offset) % length])
})
const fieldLabel = computed(() =>
  activePhoto.value ? `切换焦点照片，当前为 ${activePhoto.value.filename}` : '照片焦点场',
)

function updateFieldPosition(event: PointerEvent) {
  const field = fieldRef.value
  if (!field) return

  const bounds = field.getBoundingClientRect()
  const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5
  const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5

  field.style.setProperty('--field-shift-x', `${normalizedX * 2.2}rem`)
  field.style.setProperty('--field-shift-y', `${normalizedY * 2.2}rem`)
  field.style.setProperty('--field-stage-x', `${normalizedX * 0.35}rem`)
  field.style.setProperty('--field-stage-y', `${normalizedY * 0.35}rem`)
  field.style.setProperty('--field-tilt-x', `${normalizedY * -1.8}deg`)
  field.style.setProperty('--field-tilt-y', `${normalizedX * 1.8}deg`)
}

function resetFieldPosition() {
  const field = fieldRef.value
  if (!field) return

  field.style.setProperty('--field-shift-x', '0rem')
  field.style.setProperty('--field-shift-y', '0rem')
  field.style.setProperty('--field-stage-x', '0rem')
  field.style.setProperty('--field-stage-y', '0rem')
  field.style.setProperty('--field-tilt-x', '0deg')
  field.style.setProperty('--field-tilt-y', '0deg')
}

function pulseFocus() {
  pulseId.value += 1
  if (!props.photos.length) return

  const nextIndex = (activePhotoIndex.value + 1) % props.photos.length
  activePhotoId.value = props.photos[nextIndex]?.id ?? null
}

watch(
  () => props.focusedPhoto?.id,
  (photoId) => {
    if (!photoId || photoId === activePhotoId.value) return
    activePhotoId.value = photoId
    pulseId.value += 1
  },
  { immediate: true },
)
</script>

<template>
  <button
    ref="field"
    type="button"
    class="photo-field"
    data-ripplable-interactive
    :aria-label="fieldLabel"
    @click="pulseFocus"
    @pointermove="updateFieldPosition"
    @pointerleave="resetFieldPosition"
  >
    <span class="photo-field__stage" aria-hidden="true">
      <span class="photo-field__axis photo-field__axis--horizontal" />
      <span class="photo-field__axis photo-field__axis--vertical" />
      <span
        v-for="(orbit, index) in orbitDefinitions"
        :key="orbit.id"
        :class="['photo-field__orbit', orbit.className]"
      >
        <span class="photo-field__node">
          <img
            v-if="orbitPhotos[index]"
            :src="orbitPhotos[index].thumbnail"
            alt=""
            decoding="async"
            draggable="false"
          />
        </span>
      </span>

      <span class="photo-field__focus">
        <Transition name="photo-field-image">
          <img
            v-if="activePhoto"
            :key="activePhoto.id"
            class="photo-field__preview"
            :src="activePhoto.thumbnail"
            alt=""
            decoding="async"
            draggable="false"
          />
        </Transition>
        <span v-if="pulseId" :key="pulseId" class="photo-field__pulse" />
        <span class="photo-field__bracket photo-field__bracket--top-left" />
        <span class="photo-field__bracket photo-field__bracket--top-right" />
        <span class="photo-field__bracket photo-field__bracket--bottom-left" />
        <span class="photo-field__bracket photo-field__bracket--bottom-right" />
        <span class="photo-field__focus-point" />
      </span>
    </span>
  </button>
</template>

<style scoped>
.photo-field {
  --field-ink: rgb(17 17 15 / 68%);
  --field-muted: rgb(17 17 15 / 28%);
  --field-faint: rgb(17 17 15 / 11%);
  --field-shift-x: 0rem;
  --field-shift-y: 0rem;
  --field-stage-x: 0rem;
  --field-stage-y: 0rem;
  --field-tilt-x: 0deg;
  --field-tilt-y: 0deg;

  position: absolute;
  z-index: 45;
  top: 6.5rem;
  left: clamp(5.75rem, 7vw, 8.5rem);
  width: clamp(16rem, 23vw, 21rem);
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--field-ink);
  font: inherit;
  text-align: left;
  cursor: crosshair;
  outline: none;
  transform: perspective(48rem) rotateX(var(--field-tilt-x)) rotateY(var(--field-tilt-y));
  transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

:global(.dark .photo-field) {
  --field-ink: rgb(233 233 229 / 70%);
  --field-muted: rgb(233 233 229 / 30%);
  --field-faint: rgb(233 233 229 / 10%);
}

.photo-field:focus-visible {
  outline: none;
}

.photo-field:focus-visible .photo-field__stage {
  box-shadow: 0 0 0 1px var(--field-muted);
}

.photo-field__stage {
  position: absolute;
  inset: 0.8rem;
  border-radius: 50%;
  transform: translate3d(var(--field-stage-x), var(--field-stage-y), 0);
  transition: transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-field__stage::before,
.photo-field__stage::after {
  position: absolute;
  border-radius: 50%;
  content: '';
  pointer-events: none;
}

.photo-field__axis {
  position: absolute;
  top: 50%;
  left: 50%;
  background: var(--field-faint);
  transform: translate(-50%, -50%);
}

.photo-field__axis--horizontal {
  width: 92%;
  height: 1px;
}

.photo-field__axis--vertical {
  width: 1px;
  height: 92%;
}

.photo-field__orbit {
  position: absolute;
  border: 1px solid var(--field-muted);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.photo-field__orbit--one {
  top: 46%;
  left: 47%;
  width: 88%;
  height: 67%;
  border-style: dashed;
  border-color: var(--field-faint);
  animation: photo-field-orbit 31s linear infinite;
}

.photo-field__orbit--two {
  top: 53%;
  left: 55%;
  width: 72%;
  height: 89%;
  border-style: dashed;
  border-color: var(--field-faint);
  animation: photo-field-orbit-reverse 27s linear infinite;
}

.photo-field__orbit--three {
  top: 45%;
  left: 52%;
  width: 59%;
  height: 43%;
  border-style: dashed;
  border-color: var(--field-faint);
  animation: photo-field-orbit 22s linear infinite;
}

.photo-field__orbit--four {
  top: 56%;
  left: 43%;
  width: 43%;
  height: 59%;
  border-style: dashed;
  border-color: var(--field-faint);
  animation: photo-field-orbit-reverse 18s linear infinite;
}

.photo-field__node {
  position: absolute;
  width: 1.4rem;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.photo-field__node img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.08);
  opacity: 0.62;
  transition:
    filter 420ms ease,
    opacity 420ms ease,
    transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-field__orbit--one .photo-field__node {
  top: 8%;
  right: 17%;
}

.photo-field__orbit--two .photo-field__node {
  right: 1%;
  bottom: 22%;
}

.photo-field__orbit--three .photo-field__node {
  bottom: -0.65rem;
  left: 27%;
}

.photo-field__orbit--four .photo-field__node {
  top: 15%;
  left: -0.6rem;
}

.photo-field__focus {
  position: absolute;
  z-index: 3;
  top: 50%;
  left: 50%;
  width: 4.5rem;
  aspect-ratio: 1;
  transform: translate(calc(-50% + var(--field-shift-x)), calc(-50% + var(--field-shift-y)));
  transition: transform 480ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-field__preview {
  position: absolute;
  inset: 0.55rem;
  width: calc(100% - 1.1rem);
  height: calc(100% - 1.1rem);
  border: 1px solid var(--field-faint);
  border-radius: 50%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.08);
  opacity: 0.48;
  transition:
    filter 480ms ease,
    opacity 480ms ease,
    transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-field-image-enter-active,
.photo-field-image-leave-active {
  transition:
    opacity 360ms ease,
    transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-field-image-leave-active {
  position: absolute;
}

.photo-field-image-enter-from {
  opacity: 0;
  transform: scale(0.78) rotate(-8deg);
}

.photo-field-image-leave-to {
  opacity: 0;
  transform: scale(1.14) rotate(6deg);
}

.photo-field__bracket {
  position: absolute;
  width: 0.9rem;
  height: 0.9rem;
  border-color: var(--field-ink);
  border-style: solid;
  transition:
    width 360ms cubic-bezier(0.16, 1, 0.3, 1),
    height 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-field__bracket--top-left {
  top: 0;
  left: 0;
  border-width: 1px 0 0 1px;
}

.photo-field__bracket--top-right {
  top: 0;
  right: 0;
  border-width: 1px 1px 0 0;
}

.photo-field__bracket--bottom-left {
  bottom: 0;
  left: 0;
  border-width: 0 0 1px 1px;
}

.photo-field__bracket--bottom-right {
  right: 0;
  bottom: 0;
  border-width: 0 1px 1px 0;
}

.photo-field__focus-point {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.45rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: currentColor;
  box-shadow:
    0 0 0 0.3rem color-mix(in srgb, currentColor 8%, transparent),
    0 0 1.5rem color-mix(in srgb, currentColor 24%, transparent);
  transform: translate(-50%, -50%);
  animation: photo-field-breathe 3.8s ease-in-out infinite;
}

.photo-field__pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1rem;
  aspect-ratio: 1;
  border: 1px solid currentColor;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: photo-field-pulse 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.photo-field:hover {
  --field-muted: color-mix(in srgb, currentColor 42%, transparent);
}

.photo-field:hover .photo-field__bracket {
  width: 1.15rem;
  height: 1.15rem;
}

.photo-field:hover .photo-field__preview {
  filter: grayscale(0.15) contrast(1.02);
  opacity: 0.78;
  transform: scale(1.08);
}

.photo-field:hover .photo-field__node img {
  filter: grayscale(0.35) contrast(1.02);
  opacity: 0.82;
  transform: scale(1.12);
}

.photo-field:active {
  transform: perspective(48rem) rotateX(var(--field-tilt-x)) rotateY(var(--field-tilt-y))
    scale(0.985);
}

@keyframes photo-field-orbit {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes photo-field-orbit-reverse {
  from {
    transform: translate(-50%, -50%) rotate(360deg);
  }

  to {
    transform: translate(-50%, -50%) rotate(0deg);
  }
}

@keyframes photo-field-breathe {
  0%,
  100% {
    opacity: 0.48;
    transform: translate(-50%, -50%) scale(0.82);
  }

  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes photo-field-pulse {
  from {
    opacity: 0.72;
    transform: translate(-50%, -50%) scale(0.5);
  }

  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(8);
  }
}

@media (max-width: 760px), (max-height: 620px) {
  .photo-field {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-field,
  .photo-field__stage,
  .photo-field__focus,
  .photo-field__preview,
  .photo-field__node img {
    transition: none;
  }

  .photo-field__orbit,
  .photo-field__focus-point,
  .photo-field__pulse {
    animation: none;
  }
}
</style>

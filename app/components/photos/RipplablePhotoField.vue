<script setup lang="ts">
const props = defineProps<{
  photoCount: number
}>()

const fieldRef = useTemplateRef<HTMLButtonElement>('field')
const pulseId = shallowRef(0)
const formattedPhotoCount = computed(() => String(props.photoCount).padStart(3, '0'))

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
}
</script>

<template>
  <button
    ref="field"
    type="button"
    class="photo-field"
    data-ripplable-interactive
    :aria-label="`触发对焦脉冲，当前共 ${photoCount} 张照片`"
    @click="pulseFocus"
    @pointermove="updateFieldPosition"
    @pointerleave="resetFieldPosition"
  >
    <span class="photo-field__meta">
      <span>focus field</span>
      <span>{{ formattedPhotoCount }} frames</span>
    </span>

    <span class="photo-field__stage" aria-hidden="true">
      <span class="photo-field__axis photo-field__axis--horizontal" />
      <span class="photo-field__axis photo-field__axis--vertical" />
      <span class="photo-field__orbit photo-field__orbit--outer">
        <span class="photo-field__node photo-field__node--one" />
      </span>
      <span class="photo-field__orbit photo-field__orbit--middle">
        <span class="photo-field__node photo-field__node--two" />
      </span>
      <span class="photo-field__orbit photo-field__orbit--inner">
        <span class="photo-field__node photo-field__node--three" />
      </span>

      <span class="photo-field__focus">
        <span v-if="pulseId" :key="pulseId" class="photo-field__pulse" />
        <span class="photo-field__bracket photo-field__bracket--top-left" />
        <span class="photo-field__bracket photo-field__bracket--top-right" />
        <span class="photo-field__bracket photo-field__bracket--bottom-left" />
        <span class="photo-field__bracket photo-field__bracket--bottom-right" />
        <span class="photo-field__focus-point" />
      </span>
    </span>

    <span class="photo-field__hint">
      <span>move to calibrate</span>
      <span>click to focus</span>
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
  outline: 1px solid var(--field-ink);
  outline-offset: 0.75rem;
}

.photo-field__meta,
.photo-field__hint {
  position: absolute;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  width: 100%;
  color: var(--field-muted);
  font-size: 0.6rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: 0.14em;
  line-height: 1;
  text-transform: uppercase;
  transition: color 300ms ease;
}

.photo-field__meta {
  top: 0;
}

.photo-field__hint {
  bottom: 0;
  font-size: 0.54rem;
  letter-spacing: 0.1em;
}

.photo-field__stage {
  position: absolute;
  inset: 2rem 1.2rem;
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

.photo-field__stage::before {
  inset: 8%;
  border: 1px solid var(--field-faint);
  mask-image: conic-gradient(
    #000 0 14%,
    transparent 14% 20%,
    #000 20% 62%,
    transparent 62% 70%,
    #000 70%
  );
}

.photo-field__stage::after {
  inset: 27%;
  background: radial-gradient(circle, var(--field-faint), transparent 64%);
  opacity: 0.5;
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
  top: 50%;
  left: 50%;
  border: 1px solid var(--field-muted);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.photo-field__orbit--outer {
  width: 82%;
  aspect-ratio: 1;
  border-style: dashed;
  animation: photo-field-orbit 26s linear infinite;
}

.photo-field__orbit--middle {
  width: 61%;
  aspect-ratio: 1;
  border-color: var(--field-faint);
  animation: photo-field-orbit-reverse 19s linear infinite;
}

.photo-field__orbit--inner {
  width: 39%;
  aspect-ratio: 1;
  border-style: dotted;
  animation: photo-field-orbit 13s linear infinite;
}

.photo-field__node {
  position: absolute;
  width: 0.38rem;
  aspect-ratio: 1;
  border: 1px solid var(--field-ink);
  border-radius: 50%;
  background: color-mix(in srgb, currentColor 22%, transparent);
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, currentColor 6%, transparent);
}

.photo-field__node--one {
  top: 10%;
  right: 13%;
}

.photo-field__node--two {
  bottom: 4%;
  left: 30%;
}

.photo-field__node--three {
  top: 42%;
  left: -0.2rem;
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

.photo-field:hover .photo-field__meta,
.photo-field:hover .photo-field__hint {
  color: var(--field-ink);
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
  .photo-field__focus {
    transition: none;
  }

  .photo-field__orbit,
  .photo-field__focus-point,
  .photo-field__pulse {
    animation: none;
  }
}
</style>

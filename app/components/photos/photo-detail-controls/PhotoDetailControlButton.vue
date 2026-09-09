<script setup lang="ts">
import { computed } from 'vue'

type PopupValue = boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
type ButtonVariant = 'default' | 'value'
type ButtonTone = 'default' | 'success'

interface Props {
  label: string
  icon?: string
  text?: string
  title?: string
  href?: string
  download?: string
  disabled?: boolean
  loading?: boolean
  progress?: number
  pressed?: boolean
  expanded?: boolean
  hasPopup?: PopupValue
  live?: 'polite' | 'assertive' | 'off'
  variant?: ButtonVariant
  tone?: ButtonTone
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  href: undefined,
  download: undefined,
  disabled: false,
  loading: false,
  progress: 0,
  pressed: undefined,
  expanded: undefined,
  hasPopup: undefined,
  live: undefined,
  variant: 'default',
  tone: 'default',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isLink = computed(() => Boolean(props.href) && !props.loading && !props.disabled)
const isDisabled = computed(() => props.disabled || props.loading)
const accessibleTitle = computed(() => props.title ?? props.label)
const normalizedProgress = computed(() => Math.min(100, Math.max(0, props.progress)))
const progressStyle = computed(() => ({
  strokeDashoffset: `${50.27 * (1 - normalizedProgress.value / 100)}`,
}))
const buttonClasses = computed(() => [
  'photo-detail-control-button',
  `photo-detail-control-button--${props.variant}`,
  {
    'is-success': props.tone === 'success',
    'is-loading': props.loading,
  },
])

function handleClick(event: MouseEvent) {
  emit('click', event)
}
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    :class="buttonClasses"
    :type="isLink ? undefined : 'button'"
    :href="isLink ? props.href : undefined"
    :download="isLink ? props.download : undefined"
    :disabled="isLink ? undefined : isDisabled"
    :aria-label="props.loading ? `${props.label}, ${normalizedProgress}%` : props.label"
    :aria-disabled="isLink && isDisabled ? 'true' : undefined"
    :aria-busy="props.loading ? 'true' : undefined"
    :aria-pressed="props.pressed"
    :aria-expanded="props.expanded"
    :aria-haspopup="props.hasPopup"
    :aria-live="props.live"
    :title="accessibleTitle"
    data-cuelume-hover="tick"
    data-cuelume-toggle="pulse"
    @click.stop="handleClick"
  >
    <svg
      v-if="props.loading"
      class="photo-detail-control-button__progress"
      viewBox="0 0 20 20"
      role="progressbar"
      :aria-label="`${props.label}, ${normalizedProgress}%`"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="normalizedProgress"
    >
      <circle class="photo-detail-control-button__progress-track" cx="10" cy="10" r="8" />
      <circle
        class="photo-detail-control-button__progress-value"
        cx="10"
        cy="10"
        r="8"
        :style="progressStyle"
      />
    </svg>
    <i v-else-if="props.icon" :class="props.icon" aria-hidden="true" />
    <span v-else>{{ props.text }}</span>
  </component>
</template>

<style scoped>
.photo-detail-control-button {
  display: grid;
  flex: 0 0 auto;
  width: 2rem;
  min-height: 2rem;
  padding: 0;
  border: 0;
  border-radius: var(--photo-detail-control-radius, 0);
  background: transparent;
  color: var(--photo-detail-control-color, var(--media-text-color, var(--dialog-text, #f4f4f0)));
  font: inherit;
  cursor: pointer;
  place-items: center;
  text-decoration: none;
  transition: background 180ms ease;
}

.photo-detail-control-button--value {
  width: 3.6rem;
  color: var(--photo-detail-control-muted, var(--dialog-muted, rgb(244 244 240 / 72%)));
  font-size: 0.56rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  user-select: none;
}

.photo-detail-control-button.is-success {
  color: var(--photo-detail-control-success, #4b9b68);
}

.photo-detail-control-button i {
  display: block;
  width: 1.05rem;
  height: 1.05rem;
  color: currentColor;
  font-size: 1.05rem;
  line-height: 1;
}

.photo-detail-control-button:disabled,
.photo-detail-control-button.is-loading {
  cursor: wait;
}

.photo-detail-control-button:focus-visible {
  outline: 1px dashed currentColor;
  outline-offset: 0.35rem;
}

.photo-detail-control-button__progress {
  width: 1.05rem;
  height: 1.05rem;
  overflow: visible;
  transform: rotate(-90deg);
}

.photo-detail-control-button__progress circle {
  fill: none;
  stroke-width: 1.5;
}

.photo-detail-control-button__progress-track {
  stroke: color-mix(in srgb, currentColor 18%, transparent);
}

.photo-detail-control-button__progress-value {
  stroke: currentColor;
  stroke-dasharray: 50.27;
  stroke-dashoffset: 50.27;
  stroke-linecap: round;
  transition: stroke-dashoffset 140ms linear;
}

@media (hover: hover) and (pointer: fine) {
  .photo-detail-control-button:hover:not(:disabled) {
    background: var(
      --photo-detail-control-hover-background,
      var(--media-control-hover-background, var(--dialog-checker, rgb(244 244 240 / 8%)))
    );
  }
}

@media (max-width: 767.9px) {
  .photo-detail-control-button {
    min-height: 1.9rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-detail-control-button,
  .photo-detail-control-button__progress-value {
    transition-duration: 1ms;
  }
}
</style>

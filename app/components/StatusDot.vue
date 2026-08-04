<script setup lang="ts">
interface Props {
  active?: boolean
  color?: string
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: true,
  color: '#4f9a68',
  pulse: false,
})

const dotStyle = computed(() => ({ '--status-dot-color': props.color }))
</script>

<template>
  <span
    class="status-dot"
    :class="{
      'status-dot--active': active,
      'status-dot--pulse': active && pulse,
    }"
    :style="dotStyle"
    aria-hidden="true"
  />
</template>

<style scoped>
.status-dot {
  position: relative;
  display: inline-block;
  width: 0.4rem;
  height: 0.4rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: color-mix(in srgb, currentColor 28%, transparent);
}

.status-dot--active {
  background: var(--status-dot-color);
  box-shadow: 0 0 0 0.15rem color-mix(in srgb, var(--status-dot-color) 16%, transparent);
}

.status-dot--pulse::after {
  position: absolute;
  inset: -0.16rem;
  border: 1px solid color-mix(in srgb, var(--status-dot-color) 58%, transparent);
  border-radius: inherit;
  content: '';
  opacity: 0;
  transform: scale(0.72);
  animation: status-dot-pulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  pointer-events: none;
}

@keyframes status-dot-pulse {
  0% {
    opacity: 0;
    transform: scale(0.72);
  }

  14% {
    opacity: 0.62;
  }

  72%,
  100% {
    opacity: 0;
    transform: scale(1.55);
  }
}

@media (prefers-reduced-motion: reduce) {
  .status-dot--pulse::after {
    opacity: 0.38;
    transform: scale(1);
    animation: none;
  }
}
</style>

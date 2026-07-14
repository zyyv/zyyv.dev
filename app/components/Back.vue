<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: 'Back',
  },
)

function goBack() {
  if (!import.meta.client) return
  if (history.length > 1) history.back()
  else navigateTo('/posts')
}
</script>

<template>
  <button type="button" class="back-link" @click="goBack">
    <i class="i-hugeicons:arrow-left-02" aria-hidden="true" />
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0 0 0.25rem;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, currentColor 45%, transparent);
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.7rem;
  cursor: pointer;
  opacity: 0.62;
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.back-link:hover {
  opacity: 1;
  transform: translateX(-0.15rem);
}

.back-link:active {
  transform: translateX(-0.15rem) translateY(1px);
}

.back-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 0.35rem;
}

@media (prefers-reduced-motion: reduce) {
  .back-link {
    transition: none;
  }
}
</style>

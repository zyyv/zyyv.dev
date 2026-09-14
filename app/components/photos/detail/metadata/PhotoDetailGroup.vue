<script setup lang="ts">
interface Props {
  title: string
  live?: 'off' | 'polite' | 'assertive'
}

const props = withDefaults(defineProps<Props>(), {
  live: 'off',
})
const liveRegion = computed(() => (props.live === 'off' ? undefined : props.live))
</script>

<template>
  <section class="photo-dialog__detail-group" :aria-live="liveRegion">
    <h3>{{ title }}</h3>
    <slot />
  </section>
</template>

<style scoped>
.photo-dialog__detail-group h3 {
  margin: 0 0 1rem;
  color: var(--dialog-muted);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

:deep(.photo-dialog__detail-list),
:deep(.photo-dialog__detail-list dd) {
  margin: 0;
}

:deep(.photo-dialog__detail-list > div) {
  display: grid;
  grid-template-columns: minmax(4.8rem, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 0.75rem;
  padding: 0.45rem 0;
}

:deep(.photo-dialog__detail-list dt),
:deep(.photo-dialog__detail-list dd) {
  font-size: 0.66rem;
  line-height: 1.45;
}

:deep(.photo-dialog__detail-list dt) {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--dialog-muted);
}

:deep(.photo-dialog__detail-list dt i) {
  flex: 0 0 auto;
  font-size: 0.78rem;
}

:deep(.photo-dialog__detail-list dd) {
  overflow-wrap: anywhere;
  color: var(--dialog-text);
  text-align: right;
}

:deep(.photo-dialog__reaction-list dd) {
  font-variant-numeric: tabular-nums;
}

:deep(.photo-dialog__reaction-list dt i) {
  font-size: 1rem;
}
</style>

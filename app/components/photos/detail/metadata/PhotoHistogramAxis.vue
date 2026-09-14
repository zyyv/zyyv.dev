<script setup lang="ts">
const ticks = [0, 52, 104, 156, 208, 255] as const
</script>

<template>
  <div class="photo-histogram-axis" aria-hidden="true">
    <span v-for="tick in ticks" :key="tick">{{ tick }}</span>
  </div>
</template>

<style scoped>
.photo-histogram-axis {
  position: absolute;
  right: 0.05rem;
  bottom: 0;
  left: 0.05rem;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  color: var(--dialog-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 9px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
</style>

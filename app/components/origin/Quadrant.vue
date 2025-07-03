<script lang="ts" setup>
defineProps<{
  quadrant: string
}>()
</script>

<template>
  <section class="quadrant pr group">
    <slot />
    <OriginFullQuadrant :quadrant />
  </section>
</template>

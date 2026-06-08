<script lang="ts" setup>
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <h2 text-2xl fw-bold md-text-3xl mb4 mt-12>
    {{ title }}
  </h2>
  <p font-dank text-xs md-text-sm italic>
    {{ description }}
  </p>
</template>

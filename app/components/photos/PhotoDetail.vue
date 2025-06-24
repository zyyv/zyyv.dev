<script lang="ts" setup>
defineProps<{
  id: string
}>()
</script>

<template>
  <div fccc>
    <img
      :src="`/photos/${id}.jpg`"
      class="max-w-80vw max-h-80vh"
      :alt="id"
    >
    details: {{ id }}
  </div>
</template>

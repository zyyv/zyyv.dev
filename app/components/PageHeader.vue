<script lang="ts" setup>
defineProps<{
  title: string
  description: string
  eyebrow?: string
}>()
</script>

<template>
  <header class="page-header">
    <p v-if="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</p>
    <h1>{{ title }}</h1>
    <p class="page-header__description">{{ description }}</p>
  </header>
</template>

<style scoped>
.page-header {
  padding: clamp(6.5rem, 13vw, 9.5rem) 0 clamp(2.75rem, 6vw, 4.5rem);
  border-bottom: 1px solid color-mix(in srgb, currentColor 14%, transparent);
}

.page-header__eyebrow {
  margin: 0 0 1.2rem;
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  opacity: 0.48;
  text-transform: uppercase;
}

.page-header h1 {
  max-width: 12ch;
  margin: 0;
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(2.6rem, 6vw, 4.8rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.065em;
  text-wrap: balance;
}

.page-header__description {
  max-width: 34rem;
  margin: 1.35rem 0 0;
  font-size: clamp(0.82rem, 1.2vw, 0.94rem);
  line-height: 1.65;
  opacity: 0.56;
  text-wrap: pretty;
}

@media (max-width: 767.9px) {
  .page-header {
    padding-top: 5.75rem;
  }
}
</style>

<script setup lang="ts">
useSeoMeta({
  title: 'About - Chris',
  description: 'Chris is an open-source maintainer, front-end engineer, and photographer.',
  ogType: 'profile',
  ogTitle: 'About - Chris',
  ogDescription: 'Chris is an open-source maintainer, front-end engineer, and photographer.',
  ogImage: 'https://zyyv.dev/og.png#1',
  ogUrl: 'https://zyyv.dev/about',
  twitterTitle: 'About - Chris',
  twitterDescription: 'Chris is an open-source maintainer, front-end engineer, and photographer.',
  twitterImage: 'https://zyyv.dev/og.png#1',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zyyv.dev/about' }],
})
</script>

<template>
  <div class="about-page">
    <AboutHero />
  </div>
</template>

<style scoped>
.about-page {
  width: 100%;
  min-width: 0;
  overflow-x: clip;
  background: #e9e9e5;
  color: #11110f;
}

:global(body:has(.about-page)) {
  background-color: #e9e9e5;
  background-image: none;
}

:global(.dark .about-page) {
  background: #11110f;
  color: #e9e9e5;
}

:global(.dark body:has(.about-page)) {
  background-color: #11110f;
  background-image: none;
}
</style>

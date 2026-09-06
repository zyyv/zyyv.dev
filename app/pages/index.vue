<script setup lang="ts">
import Home from '~/components/Home.vue'

useSeoMeta({
  title: 'Chris',
  description: 'Regardless of the past, do not ask the future.',
  ogType: 'website',
  ogTitle: 'Chris',
  ogDescription: 'Regardless of the past, do not ask the future.',
  ogImage: 'https://zyyv.dev/og.png#1',
  ogUrl: 'https://zyyv.dev/',
  twitterTitle: 'Chris',
  twitterDescription: 'Regardless of the past, do not ask the future.',
  twitterImage: 'https://zyyv.dev/og.png#1',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://zyyv.dev/' },
    { rel: 'preload', as: 'image', href: '/avatar.webp', fetchpriority: 'high' },
  ],
})
</script>

<template>
  <Home />
</template>

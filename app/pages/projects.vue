<script setup lang="ts">
useSeoMeta({
  title: 'Projects - Chris',
  description: 'Open-source projects and experiments by Chris.',
  ogType: 'website',
  ogTitle: 'Projects - Chris',
  ogDescription: 'Open-source projects and experiments by Chris.',
  ogImage: 'https://zyyv.dev/og.png#1',
  ogUrl: 'https://zyyv.dev/projects',
  twitterTitle: 'Projects - Chris',
  twitterDescription: 'Open-source projects and experiments by Chris.',
  twitterImage: 'https://zyyv.dev/og.png#1',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://zyyv.dev/projects' }],
})
</script>

<template>
  <div class="mx-auto w-[min(calc(100%-2rem),68rem)] pb-[clamp(3rem,8vw,7rem)] pt-16">
    <PageHeader title="Projects" description="Open-source projects and experiments." />
    <Projects />
  </div>
</template>

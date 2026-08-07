<script setup lang="ts">
import BookmarksPage from '~/components/bookmarks/BookmarksPage.vue'

useSeoMeta({
  title: 'Bookmarks - Chris',
  description: 'A curated collection of useful tools, references, and pages worth returning to.',
  ogType: 'website',
  ogTitle: 'Bookmarks - Chris',
  ogDescription: 'A curated collection of useful tools, references, and pages worth returning to.',
  ogImage: 'https://zyyv.dev/og.png#1',
  ogUrl: 'https://zyyv.dev/bookmarks',
  twitterTitle: 'Bookmarks - Chris',
  twitterDescription:
    'A curated collection of useful tools, references, and pages worth returning to.',
  twitterImage: 'https://zyyv.dev/og.png#1',
})

useHead({ link: [{ rel: 'canonical', href: 'https://zyyv.dev/bookmarks' }] })
</script>

<template>
  <BookmarksPage />
</template>

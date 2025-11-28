<script setup>
const ogUrl = 'https://zyyv.dev/'
const ogImage = `${ogUrl}og.png#1`
const title = 'Chris.me'
const description = 'Regardless of the past, do not ask the future.'

useHead({
  title: 'Chris',
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/avatar.png' },
  ],
  meta: [
    { name: 'author', content: 'Chris' },
    { hid: 'description', name: 'description', content: 'Chris\' Portfolio' },
    { hid: 'keywords', name: 'keywords', content: 'Chris, Blog, Portfolio' },

    { property: 'og:type', content: 'website' },
    { name: 'og:title', content: title },
    { name: 'og:description', content: description },
    { property: 'og:image', content: ogImage },
    { name: 'twitter:title', content: title },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: ogImage },
    { name: 'twitter:site', content: '@chris_zyyv' },
    { name: 'twitter:url', content: ogUrl },
  ],
  charset: 'utf-8',
  viewport: 'width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0',
})

useCenter().initQuadrantSizeConfig()
</script>

<template>
  <!-- <NuxtLoadingIndicator
    :height="1"
    color="repeating-linear-gradient(to right,rgba(192,132,252,1) 0%,rgba(248,113,113,1) 50%,rgba(45,212,191,1) 100%)"
  /> -->
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

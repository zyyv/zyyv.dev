<script setup lang="ts">
import PhotoAdmin from '~/components/admin/PhotoAdmin.vue'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Photo Admin - Chris',
  description: 'Photo archive management',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <PhotoAdmin />
</template>

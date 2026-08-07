<script setup lang="ts">
import PhotoAdmin from '~/components/admin/PhotoAdmin.vue'

definePageMeta({ layout: 'default' })

const { authenticated, refreshSession } = useAdminSession()
await refreshSession()

if (!authenticated.value) {
  await navigateTo({ path: '/admin', query: { redirect: '/admin/photos' } })
}

useSeoMeta({
  title: 'Photo Archive - Chris',
  description: 'Private photo archive',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <PhotoAdmin />
</template>

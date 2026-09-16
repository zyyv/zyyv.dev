<script setup lang="ts">
import BookmarkAdmin from '~/components/admin/BookmarkAdmin.vue'

definePageMeta({ layout: 'default' })

const { authenticated, refreshSession } = useAdminSession()
await refreshSession()

if (!authenticated.value) {
  await navigateTo({ path: '/admin', query: { redirect: '/admin/bookmarks' } })
}

useSeoMeta({
  title: 'Bookmark Archive - Chris',
  description: 'Private bookmark archive',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <BookmarkAdmin />
</template>

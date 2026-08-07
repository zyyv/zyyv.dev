<script setup lang="ts">
import AdminLogin from '~/components/admin/AdminLogin.vue'
import AdminPortal from '~/components/admin/AdminPortal.vue'

const route = useRoute()
const { authenticated, mutating, error, login, clearError } = useAdminSession()

const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/admin/') ? redirect : null
})

async function handleLogin(password: string) {
  const success = await login(password)
  if (success && redirectPath.value) await navigateTo(redirectPath.value)
}

onBeforeUnmount(clearError)

useSeoMeta({
  title: 'Admin - Chris',
  description: 'Site administration',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <AdminPortal v-if="authenticated" />
  <AdminLogin v-else :loading="mutating" :error="error" @submit="handleLogin" />
</template>

<script setup lang="ts">
import CommandPalette from '~/components/command/CommandPalette.vue'
import NavHeader from '~/components/nav/NavHeader.vue'

const route = useRoute()
const { refreshSession } = useAdminSession()
const showFooter = computed(
  () => !route.path.startsWith('/photos') && !route.path.startsWith('/admin'),
)

await refreshSession()
</script>

<template>
  <NavHeader />
  <main>
    <slot />
  </main>
  <SiteFooter v-if="showFooter" />
  <CommandPalette />
</template>

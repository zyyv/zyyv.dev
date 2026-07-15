<script setup lang="ts">
import CommandPalette from '~/components/command/CommandPalette.vue'
import NavHeader from '~/components/nav/NavHeader.vue'

const route = useRoute()
const showFooter = computed(
  () => !route.path.startsWith('/photos') && !route.path.startsWith('/admin'),
)
</script>

<template>
  <NavHeader />
  <main>
    <slot />
  </main>
  <SiteFooter v-if="showFooter" />
  <CommandPalette />
</template>

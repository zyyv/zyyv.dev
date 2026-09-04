<script setup lang="ts">
import CommandPalette from '~/components/command/CommandPalette.vue'
import SiteVgpuBackground from '~/components/SiteVgpuBackground.vue'
import NavHeader from '~/components/nav/NavHeader.vue'

const route = useRoute()
const { refreshSession } = useAdminSession()
const showFooter = computed(
  () =>
    !route.path.startsWith('/photos') &&
    !route.path.startsWith('/bookmarks') &&
    !route.path.startsWith('/admin'),
)

if (!route.path.startsWith('/bookmarks')) await refreshSession()
</script>

<template>
  <SiteVgpuBackground />
  <div class="site-content">
    <NavHeader />
    <main>
      <slot />
    </main>
    <SiteFooter v-if="showFooter" />
  </div>
  <CommandPalette />
</template>

<style scoped>
.site-content {
  position: relative;
  z-index: 1;
}
</style>

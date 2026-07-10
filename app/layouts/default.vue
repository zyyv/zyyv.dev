<script setup lang="ts">
import CommandPalette from '~/components/command/CommandPalette.vue'
import NavHeader from '~/components/nav/NavHeader.vue'
</script>

<template>
  <NavHeader />
  <main>
    <slot />
  </main>
  <SiteFooter />
  <CommandPalette />
</template>

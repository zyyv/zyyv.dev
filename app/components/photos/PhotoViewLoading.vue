<script setup lang="ts">
import MotionRevealGroup from '~/components/motion/MotionRevealGroup.vue'
</script>

<template>
  <MotionRevealGroup
    as="div"
    class="flex h-full min-h-48 items-center justify-center p-6 text-center"
    role="status"
  >
    <span data-motion-reveal>Loading view…</span>
  </MotionRevealGroup>
</template>

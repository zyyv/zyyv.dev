<script setup lang="ts">
import type { CSSProperties } from 'vue'

interface Props {
  arthash: string
  width: number
  height: number
  style?: CSSProperties
}

const props = defineProps<Props>()
</script>

<template>
  <div
    class="photo-detail-canvas__preview-arthash"
    :style="props.style"
    :aria-label="`Arthash preview for ${props.width} × ${props.height} image`"
    role="img"
  >
    <ArthashPlaceholder :arthash="props.arthash" :revealed="false" />
  </div>
</template>

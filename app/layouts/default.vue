<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { onMounted, ref } from 'vue'

const defaultCenter = { x: 0.5, y: 0.5 }
const center = ref(defaultCenter)
const ready = ref(false)

onMounted(() => {
  const storage = useLocalStorage('center', defaultCenter)
  if (storage.value)
    center.value = { ...storage.value }

  watchEffect(() => {
    storage.value = { ...center.value }
  })
  ready.value = true
})
</script>

<template>
  <div class="absolute inset-0 z-20 pointer-events-none">
    <OriginController v-model="center" size-full />
  </div>
  <main
    class="size-screen grid"
    :style="{
      gridTemplateColumns: `${center.x * 100}% ${100 - center.x * 100}%`,
      gridTemplateRows: `${center.y * 100}% ${100 - center.y * 100}%`,
    }"
  >
    <section class="quadrant">
      <slot name="two">
        <!-- 默认左上象限内容 -->
      </slot>
    </section>
    <!-- 右上象限 -->
    <section class="quadrant">
      <slot name="one">
        <!-- 默认右上象限内容 -->
      </slot>
    </section>
    <!-- 左下象限 -->
    <section class="quadrant">
      <slot name="three">
        <!-- 默认左下象限内容 -->
      </slot>
    </section>
    <!-- 右下象限 -->
    <section class="quadrant">
      <slot name="four">
        <!-- 默认右下象限内容 -->
      </slot>
    </section>
  </main>
</template>

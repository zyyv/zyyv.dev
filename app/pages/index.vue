<script lang="ts" setup>
import { center } from '~/composables/center'

useHead({
  title: 'Chris',
})

const ready = ref(false)

onMounted(() => {
  const storage = useLocalStorage('center', center)
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
      <MeInfo />
    </section>
    <!-- 右上象限 -->
    <section class="quadrant">
      <Photos />
    </section>
    <!-- 左下象限 -->
    <section class="quadrant">
      <Projects />
    </section>
    <!-- 右下象限 -->
    <section class="quadrant">
      1
    </section>
  </main>
</template>

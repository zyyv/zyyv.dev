<script lang="ts" setup>
useHead({
  title: 'Chris',
})

const ready = ref(false)
const { center } = useCenter()

onMounted(() => {
  const storage = useLocalStorage('center', center)
  if (storage.value)
    center.value = { ...storage.value }

  // 使用防抖优化 localStorage 写入性能
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  watchEffect(() => {
    if (timeoutId)
      clearTimeout(timeoutId)

    const currentCenter = { ...center.value }
    timeoutId = setTimeout(() => {
      storage.value = currentCenter
    }, 300) // 防抖延迟 300ms，与动画时间一致
  })
  ready.value = true
})

const dragState = ref(false)
</script>

<template>
  <main
    class="size-screen grid"
    :class="{ trans: !dragState }"
    :style="{
      gridTemplateColumns: `${center.x * 100}% ${100 - center.x * 100}%`,
      gridTemplateRows: `${center.y * 100}% ${100 - center.y * 100}%`,
      willChange: dragState ? 'auto' : 'grid-template-columns, grid-template-rows',
    }"
  >
    <OriginQuadrant quadrant="II">
      <MeInfo />
    </OriginQuadrant>
    <OriginQuadrant quadrant="I">
      <Photos />
    </OriginQuadrant>
    <OriginQuadrant quadrant="III">
      <Projects />
    </OriginQuadrant>
    <OriginQuadrant quadrant="IV">
      <div size-full fcc animate-pulse>
        Coming soon...
      </div>
    </OriginQuadrant>
  </main>
  <div class="absolute inset-0 z-200 pointer-events-none">
    <OriginController v-model="center" v-model:state="dragState" size-full />
  </div>
</template>

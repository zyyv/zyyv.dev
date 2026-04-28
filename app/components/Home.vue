<script lang="ts" setup>
import type { PostPreview } from '~/types'

defineProps<{
  posts: PostPreview[]
}>()

const { center, initQuadrantSizeConfig } = useCenter()

initQuadrantSizeConfig()

onMounted(() => {
  const storage = useLocalStorage('center', center)
  if (storage.value)
    center.value = { ...storage.value }

  let timeoutId: ReturnType<typeof setTimeout> | null = null
  watchEffect(() => {
    if (timeoutId)
      clearTimeout(timeoutId)

    const currentCenter = { ...center.value }
    timeoutId = setTimeout(() => {
      storage.value = currentCenter
    }, 300)
  })
})

const dragState = ref(false)
</script>

<template>
  <section
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
      <Posts :posts="posts" />
    </OriginQuadrant>
  </section>
  <div class="absolute inset-0 z-200 pointer-events-none">
    <OriginController v-model="center" v-model:state="dragState" size-full />
  </div>
</template>

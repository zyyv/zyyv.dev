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

const dragState = ref(false)
</script>

<template>
  <div class="absolute inset-0 z-20 pointer-events-none">
    <OriginController v-model="center" v-model:state="dragState" size-full />
  </div>
  <main
    class="size-screen grid"
    :class="{ trans: !dragState }"
    :style="{
      gridTemplateColumns: `${center.x * 100}% ${100 - center.x * 100}%`,
      gridTemplateRows: `${center.y * 100}% ${100 - center.y * 100}%`,
    }"
  >
    <section class="quadrant">
      <MeInfo />
    </section>
    <section class="quadrant">
      <Photos />
    </section>
    <section class="quadrant">
      <Projects />
    </section>
    <section class="quadrant">
      1
    </section>
  </main>
</template>

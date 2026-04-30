<script lang="ts" setup>
import type { PostPreview } from '~/types'

defineProps<{
  posts: PostPreview[]
}>()

const {
  center,
  getQuadrantScrollProgress,
  initQuadrantSizeConfig,
  setQuadrantScrollProgress,
} = useCenter()

initQuadrantSizeConfig()

onMounted(() => {
  const storage = useLocalStorage('center', center)

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
const wheelState = ref(false)
const scrollProgress = ref(0)
const scrollSensitivity = 0.0005
let wheelStateTimer: ReturnType<typeof setTimeout> | null = null

function canElementScroll(element: HTMLElement, deltaY: number) {
  const style = window.getComputedStyle(element)
  const canOverflow = ['auto', 'scroll', 'overlay'].includes(style.overflowY)

  if (!canOverflow || element.scrollHeight <= element.clientHeight)
    return false

  if (deltaY > 0)
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1

  if (deltaY < 0)
    return element.scrollTop > 1

  return false
}

function canScrollInsideQuadrant(event: WheelEvent) {
  let element = event.target instanceof HTMLElement
    ? event.target
    : null
  const boundary = event.currentTarget instanceof HTMLElement
    ? event.currentTarget
    : null

  while (element && element !== boundary) {
    if (canElementScroll(element, event.deltaY))
      return true

    element = element.parentElement
  }

  return false
}

function handleWheel(event: WheelEvent) {
  if (canScrollInsideQuadrant(event))
    return

  event.preventDefault()

  if (dragState.value)
    return

  wheelState.value = true
  if (wheelStateTimer)
    clearTimeout(wheelStateTimer)
  wheelStateTimer = setTimeout(() => {
    wheelState.value = false
  }, 120)

  scrollProgress.value = getQuadrantScrollProgress()
  scrollProgress.value += event.deltaY * scrollSensitivity
  setQuadrantScrollProgress(scrollProgress.value)
}

onBeforeUnmount(() => {
  if (wheelStateTimer)
    clearTimeout(wheelStateTimer)
})
</script>

<template>
  <section
    class="size-screen grid"
    :class="{ trans: !dragState && !wheelState }"
    :style="{
      gridTemplateColumns: `${center.x * 100}% ${100 - center.x * 100}%`,
      gridTemplateRows: `${center.y * 100}% ${100 - center.y * 100}%`,
      willChange: dragState || wheelState ? 'auto' : 'grid-template-columns, grid-template-rows',
    }"
    @wheel="handleWheel"
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
    <OriginController
      v-model="center"
      v-model:state="dragState"
      :transition-disabled="wheelState"
      size-full
    />
  </div>
</template>

<script lang="ts" setup>
import type { Photo, PostPreview } from '~/types'

defineProps<{
  posts: PostPreview[]
  photos: Photo[]
}>()

const { center, getQuadrantScrollProgress, initQuadrantSizeConfig, setQuadrantScrollProgress } =
  useCenter()

initQuadrantSizeConfig()

onMounted(() => {
  const storage = useLocalStorage('center', center)

  let timeoutId: ReturnType<typeof setTimeout> | null = null
  watchEffect(() => {
    if (timeoutId) clearTimeout(timeoutId)

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

  if (!canOverflow || element.scrollHeight <= element.clientHeight) return false

  if (deltaY > 0) return element.scrollTop + element.clientHeight < element.scrollHeight - 1

  if (deltaY < 0) return element.scrollTop > 1

  return false
}

function canScrollInsideQuadrant(event: WheelEvent) {
  let element = event.target instanceof HTMLElement ? event.target : null
  const boundary = event.currentTarget instanceof HTMLElement ? event.currentTarget : null

  while (element && element !== boundary) {
    if (canElementScroll(element, event.deltaY)) return true

    element = element.parentElement
  }

  return false
}

function handleWheel(event: WheelEvent) {
  if (canScrollInsideQuadrant(event)) return

  event.preventDefault()

  if (dragState.value) return

  wheelState.value = true
  if (wheelStateTimer) clearTimeout(wheelStateTimer)
  wheelStateTimer = setTimeout(() => {
    wheelState.value = false
  }, 120)

  scrollProgress.value = getQuadrantScrollProgress()
  scrollProgress.value += event.deltaY * scrollSensitivity
  setQuadrantScrollProgress(scrollProgress.value)
}

onBeforeUnmount(() => {
  if (wheelStateTimer) clearTimeout(wheelStateTimer)
})

const mobileLinks = [
  {
    href: '/photos',
    icon: 'i-hugeicons:image-03',
    label: 'Photos',
    class: 'text-orange',
  },
  {
    href: '/posts',
    icon: 'i-hugeicons:note-edit',
    label: 'Posts',
    class: 'text-blue',
  },
  {
    href: 'https://github.com/zyyv',
    icon: 'i-custom:github',
    label: 'GitHub',
    class: 'text-basecolor',
  },
]
</script>

<template>
  <section
    class="home-quadrants size-screen grid"
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
      <Photos :photos="photos" />
    </OriginQuadrant>
    <OriginQuadrant quadrant="III">
      <Projects />
    </OriginQuadrant>
    <OriginQuadrant quadrant="IV">
      <Posts :posts="posts" />
    </OriginQuadrant>
  </section>
  <div class="home-controller-layer absolute inset-0 z-200 pointer-events-none">
    <OriginController
      v-model="center"
      v-model:state="dragState"
      class="home-controller"
      :transition-disabled="wheelState"
      size-full
    />
  </div>

  <section class="home-mobile px-6 pb-10 pt-18">
    <MeInfo expanded />

    <nav class="home-mobile-nav" aria-label="Primary navigation">
      <NuxtLink
        v-for="link in mobileLinks"
        :key="link.label"
        :to="link.href"
        class="home-mobile-icon"
        :class="link.class"
        :aria-label="link.label"
      >
        <i :class="link.icon" />
      </NuxtLink>
    </nav>
  </section>
</template>

<style scoped>
.home-mobile {
  display: none;
}

@media (max-width: 767px) {
  :global(.home-page) {
    overflow-y: auto;
  }

  .home-quadrants,
  .home-controller-layer,
  .home-controller {
    display: none;
  }

  .home-mobile {
    display: flex;
    min-height: 100svh;
    flex-direction: column;
    justify-content: center;
    overflow-x: hidden;
  }

  .home-mobile :deep(> div) {
    height: auto;
    min-height: 0;
    padding-inline: 0;
    text-align: left;
  }

  .home-mobile :deep(h1) {
    align-self: center;
  }

  .home-mobile :deep(section) {
    width: min(100%, 28rem);
    margin-inline: auto;
  }

  .home-mobile-nav {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
    margin-top: 2.5rem;
  }

  .home-mobile-icon {
    display: inline-flex;
    width: 3rem;
    height: 3rem;
    align-items: center;
    justify-content: center;
    border: 1px dashed rgba(120, 120, 120, 0.28);
    border-radius: 999px;
    font-size: 1.45rem;
    opacity: 0.78;
    transition:
      opacity 180ms ease,
      transform 180ms ease,
      border-color 180ms ease;
  }

  .home-mobile-icon:active {
    transform: scale(0.94);
  }
}
</style>

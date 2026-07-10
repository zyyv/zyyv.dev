<script setup lang="ts">
const route = useRoute()

const navigation = [
  { label: 'Home', to: '/', icon: null },
  { label: 'Photos', to: '/photos', icon: 'i-hugeicons:image-03' },
  { label: 'Projects', to: '/projects', icon: 'i-hugeicons:package-search' },
  { label: 'Posts', to: '/posts', icon: 'i-hugeicons:note-edit' },
] as const

const isHome = computed(() => route.path === '/')

function isActive(path: string) {
  if (path === '/') return route.path === path
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <header
    class="pointer-events-none fixed left-[clamp(0.65rem,1.6vw,1rem)] top-1/2 z-30 -translate-y-1/2 color-inherit lt-md:(bottom-[0.65rem] left-1/2 top-auto -translate-x-1/2 translate-y-0)"
  >
    <nav
      class="pointer-events-auto flex flex-col items-center gap-[0.2rem] border rounded-[0.85rem] p-[0.3rem] [backdrop-filter:blur(18px)_saturate(135%)] [background-color:color-mix(in_srgb,currentColor_6%,transparent)] [border-color:color-mix(in_srgb,currentColor_16%,transparent)] [box-shadow:0_0.75rem_2.5rem_color-mix(in_srgb,currentColor_8%,transparent)] [-webkit-backdrop-filter:blur(18px)_saturate(135%)] lt-md:flex-row"
      aria-label="Site navigation"
    >
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="relative grid size-[2.35rem] place-items-center rounded-[0.65rem] color-inherit text-[1.12rem] op-52 no-underline transition-[background-color,opacity,transform] duration-180 ease hover:(-translate-y-px op-92 [background-color:color-mix(in_srgb,currentColor_9%,transparent)]) active:scale-96 focus-visible:(outline-2 outline-current outline-offset-2) motion-reduce:transition-none"
        :class="{
          '[background-color:color-mix(in_srgb,currentColor_14%,transparent)]! op-100!': isActive(
            item.to,
          ),
        }"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        :aria-label="item.label"
        :title="item.label"
      >
        <MeAvatar v-if="item.to === '/'" navigation :shared="!isHome" />
        <i v-else class="color-inherit" :class="item.icon" aria-hidden="true" />
        <span class="sr-only">{{ item.label }}</span>
      </NuxtLink>

      <span
        class="my-[0.12rem] h-px w-5 [background-color:color-mix(in_srgb,currentColor_18%,transparent)] lt-md:(mx-[0.12rem] my-0 h-5 w-px)"
        aria-hidden="true"
      />
      <div class="grid size-[2.35rem] place-items-center">
        <DarkToggle />
      </div>
    </nav>
  </header>
</template>

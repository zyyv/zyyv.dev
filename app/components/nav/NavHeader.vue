<script setup lang="ts">
const route = useRoute()

const navigation = [
  { label: 'Home', to: '/', icon: null },
  { label: 'Photos', to: '/photos', icon: 'i-hugeicons:image-03' },
  { label: 'Projects', to: '/projects', icon: 'i-hugeicons:package-search' },
  { label: 'Posts', to: '/posts', icon: 'i-hugeicons:note-edit' },
  { label: 'About', to: '/about', icon: 'i-hugeicons:user-circle' },
] as const

const isHome = computed(() => route.path === '/')
const { mode: photosViewMode, togglePhotosView } = usePhotosViewMode()

const photosToggleLabel = computed(() =>
  photosViewMode.value === 'waterfall'
    ? 'Switch photos to Ripplable view'
    : 'Switch photos to waterfall view',
)

function isActive(path: string) {
  if (path === '/') return route.path === path
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <header
    class="pointer-events-none fixed z-30 color-inherit"
    :class="
      isHome
        ? 'inset-x-0 top-0 px-[clamp(1rem,4vw,4rem)] py-5'
        : 'left-[clamp(0.65rem,1.6vw,1rem)] top-1/2 -translate-y-1/2 lt-md:(bottom-[0.65rem] left-1/2 top-auto -translate-x-1/2 translate-y-0)'
    "
  >
    <nav
      class="pointer-events-auto"
      :class="
        isHome
          ? 'flex items-center justify-between'
          : 'flex flex-col items-center gap-[0.2rem] border rounded-[0.85rem] p-[0.3rem] [backdrop-filter:blur(18px)_saturate(135%)] [background-color:color-mix(in_srgb,currentColor_6%,transparent)] [border-color:color-mix(in_srgb,currentColor_16%,transparent)] [box-shadow:0_0.75rem_2.5rem_color-mix(in_srgb,currentColor_8%,transparent)] [-webkit-backdrop-filter:blur(18px)_saturate(135%)] lt-md:flex-row'
      "
      aria-label="Site navigation"
    >
      <div
        class="flex items-center"
        :class="isHome ? 'gap-[clamp(1rem,3vw,2.5rem)]' : 'flex-col gap-[0.2rem] lt-md:flex-row'"
      >
        <template v-for="item in navigation" :key="item.to">
          <button
            v-if="!isHome && item.to === '/photos' && isActive(item.to)"
            type="button"
            class="relative grid size-[2.35rem] place-items-center rounded-[0.65rem] border-0 color-inherit text-[1.12rem] op-100 [background-color:color-mix(in_srgb,currentColor_14%,transparent)] transition-[opacity,transform] duration-180 ease hover:(-translate-y-px op-62) active:scale-96 focus-visible:(outline-2 outline-current outline-offset-3) motion-reduce:transition-none"
            :aria-label="photosToggleLabel"
            :aria-pressed="photosViewMode === 'ripplable'"
            :title="photosToggleLabel"
            @click="togglePhotosView"
          >
            <i class="i-hugeicons:image-03 color-inherit" aria-hidden="true" />
          </button>

          <NuxtLink
            v-else
            :to="item.to"
            class="relative color-inherit no-underline transition-[opacity,transform] duration-180 ease hover:(-translate-y-px op-62) active:scale-96 focus-visible:(outline-2 outline-current outline-offset-3) motion-reduce:transition-none"
            :class="[
              isHome
                ? 'text-[0.68rem] font-500'
                : 'grid size-[2.35rem] place-items-center rounded-[0.65rem] text-[1.12rem] op-52 hover:[background-color:color-mix(in_srgb,currentColor_9%,transparent)]',
              !isHome && isActive(item.to)
                ? '[background-color:color-mix(in_srgb,currentColor_14%,transparent)]! op-100!'
                : '',
            ]"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            :aria-label="item.label"
            :title="item.label"
          >
            <span v-if="isHome">{{ item.label }}</span>
            <MeAvatar v-else-if="item.to === '/'" navigation shared />
            <i v-else class="color-inherit" :class="item.icon" aria-hidden="true" />
            <span v-if="!isHome" class="sr-only">{{ item.label }}</span>
          </NuxtLink>
        </template>
      </div>

      <span
        v-if="!isHome"
        class="my-[0.12rem] h-px w-5 [background-color:color-mix(in_srgb,currentColor_18%,transparent)] lt-md:(mx-[0.12rem] my-0 h-5 w-px)"
        aria-hidden="true"
      />
      <div
        :class="
          isHome ? 'grid size-7 place-items-center' : 'grid size-[2.35rem] place-items-center'
        "
      >
        <DarkToggle />
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()

const navigation = [
  { label: 'Home', to: '/', icon: null },
  { label: 'Photos', to: '/photos', icon: 'i-hugeicons:image-03' },
  { label: 'Projects', to: '/projects', icon: 'i-hugeicons:package-search' },
  { label: 'Bookmarks', to: '/bookmarks', icon: 'i-hugeicons:book-open-02' },
  { label: 'Posts', to: '/posts', icon: 'i-hugeicons:note-edit' },
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
      <div v-if="isHome" class="home-menu">
        <button type="button" class="home-menu__trigger" aria-label="Show navigation menu">
          <i class="home-menu__icon i-hugeicons:ai-magic color-inherit" aria-hidden="true" />
        </button>

        <div class="home-menu__panel">
          <div class="home-menu__links">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              class="home-menu__link"
              :class="isActive(item.to) ? 'op-100' : 'op-62'"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              :aria-label="item.label"
            >
              <MeAvatar v-if="item.to === '/'" navigation shared />
              <i v-else class="home-menu__link-icon" :class="item.icon" aria-hidden="true" />
              <span class="home-menu__label">{{ item.label }}</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center gap-[0.2rem] lt-md:flex-row">
        <template v-for="item in navigation" :key="item.to">
          <button
            v-if="item.to === '/photos' && isActive(item.to)"
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
              'grid size-[2.35rem] place-items-center rounded-[0.65rem] text-[1.12rem] op-52 hover:[background-color:color-mix(in_srgb,currentColor_9%,transparent)]',
              isActive(item.to)
                ? '[background-color:color-mix(in_srgb,currentColor_14%,transparent)]! op-100!'
                : '',
            ]"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            :aria-label="item.label"
            :title="item.label"
          >
            <MeAvatar v-if="item.to === '/'" navigation shared />
            <i v-else class="color-inherit" :class="item.icon" aria-hidden="true" />
            <span class="sr-only">{{ item.label }}</span>
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

<style scoped>
.home-menu {
  position: relative;
  display: flex;
  align-items: center;
}

.home-menu__trigger {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  border: 0;
  border-radius: 0.65rem;
  color: inherit;
  background: transparent;
  cursor: pointer;
  opacity: 0.52;
  transition:
    background-color 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
}

.home-menu__icon {
  width: 1.25rem;
  height: 1.25rem;
}

.home-menu__trigger:hover,
.home-menu__trigger:focus-visible {
  background-color: color-mix(in srgb, currentColor 9%, transparent);
  opacity: 0.92;
  transform: translateY(-1px);
}

.home-menu__trigger:active {
  transform: scale(0.96);
}

.home-menu__trigger:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.home-menu__panel {
  position: absolute;
  top: 50%;
  left: 100%;
  padding-left: 0.55rem;
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translate3d(-0.2rem, -50%, 0) scale(0.985);
  transform-origin: left center;
  transition:
    opacity 140ms ease-out,
    transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    visibility 0s linear 160ms;
}

.home-menu__links {
  display: flex;
  box-sizing: border-box;
  align-items: center;
  gap: 0.1rem;
  padding: 0.22rem;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 0.85rem;
  background-color: color-mix(in srgb, currentColor 5%, transparent);
  backdrop-filter: blur(18px) saturate(135%);
  -webkit-backdrop-filter: blur(18px) saturate(135%);
  box-shadow: 0 0.65rem 2rem color-mix(in srgb, currentColor 7%, transparent);
}

.home-menu__link {
  position: relative;
  display: grid;
  width: 2.35rem;
  height: 2.35rem;
  place-items: center;
  border-radius: 0.65rem;
  color: inherit;
  font-size: 1.12rem;
  text-decoration: none;
  transition:
    background-color 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
}

.home-menu__link:hover,
.home-menu__link:focus-visible {
  background-color: color-mix(in srgb, currentColor 9%, transparent);
  opacity: 1;
  transform: translateY(-1px);
}

.home-menu__link:active {
  transform: scale(0.96);
}

.home-menu__link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.home-menu__link-icon {
  width: 1.12rem;
  height: 1.12rem;
}

.home-menu__label {
  position: absolute;
  top: calc(100% + 0.45rem);
  left: 50%;
  padding: 0.35rem 0.48rem;
  /* box-shadow: 0 0.5rem 1.25rem rgb(0 0 0 / 0.16); */
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translate3d(-50%, -0.2rem, 0);
  transition:
    opacity 140ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.home-menu__link:hover .home-menu__label,
.home-menu__link:focus-visible .home-menu__label {
  opacity: 1;
  transform: translate3d(-50%, 0, 0);
}

.home-menu:hover .home-menu__panel,
.home-menu:focus-within .home-menu__panel {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: translate3d(0, -50%, 0) scale(1);
  transition-delay: 0s;
}

@media (max-width: 639.9px) {
  .home-menu__panel {
    top: calc(100% + 0.45rem);
    left: 0;
    padding-top: 0.4rem;
    padding-left: 0;
    transform: translate3d(0, -0.3rem, 0) scale(0.985);
    transform-origin: left top;
  }

  .home-menu:hover .home-menu__panel,
  .home-menu:focus-within .home-menu__panel {
    transform: translate3d(0, 0, 0) scale(1);
  }

  .home-menu__links {
    max-width: calc(100vw - 2rem);
  }

  .home-menu__link {
    width: clamp(2.2rem, 11vw, 2.65rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-menu__trigger,
  .home-menu__panel,
  .home-menu__link,
  .home-menu__label {
    transition: none;
  }
}
</style>

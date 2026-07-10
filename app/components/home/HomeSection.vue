<script setup lang="ts">
interface Props {
  id: string
  title: string
  description: string
  icon: string
  label: string
  to: string
}

defineProps<Props>()
</script>

<template>
  <section :id="id" class="home-section scroll-mt-6" :aria-labelledby="`${id}-title`">
    <div
      class="overflow-hidden border rounded-[1.25rem] [background-color:color-mix(in_srgb,currentColor_2.8%,transparent)] [border-color:color-mix(in_srgb,currentColor_14%,transparent)] [box-shadow:0_1.5rem_5rem_color-mix(in_srgb,currentColor_5%,transparent)]"
    >
      <header
        class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-8 border-b px-[clamp(1.25rem,4vw,3rem)] py-[clamp(1.5rem,4vw,2.75rem)] [border-color:color-mix(in_srgb,currentColor_12%,transparent)] lt-md:(grid-cols-1 items-start gap-5)"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-[0.8rem]">
            <i class="text-[clamp(1.35rem,2.4vw,2rem)] op-42" :class="icon" aria-hidden="true" />
            <h2
              :id="`${id}-title`"
              class="m-0 text-[clamp(2.25rem,5vw,4.25rem)] leading-[0.94] font-600 tracking-[-0.06em]"
            >
              {{ title }}
            </h2>
          </div>
          <p class="mb-0 mt-[1rem] max-w-52ch text-[clamp(0.9rem,1.5vw,1.05rem)] leading-6 op-56">
            {{ description }}
          </p>
        </div>

        <NuxtLink
          :to="to"
          class="group inline-flex min-h-[2.75rem] flex-none items-center justify-center gap-[0.55rem] border rounded-[0.85rem] px-[1rem] color-inherit text-[0.82rem] font-600 no-underline transition-[background-color,border-color,transform] duration-250 [background-color:color-mix(in_srgb,currentColor_5%,transparent)] [border-color:color-mix(in_srgb,currentColor_18%,transparent)] hover:(-translate-y-0.5 [background-color:color-mix(in_srgb,currentColor_10%,transparent)] [border-color:color-mix(in_srgb,currentColor_34%,transparent)]) active:translate-y-0 active:scale-98 focus-visible:(outline-2 outline-current outline-offset-3) motion-reduce:transition-none lt-md:w-full"
        >
          <span class="whitespace-nowrap">{{ label }}</span>
          <i
            class="i-hugeicons:arrow-up-right-02 transition-transform duration-250 group-hover:(translate-x-0.5 -translate-y-0.5) motion-reduce:transition-none"
            aria-hidden="true"
          />
        </NuxtLink>
      </header>

      <div class="p-[clamp(0.75rem,2.5vw,1.5rem)]">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes home-section-reveal {
  from {
    opacity: 0;
    transform: translateY(2rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .home-section {
      animation-name: home-section-reveal;
      animation-fill-mode: both;
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      animation-timeline: view();
      animation-range: entry 5% entry 72%;
    }
  }
}
</style>

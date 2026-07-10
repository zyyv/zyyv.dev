<script setup lang="ts">
const config = useRuntimeConfig()
const year = new Date().getFullYear()
const commitHash = computed(() => String(config.public.buildCommit || 'local'))
const shortCommit = computed(() =>
  commitHash.value === 'local' ? 'local' : commitHash.value.slice(0, 7),
)
const commitUrl = computed(() =>
  commitHash.value === 'local'
    ? 'https://github.com/zyyv/zyyv.dev'
    : `https://github.com/zyyv/zyyv.dev/commit/${commitHash.value}`,
)

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <footer
    class="mx-auto w-[min(calc(100%-clamp(2rem,8vw,8rem)),68rem)] pb-[clamp(2rem,5vw,4rem)] pt-6 lt-sm:w-[calc(100%-2rem)]"
  >
    <div class="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 op-30" aria-hidden="true">
      <span class="border-t border-dashed border-current" />
      <i class="i-hugeicons:git-commit-horizontal text-[1.1rem]" />
      <span class="border-t border-dashed border-current" />
    </div>

    <div class="flex items-end justify-between gap-8 lt-sm:(flex-col items-start)">
      <div>
        <p class="m-0 text-[clamp(0.9rem,1.8vw,1.05rem)] italic [font-family:dank,monospace]">
          You found the edge of the page. Nothing fell off.
        </p>
        <p class="m-0 mt-[0.4rem] text-[0.7rem] tracking-[0.04em] op-42">
          © {{ year }} Chris · Built somewhere between coffee and git.
        </p>
      </div>

      <div class="flex flex-none items-center gap-[0.6rem] lt-sm:w-full">
        <a
          :href="commitUrl"
          target="_blank"
          rel="noreferrer"
          class="inline-flex min-h-[2.4rem] items-center gap-[0.45rem] border border-dashed rounded-[0.7rem] px-[0.8rem] color-inherit text-[0.72rem] no-underline transition-[background-color,border-color,opacity,transform] duration-180 ease [background-color:rgb(120_120_120/5%)] [border-color:rgb(120_120_120/28%)] hover:(-translate-y-0.5 [background-color:rgb(120_120_120/11%)] [border-color:rgb(120_120_120/48%)]) active:scale-97 focus-visible:(outline-2 outline-current outline-offset-3) motion-reduce:transition-none lt-sm:(flex-1 justify-center)"
          :title="`Open commit ${commitHash}`"
        >
          <span class="op-52">Last dispatch</span>
          <code class="text-[0.75rem] [font-family:dank,monospace]">{{ shortCommit }}</code>
          <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
        </a>
        <button
          type="button"
          class="grid size-[2.4rem] cursor-pointer place-items-center border border-dashed rounded-full color-inherit transition-[background-color,border-color,opacity,transform] duration-180 ease [background-color:rgb(120_120_120/5%)] [border-color:rgb(120_120_120/28%)] hover:(-translate-y-0.5 [background-color:rgb(120_120_120/11%)] [border-color:rgb(120_120_120/48%)]) active:scale-97 focus-visible:(outline-2 outline-current outline-offset-3) motion-reduce:transition-none"
          aria-label="Back to top"
          @click="backToTop"
        >
          <i class="i-hugeicons:arrow-up-01" aria-hidden="true" />
        </button>
      </div>
    </div>
  </footer>
</template>

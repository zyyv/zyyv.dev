<script lang="ts" setup>
import type { User } from '~/types'

const user = ref<Partial<User>>({
  name: 'Chris',
  bio: 'Regardless of the past, do not ask the future.',
  email: 'hizyyv@gmail.com',
})

onMounted(async () => {
  try {
    const response = await fetch('/api/user')
    if (response.ok) user.value = await response.json()
  } catch (error) {
    console.error(error)
  }
})
</script>

<template>
  <div
    class="me-info fccc size-full select-none gap-4 px-6 py-4 text-[clamp(0.875rem,calc(100cqw/40),1rem)] @2xl:(flex-row! gap-10 flex-row py-0) lt-md:(w-full items-stretch gap-[1.85rem] py-0 text-[clamp(0.95rem,3.7vw,1.02rem)]! leading-[1.78])"
  >
    <h1 fsc class="lt-md:(mb-[0.15rem] flex justify-center)">
      <MeAvatar mobile shared />
    </h1>
    <section class="lt-md:(mx-auto w-[min(100%,25rem)])">
      <p class="lt-md:(max-w-72 text-[1.16rem] leading-6)">
        I'm
        <strong
          class="lt-md:(mb-[0.2rem] block text-[clamp(2.5rem,13vw,4rem)] leading-[0.92] tracking-[-0.08em])"
          >{{ user?.name }}</strong
        >,
        <code
          text-p-r
          italic
          font-dank
          class="lt-md:whitespace-nowrap"
          v-text="`<Front-End Developer />`"
        />
        <span text-p-r animate-count-infinite animate-duration-2000 animate-flash> | </span>
        🧑🏻‍💻 &
        <code
          italic
          text-sm
          rd-sm
          font-dank
          b="~ dashed orange/60"
          p-1
          text-p-r
          class="lt-md:whitespace-nowrap"
          >Open Source Enthusiast</code
        >
      </p>
      <p italic font-dank mt-2 class="lt-md:(mt-[0.85rem] max-w-76 op-72)">「 {{ user?.bio }} 」</p>
      <ul my-6 space-y-2 class="lt-md:(mb-[1.45rem] mt-7 grid gap-[0.85rem] space-y-0)">
        <li
          class="lt-md:relative lt-md:pl-4 lt-md:before:(absolute left-0 top-[0.72em] size-[0.35rem] rounded-full content-empty bg-linear-to-br from-[#a78bfa] to-[#f87171])"
        >
          <i i-fluent-emoji:sports-medal mr-1 class="lt-md:ml-[-0.1rem]" />
          Team member of:
          <IconsUnoCSS />
          ,
          <IconsElk />
        </li>
        <li
          class="lt-md:relative lt-md:pl-4 lt-md:before:(absolute left-0 top-[0.72em] size-[0.35rem] rounded-full content-empty bg-linear-to-br from-[#a78bfa] to-[#f87171])"
        >
          <i i-fluent-emoji:sparkles mr-1 class="lt-md:ml-[-0.1rem]" />
          Creator of:
          <IconsOnuUI />
          ,
          <IconsUnPreset />
        </li>
        <li
          class="lt-md:relative lt-md:pl-4 lt-md:before:(absolute left-0 top-[0.72em] size-[0.35rem] rounded-full content-empty bg-linear-to-br from-[#a78bfa] to-[#f87171])"
        >
          <i i-fluent-emoji:party-popper mr-1 class="lt-md:ml-[-0.1rem]" />
          Contributor of:
          <IconsVite />
          、
          <IconsVue />
          、
          <IconsNuxt />
          、
          <IconsVitest />
          & etc.
        </li>
        <li
          class="lt-md:relative lt-md:pl-4 lt-md:before:(absolute left-0 top-[0.72em] size-[0.35rem] rounded-full content-empty bg-linear-to-br from-[#a78bfa] to-[#f87171])"
        >
          <i i-fluent-emoji:bubbles mr-1 class="lt-md:ml-[-0.1rem]" />
          Find me on:
          <IconsBilibili />
          、
          <IconsBlueSky />
          、
          <IconsX /> & etc.
        </li>
      </ul>
      <p class="lt-md:mt-[0.2rem]">
        <a
          trans
          text-p-r
          class="group"
          hover-op-75
          :href="`mailto:${user?.email ?? 'hizyyv@gmail.com'}`"
        >
          Hire Me
          <i
            trans
            group-hover="ml-2"
            class="i-hugeicons:arrow-up-right-02"
            bg-linear-to-r
            from-purple
            to-red
          />
        </a>
      </p>
    </section>
  </div>
</template>

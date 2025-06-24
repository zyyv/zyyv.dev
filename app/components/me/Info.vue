<script lang='ts' setup>
const { data: user } = await useFetch('/api/user')
</script>

<template>
  <div class="fccc py-4 px-4 gap-4 @2xl:(flex-row! gap-10 flex-row py-0) size-full">
    <h1 fsc>
      <MeAvatar />
    </h1>
    <section class="hidden @sm:block">
      <p>
        I'm <strong text-primary>{{ user?.name }}</strong>,
        <code text-p-r italic font-dank v-text="`<Front-End Developer />`" />
        <span text-p-r animate-count-infinite animate-duration-2000 animate-flash> | </span>
        🧑🏻‍💻 &
        <code italic text-sm rd-sm font-dank b="~ dashed orange/60" p-1 text-p-r>Open Source Enthusiast</code>
      </p>
      <p italic font-dank mt-2>
        「 {{ user?.bio }} 」
      </p>
      <ul my-6 space-y-2>
        <li>
          <i i-fluent-emoji:sports-medal mr-1 />
          Team member of:
          <IconsUnoCSS />
          ,
          <IconsElk />
        </li>
        <li>
          <i i-fluent-emoji:sparkles mr-1 />
          Creator of:
          <IconsOnuUI />
          ,
          <IconsUnPreset />
        </li>
        <li>
          <i i-fluent-emoji:party-popper mr-1 />
          Contributor of:
          <IconsVite />
          、
          <IconsVue />
          、
          <IconsNuxt /> & etc.
        </li>
        <li>
          <i i-fluent-emoji:bubbles mr-1 />
          Find me on:
          <IconsBilibili />
          、
          <IconsBlueSky />
          、
          <IconsX /> & etc.
        </li>
      </ul>
      <p>
        <a trans text-p-r class="group" hover-op-75 :href="`mailto:${user?.email ?? 'hizyyv@gmail.com'}`">
          Hire Me
          <i trans group-hover="ml-2" class="i-hugeicons:arrow-up-right-02" bg-linear-to-r from-purple to-red />
        </a>
      </p>
    </section>
  </div>
</template>

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
    class="me-info me-info-mobile fccc py-4 px-6 gap-4 @2xl:(flex-row! gap-10 flex-row py-0) size-full select-none"
    style="font-size: clamp(0.875rem, calc(100cqw / 40), 1rem)"
  >
    <h1 fsc>
      <MeAvatar mobile shared />
    </h1>
    <section class="me-info-content">
      <p>
        I'm <strong>{{ user?.name }}</strong
        >,
        <code text-p-r italic font-dank v-text="`<Front-End Developer />`" />
        <span text-p-r animate-count-infinite animate-duration-2000 animate-flash> | </span>
        🧑🏻‍💻 &
        <code italic text-sm rd-sm font-dank b="~ dashed orange/60" p-1 text-p-r
          >Open Source Enthusiast</code
        >
      </p>
      <p italic font-dank mt-2>「 {{ user?.bio }} 」</p>
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
          <IconsNuxt />
          、
          <IconsVitest />
          & etc.
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

<style scoped>
@media (max-width: 767px) {
  .me-info-mobile {
    align-items: stretch;
    gap: 1.85rem;
    width: 100%;
    padding-block: 0;
    font-size: clamp(0.95rem, 3.7vw, 1.02rem) !important;
    line-height: 1.78;
  }

  .me-info-mobile h1 {
    display: flex;
    justify-content: center;
    margin-bottom: 0.15rem;
  }

  .me-info-mobile .me-info-content {
    width: min(100%, 25rem);
    margin-inline: auto;
  }

  .me-info-mobile p:first-child {
    max-width: 18rem;
    font-size: 1.16rem;
    line-height: 1.5;
  }

  .me-info-mobile p:first-child strong {
    display: block;
    margin-bottom: 0.2rem;
    font-size: clamp(2.5rem, 13vw, 4rem);
    line-height: 0.92;
    letter-spacing: -0.08em;
  }

  .me-info-mobile p:nth-child(2) {
    max-width: 19rem;
    margin-top: 0.85rem;
    opacity: 0.72;
  }

  .me-info-mobile code {
    white-space: nowrap;
  }

  .me-info-mobile ul {
    display: grid;
    gap: 0.85rem;
    margin-block: 1.75rem 1.45rem;
  }

  .me-info-mobile li {
    position: relative;
    padding-left: 1rem;
  }

  .me-info-mobile li::before {
    position: absolute;
    left: 0;
    top: 0.72em;
    width: 0.35rem;
    height: 0.35rem;
    border-radius: 999px;
    background: linear-gradient(135deg, #a78bfa, #f87171);
    content: '';
  }

  .me-info-mobile li > i:first-child {
    margin-left: -0.1rem;
  }

  .me-info-mobile p:last-child {
    margin-top: 0.2rem;
  }
}
</style>

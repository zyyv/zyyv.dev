<script setup lang="ts">
import { socialLinks } from '~/utils/socialLinks'

const { user, loadUser } = useUser()

onMounted(loadUser)
</script>

<template>
  <section
    class="home-hero relative flex min-h-dvh overflow-hidden px-4 py-20 md:px-16 md:py-24"
    aria-labelledby="home-hero-title"
  >
    <div
      class="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-8 md:gap-12"
    >
      <div class="relative z-1 size-28 flex-none md:size-36">
        <img
          class="animate-shape block size-full object-cover shadow-xl motion-reduce:animate-none"
          src="/avatar.png"
          alt="Chris"
          width="1000"
          height="1000"
          fetchpriority="high"
        />
      </div>

      <div class="relative z-2 w-full max-w-6xl">
        <h1 id="home-hero-title" class="home-hero__title">
          <span class="flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3">
            <span class="inline-flex items-center">
              <i
                class="home-hero__title-icon i-hugeicons:ai-programming text-green-500"
                aria-hidden="true"
              />
              code
            </span>
            <span class="inline-flex items-center sm:ml-2">
              <i
                class="home-hero__title-icon i-hugeicons:camera-02 text-violet-500"
                aria-hidden="true"
              />
              photography
            </span>
          </span>

          <span class="mt-1 flex flex-col items-center sm:mt-2 sm:flex-row sm:gap-3">
            <span class="inline-flex items-center">
              <span aria-hidden="true">&amp;</span>
              <i
                class="home-hero__title-icon home-hero__title-icon--idea i-hugeicons:ai-idea text-rose-300"
                aria-hidden="true"
              />
              curious
            </span>
            <em class="border-b-2 border-rose-300 pb-1 font-serif font-normal text-rose-300 italic"
              >things.</em
            >
          </span>
        </h1>
      </div>
    </div>

    <div class="home-hero__signature">
      <p>「{{ user.bio }}」</p>

      <nav class="home-hero__socials" aria-label="Social links">
        <a
          v-for="link in socialLinks"
          :key="link.label"
          :href="link.href"
          :aria-label="link.label"
          :title="link.label"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noreferrer' : undefined"
        >
          <i :class="link.icon" aria-hidden="true" />
        </a>
      </nav>
    </div>
  </section>
</template>

<style scoped>
.home-hero {
  isolation: isolate;
}

.home-hero__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  font-size: clamp(2.25rem, 5.2vw, 5rem);
  font-weight: 500;
  line-height: 0.98;
  letter-spacing: -0.055em;
  text-align: center;
  text-wrap: balance;
}

.home-hero__title-icon {
  width: 0.74em;
  height: 0.74em;
  margin-right: 0.12em;
  flex: none;
  transform: translateY(0.025em);
}

.home-hero__title-icon--idea {
  margin-right: 0.1em;
  margin-left: 0.1em;
}

.home-hero__signature {
  position: absolute;
  z-index: 2;
  right: 1rem;
  bottom: clamp(1.25rem, 3.5vh, 2.75rem);
  left: 1rem;
  display: grid;
  justify-items: center;
  gap: 0.75rem;
}

.home-hero__signature p {
  width: min(23rem, 42vw);
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.5;
  text-align: center;
}

.home-hero__socials {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 2.4vw, 1.65rem);
}

.home-hero__socials a {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  color: color-mix(in srgb, currentColor 62%, transparent);
  text-decoration: none;
  transition:
    color 220ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.home-hero__socials i {
  width: 1.1rem;
  height: 1.1rem;
}

.home-hero__socials a:hover {
  color: currentColor;
  transform: translateY(-2px);
}

.home-hero__socials a:active {
  transform: translateY(1px);
}

.home-hero__socials a:focus-visible {
  border-radius: 0.25rem;
  outline: 2px solid currentColor;
  outline-offset: 0.2rem;
}

@media (max-width: 639.9px) {
  .home-hero__title {
    font-size: clamp(2.15rem, 9.5vw, 3rem);
    line-height: 1.04;
  }

  .home-hero__signature p {
    width: min(18rem, 78vw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero__socials a {
    transition: none;
  }
}
</style>

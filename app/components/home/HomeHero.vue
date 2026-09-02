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
      <div class="home-hero__avatar relative z-1 size-28 flex-none md:size-36">
        <span class="home-hero__avatar-aura" aria-hidden="true" />
        <span class="home-hero__avatar-orbit" aria-hidden="true" />
        <img
          class="home-hero__avatar-image animate-shape block size-full object-cover motion-reduce:animate-none"
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

.home-hero__avatar {
  isolation: isolate;
}

.home-hero__avatar-aura {
  position: absolute;
  z-index: -2;
  inset: -32%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, rgb(130 157 218 / 0.34), transparent 42%),
    radial-gradient(circle at 68% 70%, rgb(248 113 113 / 0.2), transparent 44%);
  filter: blur(1.1rem);
  opacity: 0.74;
  animation: avatar-breathe 5.5s ease-in-out infinite;
}

.home-hero__avatar-orbit {
  position: absolute;
  z-index: -1;
  inset: -0.7rem;
  border: 1px solid rgb(87 115 177 / 0.28);
  border-radius: 48% 52% 46% 54% / 54% 43% 57% 46%;
  animation: avatar-orbit 11s linear infinite;
}

.home-hero__avatar-orbit::before,
.home-hero__avatar-orbit::after {
  position: absolute;
  border-radius: 999px;
  background: #6f8fcf;
  box-shadow: 0 0 0.8rem rgb(111 143 207 / 0.7);
  content: '';
}

.home-hero__avatar-orbit::before {
  top: 8%;
  right: 11%;
  width: 0.34rem;
  height: 0.34rem;
}

.home-hero__avatar-orbit::after {
  bottom: 13%;
  left: 5%;
  width: 0.22rem;
  height: 0.22rem;
  background: #f38b8b;
}

.home-hero__avatar-image {
  box-shadow:
    0 1.5rem 4rem rgb(35 52 92 / 0.25),
    inset 0 0 0 1px rgb(255 255 255 / 0.18);
  transition:
    filter 500ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}

.home-hero__avatar:hover .home-hero__avatar-image {
  filter: saturate(1.08) contrast(1.03);
}

.home-hero__avatar:hover .home-hero__avatar-orbit {
  animation-duration: 5s;
}

@keyframes avatar-orbit {
  to {
    transform: rotate(360deg);
  }
}

@keyframes avatar-breathe {
  0%,
  100% {
    opacity: 0.62;
    transform: scale(0.92);
  }

  50% {
    opacity: 0.9;
    transform: scale(1.08);
  }
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
  .home-hero__avatar-aura {
    inset: -24%;
    filter: blur(0.85rem);
  }

  .home-hero__avatar-orbit {
    inset: -0.55rem;
  }

  .home-hero__title {
    font-size: clamp(2.15rem, 9.5vw, 3rem);
    line-height: 1.04;
  }

  .home-hero__signature p {
    width: min(18rem, 78vw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero__avatar-aura,
  .home-hero__avatar-orbit {
    animation: none;
  }

  .home-hero__socials a {
    transition: none;
  }
}
</style>

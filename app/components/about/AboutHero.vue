<template>
  <section class="about-hero" aria-labelledby="about-title">
    <div class="about-hero__meta">
      <p>Chris / zyyv</p>
      <p>Front-end engineer</p>
    </div>

    <div class="about-hero__intro">
      <h1 id="about-title" class="about-hero__title">
        <span>Open source &</span>
        <span>photography.</span>
      </h1>

      <div class="about-hero__copy">
        <p>
          Hi, I’m Chris, a front-end engineer and open-source maintainer. I build tools around Vue,
          Nuxt, Vite, and UnoCSS, turning small ideas into useful things people can share.
        </p>
        <p>
          Away from the screen, I carry a camera. Photography slows me down and teaches me to notice
          light, distance, and the quiet moments that are easy to miss.
        </p>
      </div>
    </div>

    <div class="about-hero__interests">
      <article class="about-interest">
        <p class="about-interest__index">01</p>
        <div class="about-interest__body">
          <h2 class="about-interest__title">Open source</h2>
          <p class="about-interest__copy">
            Building in public, learning with others, and giving useful ideas a life beyond my own
            screen.
          </p>
          <NuxtLink class="about-interest__link" to="/projects">
            View projects
            <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
          </NuxtLink>
        </div>
      </article>

      <article class="about-interest">
        <p class="about-interest__index">02</p>
        <div class="about-interest__body">
          <h2 class="about-interest__title">Photography</h2>
          <p class="about-interest__copy">
            A way to stay curious, look more closely, and keep a record of places, people, and
            passing light.
          </p>
          <NuxtLink class="about-interest__link" to="/photos">
            View photos
            <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
          </NuxtLink>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.about-hero {
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  padding: clamp(5.5rem, 8vw, 7.5rem) clamp(1rem, 4vw, 4rem) clamp(2.5rem, 4vw, 4rem);
}

.about-hero__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  font-size: 0.68rem;
  line-height: 1.2;
  text-transform: uppercase;
}

.about-hero__meta p,
.about-hero__copy p,
.about-interest p,
.about-interest__title {
  margin: 0;
}

.about-hero__meta p:last-child {
  text-align: right;
}

.about-hero__intro {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(18rem, 0.45fr);
  gap: clamp(3rem, 7vw, 8rem);
  align-items: end;
  margin: auto 0;
  padding: clamp(4rem, 8vh, 7rem) 0;
}

.about-hero__title {
  margin: 0;
  font-size: clamp(4.8rem, 9.6vw, 10rem);
  font-weight: 500;
  line-height: 0.77;
  letter-spacing: -0.085em;
}

.about-hero__title span {
  display: block;
  width: max-content;
  max-width: 100%;
}

.about-hero__title span:last-child {
  color: color-mix(in srgb, currentColor 42%, transparent);
}

.about-hero__copy {
  display: grid;
  gap: 1.2rem;
  max-width: 29rem;
  padding-bottom: 0.3rem;
  font-size: clamp(0.95rem, 1.15vw, 1.08rem);
  line-height: 1.55;
  letter-spacing: -0.018em;
}

.about-hero__copy p:last-child {
  color: color-mix(in srgb, currentColor 56%, transparent);
}

.about-hero__interests {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent);
}

.about-interest {
  display: grid;
  grid-template-columns: 2.5rem 1fr;
  gap: clamp(1rem, 2vw, 2rem);
  padding: clamp(1.25rem, 2.5vw, 2rem) clamp(1rem, 3vw, 3rem) 0 0;
}

.about-interest + .about-interest {
  padding-right: 0;
  padding-left: clamp(1rem, 3vw, 3rem);
  border-left: 1px solid color-mix(in srgb, currentColor 18%, transparent);
}

.about-interest__index {
  padding-top: 0.2rem;
  font-size: 0.62rem;
  opacity: 0.46;
}

.about-interest__body {
  display: grid;
  grid-template-columns: minmax(7rem, 0.55fr) minmax(12rem, 1fr) auto;
  gap: clamp(1rem, 2vw, 2rem);
  align-items: start;
}

.about-interest__title {
  font-size: clamp(1.05rem, 1.6vw, 1.35rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.035em;
}

.about-interest__copy {
  max-width: 25rem;
  font-size: 0.76rem;
  line-height: 1.45;
  opacity: 0.58;
}

.about-interest__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding-bottom: 0.18rem;
  border-bottom: 1px solid currentColor;
  color: inherit;
  font-size: 0.64rem;
  line-height: 1.2;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  transition:
    opacity 220ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.about-interest__link:hover {
  opacity: 0.5;
  transform: translateY(-1px);
}

.about-interest__link:active {
  transform: translateY(1px);
}

.about-interest__link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 0.35rem;
}

@media (prefers-reduced-motion: no-preference) {
  .about-hero__meta {
    animation: about-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .about-hero__title span:first-child {
    animation: about-rise 900ms 80ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .about-hero__title span:last-child {
    animation: about-rise 900ms 160ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .about-hero__copy {
    animation: about-rise 850ms 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .about-interest:first-child {
    animation: about-rise 800ms 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .about-interest:last-child {
    animation: about-rise 800ms 440ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
}

@keyframes about-rise {
  from {
    opacity: 0;
    transform: translate3d(0, 1rem, 0);
  }
}

@media (max-width: 1100px) {
  .about-hero__intro {
    grid-template-columns: minmax(0, 1.2fr) minmax(17rem, 0.6fr);
    gap: 3rem;
  }

  .about-interest__body {
    grid-template-columns: 1fr;
  }

  .about-interest__link {
    width: max-content;
  }
}

@media (max-width: 767.9px) {
  .about-hero {
    min-height: auto;
    padding: 5.5rem 1rem 2rem;
  }

  .about-hero__meta {
    font-size: 0.61rem;
  }

  .about-hero__intro {
    grid-template-columns: 1fr;
    gap: 2.5rem;
    padding: 5rem 0 4rem;
  }

  .about-hero__title {
    font-size: clamp(4.25rem, 20.5vw, 6rem);
    line-height: 0.8;
  }

  .about-hero__copy {
    max-width: 31rem;
    padding-left: 18vw;
    font-size: 0.95rem;
  }

  .about-hero__interests {
    grid-template-columns: 1fr;
  }

  .about-interest {
    grid-template-columns: 2rem 1fr;
    padding: 1.5rem 0;
  }

  .about-interest + .about-interest {
    padding: 1.5rem 0 0;
    border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent);
    border-left: 0;
  }

  .about-interest__body {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .about-interest__copy {
    max-width: 21rem;
  }
}
</style>

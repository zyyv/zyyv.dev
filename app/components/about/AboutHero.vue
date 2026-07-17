<template>
  <section class="about-hero" aria-labelledby="about-title">
    <div class="about-hero__meta">
      <p>Chris / zyyv</p>
      <p>Front-end engineer</p>
    </div>

    <div class="about-hero__intro">
      <h1 id="about-title" class="about-hero__title">Chris.</h1>
      <p class="about-hero__statement">Regardless of the past, do not ask the future.</p>

      <div class="about-hero__copy">
        <p>
          I’m a front-end engineer and open-source maintainer working around Vue, Nuxt, Vite, and
          UnoCSS. I enjoy turning small ideas into useful things people can share.
        </p>
        <p>
          Away from the screen, photography helps me slow down and notice light, distance, and the
          quiet moments that are easy to miss.
        </p>
      </div>
    </div>

    <div class="about-hero__interests">
      <article class="about-interest">
        <h2 class="about-interest__title">Open source</h2>
        <p class="about-interest__copy">
          Building in public, learning with others, and giving useful ideas a life beyond my own
          screen.
        </p>
        <NuxtLink class="about-interest__link" to="/projects">
          View projects
          <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
        </NuxtLink>
      </article>

      <article class="about-interest">
        <h2 class="about-interest__title">Photography</h2>
        <p class="about-interest__copy">
          A way to stay curious, look more closely, and keep a record of places, people, and passing
          light.
        </p>
        <NuxtLink class="about-interest__link" to="/photos">
          View photos
          <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
        </NuxtLink>
      </article>
    </div>
  </section>
</template>

<style scoped>
.about-hero {
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  padding: clamp(5.5rem, 8vw, 7rem) clamp(1rem, 4vw, 4rem) clamp(2.5rem, 4vw, 4rem)
    clamp(5.5rem, 8vw, 8rem);
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
.about-hero__statement,
.about-hero__copy p,
.about-interest__title,
.about-interest__copy {
  margin: 0;
}

.about-hero__meta p:last-child {
  text-align: right;
}

.about-hero__intro {
  width: min(100%, 58rem);
  margin: auto 0;
  padding: clamp(4rem, 8vh, 6rem) 0;
}

.about-hero__title {
  margin: 0 0 1.4rem;
  font-size: clamp(2.75rem, 5vw, 4.75rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.065em;
}

.about-hero__statement {
  max-width: 45rem;
  margin-bottom: clamp(2.5rem, 5vw, 4rem);
  color: color-mix(in srgb, currentColor 52%, transparent);
  font-size: clamp(1.3rem, 2.4vw, 2rem);
  line-height: 1.12;
  letter-spacing: -0.045em;
}

.about-hero__copy {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1.5rem, 4vw, 4rem);
  max-width: 47rem;
  font-size: clamp(0.9rem, 1vw, 1rem);
  line-height: 1.55;
  letter-spacing: -0.018em;
}

.about-hero__copy p:last-child {
  color: color-mix(in srgb, currentColor 60%, transparent);
}

.about-hero__interests {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent);
}

.about-interest {
  display: grid;
  grid-template-columns: minmax(7rem, 0.55fr) minmax(12rem, 1fr) auto;
  gap: clamp(1rem, 2vw, 2rem);
  align-items: start;
  padding: clamp(1.25rem, 2.5vw, 2rem) clamp(1rem, 3vw, 3rem) 0 0;
}

.about-interest + .about-interest {
  padding-right: 0;
  padding-left: clamp(1rem, 3vw, 3rem);
  border-left: 1px solid color-mix(in srgb, currentColor 18%, transparent);
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
    animation: about-rise 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .about-hero__title {
    animation: about-rise 750ms 70ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .about-hero__statement {
    animation: about-rise 750ms 130ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .about-hero__copy {
    animation: about-rise 750ms 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .about-hero__interests {
    animation: about-rise 750ms 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
}

@keyframes about-rise {
  from {
    opacity: 0;
    transform: translate3d(0, 0.75rem, 0);
  }
}

@media (max-width: 1100px) {
  .about-interest {
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
    padding: 5rem 0 4.5rem;
  }

  .about-hero__title {
    margin-bottom: 1rem;
    font-size: clamp(2.65rem, 12vw, 3.6rem);
    line-height: 0.95;
  }

  .about-hero__statement {
    max-width: 19rem;
    margin-bottom: 2.8rem;
    font-size: 1.35rem;
  }

  .about-hero__copy {
    grid-template-columns: 1fr;
    gap: 1rem;
    max-width: 29rem;
    padding-left: 12vw;
    font-size: 0.9rem;
  }

  .about-hero__interests {
    grid-template-columns: 1fr;
  }

  .about-interest {
    grid-template-columns: 1fr;
    gap: 0.9rem;
    padding: 1.5rem 0;
  }

  .about-interest + .about-interest {
    padding: 1.5rem 0 0;
    border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent);
    border-left: 0;
  }

  .about-interest__copy {
    max-width: 21rem;
  }
}
</style>

<template>
  <section class="photo-empty" aria-labelledby="photo-empty-title">
    <div class="photo-empty__visual" aria-hidden="true">
      <div class="photo-empty__frame photo-empty__frame--left">
        <span class="photo-empty__frame-fill" />
      </div>
      <div class="photo-empty__frame photo-empty__frame--right">
        <span class="photo-empty__frame-fill" />
      </div>
      <div class="photo-empty__frame photo-empty__frame--front">
        <span class="photo-empty__frame-fill">
          <i class="i-hugeicons:image-not-found-01" />
        </span>
      </div>
    </div>

    <div class="photo-empty__copy">
      <h1 id="photo-empty-title">No photos yet.</h1>
      <p class="photo-empty__description">
        New work will appear here after it is added to the collection.
      </p>
      <NuxtLink class="photo-empty__link" to="/">
        <span>Back Home</span>
        <i class="i-hugeicons:arrow-up-right-02" aria-hidden="true" />
      </NuxtLink>
    </div>
  </section>
</template>

<style>
html.dark .photo-empty__visual {
  --photo-empty-frame-bg: #1c1c1a;
  --photo-empty-frame-fill: #252522;
  --photo-empty-frame-icon: #9b9a94;
  --photo-empty-frame-border: rgb(233 233 229 / 18%);
}
</style>

<style scoped>
.photo-empty {
  display: grid;
  width: min(calc(100% - 2rem), 72rem);
  min-height: 100dvh;
  margin-inline: auto;
  padding: clamp(4.5rem, 9vw, 7.5rem) clamp(1rem, 5vw, 4.5rem);
  grid-template-columns: minmax(0, 1.15fr) minmax(16rem, 0.85fr);
  gap: clamp(3rem, 8vw, 7rem);
  align-items: center;
}

.photo-empty__visual {
  --photo-empty-frame-bg: #f0f0ed;
  --photo-empty-frame-fill: #e2e2de;
  --photo-empty-frame-icon: #4a4a46;
  --photo-empty-frame-border: rgb(17 17 15 / 16%);

  position: relative;
  width: min(100%, 34rem);
  aspect-ratio: 1 / 0.86;
  justify-self: end;
}

.photo-empty__frame {
  position: absolute;
  padding: clamp(0.45rem, 1.2vw, 0.7rem);
  border: 1px dashed var(--photo-empty-frame-border);
  border-radius: 0.35rem;
  background: var(--photo-empty-frame-bg);
  /* box-shadow:
    0 1.5rem 4rem rgb(17 17 15 / 10%),
    inset 0 1px 0 color-mix(in srgb, currentColor 12%, transparent); */
  transform-origin: center;
}

.photo-empty__frame-fill {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  overflow: hidden;
  border-radius: 0.12rem;
  background:
    radial-gradient(
      circle at 56% 38%,
      color-mix(in srgb, currentColor 9%, transparent),
      transparent 46%
    ),
    var(--photo-empty-frame-fill);
}

.photo-empty__frame--left {
  inset: 10% 33% 24% 2%;
  transform: rotate(-7deg);
}

.photo-empty__frame--right {
  inset: 4% 1% 28% 42%;
  transform: rotate(6deg);
}

.photo-empty__frame--front {
  inset: 27% 16% 2% 20%;
  transform: rotate(-1.5deg);
}

.photo-empty__frame--front .photo-empty__frame-fill {
  font-size: clamp(2rem, 5vw, 3.75rem);
  color: var(--photo-empty-frame-icon);
}

.photo-empty__copy {
  max-width: 27rem;
}

.photo-empty__eyebrow {
  margin: 0 0 1.35rem;
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.48;
}

.photo-empty h1 {
  max-width: 8ch;
  margin: 0;
  font-size: clamp(2.8rem, 6vw, 5.4rem);
  font-weight: 520;
  letter-spacing: -0.065em;
  line-height: 0.92;
}

.photo-empty__description {
  max-width: 24rem;
  margin: 1.5rem 0 0;
  font-size: clamp(0.95rem, 1.4vw, 1.08rem);
  line-height: 1.65;
  opacity: 0.58;
}

.photo-empty__link {
  display: inline-flex;
  margin-top: 2rem;
  padding-bottom: 0.35rem;
  align-items: center;
  gap: 0.55rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  color: inherit;
  font-size: 0.83rem;
  font-weight: 600;
  text-decoration: none;
  transition:
    border-color 220ms ease,
    opacity 220ms ease;
}

.photo-empty__link i {
  transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-empty__link:hover {
  border-color: currentColor;
}

.photo-empty__link:hover i {
  transform: translate(0.16rem, -0.16rem);
}

.photo-empty__link:focus-visible {
  border-radius: 0.15rem;
  outline: 2px solid currentColor;
  outline-offset: 0.35rem;
}

@media (prefers-reduced-motion: no-preference) {
  .photo-empty__frame {
    animation: photo-empty-frame-in 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .photo-empty__frame--right {
    animation-delay: 70ms;
  }

  .photo-empty__frame--front {
    animation-delay: 140ms;
  }

  .photo-empty__copy {
    animation: photo-empty-copy-in 680ms 150ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
}

@keyframes photo-empty-frame-in {
  from {
    opacity: 0;
    scale: 0.94;
    translate: 0 1.25rem;
  }
}

@keyframes photo-empty-copy-in {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
}

@media (max-width: 767px) {
  .photo-empty {
    min-height: 100dvh;
    padding: 4.5rem 1rem 6.5rem;
    grid-template-columns: 1fr;
    gap: 2.5rem;
    align-content: center;
  }

  .photo-empty__visual {
    width: min(100%, 25rem);
    justify-self: center;
  }

  .photo-empty__copy {
    max-width: 29rem;
  }

  .photo-empty h1 {
    max-width: none;
    font-size: clamp(2.75rem, 14vw, 4.25rem);
  }
}
</style>

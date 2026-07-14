<template>
  <section v-for="section in 2" :key="section" class="project-skeleton__group" aria-hidden="true">
    <div class="project-skeleton__heading">
      <span />
      <i />
    </div>
    <div class="project-skeleton__grid">
      <div v-for="n in 4" :key="n" class="project-skeleton__card">
        <div class="project-skeleton__preview" />
        <div class="project-skeleton__body">
          <span class="project-skeleton__label" />
          <span class="project-skeleton__title" />
          <span class="project-skeleton__copy" />
          <span class="project-skeleton__copy is-short" />
          <span class="project-skeleton__meta" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.project-skeleton__group + .project-skeleton__group {
  margin-top: clamp(4.5rem, 9vw, 7.5rem);
}

.project-skeleton__heading {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.15rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
}

.project-skeleton__heading span,
.project-skeleton__heading i,
.project-skeleton__body span,
.project-skeleton__preview {
  display: block;
  border-radius: 0.24rem;
  background: color-mix(in srgb, currentColor 8%, transparent);
  animation: project-skeleton-pulse 1.5s ease-in-out infinite;
}

.project-skeleton__heading span {
  width: 5rem;
  height: 1rem;
}

.project-skeleton__heading i {
  width: 1.2rem;
  height: 0.6rem;
}

.project-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: 0.85rem;
}

.project-skeleton__card {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 9%, transparent);
  border-radius: 0.9rem;
}

.project-skeleton__preview {
  height: clamp(12rem, 22vw, 16rem);
  border-radius: 0;
}

.project-skeleton__body {
  min-height: 10rem;
  padding: 1.25rem 1.3rem;
}

.project-skeleton__label {
  width: 3.5rem;
  height: 0.4rem;
  margin-bottom: 0.6rem;
}

.project-skeleton__title {
  width: 42%;
  height: 1.2rem;
  margin-bottom: 1rem;
}

.project-skeleton__copy {
  width: 88%;
  height: 0.55rem;
  margin-bottom: 0.5rem;
}

.project-skeleton__copy.is-short {
  width: 61%;
}

.project-skeleton__meta {
  width: 34%;
  height: 0.55rem;
  margin-top: 2rem;
}

@keyframes project-skeleton-pulse {
  50% {
    opacity: 0.42;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-skeleton__heading span,
  .project-skeleton__heading i,
  .project-skeleton__body span,
  .project-skeleton__preview {
    animation: none;
  }
}
</style>

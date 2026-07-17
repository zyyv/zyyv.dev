<script setup lang="ts">
import type { PhotoReactionType } from '~/types'
import { PHOTO_REACTIONS } from '#shared/constants/photo-reactions'

defineProps<{
  disabled?: boolean
  error?: string | null
}>()
const emit = defineEmits<{
  react: [reaction: PhotoReactionType]
}>()
</script>

<template>
  <section class="photo-reactions" role="dialog" aria-label="Choose a reaction">
    <div class="photo-reactions__options">
      <button
        v-for="reaction in PHOTO_REACTIONS"
        :key="reaction.type"
        type="button"
        class="photo-reactions__button"
        :disabled="disabled"
        :aria-label="reaction.label"
        :title="reaction.label"
        @click="emit('react', reaction.type)"
      >
        <i :class="reaction.icon" aria-hidden="true" />
      </button>
    </div>

    <p v-if="error" class="photo-reactions__error" role="status">
      Reactions are unavailable right now.
    </p>
  </section>
</template>

<style scoped>
.photo-reactions {
  width: min(23rem, calc(100vw - 2rem));
  padding: 0.8rem;
  box-sizing: border-box;
  border: 1px dashed var(--dialog-line);
  background: var(--dialog-control);
  backdrop-filter: blur(1rem);
  box-shadow: 0 0.8rem 2.4rem color-mix(in srgb, var(--dialog-canvas) 55%, transparent);
}

.photo-reactions__error {
  margin: 0;
}

.photo-reactions__options {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.35rem;
}

.photo-reactions__button {
  position: relative;
  display: grid;
  min-width: 0;
  height: 2.55rem;
  padding: 0;
  /* border: 1px solid transparent; */
  /* border-radius: 0.2rem; */
  /* background: color-mix(in srgb, var(--dialog-text) 4%, transparent); */
  cursor: pointer;
  place-items: center;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    transform 180ms ease;
}

.photo-reactions__button i {
  font-size: 1.35rem;
  filter: saturate(0.82);
  transition:
    filter 180ms ease,
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-reactions__button:disabled {
  cursor: wait;
  opacity: 0.66;
}

.photo-reactions__error {
  margin-top: 0.6rem;
  color: var(--dialog-muted);
  font-size: 0.56rem;
  line-height: 1.4;
}

@media (hover: hover) and (pointer: fine) {
  .photo-reactions__button:not(:disabled):hover {
    transform: translateY(-0.08rem);
  }

  .photo-reactions__button:not(:disabled):hover i {
    filter: saturate(1);
    transform: scale(1.08);
  }
}

.photo-reactions__button:not(:disabled):active {
  transform: scale(0.95);
}

.photo-reactions__button:focus-visible {
  outline: 1px dashed var(--dialog-text);
  outline-offset: 0.18rem;
}

@media (prefers-reduced-motion: reduce) {
  .photo-reactions__button,
  .photo-reactions__button i {
    transition-duration: 1ms;
  }
}

@media (max-width: 479.9px) {
  .photo-reactions {
    width: min(20rem, calc(100vw - 1.5rem));
  }

  .photo-reactions__options {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>

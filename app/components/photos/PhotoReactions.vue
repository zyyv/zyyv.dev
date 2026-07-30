<script setup lang="ts">
import type { PhotoReactionType } from '~/types'
import { PHOTO_REACTIONS } from '#shared/constants/photo-reactions'

defineProps<{
  busy?: boolean
  disabled?: boolean
  error?: string | null
}>()
const emit = defineEmits<{
  react: [reaction: PhotoReactionType]
}>()
</script>

<template>
  <section class="photo-reactions" role="dialog" aria-label="Choose a reaction" :aria-busy="busy">
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
  width: min(20.5rem, calc(100vw - 2rem));
  padding: 0.42rem;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--dialog-control) 62%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 42%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--dialog-text) 4%, transparent),
    0 0.8rem 2.4rem color-mix(in srgb, var(--dialog-canvas) 48%, transparent);
  -webkit-backdrop-filter: blur(1.15rem) saturate(1.18);
  backdrop-filter: blur(1.15rem) saturate(1.18);
}

.photo-reactions__error {
  margin: 0;
}

.photo-reactions__options {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  column-gap: 0.12rem;
  row-gap: 0.08rem;
}

.photo-reactions__button {
  position: relative;
  display: grid;
  min-width: 0;
  height: 2.1rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 0.18rem;
  background: transparent;
  cursor: pointer;
  place-items: center;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    transform 180ms ease;
}

.photo-reactions__button i {
  font-size: 1.2rem;
  filter: saturate(0.82);
  transition:
    filter 180ms ease,
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-reactions__button:disabled {
  cursor: not-allowed;
}

.photo-reactions__error {
  margin-top: 0.6rem;
  color: var(--dialog-muted);
  font-size: 0.56rem;
  line-height: 1.4;
}

@media (hover: hover) and (pointer: fine) {
  .photo-reactions__button:not(:disabled):hover {
    /* border-color: color-mix(in srgb, var(--dialog-text) 8%, transparent); */
    /* background: color-mix(in srgb, var(--dialog-text) 6%, transparent); */
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
    width: min(17rem, calc(100vw - 1.5rem));
    padding: 0.35rem;
  }

  .photo-reactions__options {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .photo-reactions__button {
    height: 2rem;
  }
}
</style>

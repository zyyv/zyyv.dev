<script setup lang="ts">
import { PHOTO_REACTIONS } from '#shared/constants/photo-reactions'
import type { PhotoReactionCounts, PhotoReactionType } from '~/types'
import PhotoDetailGroup from './PhotoDetailGroup.vue'

interface Props {
  reactionCounts: PhotoReactionCounts
}

interface ActiveReaction {
  type: PhotoReactionType
  icon: string
  label: string
  count: number
}

const props = defineProps<Props>()

const activeReactions = computed<ActiveReaction[]>(() =>
  PHOTO_REACTIONS.filter((reaction) => props.reactionCounts[reaction.type] > 0).map((reaction) => ({
    type: reaction.type,
    icon: reaction.icon,
    label: reaction.label,
    count: props.reactionCounts[reaction.type],
  })),
)
</script>

<template>
  <PhotoDetailGroup title="Reactions" live="polite">
    <ul
      v-if="activeReactions.length"
      class="photo-dialog__reaction-list"
      aria-label="Reaction counts"
    >
      <li v-for="reaction in activeReactions" :key="reaction.type" class="photo-dialog__reaction">
        <i :class="reaction.icon" aria-hidden="true" />
        <span class="photo-dialog__reaction-label">{{ reaction.label }}</span>
        <span class="photo-dialog__reaction-count" aria-hidden="true">{{ reaction.count }}</span>
      </li>
    </ul>
    <p v-else class="photo-dialog__empty-reactions">No reactions yet.</p>
  </PhotoDetailGroup>
</template>

<style scoped>
.photo-dialog__reaction-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.photo-dialog__reaction {
  position: relative;
  display: grid;
  flex: 0 0 1.8rem;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 0.42rem;
  background: transparent;
  transition: background-color 180ms ease;
}

.photo-dialog__reaction > i {
  font-size: 1.1rem;
  filter: saturate(0.82);
  transition: filter 180ms ease;
}

.photo-dialog__reaction-count {
  position: absolute;
  right: 0;
  bottom: 0;
  /* min-width: 0.7rem; */
  /* padding: 0.08rem 0.12rem; */
  border-radius: 0.18rem;
  color: var(--dialog-muted);
  font-size: 0.48rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: center;
}

.photo-dialog__reaction-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.photo-dialog__empty-reactions {
  margin: 0;
  color: var(--dialog-muted);
  font-size: 0.66rem;
  line-height: 1.45;
}

@media (max-width: 479.9px) {
  .photo-dialog__reaction-list {
    gap: 0.35rem;
  }

  .photo-dialog__reaction {
    flex-basis: 2.35rem;
  }
}

@media (hover: hover) and (pointer: fine) {
  .photo-dialog__reaction:hover {
    background: color-mix(in srgb, var(--dialog-text) 5%, transparent);
  }

  .photo-dialog__reaction:hover > i {
    filter: saturate(1);
    animation: photo-dialog-reaction-hover 560ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}

@keyframes photo-dialog-reaction-hover {
  0%,
  100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }

  35% {
    transform: translateY(-0.18rem) rotate(-8deg) scale(1.08);
  }

  70% {
    transform: translateY(-0.06rem) rotate(5deg) scale(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-dialog__reaction,
  .photo-dialog__reaction > i {
    animation: none !important;
    transition-duration: 1ms;
  }
}
</style>

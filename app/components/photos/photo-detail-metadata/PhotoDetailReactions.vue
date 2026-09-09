<script setup lang="ts">
import { PHOTO_REACTIONS } from '#shared/constants/photo-reactions'
import type { PhotoReactionCounts } from '~/types'
import type { PhotoDetailRow } from './photo-detail-metadata.types'
import PhotoDetailGroup from './PhotoDetailGroup.vue'
import PhotoDetailRows from './PhotoDetailRows.vue'

interface Props {
  reactionCounts: PhotoReactionCounts
}

const props = defineProps<Props>()

const activeReactions = computed<PhotoDetailRow[]>(() =>
  PHOTO_REACTIONS.filter((reaction) => props.reactionCounts[reaction.type] > 0).map((reaction) => ({
    icon: reaction.icon,
    label: reaction.label,
    value: props.reactionCounts[reaction.type],
  })),
)
</script>

<template>
  <PhotoDetailGroup title="Reactions" live="polite">
    <PhotoDetailRows
      v-if="activeReactions.length"
      class="photo-dialog__reaction-list"
      :details="activeReactions"
    />
    <p v-else class="photo-dialog__empty-reactions">No reactions yet.</p>
  </PhotoDetailGroup>
</template>

<style scoped>
.photo-dialog__empty-reactions {
  margin: 0;
  color: var(--dialog-muted);
  font-size: 0.66rem;
  line-height: 1.45;
}
</style>

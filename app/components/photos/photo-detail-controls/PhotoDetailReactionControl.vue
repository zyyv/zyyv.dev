<script setup lang="ts">
import type { Photo, PhotoReactionType } from '~/types'
import PhotoReactions from '../PhotoReactions.vue'
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

interface Props {
  photo: Photo
  busy?: boolean
  disabled?: boolean
  error?: string | null
}

interface Emits {
  react: [reaction: PhotoReactionType]
}

const props = withDefaults(defineProps<Props>(), {
  busy: false,
  disabled: false,
  error: null,
})
const emit = defineEmits<Emits>()
const showReactions = shallowRef(false)
const reactionControl = useTemplateRef<HTMLElement>('reactionControl')
const mediaLabel = computed(() => (props.photo.mediaType === 'video' ? 'video' : 'photo'))
const label = computed(() => `React to this ${mediaLabel.value}`)

onClickOutside(reactionControl, () => {
  showReactions.value = false
})

onKeyStroke('Escape', () => {
  showReactions.value = false
})
</script>

<template>
  <div ref="reactionControl" class="photo-detail-reaction-control">
    <Transition name="photo-detail-reaction-popover">
      <PhotoReactions
        v-show="showReactions"
        class="photo-detail-reaction-control__popover"
        :busy="props.busy"
        :disabled="props.disabled"
        :error="props.error"
        @react="emit('react', $event)"
      />
    </Transition>

    <PhotoDetailControlButton
      :label="label"
      icon="i-hugeicons:smile"
      :disabled="props.disabled"
      :expanded="showReactions"
      has-popup="dialog"
      @click="showReactions = !showReactions"
    />
  </div>
</template>

<style scoped>
.photo-detail-reaction-control {
  position: relative;
  display: grid;
  min-width: 2rem;
  align-self: stretch;
}

.photo-detail-reaction-control__popover {
  position: absolute;
  bottom: calc(100% + 0.55rem);
  left: 50%;
  transform: translateX(-50%);
}

.photo-detail-reaction-popover-enter-active,
.photo-detail-reaction-popover-leave-active {
  transition:
    opacity 160ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-detail-reaction-popover-enter-from,
.photo-detail-reaction-popover-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.45rem) scale(0.98);
}

@media (max-width: 767.9px) {
  .photo-detail-reaction-control {
    min-height: 1.9rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-detail-reaction-popover-enter-active,
  .photo-detail-reaction-popover-leave-active {
    transition-duration: 1ms;
  }
}
</style>

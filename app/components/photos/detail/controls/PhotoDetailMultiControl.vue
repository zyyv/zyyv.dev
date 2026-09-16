<script setup lang="ts">
import { usePhotoDetailContext } from '~/composables/photos/detail/usePhotoDetailContext'
import PhotoDetailBackgroundControl from './PhotoDetailBackgroundControl.vue'
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'
import PhotoDetailReactionControl from './PhotoDetailReactionControl.vue'

const { detailPhoto, isVideo } = usePhotoDetailContext()
const isExpanded = shallowRef(false)
const isHovering = shallowRef(false)
const isClickExpanded = shallowRef(false)
const multiControl = useTemplateRef<HTMLElement>('multiControl')
let collapseTimer: ReturnType<typeof setTimeout> | undefined

function expand() {
  clearTimeout(collapseTimer)
  isExpanded.value = true
}

function collapse() {
  clearTimeout(collapseTimer)
  isHovering.value = false
  isClickExpanded.value = false
  isExpanded.value = false
}

function handleMouseEnter() {
  isHovering.value = true
  isClickExpanded.value = false
  expand()
}

function handleMouseLeave() {
  if (!isHovering.value) return
  isHovering.value = false
  clearTimeout(collapseTimer)
  collapseTimer = setTimeout(() => {
    const element = multiControl.value
    const focusedInside = element?.contains(document.activeElement) ?? false
    if (isClickExpanded.value || element?.matches(':hover') || focusedInside) return
    isExpanded.value = false
  }, 80)
}

function toggle() {
  clearTimeout(collapseTimer)
  isExpanded.value = !isExpanded.value
  isClickExpanded.value = isExpanded.value
}

onClickOutside(multiControl, collapse)
onKeyStroke('Escape', () => {
  if (isExpanded.value) collapse()
})
watch(
  () => detailPhoto.value?.id,
  () => collapse(),
)
onBeforeUnmount(() => clearTimeout(collapseTimer))
</script>

<template>
  <div
    ref="multiControl"
    class="photo-detail-multi-control"
    :class="{ 'is-expanded': isExpanded }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="photo-detail-multi-control__panel" :aria-hidden="!isExpanded" :inert="!isExpanded">
      <div class="photo-detail-multi-control__item">
        <PhotoDetailReactionControl />
      </div>

      <div v-if="!isVideo" class="photo-detail-multi-control__item">
        <PhotoDetailBackgroundControl />
      </div>
    </div>

    <div class="photo-detail-multi-control__trigger">
      <PhotoDetailControlButton
        label="Open more photo controls"
        title="More controls"
        icon="i-hugeicons:more-horizontal-circle-01"
        :expanded="isExpanded"
        has-popup="menu"
        sound="toggle"
        @click="toggle"
      />
    </div>
  </div>
</template>

<style scoped>
.photo-detail-multi-control {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
}

.photo-detail-multi-control__panel {
  display: flex;
  flex: 0 0 auto;
  width: 0;
  min-width: 0;
  gap: 0.18rem;
  overflow: hidden;
  opacity: 0;
  transform: translateX(0.65rem);
  pointer-events: none;
  transition:
    width 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 160ms ease,
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-detail-multi-control.is-expanded .photo-detail-multi-control__panel {
  width: 5.58rem;
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.photo-detail-multi-control__item {
  display: flex;
  flex: 0 0 2.7rem;
  align-items: stretch;
}

.photo-detail-multi-control__trigger {
  display: flex;
  flex: 0 0 2.7rem;
  align-items: stretch;
  overflow: hidden;
  opacity: 1;
  transition:
    flex-basis 260ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 160ms ease,
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    visibility 0s linear;
}

.photo-detail-multi-control.is-expanded .photo-detail-multi-control__trigger {
  flex-basis: 0;
  opacity: 0;
  transform: translateX(-0.35rem) scale(0.8);
  visibility: hidden;
  transition:
    flex-basis 260ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 140ms ease,
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    visibility 0s linear 220ms;
}

:deep(.photo-detail-control-button) {
  width: 2.7rem;
  min-height: 2.7rem;
  border-radius: 0.82rem;
}

@media (prefers-reduced-motion: reduce) {
  .photo-detail-multi-control__panel,
  .photo-detail-multi-control__trigger {
    transition-duration: 1ms;
  }
}
</style>

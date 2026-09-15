<script setup lang="ts">
import PhotoDetailControlButton from './PhotoDetailControlButton.vue'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  toggle: []
}>()

const label = computed(() => (props.open ? 'Hide photo details' : 'Show photo details'))
</script>

<template>
  <PhotoDetailControlButton
    :label="label"
    icon="i-hugeicons:information-circle"
    :pressed="props.open"
    :expanded="props.open"
    has-popup="dialog"
    sound="toggle"
    @click="emit('toggle')"
  />
</template>

<script lang="ts" setup>
defineProps<{
  quadrant: string
}>()

const { setQuadrantSize } = useCenter()

function handleClick(quadrant: string) {
  setQuadrantSize(quadrant)
}
</script>

<template>
  <div
    class="op-0 trans group-hover:op-80 pa z-100 cursor-pointer text-sm text-red hover:op-100! pointer-events-auto"
    :class="{
      'bottom-1.3 left-1.3': quadrant === 'I',
      'bottom-1.3 right-1.3': quadrant === 'II',
      'top-1.3 right-1.3': quadrant === 'III',
      'top-1.3 left-1.3': quadrant === 'IV',
    }"
    @click.stop="handleClick(quadrant)"
  >
    <i
      i-hugeicons:arrow-up-01
      :class="{
        'rotate-45': quadrant === 'I',
        'rotate--45': quadrant === 'II',
        'rotate--135': quadrant === 'III',
        'rotate-135': quadrant === 'IV',
      }"
    />
  </div>
</template>

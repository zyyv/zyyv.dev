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
    class="op-0 trans group-hover:op-80 pa z-100 cursor-pointer text-xs text-basecolor hover:op-100! pointer-events-auto"
    :class="{
      'bottom-2 left-2': quadrant === 'I',
      'bottom-2 right-2': quadrant === 'II',
      'top-2 right-2': quadrant === 'III',
      'top-2 left-2': quadrant === 'IV',
    }"
    @click.stop="handleClick(quadrant)"
  >
    <i
      :class="{
        'i-hugeicons:arrow-expand-02': quadrant === 'II' || quadrant === 'IV',
        'i-hugeicons:arrow-expand-01': quadrant === 'I' || quadrant === 'III',
      }"
    />
  </div>
</template>

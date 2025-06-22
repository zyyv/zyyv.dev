<script lang='ts' setup>
import { defineProps } from 'vue';

defineProps<{
  x: number;
  y: number;
}>();
</script>

<template>
  <div class="w-full h-full grid" :style="{
    gridTemplateColumns: `${x * 100}% ${100 - x * 100}%`,
    gridTemplateRows: `${y * 100}% ${100 - origin.y * 100}%`
  }">
    <slot />
  </div>
</template>

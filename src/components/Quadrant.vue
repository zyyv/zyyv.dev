<script lang='ts' setup>
import { defineProps, withDefaults } from 'vue';
import { useCenterStore } from '../stores/center';

const { center } = useCenterStore()
</script>

<template>
  <div class="w-full h-full grid" :style="{
    gridTemplateColumns: `${center.x * 100}% ${100 - center.x * 100}%`,
    gridTemplateRows: `${center.y * 100}% ${100 - center.y * 100}%`
  }">
    <slot />
  </div>
</template>

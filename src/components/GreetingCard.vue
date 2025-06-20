<script setup>
import { ref } from 'vue'

const count = ref(0)
function increment() {
  count.value++
}
</script>

<template>
  <div class="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md transition-colors duration-300">
    <h2 class="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-400 transition-colors duration-300">
      Vue Component in Astro!
    </h2>
    <p class="mb-4 transition-colors duration-300">
      This is a Vue component rendered inside an Astro page.
      UnoCSS classes are used for styling this component.
    </p>
    <div class="flex items-center gap-4">
      <button
        class="btn btn-primary transition-colors duration-300"
        @click="increment"
      >
        Count: {{ count }}
      </button>
      <span v-if="count > 0" class="text-green-600 dark:text-green-400 transition-colors duration-300 animate-pulse">
        Button clicked {{ count }} times!
      </span>
    </div>
  </div>
</template>

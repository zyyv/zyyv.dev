<template>
  <div v-for="section in 2" :key="section">
    <h4 class="h-6 w-32 bg-stone-300 dark:bg-stone-700 rounded mb-3" animate="pulse" />
    <div grid="~ cols-1 @3xl:cols-2 gap-4">
      <div
        v-for="n in 4" :key="n"
        class="rounded-lg p-4"
        dark:bg-dark-500 bg-gray-200
        flex="~ col" gap-3
        animate="pulse"
      >
        <div fsc gap-2 w-full>
          <div class="h-5 w-1/3 bg-gray-300 dark:bg-dark-300 rounded" />
        </div>
        <div class="h-3 w-4/5 bg-gray-300 dark:bg-dark-300 rounded" />
        <div class="flex items-center space-x-4">
          <div class="h-4 w-16 bg-gray-300 dark:bg-dark-300 rounded" />
          <div class="h-4 w-16 bg-gray-300 dark:bg-dark-300 rounded" />
        </div>
      </div>
    </div>
  </div>
</template>

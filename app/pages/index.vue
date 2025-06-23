<script lang="ts" setup>
useHead({
  title: 'Chris',
})
definePageMeta({
  layout: false,
})
</script>

<template>
  <NuxtLayout name="default">
    <template #two>
      <div fccc class="@container">
        <PersonInfo />
      </div>
    </template>
    <template #one>
      <img class="max-w-80%" src="/photos/DSC00964.jpg" alt="Description">
      <img class="max-w-80%" src="/photos/DSC01329.jpg" alt="Description">
    </template>
    <template #three>
      <Projects />
    </template>
    <template #four>
      <div fccc>
        1
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
interface Props {
  href?: string
  target?: string
}

const props = withDefaults(defineProps<Props>(), {
  href: '',
  target: undefined,
})
</script>

<template>
  <NuxtLink :href="props.href" :target="props.target" data-cuelume-hover="tick">
    <slot />
  </NuxtLink>
</template>

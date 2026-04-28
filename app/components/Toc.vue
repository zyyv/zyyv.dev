<script lang="ts" setup>
import { proseHeadingClick } from '~/utils'

interface TocLink {
  id: string
  text: string
  depth: number
  children?: TocLink[]
}

defineProps<{
  links: TocLink[]
  highlights: string[]
}>()
</script>

<template>
  <ul class="space-y-1 text-3.25">
    <li v-for="link in links" :key="link.id" :class="`pl-${link.depth * 4}`">
      <a
        :href="`#${link.id}`" class="text op-50 trans"
        :class="highlights.includes(link.id) ? 'op-100!' : ''"
        hover="underline op-100"
        @click="proseHeadingClick($event, link.id)"
      >{{ link.text }}</a>
      <Toc v-if="link.children" :links="link.children" :highlights pl-4 my-1 />
    </li>
  </ul>
</template>

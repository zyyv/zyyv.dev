<script setup lang="ts">
import type { PostPreview } from '~/types'

const props = defineProps<{
  posts: PostPreview[]
}>()

const previewPosts = computed(() => props.posts.slice(0, 4))
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(date: string) {
  return dateFormatter.format(new Date(date))
}
</script>

<template>
  <div v-if="previewPosts.length" class="posts-list">
    <article v-for="post in previewPosts" :key="post.id" class="post-row group">
      <NuxtLink
        :to="post.path"
        class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-8 px-[clamp(1rem,3vw,2rem)] py-[clamp(1.35rem,3vw,2rem)] color-inherit no-underline transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:([background-color:color-mix(in_srgb,currentColor_5%,transparent)]) active:scale-99 focus-visible:(outline-2 outline-current outline-offset--4) motion-reduce:transition-none lt-md:(grid-cols-1 gap-5)"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] op-42">
            <time :datetime="post.date">{{ formatDate(post.date) }}</time>
            <span v-if="post.tags?.[0]" class="truncate">{{ post.tags[0] }}</span>
          </div>
          <h3
            class="mb-0 mt-3 text-[clamp(1.15rem,2.2vw,1.65rem)] leading-[1.15] font-600 tracking-[-0.035em] transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
          >
            {{ post.title }}
          </h3>
          <p class="mb-0 mt-3 line-clamp-2 max-w-60ch text-sm leading-6 op-52">
            {{ post.description }}
          </p>
        </div>

        <div class="flex items-center gap-4 lt-md:justify-between">
          <span class="text-[0.7rem] op-38">{{ post.readingMinutes }} min read</span>
          <i
            class="i-hugeicons:arrow-right-02 text-lg op-28 transition-[opacity,transform] duration-300 group-hover:(translate-x-1 op-72) motion-reduce:transition-none"
            aria-hidden="true"
          />
        </div>
      </NuxtLink>
    </article>
  </div>

  <div
    v-else
    class="grid min-h-72 place-items-center rounded-[0.9rem] [background-color:color-mix(in_srgb,currentColor_4%,transparent)]"
  >
    <div class="text-center op-52">
      <i class="i-hugeicons:note-remove mb-3 text-3xl" aria-hidden="true" />
      <p class="m-0 text-sm">No posts yet</p>
    </div>
  </div>
</template>

<style scoped>
.posts-list {
  overflow: hidden;
  border-radius: 0.9rem;
  background-color: color-mix(in srgb, currentColor 2.5%, transparent);
}

.post-row:not(:last-child) {
  border-bottom: 1px solid color-mix(in srgb, currentColor 11%, transparent);
}
</style>

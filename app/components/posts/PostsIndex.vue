<script lang="ts" setup>
import type { PostPreview } from '~/types'

const props = defineProps<{
  posts: PostPreview[]
}>()

function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const words = text.split(/\s/g).length
  return Math.ceil(words / wordsPerMinute)
}

const tags = ref(new Set<string>())

onMounted(() => {
  const query = new URLSearchParams(window.location.search)
  tags.value = new Set(query.get('tags')?.split(',').filter(Boolean) ?? [])
})

function syncUrl() {
  if (tags.value.size === 0) {
    history.replaceState(null, '', '/posts')
  }
  else {
    history.replaceState(null, '', `/posts?tags=${Array.from(tags.value).join(',')}`)
  }
}

function toggleTag(tag: string) {
  const next = new Set(tags.value)
  if (next.has(tag)) {
    next.delete(tag)
  }
  else {
    next.add(tag)
  }
  tags.value = next
  syncUrl()
}

const sortedPosts = computed(() => {
  if (tags.value.size === 0) {
    return props.posts
  }

  return [...props.posts].sort((a, b) => {
    const aHasTag = a.tags.some(tag => tags.value.has(tag))
    const bHasTag = b.tags.some(tag => tags.value.has(tag))

    if (aHasTag && !bHasTag)
      return -1
    if (!aHasTag && bHasTag)
      return 1
    return 0
  })
})
</script>

<template>
  <div mxa w-65ch>
    <PageHeader title="Posts" description="In the flow of time, seeking resonance with the soul." />

    <ul my-8 space-y-7>
      <li
        v-for="post in sortedPosts"
        :key="post.id"
        trans
        :class="tags.size > 0 && post.tags.every(tag => !tags.has(tag)) ? 'op-50' : ''"
      >
        <a :href="post.path">
          <strong>{{ post.title }}</strong>
          <sub v-if="post.rawbody" bottom-0 left-1.5>
            <span text-2.75 op-72>{{ calculateReadingTime(post.rawbody) }} min</span>
          </sub>
        </a>

        <p italic font-dank my-2 line-clamp-2 text-sm op-72>
          {{ post.description }}
        </p>

        <div fbc op-64>
          <div flex="~ wrap gap-2">
            <span
              v-for="tag in post.tags"
              :key="tag"
              inline-block text-xs rd-full px-1.5 py-1px cursor-pointer
              b="~ gray dashed"
              :class="tags.has(tag) ? 'dark:b-gray-3 dark:bg-gray-3 bg-gray-3 b-gray-3 dark:text-gray-8 text-gray-5' : ''"
              @click="toggleTag(tag)"
            >{{ tag }}</span>
          </div>
          <div>
            <span text-2.75 mr-2>{{ useDateFormat(post.date, 'MMM DD', { locales: 'en-US' }) }}</span>
            <span text-2.75>{{ useTimeAgo(post.date) }}</span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang='ts' setup>
const { data: posts, status } = await useAsyncData('posts-preview', () => {
  return queryCollection('posts')
    .select('title', 'description', 'path', 'id', 'date', 'tags', 'lang')
    .order('date', 'DESC')
    .limit(10)
    .all()
})

const postsList = computed(() => (posts.value as any) || [])
</script>

<template>
  <div mxa max-w-65ch px-6 class="hidden @sm:block">
    <div py-8 space-y-6>
      <!-- 加载状态 -->
      <div v-if="status === 'pending'" class="space-y-4">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
      </div>

      <!-- 文章列表 -->
      <div v-else-if="status === 'success' && postsList.length > 0" space-y-6>
        <article
          v-for="post in postsList"
          :key="post.id"
          class="op-72 hover:op-100 cursor-pointer trans hover:translate-x-2"
        >
          <nuxt-link :to="post.path" class="block">
            <h3 class="text-lg font-semibold mb-2 trans">
              {{ post.title }}
            </h3>

            <p class="text-sm op-72 italic font-dank mb-3 line-clamp-2">
              {{ post.description }}
            </p>

            <div class="flex items-center justify-between text-xs op-64">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in post.tags?.slice(0, 3)"
                  :key="tag"
                  class="px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-600"
                >
                  {{ tag }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span>{{ useDateFormat(post.date, 'MMM DD', { locales: 'en-US' }) }}</span>
                <span>{{ useTimeAgo(post.date) }}</span>
              </div>
            </div>
          </nuxt-link>
        </article>

        <!-- 查看更多链接 -->
        <div class="pt-4 text-center">
          <nuxt-link
            to="/posts"
            class="inline-flex items-center gap-2 text-sm op-64 hover:op-100 trans"
          >
            <span>View all posts</span>
            <i class="i-hugeicons:arrow-right-01" />
          </nuxt-link>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center py-16 op-64">
        <div class="text-4xl mb-4">
          <i i-hugeicons:camera-ai />
        </div>
        <div class="text-sm">
          No posts yet
        </div>
      </div>
    </div>
  </div>

  <!-- 移动端视图 -->
  <div class="@sm:hidden! size-full fcc">
    <nuxt-link
      to="/posts"
      class="cursor-pointer"
      text="3xl blue op-80 hover:op-100"
    >
      <i i-hugeicons:note-edit />
    </nuxt-link>
  </div>
</template>

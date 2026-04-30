<script lang="ts" setup>
import type { Repo } from '~/types'

const data = ref<Record<string, Repo[]> | null>(null)
const status = ref<'pending' | 'success' | 'error'>('pending')
const errorMessage = ref('Failed to load repositories.')

async function fetchRepos(url: string, timeout = 15000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok)
      throw new Error('Failed to load repositories.')

    return await response.json() as Record<string, Repo[]>
  }
  finally {
    window.clearTimeout(timer)
  }
}

onMounted(async () => {
  try {
    data.value = await fetchRepos('/api/repos')
    status.value = Object.values(data.value).some(repos => repos.length > 0)
      ? 'success'
      : 'error'
  }
  catch (error) {
    console.error(error)
    errorMessage.value = error instanceof DOMException && error.name === 'AbortError'
      ? 'Loading repositories timed out.'
      : 'Failed to load repositories.'
    status.value = 'error'
  }
})
</script>

<template>
  <div mxa max-w-65ch px-6 class="quadrant-desktop-block hidden">
    <div py-8 space-y-8>
      <ProjectsSkeleton v-if="status === 'pending'" />
      <div v-for="(repos, key) in data" v-else-if="status === 'success'" :key="key">
        <h4 mb-2>
          {{ key }}
        </h4>
        <div grid="~ cols-1 @3xl:cols-2 gap-4">
          <ProjectsRepoCard v-for="repo in repos" :key="repo.id" :repo="repo" />
        </div>
      </div>
      <div v-else class="op-64 text-sm">
        {{ errorMessage }}
      </div>
    </div>
  </div>
  <div class="quadrant-mobile size-full fcc">
    <div
      class="cursor-pointer"
      text="3xl yellow op-80 hover:op-100"
    >
      <i i-hugeicons:package-search />
    </div>
  </div>
</template>

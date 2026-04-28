<script lang="ts" setup>
const data = ref<Record<string, any[]> | null>(null)
const status = ref<'pending' | 'success' | 'error'>('pending')

onMounted(async () => {
  try {
    const response = await fetch('/api/repos')
    if (!response.ok)
      throw new Error(`Failed to load repos: ${response.status}`)
    data.value = await response.json()
    status.value = 'success'
  }
  catch (error) {
    console.error(error)
    status.value = 'error'
  }
})
</script>

<template>
  <div mxa max-w-65ch px-6 class="hidden @sm:block">
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
    </div>
  </div>
  <div class="@sm:hidden! size-full fcc">
    <div
      class="cursor-pointer"
      text="3xl yellow op-80 hover:op-100"
    >
      <i i-hugeicons:package-search />
    </div>
  </div>
</template>

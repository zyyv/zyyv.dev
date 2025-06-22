<script lang='ts' setup>
const { data, status } = useFetch('/api/repos')
</script>

<template>
  <div mxa max-w-65ch>
    <div my-8 space-y-8>
      <template v-if="status === 'pending'">
        <div v-for="section in 2" :key="section">
          <h4 mb-3 class="h-6 w-32 bg-gray-300:72 dark:bg-gray:32 rounded animate-pulse" />
          <div grid="~ cols-1 md:cols-2 gap-4">
            <RepoSkeleton v-for="n in 4" :key="n" />
          </div>
        </div>
      </template>

      <template v-else-if="status === 'success'">
        <div v-for="(repos, key) in data" :key="key">
          <h4 mb-2>
            {{ key }}
          </h4>
          <div grid="~ cols-1 md:cols-2 gap-4">
            <RepoCard v-for="repo in repos" :key="repo.id" :repo="repo" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

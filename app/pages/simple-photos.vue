<script setup>
const photos = ref([])
const loading = ref(false)
const error = ref(null)

async function loadPhotos() {
  try {
    loading.value = true
    error.value = null

    const response = await $fetch('/api/photos?limit=6')
    if (response.photos) {
      photos.value = response.photos
    }
  }
  catch (e) {
    error.value = e.message
    console.error('Error loading photos:', e)
  }
  finally {
    loading.value = false
  }
}

function onImageLoad(event) {
  // eslint-disable-next-line no-console
  console.log('Image loaded:', event.target.src)
}

function onImageError(event) {
  console.error('Image failed to load:', event.target.src)
}

onMounted(() => {
  loadPhotos()
})
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl mb-4">
      Simple Photos Test
    </h1>

    <div v-if="error" class="text-red-500 mb-4">
      Error: {{ error }}
    </div>

    <div v-if="loading" class="mb-4">
      Loading...
    </div>

    <div v-if="photos.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="photo in photos" :key="photo.filename" class="border rounded p-2">
        <div class="mb-2">
          <strong>{{ photo.filename }}</strong>
        </div>
        <div class="mb-2">
          <img
            :src="photo.path"
            :alt="photo.filename"
            class="w-full h-48 object-cover rounded"
            @load="onImageLoad"
            @error="onImageError"
          >
        </div>
        <div class="text-sm text-gray-600">
          {{ photo.width }} x {{ photo.height }}
        </div>
      </div>
    </div>
  </div>
</template>

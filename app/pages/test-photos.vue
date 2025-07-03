<script setup>
const photo = ref(null)
const error = ref(null)

async function loadTestPhoto() {
  try {
    error.value = null
    const response = await $fetch('/api/photos?limit=1')
    if (response.photos && response.photos.length > 0) {
      photo.value = response.photos[0]
    }
  }
  catch (e) {
    error.value = e.message
    console.error('Error loading photo:', e)
  }
}
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl mb-4">
      Photos Test
    </h1>
    <div class="mb-4">
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        @click="loadTestPhoto"
      >
        Load Test Photo
      </button>
    </div>

    <div v-if="photo" class="mb-4">
      <h2 class="text-lg mb-2">
        Photo Info:
      </h2>
      <pre class="bg-gray-100 p-4 rounded">{{ JSON.stringify(photo, null, 2) }}</pre>
    </div>

    <div v-if="photo" class="mb-4">
      <h2 class="text-lg mb-2">
        Direct Image Test:
      </h2>
      <img :src="photo.path" alt="test" class="max-w-sm border">
    </div>

    <div v-if="photo" class="mb-4">
      <h2 class="text-lg mb-2">
        ImgBlurHash Test:
      </h2>
      <ImgBlurHash
        :src="photo.path"
        :blurhash="photo.blurhash"
        class="max-w-sm border"
      />
    </div>

    <div v-if="error" class="text-red-500">
      Error: {{ error }}
    </div>
  </div>
</template>

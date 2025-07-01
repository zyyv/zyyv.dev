<script lang="ts" setup>
import { VueVirtualWaterfall } from '@lhlyu/vue-virtual-waterfall'

import ImgA from '../../../public/photos/DSC00964.JPG'
import ImgC from '../../../public/photos/DSC01031.JPG'
import ImgB from '../../../public/photos/DSC01329.JPG'

const photos = [
  { src: ImgA, id: 'DSC00964' },
  { src: ImgB, id: 'DSC01329' },
  { src: ImgC, id: 'DSC01031' },
]
</script>

<template>
  <div>
    <div fccc gap-2>
      <div
        v-for="photo in photos"
        :key="photo.id"
      >
        <img :src="photo.src" alt="Description">
      </div>
    </div>
  </div>
</template>

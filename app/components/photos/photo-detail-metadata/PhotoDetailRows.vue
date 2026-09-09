<script setup lang="ts">
import type { PhotoDetailRow } from '~/types'

interface Props {
  details: readonly PhotoDetailRow[]
}

defineProps<Props>()
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <dl class="photo-dialog__detail-list">
    <div v-for="detail in details" :key="detail.label">
      <dt>
        <i :class="detail.icon" aria-hidden="true" />
        <span>{{ detail.label }}</span>
      </dt>
      <dd>{{ detail.value }}</dd>
    </div>
    <slot />
  </dl>
</template>

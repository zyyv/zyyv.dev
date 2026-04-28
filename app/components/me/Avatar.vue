<script lang="ts" setup>
const avatarUrl = ref('/avatar.png')

onMounted(async () => {
  try {
    const response = await fetch('/api/user')
    if (response.ok) {
      const user = await response.json()
      avatarUrl.value = user.avatar_url || avatarUrl.value
    }
  }
  catch (error) {
    console.error(error)
  }
})
</script>

<template>
  <div view-transition-logo>
    <ImgBlurHash
      mode="bg"
      :src="avatarUrl"
      blurhash="L4A1l2Mx0FN402eiyEx|00-;%MIV"
      alt="Avatar"
      class="w-[clamp(calc(var(--spacing)_*_10),_calc(100cqw_/_10),_calc(var(--spacing)_*_30))]"
      aspect-square
      rd="[62%_47%_82%_35%/45%_45%_80%_66%]"
      will-change="border-radius,transform,opacity"
      animate-shape
    />
  </div>
</template>

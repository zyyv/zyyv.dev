<script lang="ts" setup>
defineProps<{
  mobile?: boolean
}>()

const avatarUrl = ref('/avatar.png')

onMounted(async () => {
  try {
    const response = await fetch('/api/user')
    if (response.ok) {
      const user = await response.json()
      avatarUrl.value = user.avatar_url || avatarUrl.value
    }
  } catch (error) {
    console.error(error)
  }
})
</script>

<template>
  <div class="avatar-shell" :class="{ 'avatar-shell-mobile': mobile }" view-transition-logo>
    <ImgBlurHash
      mode="bg"
      :src="avatarUrl"
      blurhash="L4A1l2Mx0FN402eiyEx|00-;%MIV"
      alt="Avatar"
      class="avatar-image w-[clamp(calc(var(--spacing)_*_10),_calc(100cqw_/_10),_calc(var(--spacing)_*_30))]"
      aspect-square
      rd="[62%_47%_82%_35%/45%_45%_80%_66%]"
      will-change="border-radius,transform,opacity"
      animate-shape
    />
  </div>
</template>

<style scoped>
.avatar-shell {
  display: inline-grid;
  place-items: center;
}

@media (max-width: 767px) {
  .avatar-shell-mobile {
    position: relative;
    padding: 0.45rem;
  }

  .avatar-shell-mobile::before {
    position: absolute;
    inset: 0;
    border: 1px dashed rgba(248, 113, 113, 0.42);
    animation: shape 5s linear infinite;
    border-radius: 46% 54% 62% 38% / 50% 44% 56% 50%;
    content: '';
    transform: rotate(-7deg);
  }

  .avatar-shell-mobile .avatar-image {
    width: clamp(8.5rem, 45vw, 12rem);
    box-shadow: 0 24px 70px rgba(248, 113, 113, 0.24);
  }
}
</style>

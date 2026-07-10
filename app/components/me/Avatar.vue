<script setup lang="ts">
interface Props {
  mobile?: boolean
  navigation?: boolean
  shared?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mobile: false,
  navigation: false,
  shared: false,
})

const avatarUrl = shallowRef('/avatar.png')

const avatarStyle = computed(() => ({
  viewTransitionName: props.shared ? 'site-avatar' : 'none',
}))

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
  <div
    class="avatar-shell"
    :class="{
      'avatar-shell-mobile': props.mobile,
      'avatar-shell-navigation': props.navigation,
    }"
    :style="avatarStyle"
  >
    <ImgBlurHash
      mode="bg"
      :src="avatarUrl"
      blurhash="L4A1l2Mx0FN402eiyEx|00-;%MIV"
      alt="Avatar"
      class="avatar-image"
      :class="{ 'animate-shape': !props.navigation }"
      aspect-square
      rd="[62%_47%_82%_35%/45%_45%_80%_66%]"
      :will-change="props.navigation ? undefined : 'border-radius,transform,opacity'"
    />
  </div>
</template>

<style scoped>
.avatar-shell {
  display: inline-grid;
  place-items: center;
}

.avatar-image {
  width: clamp(calc(var(--spacing) * 10), calc(100cqw / 10), calc(var(--spacing) * 30));
}

.avatar-shell-navigation,
.avatar-shell-navigation .avatar-image {
  width: 1.2em;
  height: 1.2em;
}

.avatar-shell-navigation .avatar-image {
  border-radius: 50% !important;
  animation: none !important;
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

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
    class="inline-grid place-items-center"
    :class="{
      'lt-md:relative lt-md:p-[0.45rem] lt-md:before:(absolute inset-0 border border-dashed rounded-[46%_54%_62%_38%/50%_44%_56%_50%] content-empty animate-shape [border-color:rgba(248,113,113,0.42)] [transform:rotate(-7deg)])':
        props.mobile,
      'size-[1.2em]': props.navigation,
    }"
    :style="avatarStyle"
  >
    <ImgBlurHash
      mode="bg"
      :src="avatarUrl"
      blurhash="L4A1l2Mx0FN402eiyEx|00-;%MIV"
      alt="Avatar"
      class="w-[clamp(calc(var(--spacing)*10),calc(100cqw/10),calc(var(--spacing)*30))]"
      :class="{
        'animate-shape': !props.navigation,
        'size-[1.2em]! rounded-full! animate-none!': props.navigation,
        'lt-md:(w-[clamp(8.5rem,45vw,12rem)]! [box-shadow:0_24px_70px_rgba(248,113,113,0.24)])':
          props.mobile,
      }"
      aspect-square
      rd="[62%_47%_82%_35%/45%_45%_80%_66%]"
      :will-change="props.navigation ? undefined : 'border-radius,transform,opacity'"
    />
  </div>
</template>

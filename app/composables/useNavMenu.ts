// @unocss-includes

export interface NavMenuItem {
  key: string
  icon?: string
  component?: string
  action?: () => void
}

export function useNavMenu() {
  const router = useRouter()

  const menuItems = computed<NavMenuItem[]>(() => [
    {
      key: 'home',
      icon: 'i-hugeicons:home-01',
      action: () => router.push('/'),
    },
    {
      key: 'posts',
      icon: 'i-hugeicons:quill-write-02',
      action: () => router.push('/posts'),
    },
    {
      key: 'photos',
      icon: 'i-hugeicons:image-01',
      action: () => router.push('/photos'),
    },
    {
      key: 'theme',
      component: 'DarkToggle',
    },
  ])

  return {
    menuItems,
  }
}

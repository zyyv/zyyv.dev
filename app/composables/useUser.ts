import type { User } from '~/types'

const defaultUser: Partial<User> = {
  name: 'Chris',
  bio: 'Regardless of the past, do not ask the future',
  email: 'hizyyv@gmail.com',
  avatar_url: '/avatar.png',
}

export function useUser() {
  const user = useState<Partial<User>>('site-user', () => ({ ...defaultUser }))
  const hasStartedLoading = useState('site-user-loading-started', () => false)

  async function loadUser() {
    if (hasStartedLoading.value) return

    hasStartedLoading.value = true

    try {
      const response = await $fetch<Partial<User>>('/api/user')
      user.value = {
        ...user.value,
        ...response,
        bio: response.bio ?? user.value.bio,
      }
    } catch (error) {
      hasStartedLoading.value = false
      console.error(error)
    }
  }

  return {
    user: readonly(user),
    loadUser,
  }
}

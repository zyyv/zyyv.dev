interface AdminSessionResponse {
  authenticated: boolean
}

function getAuthErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return '登录失败，请稍后重试。'

  const candidate = error as {
    data?: { statusMessage?: string; message?: string }
    statusMessage?: string
    message?: string
  }

  return (
    candidate.data?.statusMessage ||
    candidate.data?.message ||
    candidate.statusMessage ||
    candidate.message ||
    '登录失败，请稍后重试。'
  )
}

export function useAdminSession() {
  const authenticated = useState<boolean | null>('admin-session:authenticated', () => null)
  const checking = useState('admin-session:checking', () => false)
  const mutating = useState('admin-session:mutating', () => false)
  const error = useState<string | null>('admin-session:error', () => null)
  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  async function refreshSession(force = false) {
    if (!force && authenticated.value !== null) return authenticated.value

    checking.value = true
    try {
      const session = await requestFetch<AdminSessionResponse>('/api/admin/session')
      authenticated.value = session.authenticated
    } catch {
      authenticated.value = false
    } finally {
      checking.value = false
    }

    return authenticated.value
  }

  async function login(password: string) {
    mutating.value = true
    error.value = null
    try {
      await $fetch<AdminSessionResponse>('/api/admin/session', {
        method: 'POST',
        body: { password },
      })
      authenticated.value = true
      return true
    } catch (cause) {
      authenticated.value = false
      error.value = getAuthErrorMessage(cause)
      return false
    } finally {
      mutating.value = false
    }
  }

  async function logout() {
    mutating.value = true
    error.value = null
    try {
      await $fetch<AdminSessionResponse>('/api/admin/session', { method: 'DELETE' })
    } finally {
      authenticated.value = false
      mutating.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    authenticated: readonly(authenticated),
    checking: readonly(checking),
    mutating: readonly(mutating),
    error: readonly(error),
    refreshSession,
    login,
    logout,
    clearError,
  }
}

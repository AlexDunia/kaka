import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import api, { ensureCsrfCookie, getApiErrorMessage } from '@/api/axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const authProvider = ref(null)
  const initialized = ref(false)
  let initializePromise = null
  let sessionVersion = 0

  const isAuthenticated = computed(() => Boolean(user.value))
  const getUser = computed(() => user.value)
  const getError = computed(() => error.value)
  const isAdmin = computed(() => false)

  const persistUser = (userData) => {
    if (userData) localStorage.setItem('user', JSON.stringify(userData))
    else localStorage.removeItem('user')
  }
  const persistProvider = (provider) => {
    if (provider) localStorage.setItem('authProvider', provider)
    else localStorage.removeItem('authProvider')
  }
  const clearLocalSession = () => {
    sessionVersion++
    useDashboardStore().reset()
    user.value = null
    authProvider.value = null
    persistUser(null)
    persistProvider(null)
  }
  const applyUser = (userData) => {
    if (user.value?.id !== userData?.id) useDashboardStore().reset()
    user.value = userData
    persistUser(userData)
    return userData
  }

  const fetchUser = async () => {
    error.value = null
    const version = sessionVersion
    try {
      const response = await api.get('/user')
      if (version !== sessionVersion) return null
      const userData = response.data?.user ?? response.data
      if (!userData || !Number.isInteger(userData.id) || !userData.email)
        throw new Error('The server did not return an authenticated user.')
      return applyUser(userData)
    } catch (requestError) {
      if (version !== sessionVersion) return null
      error.value = getApiErrorMessage(requestError, 'We could not load your account details.')
      clearLocalSession()
      throw requestError
    }
  }

  const initialize = async ({ force = false } = {}) => {
    if (initialized.value && !force) return user.value
    if (initializePromise) return initializePromise
    initializePromise = (async () => {
      isLoading.value = true
      try {
        return await fetchUser()
      } catch {
        return null
      } finally {
        initialized.value = true
        isLoading.value = false
      }
    })()
    try {
      return await initializePromise
    } finally {
      initializePromise = null
    }
  }

  const login = async (email, password) => {
    clearLocalSession()
    isLoading.value = true
    error.value = null
    try {
      await ensureCsrfCookie()
      await api.post('/login', { email, password })
      const userData = await fetchUser()
      if (!userData) throw new Error('Please log in to continue.')
      authProvider.value = 'local'
      persistProvider('local')
      initialized.value = true
      return userData
    } catch (requestError) {
      error.value = getApiErrorMessage(
        requestError,
        'We could not log you in. Check your details and try again.',
      )
      clearLocalSession()
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    clearLocalSession()
    isLoading.value = true
    error.value = null
    try {
      await ensureCsrfCookie()
      await api.post('/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password,
      })
      const authenticatedUser = await fetchUser()
      if (!authenticatedUser) throw new Error('Please log in to continue.')
      authProvider.value = 'local'
      persistProvider('local')
      initialized.value = true
      return authenticatedUser
    } catch (requestError) {
      error.value = getApiErrorMessage(
        requestError,
        'We could not create your account. Please try again.',
      )
      clearLocalSession()
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    error.value = null
    let serverLogoutSucceeded = true
    try {
      await ensureCsrfCookie()
      await api.post('/logout')
    } catch (requestError) {
      serverLogoutSucceeded = false
      console.warn('Server logout failed. Local auth state was still cleared.', requestError)
    } finally {
      clearLocalSession()
      initialized.value = true
      isLoading.value = false
    }
    return { serverLogoutSucceeded }
  }

  const forgotPassword = async (email) => {
    isLoading.value = true
    error.value = null
    try {
      await ensureCsrfCookie()
      return (await api.post('/forgot-password', { email })).data
    } catch (requestError) {
      error.value = getApiErrorMessage(
        requestError,
        'We could not send the reset email. Please try again.',
      )
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  const resetPassword = async (data) => {
    isLoading.value = true
    error.value = null
    try {
      await ensureCsrfCookie()
      return (await api.post('/reset-password', data)).data
    } catch (requestError) {
      error.value = getApiErrorMessage(
        requestError,
        'We could not reset your password. Please request a new link.',
      )
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  const updateUser = async () => {
    throw new Error('Account editing is not available yet.')
  }

  const setUser = async (_userData, provider = 'google') => {
    await initialize({ force: true })
    authProvider.value = provider
    persistProvider(provider)
  }

  if (typeof window !== 'undefined')
    window.addEventListener('auth:unauthorized', () => {
      clearLocalSession()
      initialized.value = false
    })

  return {
    user,
    isLoading,
    error,
    authProvider,
    initialized,
    isAuthenticated,
    getUser,
    getError,
    isAdmin,
    initialize,
    login,
    register,
    logout,
    fetchUser,
    forgotPassword,
    resetPassword,
    updateUser,
    setUser,
  }
})

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api, { ensureCsrfCookie } from '@/api/axios'

const getApiErrorMessage = (error, fallback) => {
  const errors = error.response?.data?.errors
  if (errors && typeof errors === 'object') {
    const message = Object.values(errors).flat().find(Boolean)
    if (message) return message
  }
  return error.response?.data?.message || fallback
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const authProvider = ref(null)
  const initialized = ref(false)
  let initializePromise = null

  const isAuthenticated = computed(() => Boolean(user.value))
  const getUser = computed(() => user.value)
  const getError = computed(() => error.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const persistUser = (userData) => {
    if (userData) localStorage.setItem('user', JSON.stringify(userData))
    else localStorage.removeItem('user')
  }
  const persistProvider = (provider) => {
    if (provider) localStorage.setItem('authProvider', provider)
    else localStorage.removeItem('authProvider')
  }
  const clearLocalSession = () => {
    user.value = null
    authProvider.value = null
    persistUser(null)
    persistProvider(null)
  }
  const applyUser = (userData) => {
    user.value = userData
    persistUser(userData)
    return userData
  }

  const fetchUser = async () => {
    error.value = null
    try {
      const response = await api.get('/user')
      const userData = response.data?.user ?? response.data
      if (!userData || typeof userData !== 'object') throw new Error('The server did not return an authenticated user.')
      return applyUser(userData)
    } catch (requestError) {
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
      try { return await fetchUser() } catch { return null } finally {
        initialized.value = true
        isLoading.value = false
      }
    })()
    try { return await initializePromise } finally { initializePromise = null }
  }

  const login = async (email, password) => {
    isLoading.value = true
    error.value = null
    try {
      await ensureCsrfCookie()
      await api.post('/login', { email, password })
      const userData = await fetchUser()
      authProvider.value = 'local'
      persistProvider('local')
      initialized.value = true
      return userData
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError, 'We could not log you in. Check your details and try again.')
      clearLocalSession()
      throw new Error(error.value)
    } finally { isLoading.value = false }
  }

  const register = async (userData) => {
    isLoading.value = true
    error.value = null
    try {
      await ensureCsrfCookie()
      await api.post('/register', { name: userData.name, email: userData.email, password: userData.password, password_confirmation: userData.password })
      const authenticatedUser = await fetchUser()
      authProvider.value = 'local'
      persistProvider('local')
      initialized.value = true
      return authenticatedUser
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError, 'We could not create your account. Please try again.')
      clearLocalSession()
      throw new Error(error.value)
    } finally { isLoading.value = false }
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
      error.value = getApiErrorMessage(requestError, 'We could not send the reset email. Please try again.')
      throw new Error(error.value)
    } finally { isLoading.value = false }
  }

  const resetPassword = async (data) => {
    isLoading.value = true
    error.value = null
    try {
      await ensureCsrfCookie()
      return (await api.post('/reset-password', data)).data
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError, 'We could not reset your password. Please request a new link.')
      throw new Error(error.value)
    } finally { isLoading.value = false }
  }

  const updateUser = async (userData) => {
    if (!user.value) throw new Error('Not authenticated')
    isLoading.value = true
    error.value = null
    try {
      await ensureCsrfCookie()
      const response = await api.put('/user', userData)
      return applyUser(response.data?.user ?? response.data)
    } catch (requestError) {
      error.value = getApiErrorMessage(requestError, 'We could not save your account changes.')
      throw requestError
    } finally { isLoading.value = false }
  }

  const setUser = (userData, provider = 'google') => {
    applyUser(userData)
    authProvider.value = provider
    persistProvider(provider)
    initialized.value = false
  }

  return { user, isLoading, error, authProvider, initialized, isAuthenticated, getUser, getError, isAdmin, initialize, login, register, logout, fetchUser, forgotPassword, resetPassword, updateUser, setUser }
})
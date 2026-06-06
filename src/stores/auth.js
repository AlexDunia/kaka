import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const authProvider = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const getUser = computed(() => user.value)
  const getError = computed(() => error.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const initialize = async () => {
    try {
      const userJson = localStorage.getItem('user')
      const provider = localStorage.getItem('authProvider')

      if (userJson) {
        user.value = JSON.parse(userJson)
        authProvider.value = provider || null

        if (provider === 'local') {
          await fetchUser()
        }
      }
    } catch (err) {
      error.value = err.message || 'Failed to initialize'
      localStorage.removeItem('user')
      localStorage.removeItem('authProvider')
      user.value = null
      authProvider.value = null
    }
  }

  const login = async (email, password) => {
    isLoading.value = true
    error.value = null

    try {
      await axios.post(
        `${API_BASE_URL}/api/login`,
        { email, password },
        { withCredentials: true },
      )

      await fetchUser()
      authProvider.value = 'local'
      localStorage.setItem('authProvider', 'local')

      return user.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed'
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    isLoading.value = true
    error.value = null

    try {
      await axios.post(
        `${API_BASE_URL}/api/register`,
        {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          password_confirmation: userData.password,
        },
        { withCredentials: true },
      )

      await fetchUser()

      return user.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw new Error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    error.value = null

    try {
      await axios.post(`${API_BASE_URL}/api/logout`, {}, { withCredentials: true })
    } catch (err) {
      error.value = err.message || 'Logout failed'
    } finally {
      user.value = null
      authProvider.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('authProvider')
      isLoading.value = false
    }
  }

  const fetchUser = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await axios.get(`${API_BASE_URL}/api/user`, {
        withCredentials: true,
      })

      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))

      return user.value
    } catch (err) {
      error.value = err.message || 'Failed to fetch user data'
      user.value = null
      localStorage.removeItem('user')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateUser = async (userData) => {
    if (!user.value) throw new Error('Not authenticated')

    isLoading.value = true
    error.value = null

    try {
      const response = await axios.put(`${API_BASE_URL}/api/user`, userData, {
        withCredentials: true,
      })

      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))

      return user.value
    } catch (err) {
      error.value = err.message || 'Failed to update user data'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const resetPassword = async (email) => {
    isLoading.value = true
    error.value = null

    try {
      await axios.post(`${API_BASE_URL}/api/reset-password`, { email }, { withCredentials: true })
    } catch (err) {
      error.value = err.message || 'Failed to send password reset email'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updatePassword = async (data) => {
    isLoading.value = true
    error.value = null

    try {
      await axios.post(`${API_BASE_URL}/api/update-password`, data, { withCredentials: true })
    } catch (err) {
      error.value = err.message || 'Failed to update password'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const setUser = (userData, provider = 'google') => {
    user.value = userData
    authProvider.value = provider
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('authProvider', provider)
  }

  return {
    user,
    isLoading,
    error,
    authProvider,
    isAuthenticated,
    getUser,
    getError,
    isAdmin,
    initialize,
    login,
    register,
    logout,
    fetchUser,
    updateUser,
    resetPassword,
    updatePassword,
    setUser,
  }
})

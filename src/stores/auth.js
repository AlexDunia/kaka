import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Load initial state from localStorage
  const initializeStore = () => {
    try {
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('auth_token')

      if (storedUser && storedToken) {
        user.value = JSON.parse(storedUser)
        token.value = storedToken
      }
    } catch (err) {
      console.error('Error initializing auth store:', err)
    }
  }

  // Call init function when store is created
  initializeStore()

  // Computed properties
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Actions
  const login = async (email, password) => {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(email, password)
      user.value = response.user
      token.value = response.token
      return response
    } catch (err) {
      error.value = err.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    loading.value = true
    error.value = null

    try {
      const newUser = await authService.register(userData)
      return newUser
    } catch (err) {
      error.value = err.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    try {
      authService.logout()
      user.value = null
      token.value = null
    } catch (err) {
      console.error('Error during logout:', err)
    }
  }

  const forgotPassword = async (email) => {
    loading.value = true
    error.value = null

    try {
      const result = await authService.forgotPassword(email)
      return result
    } catch (err) {
      error.value = err.message || 'Password reset request failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    forgotPassword,
  }
})
 
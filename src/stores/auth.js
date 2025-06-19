import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/authService'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const router = useRouter()

  // Load initial state from localStorage
  const initializeStore = () => {
    try {
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('auth_token')

      if (storedUser && storedToken) {
        user.value = JSON.parse(storedUser)
        token.value = storedToken
      }
    } catch {
      // Clear potentially corrupted data
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
      user.value = null
      token.value = null
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
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('auth_token', response.token)
      router.push('/')
      return response
    } catch (err) {
      error.value = err.message || 'Login failed'
      throw error.value
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

  const logout = async () => {
    try {
      await authService.logout()
      user.value = null
      token.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
      router.push('/login')
    } catch {
      // Even if the API call fails, we still want to clear local data
      user.value = null
      token.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
      router.push('/login')
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

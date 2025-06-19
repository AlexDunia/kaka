import { defineStore } from 'pinia'
import axios from 'axios'
import { setAuthToken } from '@/utils/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.user,
    getError: (state) => state.error,
    isLoading: (state) => state.loading,
  },

  actions: {
    async initialize() {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          this.token = token
          await this.fetchUser()
        }
      } catch (err) {
        this.error = err.message || 'Failed to initialize auth store'
        throw err
      }
    },

    async login(credentials) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post('/api/login', credentials)
        const { token, user } = response.data

        this.token = token
        this.user = user

        localStorage.setItem('auth_token', token)
        setAuthToken(token)

        return user
      } catch (err) {
        this.error = err.message || 'Login failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      this.error = null

      try {
        await axios.post('/api/logout')
      } catch (err) {
        this.error = err.message || 'Logout failed'
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem('auth_token')
        setAuthToken(null)
        this.loading = false
      }
    },

    async fetchUser() {
      if (!this.token) return null

      this.loading = true
      this.error = null

      try {
        const response = await axios.get('/api/user')
        this.user = response.data
        return this.user
      } catch (err) {
        this.error = err.message || 'Failed to fetch user data'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateUser(userData) {
      if (!this.token) throw new Error('Not authenticated')

      this.loading = true
      this.error = null

      try {
        const response = await axios.put('/api/user', userData)
        this.user = response.data
        return this.user
      } catch (err) {
        this.error = err.message || 'Failed to update user data'
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post('/api/register', userData)
        const { token, user } = response.data

        this.token = token
        this.user = user

        localStorage.setItem('auth_token', token)
        setAuthToken(token)

        return user
      } catch (err) {
        this.error = err.message || 'Registration failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    async resetPassword(email) {
      this.loading = true
      this.error = null

      try {
        await axios.post('/api/reset-password', { email })
      } catch (err) {
        this.error = err.message || 'Failed to send password reset email'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updatePassword(data) {
      this.loading = true
      this.error = null

      try {
        await axios.post('/api/update-password', data)
      } catch (err) {
        this.error = err.message || 'Failed to update password'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})

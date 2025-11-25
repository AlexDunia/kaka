import { defineStore } from 'pinia'
import axios from 'axios'

// 🔧 PRODUCTION: Change this to your production API URL
const API_BASE_URL = 'http://127.0.0.1:8000'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    getUser: (state) => state.user,
    getError: (state) => state.error,
    isLoading: (state) => state.loading,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async initialize() {
      try {
        const userJson = localStorage.getItem('user')
        if (userJson) {
          this.user = JSON.parse(userJson)
          // Verify session is still valid
          await this.fetchUser()
        }
      } catch (err) {
        this.error = err.message || 'Failed to initialize auth store'
        localStorage.removeItem('user')
        this.user = null
      }
    },

    async login(email, password) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/login`,
          { email, password },
          { withCredentials: true }, // ✅ Send cookies
        )

        // Fetch user data after successful login
        await this.fetchUser()

        return this.user
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed'
        throw new Error(this.error)
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null

      try {
        await axios.post(
          `${API_BASE_URL}/api/register`,
          {
            name: userData.name,
            email: userData.email,
            password: userData.password,
            password_confirmation: userData.password,
          },
          { withCredentials: true }, // ✅ Send cookies
        )

        // Fetch user data after successful registration
        await this.fetchUser()

        return this.user
      } catch (err) {
        this.error = err.response?.data?.message || 'Registration failed'
        throw new Error(this.error)
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      this.error = null

      try {
        await axios.post(
          `${API_BASE_URL}/api/logout`,
          {},
          { withCredentials: true }, // ✅ Send cookies
        )
      } catch (err) {
        this.error = err.message || 'Logout failed'
      } finally {
        this.user = null
        localStorage.removeItem('user')
        this.loading = false
      }
    },

    async fetchUser() {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_BASE_URL}/api/user`, {
          withCredentials: true, // ✅ Send cookies
        })

        this.user = response.data
        localStorage.setItem('user', JSON.stringify(response.data))

        return this.user
      } catch (err) {
        this.error = err.message || 'Failed to fetch user data'
        this.user = null
        localStorage.removeItem('user')
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateUser(userData) {
      if (!this.user) throw new Error('Not authenticated')

      this.loading = true
      this.error = null

      try {
        const response = await axios.put(
          `${API_BASE_URL}/api/user`,
          userData,
          { withCredentials: true }, // ✅ Send cookies
        )

        this.user = response.data
        localStorage.setItem('user', JSON.stringify(response.data))

        return this.user
      } catch (err) {
        this.error = err.message || 'Failed to update user data'
        throw err
      } finally {
        this.loading = false
      }
    },

    async resetPassword(email) {
      this.loading = true
      this.error = null

      try {
        await axios.post(
          `${API_BASE_URL}/api/reset-password`,
          { email },
          { withCredentials: true }, // ✅ Send cookies
        )
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
        await axios.post(
          `${API_BASE_URL}/api/update-password`,
          data,
          { withCredentials: true }, // ✅ Send cookies
        )
      } catch (err) {
        this.error = err.message || 'Failed to update password'
        throw err
      } finally {
        this.loading = false
      }
    },

    // ✅ For Google OAuth callback
    setUser(userData) {
      this.user = userData
      localStorage.setItem('user', JSON.stringify(userData))
    },
  },
})

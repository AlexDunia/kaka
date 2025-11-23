<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // Get user data from URL params (sent by Laravel)
  const urlParams = new URLSearchParams(window.location.search)
  const userData = urlParams.get('user')
  const error = urlParams.get('error')

  if (error) {
    router.push('/login?error=' + error)
  } else if (userData) {
    try {
      const user = JSON.parse(decodeURIComponent(userData))
      authStore.setUser(user)

      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (e) {
      console.error('Failed to parse user data', e)
      router.push('/login')
    }
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh">
    <div style="text-align: center">
      <h2>Completing Google Sign-In...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  </div>
</template>

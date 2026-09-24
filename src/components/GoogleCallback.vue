<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const userData = urlParams.get('user')
  const error = urlParams.get('error')

  if (error) {
    await router.replace(`/login?error=${encodeURIComponent(error)}`)
    return
  }

  if (!userData) {
    await router.replace('/login?error=session_not_established')
    return
  }

  try {
    const callbackUser = JSON.parse(decodeURIComponent(userData))
    authStore.setUser(callbackUser, 'google')
    const authenticatedUser = await authStore.fetchUser()

    if (authenticatedUser?.role === 'admin') {
      await router.replace('/admin')
      return
    }

    await router.replace('/dashboard')
  } catch (callbackError) {
    console.error('Google session verification failed', callbackError)
    await router.replace('/login?error=session_not_established')
  }
})
</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh">
    <div style="text-align: center">
      <h2>Getting your account ready...</h2>
      <p>You’ll be taken to your dashboard in a moment.</p>
    </div>
  </div>
</template>

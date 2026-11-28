<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { acceptEventInvitation, operationsError } from '@/services/eventOperationsService'
const route = useRoute(),
  router = useRouter(),
  auth = useAuthStore()
const busy = ref(true),
  error = ref(''),
  token = ref('')
const key = 'rushhour-event-invitation'
const fragment = new URLSearchParams(route.hash.replace(/^#/, '')).get('token')
if (fragment) {
  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname + window.location.search,
  )
  if (/^[a-zA-Z0-9]{64}$/.test(fragment))
    sessionStorage.setItem(key, JSON.stringify({ token: fragment, expires: Date.now() + 3600000 }))
}
onMounted(async () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (saved?.expires > Date.now()) token.value = saved.token
    else sessionStorage.removeItem(key)
    if (!token.value) error.value = 'Open a valid invitation link from your email.'
    await auth.initialize()
  } catch {
    error.value = 'This invitation could not be opened. Please open the email link again.'
  } finally {
    busy.value = false
  }
})
async function accept() {
  if (busy.value || !token.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await acceptEventInvitation(token.value)
    sessionStorage.removeItem(key)
    token.value = ''
    await router.replace({ name: 'event-door', params: { eventId: result.event_id } })
  } catch (err) {
    error.value = operationsError(
      err,
      'This invitation has expired, was revoked, or belongs to a different account. Ask the organiser for a new invitation.',
    )
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <main class="invitation-page">
    <section>
      <h1>Your event invitation</h1>
      <p>Log in with the email that received this invitation.</p>
      <p v-if="busy" role="status">Getting your invitation ready...</p>
      <p v-if="error" role="alert">{{ error }}</p>
      <RouterLink
        v-if="!busy && !auth.isAuthenticated"
        :to="{ path: '/login', query: { redirect: '/event-invitations/accept' } }"
        >Log in to continue</RouterLink
      ><button v-else-if="auth.isAuthenticated && token" :disabled="busy" @click="accept" :aria-busy="busy">
        Accept invitation
      </button>
    </section>
  </main>
</template>
<style scoped>
.invitation-page {
  min-height: 100vh;
  padding: 60px 18px;
  background: var(--color-bg);
  color: var(--color-text);
}
section {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
button {
  min-height: 46px;
  padding: 0 20px;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-on-action);
  cursor: pointer;
}
</style>

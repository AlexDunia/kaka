<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exchangeOrderRecovery, requestOrderRecovery } from '@/services/checkoutService'
import { rememberOrderRecovery } from '@/utils/checkoutStorage'
const route = useRoute(),
  router = useRouter()
const orderId = ref(String(route.query.order || '')),
  email = ref(''),
  busy = ref(false),
  message = ref(''),
  error = ref('')
const send = async () => {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await requestOrderRecovery(orderId.value.trim(), email.value.trim())
    message.value = result.message
  } catch (err) {
    error.value =
      err?.response?.status === 429
        ? 'Please wait before requesting another link.'
        : 'We couldn’t request your link. Check your order reference and email, then try again.'
  } finally {
    busy.value = false
  }
}
onMounted(async () => {
  const token = new URLSearchParams(route.hash.replace(/^#/, '')).get('token')
  if (!token) return
  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname + window.location.search,
  )
  busy.value = true
  try {
    const access = await exchangeOrderRecovery(token)
    rememberOrderRecovery(access)
    await router.replace({ name: 'payment-success', params: { orderId: access.order_public_id } })
  } catch {
    error.value = 'This link has expired or has already been used. Request a new link below.'
  } finally {
    busy.value = false
  }
})
</script>
<template>
  <main class="recovery-page">
    <section>
      <h1>Find your tickets</h1>
      <p>
        Enter your order reference and the email you used at checkout. We’ll email you a secure
        link.
      </p>
      <form @submit.prevent="send">
        <label
          >Order reference<input
            v-model="orderId"
            required
            minlength="26"
            maxlength="26"
            autocomplete="off" /></label
        ><label
          >Email<input
            v-model="email"
            required
            type="email"
            maxlength="255"
            autocomplete="email" /></label
        ><button :disabled="busy" :aria-busy="busy">
          {{ busy ? 'Checking your order…' : 'Send recovery link' }}
        </button>
      </form>
      <p v-if="message" role="status">{{ message }}</p>
      <p v-if="error" role="alert">{{ error }}</p>
    </section>
  </main>
</template>
<style scoped>
.recovery-page {
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
form,
label {
  display: grid;
  gap: 12px;
}
form {
  margin-top: 24px;
  gap: 20px;
}
input {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
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
button:disabled {
  opacity: 0.6;
}
</style>

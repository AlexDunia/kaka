<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const sendResetLink = async () => {
  // Reset states
  error.value = ''
  success.value = false

  // Validate email
  if (!email.value) {
    error.value = 'Please enter your email address'
    return
  }

  // Set loading state
  loading.value = true

  try {
    // Send reset password request
    await authStore.forgotPassword(email.value)

    // Set success state
    success.value = true

    // Reset email field
    email.value = ''
  } catch (err) {
    error.value = err.message || 'Failed to send reset link. Please try again.'
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="forgot-password-form">
    <h2 class="forgot-password-form__title">Forgot password ?</h2>

    <p class="forgot-password-form__description">
      Enter the email you used to register and we will send a link to reset your password
    </p>

    <div v-if="error" class="forgot-password-form__error">
      {{ error }}
    </div>

    <div v-if="success" class="forgot-password-form__success">
      Reset link sent! Please check your email inbox.
    </div>

    <form v-if="!success" @submit.prevent="sendResetLink" class="forgot-password-form__form">
      <div class="forgot-password-form__field">
        <label for="email" class="forgot-password-form__label">Your Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="forgot-password-form__input"
          placeholder="Enter your email"
          required
          autocomplete="email"
        />
      </div>

      <button type="submit" class="forgot-password-form__submit" :disabled="loading">
        <span v-if="loading">Sending...</span>
        <span v-else>Send Link</span>
      </button>

      <div class="forgot-password-form__back">
        <button type="button" class="forgot-password-form__back-link" @click="goToLogin">
          Back to Login
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.forgot-password-form {
  max-width: 400px;
  margin: 0 auto;
}

.forgot-password-form__title {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  text-align: center;
}

.forgot-password-form__description {
  text-align: center;
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.5;
}

.forgot-password-form__error {
  background-color: rgba(255, 77, 77, 0.2);
  color: var(--error);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.forgot-password-form__success {
  background-color: rgba(46, 213, 115, 0.2);
  color: var(--success);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
}

.forgot-password-form__field {
  margin-bottom: 1.25rem;
}

.forgot-password-form__label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.forgot-password-form__input {
  transition: border-color 0.3s ease;
}

.forgot-password-form__input:focus {
  border-color: var(--primary);
}

.forgot-password-form__submit {
  width: 100%;
  padding: 0.75rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.forgot-password-form__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.forgot-password-form__back {
  text-align: center;
}

.forgot-password-form__back-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-size: 0.9rem;
}
</style>
 
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const register = async () => {
  // Reset states
  error.value = ''
  success.value = false

  // Validate inputs
  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  // Set loading state
  loading.value = true

  try {
    // Register user
    await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
    })

    // Set success state
    success.value = true

    // Reset form
    name.value = ''
    email.value = ''
    password.value = ''
    confirmPassword.value = ''

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    error.value = err.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-form">
    <h2 class="register-form__title">Create a new account</h2>

    <div v-if="error" class="register-form__error">
      {{ error }}
    </div>

    <div v-if="success" class="register-form__success">
      Registration successful! Redirecting to login page...
    </div>

    <form v-if="!success" @submit.prevent="register" class="register-form__form">
      <div class="register-form__field">
        <label for="name" class="register-form__label">Name:</label>
        <input
          id="name"
          v-model="name"
          type="text"
          class="register-form__input"
          placeholder="Your full name"
          required
          autocomplete="name"
        />
      </div>

      <div class="register-form__field">
        <label for="email" class="register-form__label">Email:</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="register-form__input"
          placeholder="Your email address"
          required
          autocomplete="email"
        />
      </div>

      <div class="register-form__field">
        <label for="password" class="register-form__label">Password:</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="register-form__input"
          placeholder="Create a password"
          required
          autocomplete="new-password"
        />
      </div>

      <div class="register-form__field">
        <label for="confirm-password" class="register-form__label">Confirm Password:</label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          class="register-form__input"
          placeholder="Confirm your password"
          required
          autocomplete="new-password"
        />
      </div>

      <button type="submit" class="register-form__submit" :disabled="loading">
        <span v-if="loading">Processing...</span>
        <span v-else>Register</span>
      </button>

      <div class="register-form__login">
        Already have an account?
        <button type="button" class="register-form__login-link" @click="goToLogin">Log in</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.register-form {
  max-width: 400px;
  margin: 0 auto;
}

.register-form__title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  text-align: center;
}

.register-form__error {
  background-color: rgba(255, 77, 77, 0.2);
  color: var(--error);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.register-form__success {
  background-color: rgba(46, 213, 115, 0.2);
  color: var(--success);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
}

.register-form__field {
  margin-bottom: 1.25rem;
}

.register-form__label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.register-form__input {
  transition: border-color 0.3s ease;
}

.register-form__input:focus {
  border-color: var(--primary);
}

.register-form__submit {
  width: 100%;
  padding: 0.75rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.register-form__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-form__login {
  text-align: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.register-form__login-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  margin-left: 0.5rem;
}
</style>
 
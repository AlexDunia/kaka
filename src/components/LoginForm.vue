<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const authStore = useAuthStore()
const router = useRouter()

const login = async () => {
  // Reset error
  error.value = ''

  // Validate inputs
  if (!email.value || !password.value) {
    error.value = 'Please enter both email and password'
    return
  }

  // Set loading state
  loading.value = true

  try {
    // Login
    await authStore.login(email.value, password.value)

    // Redirect based on role
    if (authStore.isAdmin) {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  } catch (err) {
    error.value = err.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}

const goToForgotPassword = () => {
  router.push('/forgot-password')
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-form">
    <h2 class="login-form__title">Login to your account.</h2>

    <div v-if="error" class="login-form__error">
      {{ error }}
    </div>

    <form @submit.prevent="login" class="login-form__form">
      <div class="login-form__field">
        <label for="email" class="login-form__label">Email:</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="login-form__input"
          placeholder="Your email"
          required
          autocomplete="email"
        />
      </div>

      <div class="login-form__field">
        <label for="password" class="login-form__label">Password:</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="login-form__input"
          placeholder="Your password"
          required
          autocomplete="current-password"
        />
      </div>

      <div class="login-form__forgot">
        <button type="button" class="login-form__forgot-link" @click="goToForgotPassword">
          Forgot Password
        </button>
      </div>

      <button type="submit" class="login-form__submit" :disabled="loading">
        <span v-if="loading">Loading...</span>
        <span v-else>Log In</span>
      </button>

      <div class="login-form__register">
        Don't have an account?
        <button type="button" class="login-form__register-link" @click="goToRegister">
          Register
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
}

.login-form__title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  text-align: center;
}

.login-form__error {
  background-color: rgba(255, 77, 77, 0.2);
  color: var(--error);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.login-form__field {
  margin-bottom: 1.25rem;
}

.login-form__label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.login-form__input {
  transition: border-color 0.3s ease;
}

.login-form__input:focus {
  border-color: var(--primary);
}

.login-form__forgot {
  text-align: right;
  margin-bottom: 1.5rem;
}

.login-form__forgot-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  text-decoration: underline;
}

.login-form__submit {
  width: 100%;
  padding: 0.75rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.login-form__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-form__register {
  text-align: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.login-form__register-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  margin-left: 0.5rem;
}
</style>
 
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
  error.value = ''

  if (!email.value || !password.value) {
    error.value = 'Please enter both email and password'
    return
  }

  loading.value = true

  try {
    await authStore.login(email.value, password.value)

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

// ✅ NEW: Google Sign-In
const loginWithGoogle = () => {
  // Redirect to Laravel Google OAuth
  window.location.href = 'http://127.0.0.1:8000/api/auth/google'
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

      <!-- ✅ NEW: Divider -->
      <div class="login-form__divider">
        <span>OR</span>
      </div>

      <!-- ✅ NEW: Google Sign-In Button -->
      <button type="button" class="login-form__google" @click="loginWithGoogle">
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            fill="#4285F4"
          />
          <path
            d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            fill="#FBBC05"
          />
          <path
            d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.002 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
            fill="#EA4335"
          />
        </svg>
        <span>Continue with Google</span>
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

/* Add styles for the new elements */
.login-form__divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #666;
}

.login-form__divider::before,
.login-form__divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.login-form__divider span {
  padding: 0 1rem;
  font-size: 0.875rem;
}

.login-form__google {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s;
}

.login-form__google:hover {
  background: #f8f9fa;
  border-color: #bbb;
}

.login-form__google:active {
  transform: scale(0.98);
}

.login-form__google svg {
  flex-shrink: 0;
}
</style>

<script setup>
import LoginForm from '@/components/LoginForm.vue'
</script>

<template>
  <div class="login-page">
    <div class="container">
      <div class="login-page__content">
        <LoginForm />
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  padding: 3rem 0;
}

.login-page__content {
  max-width: 500px;
  margin: 0 auto;
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 2rem;
  box-shadow: var(--shadow-subtle);
}

@media (max-width: 768px) {
  .login-page {
    padding: 2rem 0;
  }

  .login-page__content {
    padding: 1.5rem;
  }
}
</style>
 
<script setup>
import ForgotPasswordForm from '@/components/ForgotPasswordForm.vue'
</script>

<template>
  <div class="forgot-password-page">
    <div class="container">
      <div class="forgot-password-page__content">
        <ForgotPasswordForm />
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-page {
  padding: 3rem 0;
}

.forgot-password-page__content {
  max-width: 500px;
  margin: 0 auto;
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .forgot-password-page {
    padding: 2rem 0;
  }

  .forgot-password-page__content {
    padding: 1.5rem;
  }
}
</style>
 
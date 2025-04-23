<script setup>
import RegisterForm from '@/components/RegisterForm.vue'
</script>

<template>
  <div class="register-page">
    <div class="container">
      <div class="register-page__content">
        <RegisterForm />
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  padding: 3rem 0;
}

.register-page__content {
  max-width: 500px;
  margin: 0 auto;
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .register-page {
    padding: 2rem 0;
  }

  .register-page__content {
    padding: 1.5rem;
  }
}
</style>
 
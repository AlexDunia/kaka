<template>
  <div class="loading-indicator">
    <div class="spinner" :data-size="size"></div>
    <p v-if="showText" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: 'Loading...',
  },
  showText: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
})
</script>

<style scoped>
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.loading-text {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4f46e5;
  animation: spin 1s ease-in-out infinite;
}

.spinner[data-size='sm'] {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

.spinner[data-size='lg'] {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

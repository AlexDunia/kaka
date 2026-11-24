<template>
  <h1 class="enhanced-title">
    <slot>International Film Festival</slot>
  </h1>
</template>

<style scoped>
.enhanced-title {
  font-size: 2.75rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, var(--color-surface), rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition:
    transform 0.3s ease,
    text-shadow 0.3s ease;
}

.enhanced-title:hover {
  transform: translateY(-2px);
  text-shadow: none;
}
</style>

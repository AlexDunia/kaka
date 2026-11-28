<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="not-found-page">
    <div class="container">
      <div class="not-found-content">
        <div class="not-found-code">404</div>
        <h1 class="not-found-title">Page not found</h1>
        <p class="not-found-message">
          This page may have moved or is no longer available.
        </p>

        <div class="not-found-actions">
          <button class="not-found-btn" @click="goBack">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ><image :href="pngIconUrl('back')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
            Go back
          </button>

          <button class="not-found-btn not-found-btn--primary" @click="goHome">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ><image :href="pngIconUrl('home')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
            Go home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem 0;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 3rem 2rem;
  box-shadow: var(--shadow-subtle);
}

.not-found-code {
  font-size: 6rem;
  font-weight: 700;
  line-height: 1;
  color: var(--primary);
  margin-bottom: 1rem;
  text-shadow: none;
}

.not-found-title {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.not-found-message {
  color:var(--color-muted);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.not-found-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.not-found-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.not-found-btn:hover {
  background-color: var(--color-surface-soft);
}

.not-found-btn--primary {
  background-color: var(--primary);
  border-color: var(--primary);
}

.not-found-btn--primary:hover {
  background-color: var(--accent);
}

@media (max-width: 768px) {
  .not-found-code {
    font-size: 5rem;
  }

  .not-found-title {
    font-size: 1.75rem;
  }

  .not-found-actions {
    flex-direction: column;
  }
}
</style>

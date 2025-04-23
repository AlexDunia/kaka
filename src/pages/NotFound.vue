<script setup>
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
        <h1 class="not-found-title">Page Not Found</h1>
        <p class="not-found-message">
          The page you are looking for might have been removed, had its name changed, or is
          temporarily unavailable.
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
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Go Back
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
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Go Home
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
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.not-found-code {
  font-size: 6rem;
  font-weight: 700;
  line-height: 1;
  color: var(--primary);
  margin-bottom: 1rem;
  text-shadow: 0 0 10px rgba(232, 67, 147, 0.5);
}

.not-found-title {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.not-found-message {
  color: rgba(255, 255, 255, 0.8);
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
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.not-found-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
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

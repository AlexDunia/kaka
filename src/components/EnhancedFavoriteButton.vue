<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
</script>
<template>
  <button class="favorite-btn">
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
    ><image :href="pngIconUrl('heart')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
    <span>ADD TO FAVORITES</span>
  </button>
</template>

<style scoped>
.favorite-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  width: 100%;
  max-width: 300px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 50px;
  padding: 0.8rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.favorite-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, #e84393, #f368e0);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.favorite-btn:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-subtle);
  border-color: rgba(232,67,147,0.165);
}

.favorite-btn:hover::before {
  opacity: 0.1;
}

.favorite-btn:active {
  transform: translateY(-2px);
}

.favorite-btn svg {
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.favorite-btn:hover svg {
  transform: scale(1.15);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.035));
}

.favorite-btn span {
  position: relative;
  z-index: 1;
}
</style>

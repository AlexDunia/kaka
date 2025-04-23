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
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      ></path>
    </svg>
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
  background: rgba(30, 30, 40, 0.6);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: rgba(232, 67, 147, 0.3);
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
  filter: drop-shadow(0 0 5px rgba(232, 67, 147, 0.5));
}

.favorite-btn span {
  position: relative;
  z-index: 1;
}
</style>

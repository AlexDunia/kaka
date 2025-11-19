<script setup>
import { useCartStore } from '@/stores/cart'
import { computed } from 'vue'
const cartStore = useCartStore()
const cartCount = computed(() => cartStore.itemCount)
</script>

<template>
  <nav class="navbar">
    <div class="container navbar__container">
      <router-link to="/" class="navbar__logo">
        <span class="navbar__logo-text"> Tix<span class="navbar__logo-accent">Easy</span> </span>
      </router-link>

      <div class="navbar__menu">
        <router-link to="/" class="navbar__menu-item" active-class="navbar__menu-item--active">
          Home
        </router-link>
        <router-link to="/music" class="navbar__menu-item" active-class="navbar__menu-item--active">
          Music
        </router-link>
        <router-link
          to="/sports"
          class="navbar__menu-item"
          active-class="navbar__menu-item--active"
        >
          Sports
        </router-link>
        <router-link to="/arts" class="navbar__menu-item" active-class="navbar__menu-item--active">
          Arts
        </router-link>
        <router-link
          to="/comedy"
          class="navbar__menu-item"
          active-class="navbar__menu-item--active"
        >
          COMEDY
        </router-link>
        <router-link
          to="/festivals"
          class="navbar__menu-item"
          active-class="navbar__menu-item--active"
        >
          FESTIVALS
        </router-link>
      </div>

      <div class="navbar__actions">
        <router-link to="/cart" class="navbar__action navbar__action--cart">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background-color: rgba(24, 24, 30, 0.8);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.navbar__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar__logo {
  text-decoration: none;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.navbar__logo-text {
  background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.7));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.navbar__logo-accent {
  color: var(--primary);
  -webkit-text-fill-color: var(--primary);
}

.navbar__menu {
  display: flex;
  gap: 1.5rem;
}

.navbar__menu-item {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.3s ease;
  padding: 0.25rem 0;
  position: relative;
}

.navbar__menu-item:hover {
  color: white;
}

.navbar__menu-item--active {
  color: white;
}

.navbar__menu-item--active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary);
  border-radius: 2px;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.navbar__action {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.navbar__action:hover {
  color: white;
}

.navbar__action--auth {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar__action--auth:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.navbar__action--create-event {
  background-color: var(--primary);
  color: white;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  gap: 0.5rem;
}

.navbar__action--create-event:hover {
  background-color: var(--primary-dark, #d62e7e);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(232, 67, 147, 0.3);
}

.navbar__action--cart {
  position: relative;
  font-size: 1.7rem;
  background: rgba(192, 72, 136, 0.12);
  border-radius: 50%;
  padding: 0.7rem;
  border: 2.5px solid #fff;
  color: var(--primary, #c04888);
  transition:
    background 0.2s,
    color 0.2s,
    border 0.2s;
}

.navbar__action--cart:hover {
  color: #fff;
  border-color: #fff;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--primary, #c04888);
  color: #fff;
  font-size: 1rem;
  font-weight: 900;
  border-radius: 50%;
  padding: 0.22em 0.7em;
  min-width: 1.5em;
  text-align: center;
  box-shadow: 0 2px 8px rgba(232, 67, 147, 0.18);
  border: 2.5px solid #fff;
  z-index: 2;
  transition:
    background 0.2s,
    color 0.2s,
    border 0.2s;
}

/* Responsive styles */
@media (max-width: 992px) {
  .navbar__menu {
    display: none;
  }
}

@media (max-width: 576px) {
  .navbar__action span {
    display: none;
  }

  .navbar__action--create-event {
    padding: 0.5rem;
    border-radius: 50%;
  }
}
</style>

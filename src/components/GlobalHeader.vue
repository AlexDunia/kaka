<script setup>
import { useCartStore } from '@/stores/cart'
import { computed } from 'vue'

const cartStore = useCartStore()
const cartCount = computed(() => cartStore.itemCount)
</script>

<template>
  <header class="app-header">
    <div class="container">
      <div class="logo">
        <router-link to="/">
          <img
            src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1747056280/tdlogowhite_fvgocv.png"
            alt="TD Logo"
            class="logo-image"
          />
        </router-link>
      </div>

      <nav class="main-nav">
        <router-link to="/" class="nav-item" exact-active-class="active">All</router-link>
        <router-link to="/music" class="nav-item" active-class="active">Music</router-link>
        <router-link to="/movies" class="nav-item" active-class="active">Movies</router-link>
        <router-link to="/theatre" class="nav-item" active-class="active"
          >Theatre/Comedy</router-link
        >
        <router-link to="/sports" class="nav-item" active-class="active">Sports</router-link>
        <router-link to="/festivals" class="nav-item" active-class="active">Festivals</router-link>
        <router-link to="/others" class="nav-item" active-class="active">Others</router-link>
        <router-link to="/contact" class="nav-item" active-class="active">Contact us</router-link>
      </nav>

      <div class="cart">
        <router-link to="/cart" class="cart-icon">
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
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </router-link>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: #0e0e0e;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 40px;
  width: auto;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  margin: 0 auto;
  padding: 1rem 0;
}

.nav-item {
  color: #ffffff;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 0.7rem 1rem;
  position: relative;
  border-radius: 50px;
}

.nav-item:hover {
  color: #f5f5f5;
  background-color: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: #ffffff;
  background-color: rgba(224, 78, 149, 0.1);
  position: relative;
  border: 2px solid #e04e95;
  border-radius: 50px;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(224, 78, 149, 0.3);
}

.nav-item.active::after {
  display: none;
}

.cart {
  display: flex;
  align-items: center;
}

.cart-icon {
  color: #ffffff;
  text-decoration: none;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e04e95;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 50%;
  padding: 0.15em 0.5em;
  min-width: 1.5em;
  text-align: center;
}

@media (max-width: 992px) {
  .main-nav {
    display: none;
  }
}
</style>

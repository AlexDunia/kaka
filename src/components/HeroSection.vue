<script setup>
import { ref, onMounted } from 'vue'

// Local demo data (you can later replace this with API calls or backend data)
const heroItems = ref([
  {
    id: 1,
    name: 'Beach Party',
    heroimage:
      'https://res.cloudinary.com/dnuhjsckk/image/upload/v1761400912/tixdemanded2_rlx9eo.jpg',
    // heroimage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    link: '/events/beach-party',
  },
  {
    id: 2,
    name: 'Tech Expo',
    heroimage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
    link: '/events/tech-expo',
  },
  {
    id: 3,
    name: 'Movie Night',
    heroimage:
      'https://res.cloudinary.com/dnuhjsckk/image/upload/v1749023864/photo_2025-06-03_17-14-37_jxz7np.jpg',
    link: '/events/movie-night',
  },
])

// Optional: auto-slide
const currentSlide = ref(0)

onMounted(() => {
  setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % heroItems.value.length
  }, 5000)
})
</script>

<template>
  <section class="hero-section">
    <div
      v-for="(item, index) in heroItems"
      :key="item.id"
      class="hero-slide"
      :class="{ active: index === currentSlide }"
      :style="{ backgroundImage: `url(${item.heroimage})` }"
    >
      <div class="overlay">
        <div class="hero-content">
          <h1 class="hero-title">{{ item.name }}</h1>
          <RouterLink :to="item.link" class="hero-btn">Book Now</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  height: 85vh;
  overflow: hidden;
}

.hero-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

.hero-slide.active {
  opacity: 1;
  z-index: 1;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-content {
  text-align: center;
  color: #fff;
  animation: fadeInUp 1s ease-in-out;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.hero-btn {
  background: #ff4d4d;
  color: #fff;
  padding: 0.8rem 1.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.hero-btn:hover {
  background: #ff1f1f;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

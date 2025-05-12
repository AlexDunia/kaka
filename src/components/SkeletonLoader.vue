<script setup>
defineProps({
  type: {
    type: String,
    default: 'rect',
    validator: (value) =>
      ['rect', 'card', 'text', 'title', 'circle', 'banner', 'grid', 'list'].includes(value),
  },
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '100px',
  },
  color: {
    type: String,
    default: 'rgba(255, 255, 255, 0.08)',
  },
  rounded: {
    type: Boolean,
    default: false,
  },
  count: {
    type: Number,
    default: 1,
  },
})
</script>

<template>
  <div class="skeleton-container" :style="{ '--skeleton-color': color }">
    <!-- Rectangular skeleton -->
    <div
      v-if="type === 'rect'"
      class="skeleton-item"
      :class="{ 'skeleton-rounded': rounded }"
      :style="{ width, height }"
    ></div>

    <!-- Event card skeleton -->
    <div v-else-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-card-image"></div>
      <div class="skeleton-card-content">
        <div class="skeleton-card-title"></div>
        <div class="skeleton-card-text"></div>
        <div class="skeleton-card-text skeleton-card-text-short"></div>
        <div class="skeleton-card-footer">
          <div class="skeleton-card-price"></div>
          <div class="skeleton-card-button"></div>
        </div>
      </div>
    </div>

    <!-- Text line skeleton -->
    <div
      v-else-if="type === 'text'"
      class="skeleton-text"
      :style="{ width, height: '1rem' }"
      v-for="n in count"
      :key="n"
    ></div>

    <!-- Title skeleton -->
    <div
      v-else-if="type === 'title'"
      class="skeleton-title"
      :style="{ width, height: '2rem' }"
    ></div>

    <!-- Circle skeleton -->
    <div
      v-else-if="type === 'circle'"
      class="skeleton-circle"
      :style="{ width, height: width }"
    ></div>

    <!-- Banner skeleton -->
    <div v-else-if="type === 'banner'" class="skeleton-banner">
      <div class="skeleton-banner-bg"></div>
      <div class="skeleton-banner-content">
        <div class="skeleton-banner-title"></div>
        <div class="skeleton-banner-text"></div>
      </div>
    </div>

    <!-- Grid skeleton -->
    <div v-else-if="type === 'grid'" class="skeleton-grid" :style="{ '--columns': count }">
      <div class="skeleton-card" v-for="n in count" :key="n">
        <div class="skeleton-card-image"></div>
        <div class="skeleton-card-content">
          <div class="skeleton-card-title"></div>
          <div class="skeleton-card-text"></div>
          <div class="skeleton-card-text skeleton-card-text-short"></div>
          <div class="skeleton-card-footer">
            <div class="skeleton-card-price"></div>
            <div class="skeleton-card-button"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- List skeleton -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div class="skeleton-list-item" v-for="n in count" :key="n">
        <div class="skeleton-list-image"></div>
        <div class="skeleton-list-content">
          <div class="skeleton-list-title"></div>
          <div class="skeleton-list-text"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-container {
  --skeleton-color: rgba(255, 255, 255, 0.08);
  --skeleton-animation-duration: 1.5s;
  width: 100%;
}

@keyframes skeletonPulse {
  0% {
    opacity: 0.06;
  }
  50% {
    opacity: 0.09;
  }
  100% {
    opacity: 0.06;
  }
}

/* Use will-change for better performance during animations */
.skeleton-item,
.skeleton-text,
.skeleton-title,
.skeleton-circle,
.skeleton-card-image,
.skeleton-card-title,
.skeleton-card-text,
.skeleton-card-price,
.skeleton-card-button,
.skeleton-banner-bg,
.skeleton-banner-title,
.skeleton-banner-text,
.skeleton-list-image,
.skeleton-list-title,
.skeleton-list-text {
  background-color: var(--skeleton-color);
  animation: skeletonPulse var(--skeleton-animation-duration) ease infinite;
  border-radius: 4px;
  will-change: opacity;
  transform: translateZ(0); /* Hardware acceleration */
  backface-visibility: hidden; /* Performance boost */
}

.skeleton-rounded {
  border-radius: 8px;
}

.skeleton-text {
  margin-bottom: 0.5rem;
  height: 1rem;
}

.skeleton-title {
  margin-bottom: 1rem;
  height: 2rem;
}

.skeleton-circle {
  border-radius: 50%;
}

/* Card skeleton */
.skeleton-card {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background-color: rgba(18, 18, 24, 0.4);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  height: 100%;
  min-height: 350px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.skeleton-card-image {
  height: 180px;
  width: 100%;
  border-radius: 12px 12px 0 0;
}

.skeleton-card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.skeleton-card-title {
  height: 1.5rem;
  margin-bottom: 1rem;
  width: 85%;
}

.skeleton-card-text {
  height: 0.9rem;
  margin-bottom: 0.75rem;
  width: 100%;
}

.skeleton-card-text-short {
  width: 60%;
}

.skeleton-card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-card-price {
  height: 1.5rem;
  width: 30%;
}

.skeleton-card-button {
  height: 2.25rem;
  width: 40%;
  border-radius: 30px;
}

/* Banner skeleton */
.skeleton-banner {
  position: relative;
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.skeleton-banner-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.skeleton-banner-content {
  position: relative;
  z-index: 2;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.skeleton-banner-title {
  height: 3rem;
  width: 70%;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.skeleton-banner-text {
  height: 1.2rem;
  width: 50%;
  border-radius: 6px;
}

/* Grid skeleton */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(var(--columns, 3), 1fr);
  gap: 2rem;
  width: 100%;
}

/* List skeleton */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.skeleton-list-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: rgba(18, 18, 24, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.skeleton-list-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  flex-shrink: 0;
}

.skeleton-list-content {
  flex: 1;
}

.skeleton-list-title {
  height: 1.2rem;
  width: 70%;
  margin-bottom: 0.75rem;
}

.skeleton-list-text {
  height: 0.9rem;
  width: 90%;
}

/* Extra large screens */
@media (min-width: 1400px) {
  .skeleton-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 2.5rem;
  }

  .skeleton-card {
    min-height: 360px;
  }

  .skeleton-card-image {
    height: 200px;
  }

  .skeleton-banner {
    height: 350px;
  }
}

/* Large screens */
@media (min-width: 1200px) and (max-width: 1399px) {
  .skeleton-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }
}

/* Medium-large screens */
@media (min-width: 992px) and (max-width: 1199px) {
  .skeleton-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .skeleton-banner-title {
    width: 60%;
  }
}

/* Medium screens (tablets) */
@media (min-width: 768px) and (max-width: 991px) {
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .skeleton-card {
    min-height: 340px;
  }

  .skeleton-banner {
    height: 250px;
  }

  .skeleton-banner-content {
    padding: 2rem;
  }

  .skeleton-banner-title {
    height: 2.5rem;
    width: 80%;
  }

  .skeleton-banner-text {
    width: 60%;
  }
}

/* Small screens (mobile landscape) */
@media (min-width: 576px) and (max-width: 767px) {
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .skeleton-card {
    min-height: 330px;
  }

  .skeleton-card-image {
    height: 160px;
  }

  .skeleton-card-content {
    padding: 1.25rem;
  }

  .skeleton-banner {
    height: 220px;
    margin-bottom: 1.5rem;
  }

  .skeleton-banner-content {
    padding: 1.5rem;
  }

  .skeleton-banner-title {
    height: 2rem;
    width: 85%;
    margin-bottom: 1rem;
  }

  .skeleton-banner-text {
    height: 1rem;
    width: 70%;
  }

  .skeleton-list-item {
    padding: 0.75rem;
  }

  .skeleton-list-image {
    width: 70px;
    height: 70px;
  }
}

/* Extra small screens (mobile portrait) */
@media (max-width: 575px) {
  .skeleton-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .skeleton-card {
    min-height: 320px;
  }

  .skeleton-card-image {
    height: 140px;
  }

  .skeleton-card-content {
    padding: 1rem;
  }

  .skeleton-card-title {
    height: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .skeleton-card-text {
    height: 0.8rem;
    margin-bottom: 0.5rem;
  }

  .skeleton-banner {
    height: 200px;
    margin-bottom: 1.25rem;
    border-radius: 12px;
  }

  .skeleton-banner-content {
    padding: 1.25rem;
  }

  .skeleton-banner-title {
    height: 1.75rem;
    width: 90%;
    margin-bottom: 0.75rem;
  }

  .skeleton-banner-text {
    height: 0.9rem;
    width: 75%;
  }

  .skeleton-list-item {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .skeleton-list-image {
    width: 60px;
    height: 60px;
  }

  .skeleton-list-title {
    height: 1rem;
    margin-bottom: 0.5rem;
  }
}

/* Very small devices (iPhone SE, Galaxy Fold) */
@media (max-width: 375px) {
  .skeleton-card {
    min-height: 300px;
  }

  .skeleton-card-image {
    height: 130px;
  }

  .skeleton-banner {
    height: 180px;
  }

  .skeleton-banner-content {
    padding: 1rem;
  }

  .skeleton-banner-title {
    height: 1.5rem;
  }

  .skeleton-list-image {
    width: 50px;
    height: 50px;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .skeleton-item,
  .skeleton-text,
  .skeleton-title,
  .skeleton-circle,
  .skeleton-card-image,
  .skeleton-card-title,
  .skeleton-card-text,
  .skeleton-card-price,
  .skeleton-card-button,
  .skeleton-banner-bg,
  .skeleton-banner-title,
  .skeleton-banner-text,
  .skeleton-list-image,
  .skeleton-list-title,
  .skeleton-list-text {
    animation: none;
  }
}

/* Optimize for low-end devices */
@media (prefers-reduced-motion), (update: slow) {
  .skeleton-container {
    --skeleton-animation-duration: 2.5s; /* Slower animation for better performance */
  }
}
</style>

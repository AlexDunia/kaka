<template>
  <div class="progress-container">
    <div class="progress-bar">
      <div class="progress-bg"></div>
      <div class="progress" :style="{ width: progress + '%' }"></div>
    </div>

    <div class="stats">
      <div class="tickets-left">
        <span class="count">{{ ticketsLeft }}</span>
        <span class="label">tickets left</span>
      </div>

      <div class="tickets-sold">
        <span class="count">{{ soldPercentage }}%</span>
        <span class="label">sold</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue'

const props = defineProps({
  ticketsLeft: {
    type: Number,
    default: 650,
  },
  soldPercentage: {
    type: Number,
    default: 35,
  },
})

const progress = ref(0)

onMounted(() => {
  // Animate the progress on mount
  setTimeout(() => {
    progress.value = props.soldPercentage
  }, 300)
})
</script>

<style scoped>
.progress-container {
  margin-bottom: 2rem;
}

.progress-bar {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

.progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #e84393, #f368e0);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(232, 67, 147, 0.3);
  transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

.count {
  font-weight: 700;
  font-size: 1.2rem;
  transition:
    transform 0.3s ease,
    text-shadow 0.3s ease;
}

.tickets-left:hover .count,
.tickets-sold:hover .count {
  transform: translateY(-2px);
  text-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.tickets-left .count {
  color: white;
}

.tickets-sold .count {
  color: #e84393;
  text-shadow: 0 0 10px rgba(232, 67, 147, 0.3);
}

.label {
  color: rgba(255, 255, 255, 0.5);
  margin-left: 0.5rem;
  font-size: 0.9rem;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>

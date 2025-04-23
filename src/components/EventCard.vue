<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  showDetails: {
    type: Boolean,
    default: true,
  },
})

const router = useRouter()

// Predefined event images
const eventImages = [
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Miss-Treasure-Base_gh6jnz.jpg',
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/6th-Service-with-mudiaga_1_hjvlab.jpg',
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Comedy-Meets-dance_s2egap.jpg',
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339804/IMG-20250219-WA0008_entmwi.jpg',
]

// Select a random image or use a specific one based on event index if available
const eventImage = computed(() => {
  // If event has mainImage, use it
  if (props.event.mainImage) {
    return props.event.mainImage
  }

  // Otherwise use the predefined images
  if (props.event.imageIndex !== undefined && eventImages[props.event.imageIndex]) {
    return eventImages[props.event.imageIndex]
  }
  return eventImages[Math.floor(Math.random() * eventImages.length)]
})

// Format price
const formattedPrice = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(props.event.price)
})

// Calculate percentage of tickets sold
const percentageSold = computed(() => {
  const sold = props.event.totalTickets - props.event.availableTickets
  return Math.round((sold / props.event.totalTickets) * 100)
})

// Format date for display
const displayDate = computed(() => {
  const eventDate = new Date(props.event.date)
  return eventDate.getDate()
})

// Format month for display
const displayMonth = computed(() => {
  const eventDate = new Date(props.event.date)
  return eventDate.toLocaleDateString('en-US', { month: 'short' })
})

// Format year for display
const displayYear = computed(() => {
  const eventDate = new Date(props.event.date)
  return eventDate.getFullYear()
})

// Get avatar initials
const hostInitials = computed(() => {
  if (!props.event.host) return 'TD'

  const hostName = props.event.host.name || 'Tix Demand'
  const nameParts = hostName.split(' ')
  if (nameParts.length >= 2) {
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
  }
  return hostName.substring(0, 2).toUpperCase()
})

// Navigate to event details
const viewDetails = (e) => {
  e.stopPropagation()
  router.push(`/event/${props.event.id}`)
}
</script>

<template>
  <div class="event-card" @click="viewDetails">
    <div class="event-card__image">
      <img :src="eventImage" :alt="event.title" />
      <div class="event-card__category">{{ event.category }}</div>
      <div v-if="percentageSold > 75" class="event-card__badge">Hot!</div>

      <div class="event-card__date-badge">
        <div class="date-main">
          <span class="date-number">{{ displayDate }}</span>
          <span class="date-month">{{ displayMonth }}</span>
        </div>
        <span class="date-year">{{ displayYear }}</span>
      </div>
    </div>

    <div class="event-card__content">
      <div class="event-card__header">
        <h3 class="event-card__title">{{ event.title }}</h3>
        <div class="event-card__rating">
          <span class="star-icon">★</span>
          <span>{{ (4 + Math.random()).toFixed(1) }}</span>
        </div>
      </div>

      <div class="event-card__details">
        <div class="event-card__info">
          <div class="event-card__location">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {{ event.location }}
          </div>

          <div class="event-card__host">
            <div class="host-avatar">{{ hostInitials }}</div>
            <span class="host-label">{{ event.host?.name || 'Organized by Tix Demand' }}</span>
          </div>
        </div>
      </div>

      <div class="event-card__tickets">
        <div class="event-card__progress">
          <div class="event-card__progress-bar" :style="{ width: `${percentageSold}%` }"></div>
        </div>
        <div class="event-card__tickets-info">
          <span class="tickets-left">{{ event.availableTickets }} tickets left</span>
          <span class="event-card__price">{{ formattedPrice }}</span>
        </div>
      </div>

      <div v-if="showDetails" class="event-card__action">
        <button class="event-card__button" @click="viewDetails">View Event</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  transition: all var(--transition-medium) ease;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.03);
  box-shadow: var(--shadow-subtle);
  cursor: pointer;
  transform-origin: center bottom;
}

.event-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: var(--shadow-elevated);
  background-color: var(--card-bg-hover);
  border-color: rgba(255, 255, 255, 0.08);
}

.event-card__image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.event-card__image::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0));
  z-index: 1;
  pointer-events: none;
}

.event-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow) ease;
}

.event-card:hover .event-card__image img {
  transform: scale(1.08);
}

.event-card__category {
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
  padding: 6px 12px;
  border-radius: var(--button-radius);
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  background-color: var(--primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.event-card__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff9f43;
  color: white;
  padding: 6px 12px;
  border-radius: var(--button-radius);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.event-card__date-badge {
  position: absolute;
  bottom: 15px;
  right: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 14px;
  background-color: rgba(0, 0, 0, 0.75);
  border-radius: 8px;
  text-align: center;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 60px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  transition:
    transform var(--transition-fast) ease,
    box-shadow var(--transition-fast) ease;
}

.event-card:hover .event-card__date-badge {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.15);
}

.date-main {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.date-number {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.date-month {
  font-size: 1rem;
  color: var(--primary);
  text-transform: uppercase;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.05em;
}

.date-year {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  margin-top: 3px;
}

.event-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: var(--card-bg);
}

.event-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.event-card__title {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.3;
  color: white;
  font-weight: 700;
  flex: 1;
  padding-right: 8px;
  letter-spacing: -0.01em;
}

.event-card__rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.star-icon {
  color: var(--primary);
  font-size: 1.1rem;
}

.event-card__details {
  display: flex;
  margin-bottom: 16px;
}

.event-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-card__location {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.event-card__location svg {
  flex-shrink: 0;
  color: var(--primary);
}

.event-card__host {
  display: flex;
  align-items: center;
  gap: 8px;
}

.host-avatar {
  width: 28px;
  height: 28px;
  background-color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.host-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.event-card__tickets {
  margin-top: auto;
  margin-bottom: 16px;
}

.event-card__progress {
  height: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  overflow: hidden;
  margin-bottom: 8px;
}

.event-card__progress-bar {
  height: 100%;
  background: linear-gradient(to right, var(--primary), var(--accent));
  border-radius: 100px;
  transition: width 1.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.event-card__tickets-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.tickets-left {
  color: var(--text-secondary);
  font-weight: 500;
}

.event-card__price {
  font-weight: 700;
  color: var(--primary);
}

.event-card__action {
  margin-top: auto;
  display: flex;
  justify-content: center;
}

.event-card__button {
  width: 100%;
  padding: 10px 16px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--button-radius);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.event-card__button:hover {
  background-color: var(--accent);
  transform: scale(1.03);
  box-shadow: 0 6px 14px rgba(232, 67, 147, 0.3);
}
</style>

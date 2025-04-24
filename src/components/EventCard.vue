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

// Predefined event images - fallback in case mainImage is not available
const eventImages = [
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Miss-Treasure-Base_gh6jnz.jpg',
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/6th-Service-with-mudiaga_1_hjvlab.jpg',
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Comedy-Meets-dance_s2egap.jpg',
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339804/IMG-20250219-WA0008_entmwi.jpg',
]

// Select image based on the event data
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

// Get category display name
const categoryDisplayName = computed(() => {
  const category = props.event.category
  if (!category) return 'Event'

  // Capitalize first letter and replace dashes/underscores with spaces
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/[-_]/g, ' ')
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
      <div class="event-card__category">{{ categoryDisplayName }}</div>

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
  background-color: rgba(18, 18, 24, 0.25);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(255, 255, 255, 0.025);
  cursor: pointer;
  transform-origin: center bottom;
}

.event-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.1),
    0 0 15px rgba(255, 255, 255, 0.025);
  background-color: rgba(24, 24, 32, 0.3);
  border-color: rgba(255, 255, 255, 0.06);
}

.event-card__image {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.event-card__image::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0));
  z-index: 1;
  pointer-events: none;
}

.event-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
}

.event-card:hover .event-card__image img {
  transform: scale(1.1);
}

.event-card__category {
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  background: rgba(0, 0, 0, 0.7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.event-card__date-badge {
  position: absolute;
  bottom: 15px;
  right: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
  padding: 8px;
  min-width: 50px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.date-main {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.date-number {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1;
  color: white;
}

.date-month {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
}

.date-year {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

.event-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: rgba(12, 12, 16, 0.35);
  color: white;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  position: relative;
}

.event-card__content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0)
  );
}

.event-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.event-card__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
  padding-right: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-card__rating {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  margin-top: 4px;
}

.star-icon {
  color: #f0c14b; /* Amazon-style gold star color */
  margin-right: 4px;
}

.event-card__details {
  flex: 0;
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.event-card__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-card__location {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
}

.event-card__location svg {
  margin-right: 6px;
  flex-shrink: 0;
  stroke: rgba(255, 255, 255, 0.6);
}

.event-card__tickets {
  margin-top: 0;
  padding-top: 0;
}

.event-card__price {
  font-weight: 700;
  color: white;
  font-size: 1.2rem;
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.event-card__action {
  text-align: center;
  margin-top: 12px;
}

.event-card__button {
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.event-card__button:hover {
  background: #e84393;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(232, 67, 147, 0.3);
  border-color: transparent;
}

@media (max-width: 768px) {
  .event-card__image {
    height: 160px;
  }

  .event-card__content {
    padding: 12px;
  }

  .event-card__title {
    font-size: 1rem;
  }

  .event-card__date-badge {
    bottom: 10px;
    right: 10px;
    padding: 6px;
    min-width: 45px;
  }

  .date-number {
    font-size: 1rem;
  }
}
</style>

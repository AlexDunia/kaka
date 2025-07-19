<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import SeoImage from '@/components/SeoImage.vue'
import { useSlug } from '@/composables/useSlug'

const props = defineProps({
  event: {
    type: Object,
    required: false,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: 'rgba(255, 255, 255, 0.08)',
  },
  showDetails: {
    type: Boolean,
    default: true,
  },
})

const router = useRouter()
const { getEventUrl } = useSlug()

// Check if event is expired using backend sales_status
const isExpired = computed(() => {
  if (!props.event?.sales_status) return false
  return props.event.sales_status.is_expired
})

// Format sales end date if needed
const formattedSalesEnd = computed(() => {
  if (!props.event?.sales_status?.sales_end) return ''
  const salesEnd = new Date(props.event.sales_status.sales_end)
  return salesEnd.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

// Create computed properties from event if available
const eventTitle = computed(() => props.event?.title || '')
const eventImage = computed(() => props.event?.main_image || '')
const eventLocation = computed(() => props.event?.location || '')

// Format date for display
const displayDate = computed(() => {
  const eventDate = props.event?.event_date ? new Date(props.event.event_date) : null
  return eventDate && !isNaN(eventDate) ? eventDate.getDate() : ''
})

const displayMonth = computed(() => {
  const eventDate = props.event?.event_date ? new Date(props.event.event_date) : null
  return eventDate && !isNaN(eventDate)
    ? eventDate.toLocaleDateString('en-US', { month: 'short' })
    : ''
})

const displayYear = computed(() => {
  const eventDate = props.event?.event_date ? new Date(props.event.event_date) : null
  return eventDate && !isNaN(eventDate) ? eventDate.getFullYear() : ''
})

// Format price
const formattedPrice = computed(() => {
  if (!props.event?.price) return 'Free'

  // Return just the number value, we'll add the Naira sign in the template
  return typeof props.event.price === 'number' ? props.event.price.toFixed(2) : props.event.price
})

// Get category display name
const categoryDisplayName = computed(() => {
  const category = props.event?.category
  if (!category) return 'Event'

  const displayNames = {
    music: 'Music',
    movies: 'Movies',
    theatre: 'Theatre',
    sports: 'Sports',
    festivals: 'Festivals',
    comedy: 'Comedy',
    art: 'Art',
    food: 'Food',
    tech: 'Tech',
    workshop: 'Workshop',
    conference: 'Conference',
    others: 'Others',
  }

  return displayNames[category.toLowerCase()] || category
})

const viewDetails = () => {
  if (!props.showDetails || !props.event) return
  // Use the useSlug composable to get the proper URL
  const url = getEventUrl(props.event)
  router.push(url)
}
</script>

<template>
  <!-- Show skeleton loader when in loading state or event is null/undefined -->
  <div v-if="loading || !event" class="event-card">
    <SkeletonLoader type="card" :color="color" />
  </div>

  <!-- Show actual event card when data is available -->
  <div v-else-if="event" class="event-card" @click="viewDetails">
    <div class="event-card__image">
      <SeoImage
        :src="eventImage"
        :alt="eventTitle"
        :title="eventTitle"
        imgClass="event-card-image"
        lazy
      />
      <div class="event-card__category">{{ categoryDisplayName }}</div>

      <!-- Add expired stamp -->
      <div v-if="isExpired" class="event-card__expired-stamp">
        <svg width="16" height="16" viewBox="0 0 24 24" class="stamp-icon">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
          <path d="M12 6v8l4 2" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
        <span>EXPIRED</span>
      </div>

      <div class="event-card__date" v-if="displayDate">
        <span class="event-card__date-day">{{ displayDate }}</span>
        <span class="event-card__date-month">{{ displayMonth }}</span>
        <span class="event-card__date-year">{{ displayYear }}</span>
      </div>
    </div>

    <div class="event-card__content">
      <div class="event-card__header">
        <h3 class="event-card__title">{{ eventTitle }}</h3>
        <div class="event-card__rating">
          <span class="star-icon">★</span>
          <span>{{ event?.rating || '4.5' }}</span>
        </div>
      </div>
      <div class="event-card__footer">
        <div class="event-card__footer-text">
          <div class="event-card__location">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
            {{ eventLocation }}
          </div>
          <span class="event-card__price">
            <span class="event-card__price-label">Starting from</span>
            <span class="naira-price">₦{{ formattedPrice }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-card {
  width: 100%;
  background-color: rgba(18, 18, 24, 0.4);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  cursor: pointer;
  height: 100%;
  min-height: 350px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.event-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

/* Focus styles for keyboard users - accessibility */
.event-card:focus-visible {
  outline: 2px solid var(--primary, #e84393);
  outline-offset: 3px;
  transform: translateY(-5px);
}

.event-card__image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.event-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.event-card:hover .event-card__image img {
  transform: scale(1.05);
}

.event-card__category {
  position: absolute;
  top: 15px;
  left: 15px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 30px;
  font-size: 0.7rem;
  font-weight: 600;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.event-card__date {
  position: absolute;
  bottom: 15px;
  right: 15px;
  background-color: rgba(232, 67, 147, 0.9);
  color: white;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 50px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(232, 67, 147, 0.4);
}

.event-card__date-day {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 2px;
}

.event-card__date-month {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.event-card__date-year {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.6);
}

.event-card__content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.event-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.event-card__title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
  flex: 1;
  color: white;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-card__rating {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 3px 8px;
  border-radius: 30px;
  margin-left: 10px;
  font-size: 0.8rem;
  white-space: nowrap;
}

.star-icon {
  color: #fcba03;
  margin-right: 4px;
}

.event-card__footer {
  flex: 0;
  display: flex;
  flex-direction: column;
}

.event-card__footer-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-card__location {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-card__location svg {
  opacity: 0.6;
  flex-shrink: 0;
}

.event-card__price {
  font-weight: 700;
  color: #e84393;
  font-size: 1.3rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 4px;
}

.event-card__price-label {
  font-size: 0.73rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Comprehensive responsive styling */
/* Extra small devices (phones less than 576px) */
@media (max-width: 575.98px) {
  .event-card {
    min-height: 320px;
  }

  .event-card__image {
    height: 140px;
  }

  .event-card__content {
    padding: 15px;
  }

  .event-card__title {
    font-size: 1rem;
    -webkit-line-clamp: 2;
  }

  .event-card__category {
    font-size: 0.65rem;
    padding: 4px 8px;
  }

  .event-card__date {
    padding: 5px;
    min-width: 40px;
    bottom: 10px;
    right: 10px;
  }

  .event-card__date-day {
    font-size: 1rem;
  }

  .event-card__price {
    font-size: 1.2rem;
  }

  .event-card__price-label {
    font-size: 0.67rem;
  }

  .event-card__rating {
    padding: 2px 6px;
    font-size: 0.7rem;
  }
}

/* Small devices (landscape phones, 576px to 767px) */
@media (min-width: 576px) and (max-width: 767.98px) {
  .event-card {
    min-height: 330px;
  }

  .event-card__image {
    height: 160px;
  }

  .event-card__price-label {
    font-size: 0.66rem;
  }
}

/* Medium devices (tablets, 768px to 991px) */
@media (min-width: 768px) and (max-width: 991.98px) {
  .event-card {
    min-height: 340px;
  }

  .event-card__title {
    font-size: 1.05rem;
  }
}

/* Large devices (desktops, 992px to 1199px) */
@media (min-width: 992px) and (max-width: 1199.98px) {
  .event-card__image {
    height: 170px;
  }
}

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) {
  .event-card__image {
    height: 190px;
  }

  .event-card__title {
    font-size: 1.15rem;
  }
}

/* Support for ultra-wide screens */
@media (min-width: 1400px) {
  .event-card {
    min-height: 360px;
  }

  .event-card__image {
    height: 200px;
  }
}

/* Fold/Narrow device support */
@media (max-width: 320px) {
  .event-card {
    min-height: 300px;
  }

  .event-card__image {
    height: 130px;
  }

  .event-card__content {
    padding: 12px;
  }

  .event-card__title {
    font-size: 0.95rem;
  }

  .event-card__price {
    font-size: 0.95rem;
  }

  .event-card__header {
    margin-bottom: 10px;
  }

  .event-card__price {
    font-size: 0.95rem;
  }

  .event-card__price-label {
    font-size: 0.63rem;
  }
}

/* Device orientation handling */
@media (max-height: 600px) and (orientation: landscape) {
  .event-card {
    min-height: 280px;
  }

  .event-card__image {
    height: 130px;
  }
}

/* High DPI screen support */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .event-card {
    border-width: 0.5px;
  }
}

/* Touch device optimization */
@media (pointer: coarse) {
  .event-card {
    /* Increase touch target size for better interaction */
    min-height: 330px;
  }

  .event-card__content {
    padding-bottom: 16px;
  }
}

/* Add image placeholder styles */
.event-card__image-placeholder {
  background: linear-gradient(135deg, rgba(18, 18, 24, 0.6), rgba(18, 18, 24, 0.8));
  width: 100%;
  height: 100%;
}

.naira-price {
  display: flex;
  align-items: center;
  font-weight: 700;
}

.event-card__expired-stamp {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 59, 48, 0.95);
  color: white;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 4px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  text-transform: uppercase;
  border: 1px dashed rgba(255, 255, 255, 0.5);
}

.event-card__expired-stamp .stamp-icon {
  opacity: 0.9;
}

.event-card__image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.event-card:hover .event-card__image::after {
  opacity: 1;
}

/* Remove previous expired styles */
.event-card--expired,
.event-card--expired:hover,
.event-card--expired .event-card__image img,
.text-muted {
  /* Remove these styles */
}
</style>

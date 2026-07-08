<script setup>
import { computed, ref } from 'vue'
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
const isFavorite = ref(Boolean(props.event?.is_favorite || props.event?.is_favorited))
const { getEventUrl } = useSlug()

// Check if event is expired using backend sales_status
const isExpired = computed(() => {
  if (!props.event?.sales_status) return false
  return props.event.sales_status.is_expired
})

// Create computed properties from event if available
const eventTitle = computed(() => props.event?.title || '')
const eventImage = computed(() => props.event?.main_image || '')

// FIX: Laravel returns address.venue_name, not location
const eventLocation = computed(() => {
  if (props.event?.address?.venue_name) {
    return props.event.address.venue_name
  }
  return props.event?.location || 'Venue TBA'
})

// Format date for display - FIX: Laravel returns 'date', not 'event_date'
const displayDate = computed(() => {
  const eventDate = props.event?.date ? new Date(props.event.date) : null
  return eventDate && !isNaN(eventDate) ? eventDate.getDate() : ''
})

const displayMonth = computed(() => {
  const eventDate = props.event?.date ? new Date(props.event.date) : null
  return eventDate && !isNaN(eventDate)
    ? eventDate.toLocaleDateString('en-US', { month: 'short' })
    : ''
})

const displayYear = computed(() => {
  const eventDate = props.event?.date ? new Date(props.event.date) : null
  return eventDate && !isNaN(eventDate) ? eventDate.getFullYear() : ''
})

const displayWeekday = computed(() => {
  const eventDate = props.event?.date ? new Date(props.event.date) : null
  return eventDate && !isNaN(eventDate)
    ? eventDate.toLocaleDateString('en-US', { weekday: 'short' })
    : ''
})

// Format price
const formattedPrice = computed(() => {
  if (!props.event?.price) return 'Free' // Return just the number value, we'll add the Naira sign in the template

  return typeof props.event.price === 'number' ? props.event.price.toFixed(2) : props.event.price
})

// FIX: Category is an object with name property, not a string
const categoryDisplayName = computed(() => {
  // Check if category is an object with name property
  if (props.event?.category?.name) {
    return props.event.category.name
  } // Fallback to old logic if category is a string

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

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
}

const viewDetails = () => {
  if (!props.showDetails || !props.event) return // Use the useSlug composable to get the proper URL
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
  <article v-else class="event-card event-card--loaded" @click="viewDetails">
    <div class="event-card__image">
      <SeoImage
        v-if="eventImage"
        :src="eventImage"
        :alt="eventTitle"
        :title="eventTitle"
        imgClass="event-card-image"
        lazy
      />
      <div v-else class="event-card__empty-image">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 14l3-3 4 4 2-2 3 3" />
          <circle cx="9" cy="9" r="1.5" />
        </svg>
        <span>Cover photo will appear here</span>
      </div>

      <div class="event-card__category">{{ categoryDisplayName }}</div>

      <button
        class="event-card__favorite"
        :class="{ 'is-favorite': isFavorite }"
        type="button"
        :aria-label="isFavorite ? 'Remove event from favorites' : 'Save event'"
        :aria-pressed="isFavorite"
        @click.stop="toggleFavorite"
      >
        <svg viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" aria-hidden="true">
          <path
            d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
          />
        </svg>
      </button>

      <div v-if="displayDate" class="event-card__date">
        <span class="event-card__date-month">{{ displayMonth }}</span>
        <span class="event-card__date-day">{{ displayDate }}</span>
        <span class="event-card__date-weekday">{{ displayWeekday }}</span>
      </div>

      <div v-if="isExpired" class="event-card__expired-stamp">Expired</div>
    </div>

    <div class="event-card__content">
      <div class="event-card__header">
        <h3 class="event-card__title">{{ eventTitle }}</h3>
        <div
          class="event-card__rating"
          :aria-label="String(event?.rating || '4.5') + ' out of 5 stars'"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m12 2.7 2.9 5.87 6.48.94-4.69 4.57 1.1 6.46L12 17.5l-5.79 3.04 1.1-6.46-4.69-4.57 6.48-.94L12 2.7Z"
            />
          </svg>
          <span>{{ event?.rating || '4.5' }}</span>
        </div>
      </div>

      <div class="event-card__location">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <span>{{ eventLocation }}</span>
      </div>

      <div class="event-card__footer">
        <div class="event-card__price">
          <span class="event-card__price-label">From</span>
          <span class="naira-price">&#8358;{{ formattedPrice }}</span>
        </div>
        <button type="button" class="event-card__ticket-button" @click.stop="viewDetails">
          View tickets
        </button>
      </div>
    </div>
  </article>
</template>
<style scoped>
.event-card {
  width: 100%;
  min-width: 0;
  min-height: 334px;
  height: 100%;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-surface) 94%, #070a0e);
  color: var(--color-text);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.2);
}

.event-card--loaded {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition:
    transform 0.28s ease,
    border-color 0.28s ease,
    box-shadow 0.28s ease;
}

.event-card--loaded:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.3);
}

.event-card--loaded:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

.event-card__image {
  position: relative;
  height: 174px;
  overflow: hidden;
  background: #10141a;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
}

.event-card__image :deep(img) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.45s ease;
}

.event-card--loaded:hover .event-card__image :deep(img) {
  transform: scale(1.025);
}

.event-card__empty-image {
  width: 100%;
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: var(--color-muted);
  font-size: 0.72rem;
}

.event-card__empty-image svg {
  width: 28px;
  height: 28px;
  stroke: currentColor;
  stroke-width: 1.4;
}

.event-card__favorite {
  position: absolute;
  top: 11px;
  right: 11px;
  z-index: 2;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: rgba(5, 8, 12, 0.28);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  backdrop-filter: blur(8px);
  cursor: pointer;
}

.event-card__favorite:hover {
  color: var(--color-primary);
  background: rgba(5, 8, 12, 0.5);
}

.event-card__favorite svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.event-card__date {
  position: absolute;
  left: 11px;
  bottom: 11px;
  z-index: 2;
  min-width: 47px;
  padding: 7px 6px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(5, 8, 12, 0.84);
  color: #fff;
  backdrop-filter: blur(10px);
  box-shadow: none;
}

.event-card__date-month {
  color: var(--color-primary);
  font-size: 0.58rem;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
}

.event-card__date-day {
  margin: 3px 0 2px;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
}

.event-card__date-weekday {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.55rem;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
}

.event-card__expired-stamp {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  padding: 5px 8px;
  border: 1px solid rgba(255, 90, 90, 0.45);
  border-radius: 5px;
  background: rgba(30, 7, 9, 0.82);
  color: #ff8a8a;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
}

.event-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 13px 14px 12px;
}

.event-card__title {
  min-height: 2.55em;
  margin: 0;
  overflow: hidden;
  color: var(--color-text);
  font-family: 'Figtree', sans-serif;
  font-size: 0.91rem;
  font-style: normal;
  font-weight: 600;
  line-height: 1.28;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.event-card__category {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  color: var(--color-muted);
  font-size: 0.68rem;
}

.event-card__category > span {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: var(--color-primary);
}

.event-card__location {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 13px;
  color: var(--color-muted);
  font-size: 0.68rem;
}

.event-card__location svg {
  width: 13px;
  height: 13px;
  flex: 0 0 13px;
  stroke: currentColor;
  stroke-width: 1.5;
}

.event-card__location span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-card__footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 13px;
}

.event-card__price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: var(--color-primary);
  font-size: 0.79rem;
  font-weight: 600;
}

.event-card__price-label {
  color: var(--color-primary);
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: 0;
  text-transform: none;
}

.naira-price {
  color: inherit;
  font-weight: inherit;
}

.event-card__ticket-button {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--color-text) 16%, transparent);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;
}

.event-card__ticket-button:hover,
.event-card__ticket-button:focus-visible {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-primary);
  outline: none;
}

:global(.light) .event-card {
  background: color-mix(in srgb, var(--color-surface) 97%, #fff);
  box-shadow: 0 10px 24px rgba(41, 35, 28, 0.08);
}

@media (max-width: 575px) {
  .event-card {
    min-height: 326px;
  }

  .event-card__image {
    height: 168px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .event-card--loaded,
  .event-card__image :deep(img) {
    transition: none;
  }
}

/* Warmer, tighter card refinements */
.event-card__category {
  position: absolute;
  top: 11px;
  left: 11px;
  z-index: 2;
  max-width: calc(100% - 58px);
  overflow: hidden;
  padding: 6px 9px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(5, 8, 12, 0.62);
  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(9px);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-card__favorite.is-favorite {
  color: var(--color-primary);
}

.event-card__expired-stamp {
  top: 47px;
}

.event-card__content {
  padding: 15px 15px 13px;
}

.event-card__header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.event-card__title {
  min-height: 0;
  flex: 1;
  font-size: 1rem;
  line-height: 1.3;
}

.event-card__rating {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 1px;
  color: color-mix(in srgb, var(--color-text) 74%, transparent);
  font-size: 0.74rem;
  font-weight: 600;
}

.event-card__rating svg {
  width: 13px;
  height: 13px;
  fill: #f2b94b;
}

.event-card__location {
  margin-top: 9px;
  font-size: 0.76rem;
}

.event-card__location svg {
  width: 14px;
  height: 14px;
  flex-basis: 14px;
}

.event-card__footer {
  padding-top: 14px;
}

.event-card__price {
  font-size: 0.86rem;
}

.event-card__ticket-button {
  min-height: 34px;
  padding-inline: 13px;
  font-size: 0.74rem;
}

/* Reference card proportions: short, balanced, and self-contained */
.event-card {
  min-height: 0;
  border-radius: 7px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--color-surface) 92%, #071019),
    color-mix(in srgb, var(--color-surface) 97%, #05080d)
  );
  border-color: color-mix(in srgb, var(--color-text) 9%, transparent);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
}

.event-card--loaded {
  min-height: 238px;
}

.event-card__image {
  height: 122px;
  flex: 0 0 122px;
}

.event-card__content {
  min-height: 115px;
  padding: 9px 10px 9px;
}

.event-card__header {
  gap: 7px;
}

.event-card__title {
  font-size: 0.76rem;
  line-height: 1.22;
}

.event-card__rating {
  gap: 3px;
  padding-top: 0;
  font-size: 0.61rem;
}

.event-card__rating svg {
  width: 11px;
  height: 11px;
}

.event-card__category {
  top: 9px;
  left: 9px;
  padding: 5px 7px;
  border-radius: 5px;
  font-size: 0.61rem;
}

.event-card__favorite {
  top: 7px;
  right: 7px;
  width: 27px;
  height: 27px;
}

.event-card__favorite svg {
  width: 16px;
  height: 16px;
}

.event-card__date {
  left: 9px;
  bottom: 9px;
  min-width: 42px;
  padding: 6px 5px 5px;
  border-radius: 5px;
}

.event-card__date-month {
  font-size: 0.51rem;
}

.event-card__date-day {
  margin-block: 2px;
  font-size: 0.88rem;
}

.event-card__date-weekday {
  font-size: 0.48rem;
}

.event-card__location {
  gap: 5px;
  margin-top: 6px;
  font-size: 0.61rem;
}

.event-card__location svg {
  width: 12px;
  height: 12px;
  flex-basis: 12px;
}

.event-card__footer {
  align-items: center;
  gap: 14px;
  padding-top: 8px;
}

.event-card__price {
  gap: 3px;
  font-size: 0.68rem;
  white-space: nowrap;
}

.event-card__ticket-button {
  min-height: 29px;
  margin-left: auto;
  padding-inline: 10px;
  border-radius: 5px;
  font-size: 0.61rem;
  white-space: nowrap;
}

.event-card--loaded:hover {
  transform: translateY(-2px);
  box-shadow: 0 11px 26px rgba(0, 0, 0, 0.24);
}

@media (max-width: 575px) {
  .event-card--loaded {
    min-height: 250px;
  }

  .event-card__image {
    height: 132px;
    flex-basis: 132px;
  }

  .event-card__title {
    font-size: 0.82rem;
  }
}

/* Final card rhythm */
.event-card--loaded {
  min-height: 0;
}

.event-card__content {
  min-height: 0;
  flex: 0 0 116px;
}

.event-card__title {
  min-height: 1.86rem;
}

.event-card__footer {
  margin-top: 8px;
  padding-top: 0;
}

/* Pink brand interactions; green remains a pricing utility */
.event-card__title {
  min-height: 0;
  padding-top: 2px;
  font-size: 0.885rem;
}

.event-card__rating {
  font-size: 0.735rem;
}

.event-card__category {
  border-color: color-mix(in srgb, var(--color-accent) 42%, rgba(255, 255, 255, 0.08));
  background: color-mix(in srgb, var(--color-accent) 16%, rgba(5, 8, 12, 0.72));
  color: #fff;
  font-size: 0.735rem;
}

.event-card__favorite:hover,
.event-card__favorite.is-favorite {
  color: var(--color-accent);
}

.event-card__date-month {
  color: var(--color-accent);
  font-size: 0.635rem;
}

.event-card__date-day {
  font-size: 1.005rem;
}

.event-card__date-weekday {
  font-size: 0.605rem;
}

.event-card__location {
  font-size: 0.735rem;
}

.event-card__price {
  color: var(--color-primary);
  font-size: 0.805rem;
}

.event-card__price-label,
.naira-price {
  color: var(--color-primary);
}

.event-card__ticket-button {
  font-size: 0.735rem;
}

.event-card__ticket-button:hover,
.event-card__ticket-button:focus-visible {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent);
}

.event-card--loaded:hover {
  border-color: color-mix(in srgb, var(--color-accent) 35%, transparent);
}

.event-card--loaded:focus-visible {
  outline-color: var(--color-accent);
}
</style>

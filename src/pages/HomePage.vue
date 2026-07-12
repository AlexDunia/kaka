<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useEventStore } from '@/stores/events'
import { storeToRefs } from 'pinia'
import EventCard from '@/components/EventCard.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useLoading } from '@/composables/useLoading'
import { useSeo } from '@/composables/useSeo'

// SEO setup
const { updatePageTitle, updateMetaDescription, updateSocialMeta } = useSeo()

// Update SEO metadata
onMounted(() => {
  updatePageTitle('Find and Book Amazing Events', false) // Override the default format
  updateMetaDescription(
    'Discover and book tickets for the best events, concerts, movies, theatre shows, sports events, and festivals near you.',
  )
  updateSocialMeta({
    title: 'KakaWorld - Find and Book Events',
    description:
      'Discover and book tickets for the best events, concerts, movies, theatre shows, sports events, and festivals near you.',
    url: window.location.href,
    image: 'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747162284/kakalink_elyn4g.jpg',
  })
})

// Store
const eventStore = useEventStore()
const { events, featuredEvents, error, searchQuery: storeSearchQuery } = storeToRefs(eventStore)

// Local state
const viewAll = ref(false)
const skeletonColor = ref('var(--color-skeleton-base)')
const safetyTimer = ref(null)

// Use our loading composables
const { isLoading, startLoading, stopLoading } = useLoading({ initialState: true })
const {
  isLoading: loadingFeatured,
  startLoading: startLoadingFeatured,
  stopLoading: stopLoadingFeatured,
} = useLoading()
const { isLoading: initialLoadComplete, stopLoading: completeInitialLoad } = useLoading({
  initialState: false,
})

// Watch events to update loading state
watch(
  events,
  (newEvents) => {
    if (newEvents && newEvents.length > 0) {
      stopLoading()
      completeInitialLoad()
    }
  },
  { immediate: true },
)

// Watch featured events to update loading state
watch(
  featuredEvents,
  (newFeatured) => {
    if (newFeatured && newFeatured.length > 0) {
      stopLoadingFeatured()
    }
  },
  { immediate: true },
)

// Computed
const sortedEvents = computed(() => {
  if (storeSearchQuery.value && storeSearchQuery.value.trim() !== '') {
    return [...eventStore.events].sort((a, b) => b.id - a.id)
  }

  return []
})

// Replace filteredEvents computed property with sortedEvents
const filteredEvents = sortedEvents

// Sort featured events by ID as well
const sortedFeaturedEvents = computed(() => {
  return [...featuredEvents.value].sort((a, b) => b.id - a.id)
})

// Methods with safety
const resetSearch = async () => {
  await eventStore.resetFilters()
}

// Add clearSearch method
const clearSearch = async () => {
  await resetSearch()
}

// Update onMounted hook
onMounted(async () => {
  console.log('🚀 HomePage mounted, starting data fetch...')

  try {
    if (!events.value || events.value.length === 0) {
      console.log('📡 Fetching all events...')
      startLoading()
      await eventStore.fetchAllEvents()
      console.log('✅ All events fetched:', events.value)
    }

    // Load featured events
    console.log('⭐ Fetching featured events...')
    startLoadingFeatured()
    await eventStore.fetchFeaturedEvents()
    console.log('✅ Featured events fetched:', featuredEvents.value)
    console.log('✅ Sorted featured events:', sortedFeaturedEvents.value)
  } catch (err) {
    console.error('❌ Error in onMounted:', err)
    ensureLoadingCompletes()
  } finally {
    ensureLoadingCompletes()
  }
})

// Watch for changes in events store to update UI
watch(
  () => eventStore.events,
  () => {
    // This will update when the events array changes, like when a new event is created
  },
  { deep: true },
)

// Safety mechanism to prevent hanging
const ensureLoadingCompletes = () => {
  // Clear any existing safety timer
  if (safetyTimer.value) {
    clearTimeout(safetyTimer.value)
  }

  // Set a new safety timer to ensure loading states don't hang
  safetyTimer.value = setTimeout(() => {
    if (!initialLoadComplete.value) {
      completeInitialLoad()
    }
    if (isLoading.value) {
      isLoading.value = false
    }
    if (loadingFeatured.value) {
      loadingFeatured.value = false
    }
  }, 5000) // 5 second safety
}

// Cleanup on component unmount
onUnmounted(() => {
  if (safetyTimer.value) {
    clearTimeout(safetyTimer.value)
  }
})
</script>

<template>
  <div class="home-page">
    <!-- Global Error Message -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="eventStore.fetchAllEvents(true)" class="retry-button">Retry</button>
    </div>

    <!-- Search Results Section - Show when search term exists -->
    <section v-if="storeSearchQuery && filteredEvents.length > 0" class="search-results">
      <div class="section-inner">
        <div class="section-header">
          <h2>Search Results for "{{ storeSearchQuery }}"</h2>
          <div class="search-actions">
            <button @click="clearSearch" class="clear-search-btn" title="Clear search">
              <span class="close-icon">×</span>
            </button>
            <span class="view-all" @click="viewAll = !viewAll">
              {{ viewAll ? 'View Less' : 'View All' }}
            </span>
          </div>
        </div>

        <div v-if="isLoading" class="search-skeleton">
          <SkeletonLoader type="grid" :count="6" :color="skeletonColor" />
        </div>
        <div v-else class="event-grid">
          <EventCard
            v-for="event in filteredEvents.slice(0, viewAll ? undefined : 6)"
            :key="event.id"
            :event="event"
          />
        </div>
      </div>
    </section>

    <!-- Empty Search Results Message -->
    <section
      v-else-if="storeSearchQuery && filteredEvents.length === 0 && !isLoading"
      class="empty-search-results"
    >
      <div class="section-inner">
        <div class="section-header">
          <h2>No Results Found</h2>
          <button @click="clearSearch" class="clear-search-btn" title="Clear search">
            <span class="close-icon">×</span>
          </button>
        </div>
        <div class="empty-state">
          <p>
            No events found matching "{{ storeSearchQuery }}". Try different keywords or browse
            categories.
          </p>
        </div>
      </div>
    </section>

    <!-- Featured Events Section -->
    <!-- Featured Events Section -->
    <section v-if="!isLoading || sortedFeaturedEvents.length > 0" class="featured-events">
      <div class="section-inner">
        <div class="section-header">
          <h2>Featured Events</h2>
        </div>

        <div v-if="loadingFeatured && !sortedFeaturedEvents.length" class="featured-skeleton">
          <SkeletonLoader type="grid" :count="5" :color="skeletonColor" />
        </div>
        <div v-else-if="sortedFeaturedEvents.length === 0" class="empty-state">
          <p>No featured events available. Check back soon!</p>
        </div>
        <div v-else class="event-grid">
          <EventCard v-for="event in sortedFeaturedEvents" :key="event.id" :event="event" />
        </div>
      </div>
    </section>

    <section class="static-category-strip" aria-label="Event categories">
      <div class="static-category-strip__content">
        <span>Seminars</span>
        <span>Artists & Vendors</span>
        <span>*</span>
        <span>Music</span>
        <span>*</span>
        <span>Family</span>
        <span>*</span>
        <span>Seminars & Conferences</span>
        <span>*</span>
        <span>Movies</span>
        <span>*</span>
        <span>Educational</span>
        <span>*</span>
        <span>Seminars</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  margin: 0;
  padding: 60px 0 80px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  background-color: var(--color-bg);
  color: var(--color-text);
}

.section-inner {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--color-border);
  position: relative;
}

.section-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100px;
  height: 1px;
  background: linear-gradient(90deg, var(--color-border), transparent);
}

.section-header h2 {
  font-size: 1.8rem;
  margin: 0;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.view-all {
  color: var(--color-muted);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.view-all:hover {
  text-decoration: none;
  color: var(--color-accent);
  transform: translateY(-1px);
}

.search-results,
.empty-search-results,
.featured-events {
  position: relative;
  padding: 40px 0;
  border-radius: 0;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 12px 30px var(--color-shadow);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  margin-bottom: 40px;
  opacity: 1;
  position: relative;
  z-index: 1;
}

.event-grid > * {
  box-shadow: 0 8px 24px var(--color-shadow);
  transition:
    transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1),
    box-shadow 0.4s cubic-bezier(0.215, 0.61, 0.355, 1),
    opacity 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
  border: 1px solid var(--color-card-border);
  max-width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: 350px;
  background-color: var(--color-surface);
  color: var(--color-text);
}

.event-grid > *:hover {
  opacity: 1;
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
}

.loading-container,
.error-message,
.empty-state {
  text-align: center;
  padding: 20px;
  color: var(--color-text);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 40px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 15px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-accent);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: var(--color-danger);
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.retry-button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: var(--color-danger);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background-color: #c0392b;
}

.empty-state {
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  color: var(--color-muted);
  padding: 30px;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.clear-search-btn {
  background: none;
  border: none;
  color: var(--color-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  color: var(--color-accent);
  background-color: rgba(255, 255, 255, 0.1);
}

.close-icon {
  line-height: 1;
}

.search-actions span {
  font-weight: 500;
}

.featured-skeleton,
.events-skeleton,
.search-skeleton {
  width: 100%;
  min-height: 350px;
  margin-bottom: 40px;
}

.static-category-strip {
  background-color: #ec4899;
  color: #040308;
  padding: 18px 0;
}

.static-category-strip__content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-size: 1rem;
}

@media (max-width: 1400px) {
  .event-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 25px;
  }
}

@media (max-width: 1200px) {
  .event-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

@media (max-width: 992px) {
  .event-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .home-page {
    padding: 0 20px 50px;
  }
}

@media (max-width: 768px) {
  .event-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .home-page {
    padding: 0 18px 40px;
  }

  .section-header h2 {
    font-size: 1.5rem;
  }
}

@media (max-width: 576px) {
  .event-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .home-page {
    padding: 0 16px 30px;
  }

  .section-header {
    margin-bottom: 20px;
  }
}

@media (max-width: 375px) {
  .home-page {
    padding: 0 12px 30px;
  }

  .section-header h2 {
    font-size: 1.25rem;
  }
}

@media (max-width: 280px) {
  .section-header h2 {
    font-size: 1.25rem;
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  .event-grid {
    gap: 12px;
  }
}

@media (min-width: 768px) and (max-width: 992px) and (orientation: portrait) {
  .event-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (pointer: coarse) {
  .event-grid > * {
    box-shadow: 0 6px 16px var(--color-shadow);
  }
}

/* Mature event listing layout */
.section-header h2 {
  position: relative;
  padding-left: 13px;
  font-size: 1.22rem;
  font-weight: 600;
}

.section-header h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12%;
  width: 2px;
  height: 76%;
  border-radius: 2px;
  background: var(--color-primary);
}

.event-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 238px), 1fr));
  gap: 18px;
  align-items: stretch;
}

.event-grid > *:hover {
  transform: none;
}

/* Five-column desktop event grid */
.event-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

@media (max-width: 1100px) {
  .event-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .event-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .event-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 440px) {
  .event-grid {
    grid-template-columns: 1fr;
  }
}

/* Wider five-card canvas with clearer row separation */
.section-inner {
  max-width: 1320px;
  padding-inline: 24px;
}

.event-grid {
  column-gap: 18px;
  row-gap: 34px;
}

@media (max-width: 640px) {
  .event-grid {
    grid-template-columns: 1fr;
  }
}

/* Four-column desktop grid */
.event-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
/* Match the global header alignment rail exactly */
.home-page {
  padding-left: 0;
  padding-right: 0;
}

.section-inner {
  width: 100%;
  max-width: 1320px;
  padding-inline: clamp(16px, 1.8vw, 24px);
}
</style>

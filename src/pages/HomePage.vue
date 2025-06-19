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
const searchTerm = ref('')
const viewAll = ref(false)
const skeletonColor = ref('rgba(255, 255, 255, 0.08)') // Subtle gray skeleton color
const safetyTimer = ref(null)

// Use our loading composables
const { isLoading, startLoading } = useLoading()
const { isLoading: loadingFeatured, startLoading: startFeaturedLoading } = useLoading()
const {
  isLoading: initialLoadComplete,
  startLoading: startInitialLoading,
  stopLoading: completeInitialLoad,
} = useLoading({
  initialState: false,
})

// Set active tab with loading and safety
const activeTab = ref('all')
const setActiveTab = async (category) => {
  ensureLoadingCompletes()

  try {
    await startLoading(async () => {
      activeTab.value = category
      await eventStore.fetchEventsByCategory(category)
    })
  } catch (e) {
    console.error('Error setting active tab:', e)
    isLoading.value = false // Ensure we stop showing the skeleton
  }
}

// Computed
const filteredEvents = computed(() => {
  // If we're in a search context, display the raw events from the store (already filtered by API)
  if (storeSearchQuery.value && storeSearchQuery.value.trim() !== '') {
    console.log('Using store-filtered events for search results')
    return eventStore.events
  }

  // Otherwise filter by active tab and local search term
  if (activeTab.value === 'all') {
    return eventStore.events.filter((event) => {
      return event.title.toLowerCase().includes(searchTerm.value.toLowerCase())
    })
  } else {
    return eventStore.events.filter((event) => {
      return (
        event.category === activeTab.value &&
        event.title.toLowerCase().includes(searchTerm.value.toLowerCase())
      )
    })
  }
})

// When search term is updated in store, sync with local searchTerm
watch(storeSearchQuery, (newValue) => {
  searchTerm.value = newValue || ''
  console.log('Search term updated from store:', searchTerm.value)
})

// Methods with safety
const getEventsByCategory = async (category) => {
  await setActiveTab(category)
}

const handleSearch = async () => {
  ensureLoadingCompletes()

  try {
    await startLoading(async () => {
      if (searchTerm.value.trim()) {
        console.log('Calling eventStore.searchEvents with:', searchTerm.value)
        await eventStore.searchEvents(searchTerm.value)

        // Force refresh of filtered events
        activeTab.value = 'all'
      } else {
        console.log('Empty search term, resetting filters')
        await eventStore.resetFilters()
      }
    })
  } catch (e) {
    console.error('Error during search:', e)
    isLoading.value = false // Ensure we stop showing the skeleton
  }
}

// Add clear search function with safety
const clearSearch = async () => {
  ensureLoadingCompletes()

  try {
    await startLoading(async () => {
      searchTerm.value = ''
      await eventStore.resetFilters()
      console.log('Search cleared, returning to normal view')
    })
  } catch (e) {
    console.error('Error clearing search:', e)
    isLoading.value = false // Ensure we stop showing the skeleton
  }
}

// Lifecycle hooks
onMounted(async () => {
  try {
    console.log('Home page mounted - initializing data')
    ensureLoadingCompletes()

    // Start initial loading
    const loadData = async () => {
      // Load all events if not already loaded
      if (events.value.length === 0) {
        console.log('No events loaded yet, fetching from API')
        try {
          await eventStore.fetchAllEvents(true) // Force refresh from API
          console.log('Events loaded successfully')
        } catch (error) {
          console.error('Failed to fetch events in HomePage:', error)
        }
      }

      // Load featured events
      try {
        await startFeaturedLoading(async () => {
          console.log('Fetching featured events')
          await eventStore.fetchFeaturedEvents()
          console.log('Featured events loaded')
        })
      } catch (err) {
        console.error('Error loading featured events:', err)
        loadingFeatured.value = false // Ensure we stop showing the skeleton
      }
    }

    try {
      await startInitialLoading(loadData)
    } catch (e) {
      console.error('Error during initial load:', e)
      completeInitialLoad() // Ensure initial load completes
    }
  } catch (error) {
    console.error('Failed to fetch events:', error)
    completeInitialLoad()
  }
})

// Watch for changes in events store to update UI
watch(
  () => eventStore.events,
  () => {
    // This will update when the events array changes, like when a new event is created
    console.log('Events updated in HomePage')
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
      console.warn('Safety timeout: forcing initialLoad to complete')
      completeInitialLoad()
    }
    if (isLoading.value) {
      console.warn('Safety timeout: forcing loading to complete')
      isLoading.value = false
    }
    if (loadingFeatured.value) {
      console.warn('Safety timeout: forcing featuredLoading to complete')
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
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-content">
        <h1>Discover Amazing Events</h1>
        <p>Find and join events happening around you</p>
        <div class="search-container">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Search events..."
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button @click="handleSearch" class="search-button">Search</button>
        </div>
      </div>
    </div>

    <!-- Loading Indicator for Initial Load -->
    <div v-if="isLoading && !initialLoadComplete" class="loading-container">
      <SkeletonLoader type="rect" width="100%" height="40px" :color="skeletonColor" />
      <p>Loading events...</p>
    </div>

    <!-- Global Error Message -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="eventStore.fetchAllEvents(true)" class="retry-button">Retry</button>
    </div>

    <!-- Search Results Section - Show when search term exists -->
    <section v-if="storeSearchQuery && filteredEvents.length > 0" class="search-results">
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
    </section>

    <!-- Empty Search Results Message -->
    <section
      v-else-if="storeSearchQuery && filteredEvents.length === 0 && !isLoading"
      class="empty-search-results"
    >
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
    </section>

    <!-- Featured Events Section -->
    <section v-if="initialLoadComplete || featuredEvents.length > 0" class="featured-events">
      <div class="section-header">
        <h2>Featured Events</h2>
      </div>

      <div v-if="loadingFeatured" class="featured-skeleton">
        <SkeletonLoader type="grid" :count="3" :color="skeletonColor" />
      </div>
      <div v-else-if="featuredEvents.length === 0" class="empty-state">
        <p>No featured events available. Check back soon!</p>
      </div>
      <div v-else class="event-grid">
        <EventCard v-for="event in featuredEvents" :key="event.id" :event="event" />
      </div>
    </section>

    <!-- Upcoming Events Section - Only show if not searching -->
    <section
      v-if="
        (!storeSearchQuery || storeSearchQuery === '') && (initialLoadComplete || events.length > 0)
      "
      class="upcoming-events"
    >
      <div class="section-header">
        <h2>All Events</h2>
        <span class="view-all" @click="viewAll = !viewAll">
          {{ viewAll ? 'View Less' : 'View All' }}
        </span>
      </div>

      <div class="category-tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'all' }"
          @click="getEventsByCategory('all')"
        >
          All
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'music' }"
          @click="getEventsByCategory('music')"
        >
          Music
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'art' }"
          @click="getEventsByCategory('art')"
        >
          Art
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'food' }"
          @click="getEventsByCategory('food')"
        >
          Food
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'tech' }"
          @click="getEventsByCategory('tech')"
        >
          Tech
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'sports' }"
          @click="getEventsByCategory('sports')"
        >
          Sports
        </button>
      </div>

      <div v-if="isLoading" class="events-skeleton">
        <SkeletonLoader type="grid" :count="6" :color="skeletonColor" />
      </div>
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-else-if="filteredEvents.length === 0" class="empty-state">
        <p>No events found. Try a different category or create your own event!</p>
      </div>
      <div v-else class="event-grid fade-in">
        <EventCard
          v-for="event in filteredEvents.slice(0, viewAll ? undefined : 6)"
          :key="event.id"
          :event="event"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  padding: 0 30px;
}

.hero-banner {
  position: relative;
  height: 300px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 40px;
  background: rgba(30, 30, 36, 0.4); /* Further reduced opacity to 40% */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.hero-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 60px 20px;
  text-align: center;
  color: white;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.hero-content h1 {
  font-size: 2.8rem;
  margin-bottom: 10px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.hero-content p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.search-container {
  display: flex;
  max-width: 90%;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 15px;
  border: none;
  border-radius: 5px 0 0 5px;
  font-size: 1rem;
}

.search-button {
  padding: 15px 30px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 0 5px 5px 0;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-button:hover {
  background-color: #45a049;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  position: relative;
}

.section-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0));
}

.section-header h2 {
  font-size: 1.8rem;
  color: white;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.02em;
}

.view-all {
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.view-all:hover {
  text-decoration: none;
  color: #e84393;
  transform: translateY(-1px);
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition:
    transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1),
    box-shadow 0.4s cubic-bezier(0.215, 0.61, 0.355, 1),
    opacity 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: 350px;
  opacity: 0.92;
}

.event-grid > *:hover {
  opacity: 1;
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.16);
}

.category-tabs {
  display: flex;
  gap: 15px;
  margin-bottom: 35px;
  flex-wrap: wrap;
  padding: 5px 0;
}

.tab {
  padding: 10px 20px;
  background-color: rgba(18, 18, 24, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.tab:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.tab:hover::before {
  opacity: 1;
}

.tab.active {
  background: linear-gradient(135deg, rgba(232, 67, 147, 0.7), rgba(192, 72, 137, 0.8));
  color: white;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 5px 15px rgba(232, 67, 147, 0.2);
  transform: translateY(-2px);
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.5);
  transform: scaleX(0.7);
  transform-origin: center;
  border-radius: 2px;
}

.loading-container,
.error-message,
.empty-state {
  text-align: center;
  padding: 20px;
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
  border-top-color: #e84393;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.retry-button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background-color: #c0392b;
}

.empty-state {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 30px;
}

/* Enhance responsive grid layout */
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

  .hero-content h1 {
    font-size: 2.25rem;
  }
}

@media (max-width: 992px) {
  .event-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .home-page {
    padding: 0 20px;
  }

  .hero-content h1 {
    font-size: 1.6rem;
  }
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2rem;
  }

  .hero-content p {
    font-size: 1rem;
  }

  .search-container {
    flex-direction: column;
    max-width: 100%;
  }

  .search-input {
    border-radius: 5px;
    margin-bottom: 10px;
    width: 100%;
  }

  .search-button {
    border-radius: 5px;
    width: 100%;
  }

  .event-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .category-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
    margin-bottom: 24px;
    scroll-snap-type: x mandatory;
  }

  .tab {
    scroll-snap-align: start;
    white-space: nowrap;
    flex-shrink: 0;
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
    padding: 0 16px;
  }

  .search-container {
    max-width: 100%;
  }

  .featured-events,
  .upcoming-events,
  .search-results {
    padding: 20px 16px;
  }

  .hero-content h1 {
    font-size: 1.75rem;
    margin-bottom: 8px;
  }

  .hero-content p {
    font-size: 0.95rem;
    margin-bottom: 20px;
  }

  .section-header {
    margin-bottom: 20px;
  }
}

/* Small phone optimization */
@media (max-width: 375px) {
  .home-page {
    padding: 0 12px;
  }

  .hero-content h1 {
    font-size: 1.5rem;
  }

  .section-header h2 {
    font-size: 1.25rem;
  }

  .tab {
    padding: 8px 14px;
    font-size: 0.8rem;
  }

  .featured-events,
  .upcoming-events,
  .search-results {
    padding: 15px 12px;
    margin-bottom: 30px;
  }
}

/* Ultra small devices (Galaxy Fold) */
@media (max-width: 280px) {
  .hero-content h1 {
    font-size: 1.5rem;
  }

  .section-header h2 {
    font-size: 1.25rem;
  }

  .tab {
    padding: 6px 12px;
    font-size: 0.75rem;
  }
}

/* Landscape mode optimization */
@media (max-height: 500px) and (orientation: landscape) {
  .search-container {
    flex-direction: row;
    gap: 10px;
  }

  .search-input {
    margin-bottom: 0;
    border-radius: 5px;
  }

  .search-button {
    width: auto;
    border-radius: 5px;
  }
}

/* Tablets in portrait orientation */
@media (min-width: 768px) and (max-width: 992px) and (orientation: portrait) {
  .event-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* High DPI screens */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .featured-events,
  .upcoming-events,
  .search-results {
    border-width: 0.5px;
  }
}

/* Ensure touch-friendliness on mobile */
@media (pointer: coarse) {
  .tab {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .search-button,
  .search-input {
    min-height: 48px;
  }
}

/* Style enhancements for sections */
.featured-events,
.upcoming-events,
.search-results {
  position: relative;
  padding: 30px;
  border-radius: 0;
  background-color: rgba(18, 18, 24, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  margin-bottom: 40px;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.025);
  border-bottom: 1px solid rgba(255, 255, 255, 0.025);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.05),
    0 1px 2px rgba(255, 255, 255, 0.025);
}

/* Add this to the HomePage.vue file to enhance the background */
body {
  background-color: #121212;
  background-image:
    radial-gradient(circle at 10% 20%, rgba(232, 67, 147, 0.015) 0%, transparent 30%),
    radial-gradient(circle at 90% 80%, rgba(232, 67, 147, 0.015) 0%, transparent 30%);
  background-attachment: fixed;
  color: white;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.clear-search-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
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
  color: #e84393;
  background-color: rgba(255, 255, 255, 0.1);
}

.close-icon {
  line-height: 1;
  margin-top: -2px;
}

.empty-search-results {
  margin-bottom: 30px;
}

/* Skeleton styles */
.featured-skeleton,
.events-skeleton,
.search-skeleton {
  width: 100%;
  min-height: 350px;
  margin-bottom: 40px;
}

.fade-in {
  animation: fade-in 0.5s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>

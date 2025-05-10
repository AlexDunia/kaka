<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useEventStore } from '@/stores/events'
import { storeToRefs } from 'pinia'
import EventCard from '@/components/EventCard.vue'

// Store
const eventStore = useEventStore()
const { events, featuredEvents, error, isLoading } = storeToRefs(eventStore)

// Local state
const searchTerm = ref('')
const loadingFeatured = ref(false)
const activeTab = ref('all')
const viewAll = ref(false)
const initialLoadComplete = ref(false)

// Computed
const filteredEvents = computed(() => {
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

// Methods
const getEventsByCategory = async (category) => {
  try {
    activeTab.value = category
    await eventStore.fetchEventsByCategory(category)
  } catch (err) {
    console.error(`Error fetching ${category} events:`, err)
  }
}

const handleSearch = async () => {
  try {
    if (searchTerm.value.trim()) {
      await eventStore.searchEvents(searchTerm.value)
    } else {
      await eventStore.resetFilters()
    }
  } catch (err) {
    console.error('Search error:', err)
  }
}

// Lifecycle hooks
onMounted(async () => {
  try {
    console.log('Home page mounted - initializing data')
    initialLoadComplete.value = false

    // Load all events if not already loaded
    if (events.value.length === 0) {
      await eventStore.fetchAllEvents(true) // Force refresh from API
      console.log('Events loaded:', events.value)
    }

    // Load featured events
    try {
      loadingFeatured.value = true
      const featuredData = await eventStore.fetchFeaturedEvents()
      console.log('Featured events loaded:', featuredData)
    } catch (err) {
      console.error('Error loading featured events:', err)
    } finally {
      loadingFeatured.value = false
      initialLoadComplete.value = true
    }
  } catch (error) {
    console.error('Failed to fetch events:', error)
    initialLoadComplete.value = true
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
</script>

<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
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
    </section>

    <!-- Loading Indicator for Initial Load -->
    <div v-if="isLoading && !initialLoadComplete" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading events...</p>
    </div>

    <!-- Global Error Message -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="eventStore.fetchAllEvents(true)" class="retry-button">Retry</button>
    </div>

    <!-- Featured Events Section -->
    <section v-if="initialLoadComplete || featuredEvents.length > 0" class="featured-events">
      <div class="section-header">
        <h2>Featured Events</h2>
      </div>

      <div v-if="loadingFeatured" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading featured events...</p>
      </div>
      <div v-else-if="featuredEvents.length === 0" class="empty-state">
        <p>No featured events available. Check back soon!</p>
      </div>
      <div v-else class="event-grid">
        <EventCard v-for="event in featuredEvents" :key="event.id" :event="event" />
      </div>
    </section>

    <!-- Upcoming Events Section -->
    <section v-if="initialLoadComplete || events.length > 0" class="upcoming-events">
      <div class="section-header">
        <h2>Upcoming Events</h2>
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

      <div v-if="isLoading && activeTab !== 'all'" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading {{ activeTab }} events...</p>
      </div>
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-else-if="filteredEvents.length === 0" class="empty-state">
        <p>No events found. Try a different category or create your own event!</p>
      </div>
      <div v-else class="event-grid">
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

.hero-section {
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('/images/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  color: white;
  padding: 100px 20px;
  text-align: center;
  border-radius: 10px;
  margin-bottom: 40px;
}

.hero-content h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
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
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab {
  padding: 8px 15px;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.7);
}

.tab:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.tab.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.loading-container,
.error-message,
.empty-state {
  text-align: center;
  padding: 20px;
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

@media (max-width: 1200px) {
  .event-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .event-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 60px 20px;
  }

  .hero-content h1 {
    font-size: 2rem;
  }

  .hero-content p {
    font-size: 1rem;
  }

  .search-container {
    flex-direction: column;
  }

  .search-input {
    border-radius: 5px;
    margin-bottom: 10px;
  }

  .search-button {
    border-radius: 5px;
  }

  .event-grid {
    grid-template-columns: 1fr;
  }

  .section-header h2 {
    font-size: 1.5rem;
  }
}

/* Style enhancements for sections */
.featured-events,
.upcoming-events {
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
</style>

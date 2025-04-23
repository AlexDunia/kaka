<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEventStore } from '@/stores/events'
import { storeToRefs } from 'pinia'
import EventCard from '@/components/EventCard.vue'
import LoadingIndicator from '@/components/LoadingIndicator.vue'

// Store
const eventStore = useEventStore()
const { isLoading, error } = storeToRefs(eventStore)

// Computed properties from store
const featuredEvents = computed(() => eventStore.events.filter((event) => event.featured))

// Local state
const searchTerm = ref('')
const loadingFeatured = ref(false)
const activeTab = ref('all')
const viewAll = ref(false)

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
const getEventsByCategory = (category) => {
  activeTab.value = category
}

const handleSearch = () => {
  // Implement search functionality
  console.log('Searching for:', searchTerm.value)
}

// Lifecycle hooks
onMounted(async () => {
  if (eventStore.events.length === 0) {
    await eventStore.fetchAllEvents()
  }
})
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

    <!-- Featured Events Section -->
    <section class="featured-events">
      <div class="section-header">
        <h2>Featured Events</h2>
      </div>

      <div v-if="loadingFeatured" class="loading-container">
        <LoadingIndicator />
      </div>
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-else class="event-grid">
        <EventCard v-for="event in featuredEvents" :key="event.id" :event="event" />
      </div>
    </section>

    <!-- Upcoming Events Section -->
    <section class="upcoming-events">
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

      <div v-if="isLoading" class="loading-container">
        <LoadingIndicator />
      </div>
      <div v-else-if="error" class="error-message">
        {{ error }}
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
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
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.section-header h2 {
  font-size: 1.8rem;
  color: #333;
}

.view-all {
  color: #4caf50;
  cursor: pointer;
  font-weight: 500;
}

.view-all:hover {
  text-decoration: underline;
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  opacity: 0.75;
}

.event-grid > * {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.event-grid > *:hover {
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab {
  padding: 8px 15px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab:hover {
  background-color: #e0e0e0;
}

.tab.active {
  background-color: #4caf50;
  color: white;
}

.loading-container,
.error-message {
  text-align: center;
  padding: 40px;
}

.error-message {
  color: #e74c3c;
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
</style>

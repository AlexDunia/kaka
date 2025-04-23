<script setup>
import { ref, onMounted } from 'vue'
import { useEventStore } from '@/stores/events'
import EventCard from '@/components/EventCard.vue'

// Component name should be multi-word to satisfy linting rules
const componentName = 'HomePage'

const eventStore = useEventStore()

const searchQuery = ref('')
const loading = ref(true)
const error = ref(null)
const featuredEvents = ref([])
const upcomingEvents = ref([])

// Load events on mount
onMounted(async () => {
  try {
    await eventStore.fetchAllEvents()
    featuredEvents.value = await eventStore.fetchFeaturedEvents()
    upcomingEvents.value = eventStore.upcomingEvents
  } catch (err) {
    error.value = err.message || 'Failed to load events'
  } finally {
    loading.value = false
  }
})

// Search events
const searchEvents = async () => {
  if (!searchQuery.value.trim()) {
    await eventStore.fetchAllEvents()
    return
  }

  try {
    loading.value = true
    await eventStore.searchEvents(searchQuery.value)
  } catch (err) {
    error.value = err.message || 'Search failed'
  } finally {
    loading.value = false
  }
}

// Filter events by category
const filterByCategory = async (category) => {
  try {
    loading.value = true
    await eventStore.fetchEventsByCategory(category)
  } catch (err) {
    error.value = err.message || 'Failed to filter events'
  } finally {
    loading.value = false
  }
}

// Clear search and filters
const clearFilters = async () => {
  searchQuery.value = ''
  await eventStore.resetFilters()
}
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="container">
        <div class="hero__content">
          <h1 class="hero__title">Find and book tickets for<br />amazing events</h1>
          <p class="hero__subtitle">Discover concerts, sports, theatre, and more</p>

          <div class="hero__search">
            <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="searchEvents"
              placeholder="Search events, artists, or venues..."
              class="hero__search-input"
            />
            <button @click="searchEvents" class="hero__search-button">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>

          <div class="hero__categories">
            <button @click="clearFilters" class="hero__category-tag">All</button>
            <button @click="filterByCategory('music')" class="hero__category-tag">Music</button>
            <button @click="filterByCategory('sports')" class="hero__category-tag">Sports</button>
            <button @click="filterByCategory('theatre')" class="hero__category-tag">Theatre</button>
            <button @click="filterByCategory('movies')" class="hero__category-tag">Movies</button>
            <button @click="filterByCategory('festivals')" class="hero__category-tag">
              Festivals
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="featured" v-if="!searchQuery && eventStore.currentCategory === 'all'">
      <div class="container">
        <h2 class="section-title">Featured Events</h2>

        <div v-if="loading" class="loading">Loading featured events...</div>

        <div v-else-if="error" class="error">{{ error }}</div>

        <div v-else-if="featuredEvents.length === 0" class="no-results">
          No featured events available
        </div>

        <div v-else class="featured__grid">
          <div v-for="event in featuredEvents" :key="event.id" class="featured__item">
            <EventCard :event="event" />
          </div>
        </div>
      </div>
    </section>

    <section class="events">
      <div class="container">
        <h2 class="section-title">
          <span v-if="searchQuery">Search Results</span>
          <span v-else-if="eventStore.currentCategory !== 'all'">
            {{
              eventStore.currentCategory.charAt(0).toUpperCase() +
              eventStore.currentCategory.slice(1)
            }}
            Events
          </span>
          <span v-else>Upcoming Events</span>

          <span v-if="eventStore.events.length > 0" class="events__count"
            >({{ eventStore.events.length }})</span
          >
        </h2>

        <div v-if="loading && eventStore.events.length === 0" class="loading">
          Loading events...
        </div>

        <div v-else-if="error" class="error">{{ error }}</div>

        <div v-else-if="eventStore.events.length === 0" class="no-results">
          <p>No events found</p>
          <button @click="clearFilters" class="no-results__button">Clear filters</button>
        </div>

        <div v-else class="events__grid">
          <div v-for="event in eventStore.events" :key="event.id" class="events__item">
            <EventCard :event="event" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding: 5rem 0;
  background-color: var(--secondary);
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 70% 30%, var(--primary), transparent 70%);
  opacity: 0.1;
  z-index: 1;
}

.hero__content {
  position: relative;
  z-index: 2;
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.hero__title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero__subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
}

.hero__search {
  display: flex;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.hero__search-input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
  height: 60px;
  font-size: 1.1rem;
  padding-left: 1.5rem;
}

.hero__search-button {
  width: 60px;
  height: 60px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero__categories {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero__category-tag {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 30px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 1rem;
}

.hero__category-tag:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.section-title {
  font-size: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.events__count {
  font-size: 1.1rem;
  opacity: 0.7;
  margin-left: 0.5rem;
}

.featured__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 4rem;
}

.events__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  margin-bottom: 4rem;
}

.loading,
.error,
.no-results {
  text-align: center;
  padding: 3rem 0;
  color: rgba(255, 255, 255, 0.7);
}

.error {
  color: var(--error);
}

.no-results__button {
  margin-top: 1rem;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.featured,
.events {
  width: 100%;
}

@media (max-width: 1366px) {
  .events__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .featured__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .events__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 3rem 0;
  }

  .hero__title {
    font-size: 2.5rem;
  }

  .featured__grid,
  .events__grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>

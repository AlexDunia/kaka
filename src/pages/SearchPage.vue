<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '@/stores/events'
import EventCard from '@/components/EventCard.vue'

// Name of component is SearchPage (satisfies multi-word linting rule)

const eventStore = useEventStore()
const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const loading = ref(true)
const error = ref(null)

// Get search query from route query parameter
onMounted(async () => {
  if (route.query.q) {
    searchQuery.value = route.query.q
    await performSearch()
  } else {
    await eventStore.fetchAllEvents()
    loading.value = false
  }
})

// Update URL when search query changes
watch(searchQuery, (newQuery) => {
  if (newQuery) {
    router.push({ query: { q: newQuery } })
  }
})

// Perform search
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    await eventStore.resetFilters()
    router.push({ query: {} })
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
  router.push({ query: {} })
}

// Computed property for results count
const resultsCount = computed(() => eventStore.events.length)
</script>

<template>
  <div class="search-page">
    <section class="search-hero">
      <div class="container">
        <div class="search-hero__content">
          <h1 class="search-hero__title">Search Events</h1>
          <p class="search-hero__subtitle">Find your next unforgettable experience</p>

          <div class="search-hero__search">
            <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="performSearch"
              placeholder="Search events, artists, or venues..."
              class="search-hero__search-input"
            />
            <button @click="performSearch" class="search-hero__search-button">
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

          <div class="search-hero__categories">
            <button @click="clearFilters" class="search-hero__category-tag">All</button>
            <button @click="filterByCategory('music')" class="search-hero__category-tag">
              Music
            </button>
            <button @click="filterByCategory('sports')" class="search-hero__category-tag">
              Sports
            </button>
            <button @click="filterByCategory('theatre')" class="search-hero__category-tag">
              Theatre
            </button>
            <button @click="filterByCategory('movies')" class="search-hero__category-tag">
              Movies
            </button>
            <button @click="filterByCategory('festivals')" class="search-hero__category-tag">
              Festivals
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="search-results">
      <div class="container">
        <div class="search-results__header">
          <h2 class="section-title">
            <span v-if="searchQuery">Search Results for "{{ searchQuery }}"</span>
            <span v-else-if="eventStore.currentCategory !== 'all'">
              {{
                eventStore.currentCategory.charAt(0).toUpperCase() +
                eventStore.currentCategory.slice(1)
              }}
              Events
            </span>
            <span v-else>All Events</span>

            <span v-if="resultsCount > 0" class="search-results__count">({{ resultsCount }})</span>
          </h2>
        </div>

        <div v-if="loading" class="loading">
          <div class="loading__spinner"></div>
          <p>Searching for events...</p>
        </div>

        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="clearFilters" class="error__button">Try again</button>
        </div>

        <div v-else-if="resultsCount === 0" class="no-results">
          <p>No events found matching your search criteria</p>
          <button @click="clearFilters" class="no-results__button">Clear filters</button>
        </div>

        <div v-else class="search-results__grid">
          <div v-for="event in eventStore.events" :key="event.id" class="search-results__item">
            <EventCard :event="event" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.search-page {
  padding-bottom: 60px;
}

.search-hero {
  background: linear-gradient(to right, #1e1e24, #2d2d3a);
  padding: 60px 0;
  margin-bottom: 40px;
}

.search-hero__content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.search-hero__title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: white;
}

.search-hero__subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 32px;
}

.search-hero__search {
  display: flex;
  position: relative;
  margin-bottom: 24px;
}

.search-hero__search-input {
  flex: 1;
  padding: 16px 24px;
  border-radius: 100px;
  border: none;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  width: 100%;
  transition: all 0.3s;
}

.search-hero__search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-hero__search-input:focus {
  background-color: rgba(255, 255, 255, 0.15);
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 105, 180, 0.5);
}

.search-hero__search-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #ff69b4;
  border: none;
  border-radius: 100px;
  height: 42px;
  width: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.search-hero__search-button:hover {
  background-color: #ff5ba7;
}

.search-hero__search-button svg {
  color: white;
}

.search-hero__categories {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.search-hero__category-tag {
  padding: 8px 20px;
  border-radius: 100px;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.search-hero__category-tag:hover {
  background-color: rgba(255, 105, 180, 0.3);
}

.search-results__header {
  margin-bottom: 30px;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
}

.search-results__count {
  font-size: 1.2rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 12px;
}

.search-results__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: rgba(255, 255, 255, 0.8);
}

.loading__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #ff69b4;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error,
.no-results {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.error p,
.no-results p {
  margin-bottom: 24px;
  font-size: 1.1rem;
}

.error__button,
.no-results__button {
  padding: 12px 24px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.error__button:hover,
.no-results__button:hover {
  background-color: #ff5ba7;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .search-hero {
    padding: 40px 0;
  }

  .search-hero__title {
    font-size: 2rem;
  }

  .search-results__grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
}
</style>

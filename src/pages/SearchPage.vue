<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '@/stores/events'
import EventCard from '@/components/EventCard.vue'
import LoadingIndicator from '@/components/LoadingIndicator.vue'
import debug from '@/services/debug'

// Name of component is SearchPage (satisfies multi-word linting rule)

const eventStore = useEventStore()
const route = useRoute()
const router = useRouter()

// Search and filter state
const searchQuery = ref('')
const loading = ref(true)
const error = ref(null)
const showFilters = ref(false)
const appliedFilters = ref(false)

// Selected filters
const selectedCategory = ref('all')
const selectedDateRange = ref({ from: '', to: '' })
const selectedPriceRange = ref({ min: '', max: '' })
const sortOption = ref('event_date_asc')

// Pagination
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(totalResults.value / itemsPerPage.value))
const itemsPerPage = ref(12)

// Search history
const recentSearches = ref(JSON.parse(localStorage.getItem('recentSearches') || '[]'))
const maxRecentSearches = 5

// Animation control
const fadeInDelay = ref(20) // ms between each card animation

// Security - CSRF token will be passed to API calls
const csrfToken = ref(generateCsrfToken())

function generateCsrfToken() {
  // In a real app, this would be generated server-side
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Get all query parameters from URL and apply to filters
onMounted(async () => {
  try {
    // Initialize search from URL params
    if (route.query.q) {
      searchQuery.value = route.query.q
    }

    if (route.query.category) {
      selectedCategory.value = route.query.category
    }

    if (route.query.page) {
      currentPage.value = parseInt(route.query.page) || 1
    }

    if (route.query.sort) {
      sortOption.value = route.query.sort
    }

    if (route.query.date_from) {
      selectedDateRange.value.from = route.query.date_from
    }

    if (route.query.date_to) {
      selectedDateRange.value.to = route.query.date_to
    }

    if (route.query.price_min) {
      selectedPriceRange.value.min = route.query.price_min
    }

    if (route.query.price_max) {
      selectedPriceRange.value.max = route.query.price_max
    }

    // Check if any filters are applied
    appliedFilters.value = hasAppliedFilters()

    // Perform search with all parameters
    await performSearch()
  } catch (err) {
    debug.error('Error during component mount', err)
    error.value = 'Failed to initialize search page. Please try refreshing.'
  } finally {
    loading.value = false
  }
})

// Update URL when search parameters change
watch(
  [searchQuery, selectedCategory, currentPage, sortOption, selectedDateRange, selectedPriceRange],
  async (
    [newQuery, newCategory, newPage, newSort, newDateRange, newPriceRange],
    [oldQuery, oldCategory, oldPage, oldSort, oldDateRange, oldPriceRange],
  ) => {
    // Only update if any of the values actually changed
    if (
      newQuery !== oldQuery ||
      newCategory !== oldCategory ||
      newPage !== oldPage ||
      newSort !== oldSort ||
      newDateRange.from !== oldDateRange.from ||
      newDateRange.to !== oldDateRange.to ||
      newPriceRange.min !== oldPriceRange.min ||
      newPriceRange.max !== oldPriceRange.max
    ) {
      // Skip if it's just initialized
      if (oldQuery === '' && oldCategory === 'all' && oldPage === 1) {
        return
      }

      // Construct query parameters
      const query = {}

      if (newQuery) {
        query.q = newQuery
      }

      if (newCategory && newCategory !== 'all') {
        query.category = newCategory
      }

      if (newPage > 1) {
        query.page = newPage
      }

      if (newSort && newSort !== 'event_date_asc') {
        query.sort = newSort
      }

      if (newDateRange.from) {
        query.date_from = newDateRange.from
      }

      if (newDateRange.to) {
        query.date_to = newDateRange.to
      }

      if (newPriceRange.min) {
        query.price_min = newPriceRange.min
      }

      if (newPriceRange.max) {
        query.price_max = newPriceRange.max
      }

      // Update URL
      router.push({ query })

      // Check if any filters are applied
      appliedFilters.value = hasAppliedFilters()

      // Reset to page 1 when filters change (except when only page changed)
      if (
        newPage === oldPage &&
        (newQuery !== oldQuery ||
          newCategory !== oldCategory ||
          newSort !== oldSort ||
          newDateRange.from !== oldDateRange.from ||
          newDateRange.to !== oldDateRange.to ||
          newPriceRange.min !== oldPriceRange.min ||
          newPriceRange.max !== oldPriceRange.max)
      ) {
        currentPage.value = 1
      }

      // Perform search with all parameters
      await performSearch()
    }
  },
  { deep: true },
)

// Perform search with all parameters
const performSearch = async () => {
  if (!searchQuery.value.trim() && !hasAppliedFilters()) {
    await eventStore.resetFilters()
    router.push({ query: {} })
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null

    // Get sort field and direction from combined sort option
    const [sortField, sortDirection] = sortOption.value.split('_')

    // Construct search parameters
    const searchParams = {
      query: searchQuery.value,
      category: selectedCategory.value !== 'all' ? selectedCategory.value : null,
      page: currentPage.value,
      limit: itemsPerPage.value,
      sort: sortField,
      direction: sortDirection,
      date_from: selectedDateRange.value.from,
      date_to: selectedDateRange.value.to,
      price_min: selectedPriceRange.value.min,
      price_max: selectedPriceRange.value.max,
      csrf: csrfToken.value, // Pass CSRF token to API for security
    }

    debug.log('Performing search with params', searchParams)

    // Call store method with all parameters
    const searchResults = await eventStore.searchEvents(
      searchParams.query,
      searchParams.category,
      searchParams.page,
      searchParams.limit,
      searchParams.sort,
      searchParams.direction,
      searchParams.date_from,
      searchParams.date_to,
      searchParams.price_min,
      searchParams.price_max,
    )

    debug.log('Search results received', {
      count: searchResults?.length || 0,
      totalItems: eventStore.totalItems,
    })

    // Animation delay - reset for new results
    fadeInDelay.value = 20

    // Save search query to recent searches if it exists
    if (searchQuery.value.trim()) {
      addToRecentSearches(searchQuery.value.trim())
    }
  } catch (err) {
    debug.error('Search failed', err)
    error.value = err.message || 'Search failed. Please try again.'
  } finally {
    loading.value = false
  }
}

// Filter events by category
const filterByCategory = async (category) => {
  selectedCategory.value = category
  currentPage.value = 1
}

// Add search to recent searches
const addToRecentSearches = (query) => {
  // Remove this query if it already exists
  const existingIndex = recentSearches.value.indexOf(query)
  if (existingIndex !== -1) {
    recentSearches.value.splice(existingIndex, 1)
  }

  // Add to the beginning
  recentSearches.value.unshift(query)

  // Limit to max items
  if (recentSearches.value.length > maxRecentSearches) {
    recentSearches.value = recentSearches.value.slice(0, maxRecentSearches)
  }

  // Save to localStorage
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
}

// Use a recent search
const useRecentSearch = (query) => {
  searchQuery.value = query
  performSearch()
}

// Clear recent searches
const clearRecentSearches = () => {
  recentSearches.value = []
  localStorage.removeItem('recentSearches')
}

// Clear search and all filters
const clearAllFilters = async () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedDateRange.value = { from: '', to: '' }
  selectedPriceRange.value = { min: '', max: '' }
  sortOption.value = 'event_date_asc'
  currentPage.value = 1

  await eventStore.resetFilters()
  router.push({ query: {} })
  appliedFilters.value = false
}

// Toggle filters visibility
const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

// Check if any filters are applied
const hasAppliedFilters = () => {
  return (
    selectedCategory.value !== 'all' ||
    sortOption.value !== 'event_date_asc' ||
    selectedDateRange.value.from !== '' ||
    selectedDateRange.value.to !== '' ||
    selectedPriceRange.value.min !== '' ||
    selectedPriceRange.value.max !== ''
  )
}

// Handle pagination
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Computed properties
const totalResults = computed(() => eventStore.totalItems || 0)
const results = computed(() => eventStore.events || [])
const resultsCount = computed(() => results.value.length)
const showingResultsText = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(start + resultsCount.value - 1, totalResults.value)
  return `Showing ${start}-${end} of ${totalResults.value} results`
})

// Generate pagination range
const paginationRange = computed(() => {
  const range = []
  const maxVisiblePages = 5

  if (totalPages.value <= maxVisiblePages) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages.value; i++) {
      range.push(i)
    }
  } else {
    // Always show first page
    range.push(1)

    // Calculate start and end of visible range
    let rangeStart = Math.max(2, currentPage.value - 1)
    let rangeEnd = Math.min(totalPages.value - 1, currentPage.value + 1)

    // Adjust to always show 3 pages in middle
    if (rangeEnd - rangeStart < 2) {
      if (currentPage.value < totalPages.value / 2) {
        rangeEnd = Math.min(totalPages.value - 1, rangeStart + 2)
      } else {
        rangeStart = Math.max(2, rangeEnd - 2)
      }
    }

    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      range.push('...')
    }

    // Add middle range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      range.push(i)
    }

    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages.value - 1) {
      range.push('...')
    }

    // Always show last page
    range.push(totalPages.value)
  }

  return range
})

// Sort options
const sortOptions = [
  { value: 'event_date_asc', label: 'Date (Earliest first)' },
  { value: 'event_date_desc', label: 'Date (Latest first)' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
  { value: 'price_asc', label: 'Price (Low to High)' },
  { value: 'price_desc', label: 'Price (High to Low)' },
]

// Category options
const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'art', label: 'Art' },
  { value: 'food', label: 'Food' },
  { value: 'tech', label: 'Tech' },
  { value: 'movies', label: 'Movies' },
  { value: 'festivals', label: 'Festivals' },
]
</script>

<template>
  <div class="search-page">
    <!-- Hero Section with Search Bar -->
    <section class="search-hero">
      <div class="container">
        <div class="search-hero__content">
          <h1 class="search-hero__title">Discover Your Next Experience</h1>
          <p class="search-hero__subtitle">Find events that match your interests and schedule</p>

          <div class="search-hero__search">
            <input
              type="text"
              v-model="searchQuery"
              @keyup.enter="performSearch"
              placeholder="Search for events, artists, venues..."
              class="search-hero__search-input"
              aria-label="Search events"
            />
            <button @click="performSearch" class="search-hero__search-button" aria-label="Search">
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

          <!-- Recent Searches -->
          <div v-if="recentSearches.length > 0" class="recent-searches">
            <div class="recent-searches__header">
              <h3>Recent Searches</h3>
              <button @click="clearRecentSearches" class="clear-button">Clear</button>
            </div>
            <div class="recent-searches__list">
              <button
                v-for="(search, index) in recentSearches"
                :key="index"
                @click="useRecentSearch(search)"
                class="recent-search-item"
              >
                <span class="recent-search-icon">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </span>
                {{ search }}
              </button>
            </div>
          </div>

          <!-- Quick Category Filters -->
          <div class="search-hero__categories">
            <button
              v-for="category in categoryOptions"
              :key="category.value"
              @click="filterByCategory(category.value)"
              class="search-hero__category-tag"
              :class="{ active: selectedCategory === category.value }"
            >
              {{ category.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content with Filters and Results -->
    <section class="search-results">
      <div class="container">
        <div class="search-results__header">
          <div class="search-results__title-wrapper">
            <h2 class="section-title">
              <span v-if="searchQuery">Search Results for "{{ searchQuery }}"</span>
              <span v-else-if="selectedCategory !== 'all'">
                {{ categoryOptions.find((c) => c.value === selectedCategory)?.label }} Events
              </span>
              <span v-else>All Events</span>

              <span v-if="totalResults > 0" class="search-results__count"
                >({{ totalResults }})</span
              >
            </h2>
            <p v-if="totalResults > 0" class="search-results__showing">{{ showingResultsText }}</p>
          </div>

          <div class="search-results__controls">
            <button
              @click="toggleFilters"
              class="filter-toggle-button"
              :class="{ active: showFilters }"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filters
              <span v-if="appliedFilters" class="filter-badge"></span>
            </button>

            <div class="sort-dropdown">
              <label for="sort-select">Sort by:</label>
              <select id="sort-select" v-model="sortOption" class="sort-select">
                <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Advanced Filter Panel -->
        <div v-if="showFilters" class="advanced-filters">
          <div class="advanced-filters__content">
            <div class="filter-section">
              <h3 class="filter-section__title">Category</h3>
              <div class="filter-options">
                <div
                  v-for="category in categoryOptions"
                  :key="category.value"
                  class="filter-option"
                >
                  <input
                    type="radio"
                    :id="`category-${category.value}`"
                    :value="category.value"
                    v-model="selectedCategory"
                    name="category"
                  />
                  <label :for="`category-${category.value}`">{{ category.label }}</label>
                </div>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-section__title">Date Range</h3>
              <div class="date-range-inputs">
                <div class="date-input-group">
                  <label for="date-from">From</label>
                  <input
                    type="date"
                    id="date-from"
                    v-model="selectedDateRange.from"
                    class="date-input"
                  />
                </div>
                <div class="date-input-group">
                  <label for="date-to">To</label>
                  <input
                    type="date"
                    id="date-to"
                    v-model="selectedDateRange.to"
                    class="date-input"
                  />
                </div>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-section__title">Price Range</h3>
              <div class="price-range-inputs">
                <div class="price-input-group">
                  <label for="price-min">Min $</label>
                  <input
                    type="number"
                    id="price-min"
                    v-model="selectedPriceRange.min"
                    class="price-input"
                    placeholder="Min"
                    min="0"
                  />
                </div>
                <div class="price-input-group">
                  <label for="price-max">Max $</label>
                  <input
                    type="number"
                    id="price-max"
                    v-model="selectedPriceRange.max"
                    class="price-input"
                    placeholder="Max"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div class="filter-actions">
              <button @click="clearAllFilters" class="clear-filters-button">
                Clear All Filters
              </button>
              <button @click="performSearch" class="apply-filters-button">Apply Filters</button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <LoadingIndicator size="large" />
          <p>Searching for events...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
          <div class="error-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3>Something went wrong</h3>
          <p>{{ error }}</p>
          <button @click="clearAllFilters" class="retry-button">Try Again</button>
        </div>

        <!-- No Results State -->
        <div v-else-if="totalResults === 0" class="no-results-container">
          <div class="no-results-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 15A7 7 0 0 1 17.55 6.44"></path>
              <line x1="2" y1="2" x2="22" y2="22"></line>
            </svg>
          </div>
          <h3>No matching events found</h3>
          <p>Try adjusting your search criteria or filters</p>
          <button @click="clearAllFilters" class="clear-button">Clear All Filters</button>
        </div>

        <!-- Results Grid -->
        <div v-else class="search-results__grid">
          <div
            v-for="(event, index) in results"
            :key="event.id"
            class="search-results__item"
            :style="{ animationDelay: `${index * fadeInDelay}ms` }"
          >
            <!-- <EventCard :event="event" /> -->
            <!-- Temporarily commented out for debugging -->
            <div>{{ event?.title || 'No Title' }}</div>
            <!-- Simple display for testing -->
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            @click="goToPage(currentPage - 1)"
            class="pagination__arrow"
            :disabled="currentPage === 1"
            aria-label="Previous page"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div class="pagination__pages">
            <button
              v-for="(page, index) in paginationRange"
              :key="index"
              @click="page !== '...' && goToPage(page)"
              class="pagination__page"
              :class="{
                active: page === currentPage,
                ellipsis: page === '...',
              }"
              :disabled="page === '...'"
            >
              {{ page }}
            </button>
          </div>

          <button
            @click="goToPage(currentPage + 1)"
            class="pagination__arrow"
            :disabled="currentPage === totalPages"
            aria-label="Next page"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.search-page {
  padding-bottom: 60px;
  min-height: 100vh;
  color: #fff;
}

/* ===== HERO SECTION ===== */
.search-hero {
  background:
    linear-gradient(135deg, rgba(44, 41, 56, 0.9), rgba(59, 37, 75, 0.9)),
    url('/images/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  padding: 70px 0;
  margin-bottom: 40px;
  position: relative;
  overflow: hidden;
}

.search-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(255, 105, 180, 0.2) 0%, transparent 40%);
  z-index: 0;
}

.search-hero__content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
}

.search-hero__title {
  font-size: 2.75rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: white;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  line-height: 1.2;
}

.search-hero__subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.search-hero__search {
  display: flex;
  position: relative;
  margin-bottom: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-radius: 100px;
  max-width: 90%;
  margin-left: auto;
  margin-right: auto;
}

.search-hero__search-input {
  flex: 1;
  padding: 18px 24px;
  border-radius: 100px;
  border: none;
  background-color: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  font-size: 1.05rem;
  width: 100%;
  transition: all 0.3s;
}

.search-hero__search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-hero__search-input:focus {
  background-color: rgba(255, 255, 255, 0.18);
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.3);
}

.search-hero__search-button {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #ff69b4, #e74c8f);
  border: none;
  border-radius: 100px;
  height: 44px;
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(231, 76, 143, 0.3);
}

.search-hero__search-button:hover {
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 6px 16px rgba(231, 76, 143, 0.4);
}

.search-hero__search-button:active {
  transform: translateY(-50%) scale(0.98);
}

.search-hero__search-button svg {
  color: white;
  stroke-width: 2.5px;
}

/* Recent Searches */
.recent-searches {
  margin-bottom: 24px;
  background-color: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 14px 20px;
  max-width: 80%;
  margin-left: auto;
  margin-right: auto;
}

.recent-searches__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.recent-searches__header h3 {
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clear-button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.recent-searches__list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.recent-search-item {
  background-color: rgba(255, 255, 255, 0.12);
  border: none;
  padding: 6px 12px;
  border-radius: 100px;
  color: white;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.recent-search-item:hover {
  background-color: rgba(255, 255, 255, 0.22);
}

.recent-search-icon {
  margin-right: 6px;
  opacity: 0.7;
}

/* Category Tags */
.search-hero__categories {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}

.search-hero__category-tag {
  padding: 10px 20px;
  border-radius: 100px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.search-hero__category-tag:hover {
  background-color: rgba(255, 105, 180, 0.15);
  border-color: rgba(255, 105, 180, 0.3);
  transform: translateY(-2px);
}

.search-hero__category-tag.active {
  background-color: rgba(255, 105, 180, 0.25);
  border-color: rgba(255, 105, 180, 0.5);
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.2);
}

/* ===== SEARCH RESULTS SECTION ===== */
.search-results {
  position: relative;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-results__header {
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
}

.search-results__title-wrapper {
  flex-grow: 1;
}

.section-title {
  font-size: 1.9rem;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  color: white;
}

.search-results__count {
  font-size: 1.2rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 12px;
}

.search-results__showing {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-top: 4px;
}

.search-results__controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.filter-toggle-button {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.filter-toggle-button:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.filter-toggle-button.active {
  background-color: rgba(255, 105, 180, 0.15);
  border-color: rgba(255, 105, 180, 0.3);
}

.filter-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  background-color: #ff69b4;
  border-radius: 50%;
}

.sort-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-dropdown label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
}

.sort-select {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  min-width: 200px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  padding-right: 36px;
}

.sort-select:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.sort-select:focus {
  outline: none;
  border-color: rgba(255, 105, 180, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 105, 180, 0.2);
}

/* Advanced Filters Panel */
.advanced-filters {
  margin-bottom: 30px;
  background-color: rgba(35, 35, 45, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
  animation: slideDown 0.3s ease-out;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.advanced-filters__content {
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.filter-section {
  display: flex;
  flex-direction: column;
}

.filter-section__title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: white;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-option input[type='radio'] {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  margin: 0;
  position: relative;
  cursor: pointer;
}

.filter-option input[type='radio']:checked {
  border-color: #ff69b4;
}

.filter-option input[type='radio']:checked::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 8px;
  height: 8px;
  background-color: #ff69b4;
  border-radius: 50%;
}

.filter-option label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  cursor: pointer;
}

.date-range-inputs,
.price-range-inputs {
  display: flex;
  gap: 15px;
}

.date-input-group,
.price-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-input-group label,
.price-input-group label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.date-input,
.price-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background-color: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.date-input:focus,
.price-input:focus {
  outline: none;
  border-color: rgba(255, 105, 180, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 105, 180, 0.2);
}

.filter-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 15px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.clear-filters-button {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filters-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.apply-filters-button {
  padding: 10px 22px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #ff69b4, #e74c8f);
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(231, 76, 143, 0.3);
}

.apply-filters-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(231, 76, 143, 0.4);
}

.apply-filters-button:active {
  transform: translateY(0);
}

/* Search Results Grid */
.search-results__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.search-results__item {
  animation: fadeIn 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading Container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

/* Error Container */
.error-container,
.no-results-container {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  padding: 40px 20px;
}

.error-icon,
.no-results-icon {
  margin-bottom: 20px;
  color: rgba(255, 105, 180, 0.7);
}

.error-container h3,
.no-results-container h3 {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: white;
}

.error-container p,
.no-results-container p {
  margin-bottom: 24px;
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 500px;
}

.retry-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #ff69b4, #e74c8f);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(231, 76, 143, 0.3);
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(231, 76, 143, 0.4);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  gap: 8px;
}

.pagination__arrow {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.08);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination__arrow:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.pagination__arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__pages {
  display: flex;
  gap: 6px;
}

.pagination__page {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.08);
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination__page:hover:not(.active, .ellipsis) {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.pagination__page.active {
  background-color: rgba(255, 105, 180, 0.25);
  border-color: rgba(255, 105, 180, 0.5);
  font-weight: 600;
}

.pagination__page.ellipsis {
  cursor: default;
}

/* Responsive Styles */
@media (max-width: 1024px) {
  .search-hero__title {
    font-size: 2.25rem;
  }

  .advanced-filters__content {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .search-hero {
    padding: 50px 0;
  }

  .search-hero__title {
    font-size: 1.9rem;
  }

  .search-hero__subtitle {
    font-size: 1.1rem;
  }

  .search-results__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-results__controls {
    width: 100%;
    justify-content: space-between;
  }

  .sort-select {
    min-width: 0;
    flex: 1;
  }

  .search-results__grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 640px) {
  .search-hero__title {
    font-size: 1.75rem;
  }

  .search-hero__categories {
    gap: 8px;
  }

  .search-hero__category-tag {
    padding: 8px 16px;
    font-size: 0.85rem;
  }

  .search-results__grid {
    grid-template-columns: 1fr;
  }

  .advanced-filters__content {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .sort-dropdown label {
    display: none;
  }
}
</style>

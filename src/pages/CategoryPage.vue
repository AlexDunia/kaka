<script setup>
import { ref, onMounted, onUnmounted, computed, watch, inject } from 'vue'
import { useEventStore } from '@/stores/events'
import EventCard from '@/components/EventCard.vue'
import { useLoading } from '@/composables/useLoading'
import { useSeo } from '@/composables/useSeo'
import { getRushHourLogo } from '@/constants/brand'

const props = defineProps({
  category: {
    type: String,
    required: true,
  },
})

const eventStore = useEventStore()
const themeController = inject('themeController', null)

// Use our loading composable with safety timeouts
const { isLoading: loading, startLoading } = useLoading({ initialState: false })
const {
  isLoading: initialLoad,
  startLoading: startInitialLoading,
  stopLoading: stopInitialLoading,
} = useLoading()

// Add loading state safety
const safetyTimer = ref(null)
const ensureLoadingCompletes = () => {
  // Clear any existing safety timer
  if (safetyTimer.value) {
    clearTimeout(safetyTimer.value)
  }

  // Set a new safety timer to ensure loading states don't hang
  safetyTimer.value = setTimeout(() => {
    if (initialLoad.value) {
      console.warn('Safety timeout: forcing initial load to complete')
      stopInitialLoading()
    }
    if (loading.value) {
      console.warn('Safety timeout: forcing loading to complete')
      loading.value = false
    }
  }, 5000) // 5 second safety
}

const error = ref(null)
const currentPage = ref(1)
const theme = computed(() => themeController?.theme?.value || 'dark')
const brandLogoUrl = computed(() => getRushHourLogo(theme.value))

// Get the SEO utilities
const { updatePageTitle, updateMetaDescription, updateSocialMeta } = useSeo()

// Add error handling utilities
const showError = (message) => {
  error.value = message
}

// Safety timeouts
const setupSafetyTimeouts = () => {
  // Force loading states to complete after timeout
  setTimeout(() => {
    if (initialLoad.value) {
      console.warn('Safety timeout: forcing initial load to complete')
      stopInitialLoading()
    }
    if (loading.value) {
      console.warn('Safety timeout: forcing loading to complete')
      loading.value = false
    }
  }, 5000) // 5 second safety
}

// Load events for category
const loadEvents = async (categoryParam) => {
  loading.value = true
  error.value = null

  try {
    await eventStore.fetchEventsByCategory(categoryParam)

    if (eventStore.events.length === 0) {
      error.value = `No events found for category: ${categoryParam}`
    }
  } catch (err) {
    error.value = err.message || 'Failed to load events'
  } finally {
    loading.value = false
  }
}

// Initial load
const loadInitialData = async () => {
  try {
    await startInitialLoading(() => loadEvents(props.category))
  } catch (e) {
    error.value = e.message || 'Failed to load initial data'
  }
}

// Watch for category changes
watch(
  () => props.category,
  async (newCategory) => {
    try {
      if (newCategory) {
        await loadEvents(newCategory)
      }
    } catch (e) {
      error.value = e.message || 'Failed to load category'
    }
  },
)

// Load data on mount
onMounted(async () => {
  setupSafetyTimeouts()
  await loadInitialData()
})

// Watch for page changes
watch(
  () => currentPage.value,
  async () => {
    ensureLoadingCompletes()

    try {
      await startLoading(() => loadEvents(props.category))
    } catch (e) {
      console.error('Error loading page:', e)
      loading.value = false // Ensure we stop showing the skeleton
    }
  },
)

// Cleanup safety timer on component unmount
onUnmounted(() => {
  if (safetyTimer.value) {
    clearTimeout(safetyTimer.value)
  }
})

// Handle page navigation
const goToPage = (page) => {
  currentPage.value = page
  // Scroll to top when changing pages
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Computed properties
const categoryTitle = computed(() => {
  return props.category.charAt(0).toUpperCase() + props.category.slice(1)
})

const categoryDescription = computed(() => {
  const descriptions = {
    music: 'Browse and book tickets for the hottest concerts and music festivals.',
    movies: 'Find screenings and premieres for the latest blockbusters and indie films.',
    theatre: 'Discover amazing theatrical performances and comedy shows.',
    sports: 'Get tickets to exciting sporting events and championships.',
    festivals: 'Experience the best festivals for food, culture, and entertainment.',
    others: "Explore other unique events that don't fit traditional categories.",
  }

  return descriptions[props.category] || 'Browse events in this category.'
})

const categoryImage = computed(() => {
  const images = {
    music:
      'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747097418/music-category_f6fy9i.jpg',
    movies:
      'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747097418/movies-category_w2sn0t.jpg',
    theatre:
      'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747097418/theatre-category_gx8jfo.jpg',
    sports:
      'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747097417/sports-category_zmpzhs.jpg',
    festivals:
      'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747097418/festivals-category_azddzu.jpg',
    others:
      'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747097418/others-category_qhjofb.jpg',
  }

  return (
    images[props.category] ||
    'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747097418/others-category_qhjofb.jpg'
  )
})

const categoryColor = computed(() => {
  const colors = {
    music: { from: '#1DB954', to: '#116e32' }, // Spotify green
    movies: { from: '#E50914', to: '#831010' }, // Netflix red
    theatre: { from: '#FF5F6D', to: '#9b3642' }, // Pink/Magenta
    sports: { from: '#3A86FF', to: '#1c428a' }, // Vibrant blue
    festivals: { from: '#FF9E00', to: '#8f5700' }, // Orange
    others: { from: '#8E44AD', to: '#532865' }, // Purple
  }

  return colors[props.category] || { from: '#8E44AD', to: '#532865' }
})

// Category-specific images for better social sharing
const categoryImages = {
  music: 'https://example.com/images/music-category.jpg',
  movies: 'https://example.com/images/movies-category.jpg',
  theatre: 'https://example.com/images/theatre-category.jpg',
  sports: 'https://example.com/images/sports-category.jpg',
  festivals: 'https://example.com/images/festivals-category.jpg',
  others: 'https://example.com/images/others-category.jpg',
}

// Add a watch for the category prop to update SEO
watch(
  () => props.category,
  (newCategory) => {
    if (newCategory) {
      const formattedCategory = newCategory.charAt(0).toUpperCase() + newCategory.slice(1)
      const title = `${formattedCategory} Events`
      const description = `Find and book tickets for the best ${newCategory} events near you.`

      // Update page title
      updatePageTitle(title)

      // Update meta description
      updateMetaDescription(description)

      // Update social sharing metadata
      updateSocialMeta({
        title: `${title} | Kaka`,
        description: description,
        url: window.location.href,
        // Use a category-specific image if available, otherwise use default
        image: categoryImages[newCategory] || brandLogoUrl.value,
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="category-page">
    <template v-if="initialLoad">
      <div class="category-skeleton" aria-hidden="true">
        <section class="category-skeleton__hero">
          <div class="container">
            <div class="category-skeleton__hero-panel">
              <div class="category-skeleton__block category-skeleton__eyebrow"></div>
              <div class="category-skeleton__block category-skeleton__title"></div>
              <div class="category-skeleton__block category-skeleton__copy"></div>
              <div
                class="category-skeleton__block category-skeleton__copy category-skeleton__copy--short"
              ></div>
            </div>
          </div>
        </section>

        <div class="container">
          <section class="category-events">
            <div class="category-skeleton__grid">
              <article
                v-for="card in 3"
                :key="`initial-category-card-${card}`"
                class="category-skeleton__card"
              >
                <div class="category-skeleton__block category-skeleton__media"></div>
                <div class="category-skeleton__card-body">
                  <div class="category-skeleton__block category-skeleton__card-title"></div>
                  <div class="category-skeleton__block category-skeleton__line"></div>
                  <div
                    class="category-skeleton__block category-skeleton__line category-skeleton__line--short"
                  ></div>
                  <div class="category-skeleton__footer">
                    <div class="category-skeleton__block category-skeleton__price"></div>
                    <div class="category-skeleton__block category-skeleton__button"></div>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>

    <template v-else>
      <div
        class="category-hero"
        :style="{
          backgroundImage: `url(${categoryImage})`,
          '--category-accent': categoryColor.from,
        }"
      >
        <div class="container">
          <div class="category-hero__content">
            <p class="category-hero__eyebrow">{{ categoryTitle }}</p>
            <h1 class="category-hero__title">{{ categoryTitle }} Events</h1>
            <p class="category-hero__description">{{ categoryDescription }}</p>
          </div>
        </div>
      </div>

      <div class="container">
        <section class="category-events">
          <div v-if="loading" class="category-events__content">
            <div class="category-skeleton__grid category-skeleton__grid--inline" aria-hidden="true">
              <article
                v-for="card in 3"
                :key="`category-refresh-card-${card}`"
                class="category-skeleton__card"
              >
                <div class="category-skeleton__block category-skeleton__media"></div>
                <div class="category-skeleton__card-body">
                  <div class="category-skeleton__block category-skeleton__card-title"></div>
                  <div class="category-skeleton__block category-skeleton__line"></div>
                  <div
                    class="category-skeleton__block category-skeleton__line category-skeleton__line--short"
                  ></div>
                  <div class="category-skeleton__footer">
                    <div class="category-skeleton__block category-skeleton__price"></div>
                    <div class="category-skeleton__block category-skeleton__button"></div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div v-else-if="error" class="category-events__error">
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
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{{ error }}</p>
          </div>

          <div v-else-if="eventStore.events.length === 0" class="category-events__empty">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <p>No {{ props.category }} events found at the moment.</p>
            <p>Please check back later or explore other categories.</p>
          </div>

          <div v-else class="category-events__content">
            <div class="category-events__grid">
              <div v-for="event in eventStore.events" :key="event.id" class="category-events__item">
                <EventCard :event="event" />
              </div>
            </div>

            <!-- Pagination controls -->
            <div class="pagination" v-if="eventStore.totalPages > 1">
              <button
                class="pagination__btn"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Previous</span>
              </button>

              <div class="pagination__pages">
                <button
                  v-for="page in eventStore.totalPages"
                  :key="page"
                  class="pagination__page"
                  :class="{ 'pagination__page--active': page === currentPage }"
                  @click="goToPage(page)"
                  :style="
                    page === currentPage
                      ? {
                          backgroundColor: categoryColor.from,
                          borderColor: categoryColor.from,
                        }
                      : {}
                  "
                >
                  {{ page }}
                </button>
              </div>

              <button
                class="pagination__btn"
                :disabled="currentPage === eventStore.totalPages"
                @click="goToPage(currentPage + 1)"
              >
                <span>Next</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.category-page {
  width: 100%;
  overflow-x: hidden;
}

.category-skeleton {
  width: 100%;
}

.category-skeleton__hero {
  position: relative;
  padding: 7rem 0 4.25rem;
  margin-bottom: 3rem;
  background: var(--color-skeleton-surface);
  border-bottom: 1px solid var(--color-skeleton-border);
  overflow: hidden;
}

.category-skeleton__hero-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  width: min(100%, 680px);
}

.category-skeleton__block {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: var(--color-skeleton-base);
}

.category-skeleton__block::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, var(--color-skeleton-highlight), transparent);
  animation: categorySkeletonShimmer 1.45s ease-in-out infinite;
}

.category-skeleton__eyebrow {
  width: 108px;
  height: 12px;
  border-radius: 999px;
}

.category-skeleton__title {
  width: min(78%, 480px);
  height: 56px;
}

.category-skeleton__copy {
  width: min(82%, 560px);
  height: 18px;
}

.category-skeleton__copy--short {
  width: min(58%, 390px);
}

.category-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
}

.category-skeleton__grid--inline {
  margin-bottom: 0;
}

.category-skeleton__card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-skeleton-border);
  border-radius: 16px;
  background: var(--color-skeleton-surface);
}

.category-skeleton__media {
  width: 100%;
  height: 220px;
  border-radius: 0;
}

.category-skeleton__card-body {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.25rem;
}

.category-skeleton__card-title {
  width: 78%;
  height: 24px;
}

.category-skeleton__line {
  width: 100%;
  height: 14px;
}

.category-skeleton__line--short {
  width: 62%;
}

.category-skeleton__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.35rem;
}

.category-skeleton__price {
  width: 92px;
  height: 22px;
}

.category-skeleton__button {
  width: 96px;
  height: 36px;
  border-radius: 999px;
}

@keyframes categorySkeletonShimmer {
  to {
    transform: translateX(100%);
  }
}

.category-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: clamp(330px, 42vw, 470px);
  padding: 6rem 0 4rem;
  margin-bottom: 3rem;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.category-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.66);
}

.category-hero::after {
  content: '';
  position: absolute;
  left: max(1rem, calc((100vw - 1200px) / 2 + 1rem));
  right: max(1rem, calc((100vw - 1200px) / 2 + 1rem));
  bottom: 0;
  height: 4px;
  background: var(--category-accent, var(--color-primary));
  border-radius: 999px 999px 0 0;
}

.category-hero__content {
  position: relative;
  z-index: 2;
  width: min(100%, 680px);
}

.category-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  margin: 0 0 0.85rem;
  color: var(--category-accent, var(--color-primary));
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.category-hero__title {
  color: #fff;
  font-size: clamp(2.6rem, 7vw, 5.4rem);
  font-weight: 800;
  line-height: 0.95;
  margin-bottom: 1.25rem;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.category-hero__description {
  max-width: 600px;
  margin: 0;
  font-size: 1.08rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  font-weight: 400;
}

.category-events {
  position: relative;
  z-index: 5;
  margin-bottom: 2rem;
}

.category-events__content {
  animation: fadeIn 0.4s ease-in-out;
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

.category-events__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
}

.category-events__item {
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.category-events__item:hover {
  transform: translateY(-8px);
}

.category-events__loading,
.category-events__error,
.category-events__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 5rem 0;
  color: rgba(255, 255, 255, 0.7);
  gap: 1.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #e04e95;
  animation: spin 1s ease infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.category-events__error {
  color: #ff5757;
}

.category-events__error svg,
.category-events__empty svg {
  opacity: 0.7;
  margin-bottom: 1rem;
}

.category-events__empty {
  line-height: 1.5;
}

.category-events__empty p:first-of-type {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* Pagination styles */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin: 3rem 0;
}

.pagination__btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  padding: 0.7rem 1.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.pagination__btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.pagination__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination__pages {
  display: flex;
  gap: 0.75rem;
}

.pagination__page {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.pagination__page:hover:not(.pagination__page--active) {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.pagination__page--active {
  background-color: #e04e95;
  color: #fff;
  border-color: #e04e95;
  transform: scale(1.1);
  box-shadow: 0 5px 15px rgba(224, 78, 149, 0.4);
}

@media (max-width: 1024px) {
  .category-skeleton__grid,
  .category-events__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .category-hero {
    min-height: 330px;
    padding: 4.5rem 0 3rem;
  }

  .category-hero__content {
    margin: 0;
  }

  .category-hero__title {
    font-size: clamp(2.4rem, 13vw, 3.8rem);
  }

  .category-hero__description {
    font-size: 1.1rem;
  }

  .category-skeleton__hero {
    padding: 4.5rem 0 3rem;
  }

  .category-skeleton__hero-panel {
    margin: 0;
  }

  .category-skeleton__title {
    height: 42px;
  }

  .category-skeleton__grid,
  .category-events__grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .pagination__btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }

  .pagination__page {
    width: 36px;
    height: 36px;
  }
}

/* Five-column desktop event grid */
.category-skeleton__grid,
.category-events__grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 1100px) {
  .category-skeleton__grid,
  .category-events__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .category-skeleton__grid,
  .category-events__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .category-skeleton__grid,
  .category-events__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 440px) {
  .category-skeleton__grid,
  .category-events__grid {
    grid-template-columns: 1fr;
  }
}

/* Wider five-card canvas with clearer row separation */
.category-page .container {
  max-width: 1320px;
  padding-inline: 24px;
}

.category-skeleton__grid,
.category-events__grid {
  column-gap: 18px;
  row-gap: 34px;
}

@media (max-width: 640px) {
  .category-skeleton__grid,
  .category-events__grid {
    grid-template-columns: 1fr;
  }
}

/* Four-column desktop grid */
.category-skeleton__grid,
.category-events__grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
/* Match the global header alignment rail exactly */
.category-page .container {
  width: 100%;
  max-width: 1320px;
  padding-inline: clamp(16px, 1.8vw, 24px);
}
</style>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useEventStore } from '@/stores/events'
import EventCard from '@/components/EventCard.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useSeo } from '@/composables/useSeo'
import { useRoute } from 'vue-router'

const props = defineProps({
  category: {
    type: String,
    required: false,
  },
})

const eventStore = useEventStore()
const route = useRoute()

// State
const events = ref([])
const currentCategory = ref(null)
const error = ref(null)
const loading = ref(false)
const currentPage = ref(1)
const skeletonColor = ref('rgba(255, 255, 255, 0.08)') // Subtle gray skeleton color

// SEO
const { updatePageTitle, updateMetaDescription, updateSocialMeta } = useSeo()

// Update SEO meta tags
const updateSeo = () => {
  const categoryName = currentCategory.value || 'All Events'
  updatePageTitle(`${categoryName} Events in Nigeria`)
  updateMetaDescription(
    `Browse and book tickets for ${categoryName} events in Nigeria. Find the best ${categoryName.toLowerCase()} events near you.`,
  )
  updateSocialMeta({
    title: `${categoryName} Events - KakaWorld`,
    description: `Discover amazing ${categoryName.toLowerCase()} events in Nigeria`,
    image: '/images/events-social.jpg',
  })
}

const loadEvents = async () => {
  loading.value = true
  error.value = null

  try {
    const categoryParam = props.category || route.params.category
    const response = await eventStore.fetchEventsByCategory(categoryParam, true)
    events.value = response
    updateSeo()
  } catch (err) {
    error.value = err.message || 'Failed to load events'
  } finally {
    loading.value = false
  }
}

const loadCategory = async () => {
  try {
    const categoryParam = props.category || route.params.category
    currentCategory.value = categoryParam
  } catch {
    error.value = 'Failed to load category'
  }
}

const loadPage = async () => {
  try {
    await loadCategory()
    await loadEvents()
  } catch {
    error.value = 'Failed to load page'
  }
}

// Watch for category changes
watch(
  () => props.category || route.params.category,
  async () => {
    await loadPage()
  },
)

// Load data on mount
onMounted(async () => {
  await loadPage()
})

// Handle page navigation
const goToPage = async (page) => {
  currentPage.value = page
  await loadEvents()
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
        image:
          categoryImages[newCategory] ||
          'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747056280/tdlogowhite_fvgocv.png',
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="category-page">
    <!-- Skeleton Hero Banner when loading -->
    <div v-if="loading" class="skeleton-hero-container">
      <SkeletonLoader type="banner" :color="skeletonColor" />
    </div>

    <!-- Actual Hero Content -->
    <div
      v-else
      class="category-hero"
      :style="{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(18, 18, 24, 0.95)), url(${categoryImage})`,
      }"
    >
      <div
        class="category-hero__gradient"
        :style="{
          background: `linear-gradient(120deg, ${categoryColor.from}40, ${categoryColor.to}60)`,
        }"
      ></div>
      <div class="container">
        <div class="category-hero__content">
          <h1 class="category-hero__title">{{ categoryTitle }} Events</h1>
          <p class="category-hero__description">{{ categoryDescription }}</p>
        </div>
      </div>
    </div>

    <div class="container">
      <section class="category-events">
        <!-- Loading skeleton for events -->
        <div v-if="loading" class="category-events__content">
          <SkeletonLoader type="grid" :color="skeletonColor" :count="3" />
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
  </div>
</template>

<style scoped>
.category-page {
  width: 100%;
  overflow-x: hidden;
}

/* Skeleton specific styles */
.skeleton-hero-container {
  padding: 0 1rem;
  margin-bottom: 3rem;
}

.category-hero {
  position: relative;
  padding: 8rem 0 5rem;
  margin-bottom: 3rem;
  background-size: cover;
  background-position: center;
  text-align: center;
  overflow: hidden;
}

.category-hero__gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.75;
  mix-blend-mode: overlay;
  z-index: 1;
}

.category-hero__content {
  position: relative;
  z-index: 2;
  background: rgba(18, 18, 24, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 3rem;
  border-radius: 16px;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.category-hero__title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.03em;
  background: linear-gradient(180deg, #fff, rgba(255, 255, 255, 0.7));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.category-hero__description {
  max-width: 600px;
  margin: 0 auto;
  font-size: 1.25rem;
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
  .category-events__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .category-hero {
    padding: 5rem 0 3rem;
  }

  .category-hero__content {
    padding: 2rem;
    margin: 0 1rem;
  }

  .category-hero__title {
    font-size: 2.5rem;
  }

  .category-hero__description {
    font-size: 1.1rem;
  }

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
</style>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useEventStore } from '@/stores/events'
import EventCard from '@/components/EventCard.vue'

const props = defineProps({
  category: {
    type: String,
    required: true,
  },
})

const eventStore = useEventStore()

const loading = ref(true)
const error = ref(null)

// Load events on mount
onMounted(async () => {
  await loadEvents()
})

// Watch for category changes from route
watch(
  () => props.category,
  async () => {
    await loadEvents()
  },
)

// Load events by category
const loadEvents = async () => {
  try {
    loading.value = true
    error.value = null
    await eventStore.fetchEventsByCategory(props.category)
  } catch (err) {
    error.value = err.message || `Failed to load ${props.category} events`
  } finally {
    loading.value = false
  }
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
    music: 'https://placehold.co/1200x400?text=Music+Events',
    movies: 'https://placehold.co/1200x400?text=Movie+Events',
    theatre: 'https://placehold.co/1200x400?text=Theatre+Events',
    sports: 'https://placehold.co/1200x400?text=Sports+Events',
    festivals: 'https://placehold.co/1200x400?text=Festival+Events',
    others: 'https://placehold.co/1200x400?text=Other+Events',
  }

  return images[props.category] || 'https://placehold.co/1200x400?text=Events'
})
</script>

<template>
  <div class="category-page">
    <div
      class="category-hero"
      :style="{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${categoryImage})`,
      }"
    >
      <div class="container">
        <h1 class="category-hero__title">{{ categoryTitle }} Events</h1>
        <p class="category-hero__description">{{ categoryDescription }}</p>
      </div>
    </div>

    <div class="container">
      <section class="category-events">
        <div v-if="loading" class="category-events__loading">Loading events...</div>

        <div v-else-if="error" class="category-events__error">
          {{ error }}
        </div>

        <div v-else-if="eventStore.events.length === 0" class="category-events__empty">
          <p>No {{ props.category }} events found at the moment.</p>
          <p>Please check back later or explore other categories.</p>
        </div>

        <div v-else class="category-events__grid">
          <div v-for="event in eventStore.events" :key="event.id" class="category-events__item">
            <EventCard :event="event" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.category-hero {
  padding: 5rem 0;
  margin-bottom: 3rem;
  background-size: cover;
  background-position: center;
  text-align: center;
}

.category-hero__title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.category-hero__description {
  max-width: 600px;
  margin: 0 auto;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.category-events__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.category-events__loading,
.category-events__error,
.category-events__empty {
  text-align: center;
  padding: 3rem 0;
  color: rgba(255, 255, 255, 0.7);
}

.category-events__error {
  color: var(--error);
}

.category-events__empty {
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .category-events__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .category-hero {
    padding: 3rem 0;
  }

  .category-hero__title {
    font-size: 2rem;
  }

  .category-events__grid {
    grid-template-columns: 1fr;
  }
}
</style>
 
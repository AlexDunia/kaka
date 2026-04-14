<script setup>
import { RouterLink } from 'vue-router'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useEventStore } from '@/stores/events'
import { useSlug } from '@/composables/useSlug'

const eventStore = useEventStore()
const { getEventUrl } = useSlug()

const defaultSlides = [
  {
    id: 'default-fireboy',
    title: 'Fireboy DML Live In Lagos',
    subtitle: 'Experience afro-fusion and energy the city deserves',
    image: 'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747162284/kakalink_elyn4g.jpg',
    link: '/',
  },
  {
    id: 'default-soundcity',
    title: 'Sound City Festival',
    subtitle: 'The biggest weekend of music and culture in Lagos',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    link: '/',
  },
  {
    id: 'default-elevate',
    title: 'Elevate Live Sessions',
    subtitle: 'Curated pop-ups featuring the next big stars',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
    link: '/',
  },
]

const currentSlide = ref(0)
const searchTerm = ref(eventStore.searchQuery || '')
const slideInterval = ref(null)
const expandedSlideId = ref(null)
const heroTitleWordLimit = 10

const heroSlides = computed(() => {
  if (eventStore.featuredEvents && eventStore.featuredEvents.length) {
    return [...eventStore.featuredEvents]
      .sort((a, b) => b.id - a.id)
      .map((event) => {
        const image =
          event.main_image ||
          event.hero_image ||
          event.banner ||
          event.image ||
          defaultSlides[0].image

        return {
          id: event.id,
          title: event.title || 'Untitled Event',
          subtitle: event.address?.venue_name || event.location || '',
          image,
          link: getEventUrl(event),
        }
      })
  }

  return defaultSlides
})

const toggleTitleExpansion = (slideId) => {
  expandedSlideId.value = expandedSlideId.value === slideId ? null : slideId
}

const isTitleExpanded = (slideId) => expandedSlideId.value === slideId

const shouldCollapseTitle = (slide) => {
  if (!slide?.title) return false
  const words = slide.title.trim().split(/\s+/)
  return words.length > heroTitleWordLimit
}

const handleHeroSearch = async () => {
  const trimmed = searchTerm.value.trim()
  try {
    if (!trimmed) {
      await eventStore.resetFilters()
      searchTerm.value = ''
      return
    }

    await eventStore.searchEvents(trimmed)
  } catch (err) {
    console.error('Hero search failed', err)
  }
}

watch(
  () => eventStore.searchQuery,
  (value) => {
    searchTerm.value = value || ''
  },
  { immediate: true },
)

watch(
  heroSlides,
  (slides) => {
    if (slides.length === 0) {
      currentSlide.value = 0
      return
    }

    if (currentSlide.value >= slides.length) {
      currentSlide.value = 0
    }
  },
  { immediate: true },
)

onMounted(() => {
  slideInterval.value = window.setInterval(() => {
    if (!heroSlides.value.length) return
    currentSlide.value = (currentSlide.value + 1) % heroSlides.value.length
  }, 6000)
})

onUnmounted(() => {
  if (slideInterval.value) {
    clearInterval(slideInterval.value)
  }
})
</script>

<template>
  <section class="hero-section">
    <div
      v-for="(slide, index) in heroSlides"
      :key="slide.id"
      class="hero-slide"
      :class="{ active: index === currentSlide }"
      :style="{
        backgroundImage: `linear-gradient(180deg, rgba(5,5,5,0.4), rgba(5,5,5,0.85)), url(${slide.image})`,
      }"
    >
      <div class="hero-overlay">
        <div class="hero-body">
          <p class="hero-label">Now Showing</p>
          <div class="hero-title-wrapper">
            <RouterLink v-if="slide.link" :to="slide.link" class="hero-title-link">
              <h1
                class="hero-title"
                :class="{
                  'hero-title--clamped': shouldCollapseTitle(slide) && !isTitleExpanded(slide.id),
                }"
                :title="slide.title"
              >
                {{ slide.title }}
              </h1>
            </RouterLink>
            <h1
              v-else
              class="hero-title"
              :class="{
                'hero-title--clamped': shouldCollapseTitle(slide) && !isTitleExpanded(slide.id),
              }"
            >
              {{ slide.title }}
            </h1>
            <button
              v-if="shouldCollapseTitle(slide)"
              type="button"
              class="hero-title-toggle"
              @click="toggleTitleExpansion(slide.id)"
              :aria-expanded="isTitleExpanded(slide.id)"
            >
              {{ isTitleExpanded(slide.id) ? 'Show less' : 'Show more' }}
            </button>
          </div>
          <p v-if="slide.subtitle" class="hero-subtitle">{{ slide.subtitle }}</p>
        </div>
      </div>
    </div>

    <div class="hero-search">
      <div class="search-field">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M11 18a7 7 0 1 1 4.9-2.1l4.6 4.6-1.4 1.4-4.6-4.6A7 7 0 0 1 11 18z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
        <input
          v-model="searchTerm"
          class="search-input"
          type="text"
          placeholder="Search for events, artists, or venues"
          @keyup.enter="handleHeroSearch"
          aria-label="Search events"
        />
        <button type="button" class="search-submit" @click="handleHeroSearch" aria-label="Search">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              d="M11 18a7 7 0 1 1 4.9-2.1l4.6 4.6-1.4 1.4-4.6-4.6A7 7 0 0 1 11 18z"
              fill="#fff"
              stroke="none"
            />
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  min-height: 72vh;
  margin-bottom: 50px;
  overflow: hidden;
  border-radius: 24px;
}

.hero-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 1s ease;
}

.hero-slide.active {
  opacity: 1;
  z-index: 1;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.25));
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 60px clamp(20px, 4vw, 80px) 160px;
}

.hero-body {
  width: min(520px, 85vw);
  max-width: 520px;
  text-align: left;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero-label {
  font-size: 0.75rem;
  letter-spacing: 0.4rem;
  text-transform: uppercase;
  margin: 0;
  color: rgba(255, 255, 255, 0.75);
}

.hero-title-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero-title {
  font-size: clamp(2.4rem, 4vw, 4rem);
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.1;
  width: 100%;
  word-break: break-word;
}

.hero-title--clamped {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-title-link {
  text-decoration: none;
  color: inherit;
}

.hero-title-toggle {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0;
  width: fit-content;
}

.hero-title-toggle:hover {
  color: #f061a5;
}

.hero-subtitle {
  margin: 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  max-width: 460px;
}

.hero-search {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: min(920px, 92%);
  z-index: 4;
}

.search-field {
  position: relative;
  background: rgba(37, 35, 45, 0.4);
  border-radius: 32px;
  padding: 18px 24px 18px 60px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.45);
}

.search-field::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.search-icon {
  position: absolute;
  left: 24px;
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.6);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  line-height: 1.4;
  outline: none;
  caret-color: #f061a5;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.search-submit {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ed6fb0, #a44bd0);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.search-submit svg {
  width: 18px;
  height: 18px;
}

.search-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

@media (max-width: 768px) {
  .hero-overlay {
    padding: 40px 20px 140px;
  }

  .hero-search {
    bottom: 24px;
  }
}

@media (max-width: 576px) {
  .hero-section {
    min-height: 65vh;
  }

  .hero-search {
    bottom: 18px;
  }
}
</style>

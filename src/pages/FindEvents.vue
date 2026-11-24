<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import DiscoveryHero from '@/components/public/DiscoveryHero.vue'
import DiscoveryCities from '@/components/public/DiscoveryCities.vue'
import { categoryArt } from '@/components/public/categoryArt'
import {
  categoryArtIndex,
  categoryLabel,
  getPublicCategories,
  getPublicEvents,
} from '@/services/publicCatalog'
import {
  normalizeEventProfile,
  profileDate,
  safePublicUrl,
} from '@/utils/eventProfile'
import { useSlug } from '@/composables/useSlug'

const route = useRoute(),
  router = useRouter()
const { getEventUrl } = useSlug()
const categories = ref([]),
  events = ref([]),
  loading = ref(true),
  error = ref(''),
  categoryError = ref(false)
const total = ref(0),
  pages = ref(1)
let request, categoryRequest, categoriesReady
const page = computed(() =>
  Number.isSafeInteger(Number(route.query.page)) && Number(route.query.page) > 0
    ? Number(route.query.page)
    : 1,
)
const selected = computed(() =>
  String(route.query.category || route.meta.discoveryCategory || ''),
)
const art = (name) => categoryArt[categoryArtIndex(name)]
const cards = computed(() =>
  events.value.map((source) => {
    const profile = normalizeEventProfile(source)
    const category =
      typeof source.category === 'object'
        ? source.category?.name
        : source.category
    const price = profile.price
    return {
      ...profile,
      id: source.id,
      url: getEventUrl(source),
      cover: profile.cover || safePublicUrl(source.image_url || source.image),
      category: category || '',
      city: source.address?.city || source.city || '',
      priceText:
        price == null
          ? 'View ticket options'
          : price === 0
            ? 'Free'
            : `From ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: source.currency || 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price)}`,
    }
  }),
)
async function loadCategories() {
  categoryRequest?.abort()
  categoryRequest = new AbortController()
  categoryError.value = false
  try {
    categories.value = await getPublicCategories(categoryRequest.signal)
  } catch (failure) {
    if (failure.code !== 'ERR_CANCELED') categoryError.value = true
  }
}
async function loadEvents() {
  request?.abort()
  const controller = new AbortController()
  request = controller
  loading.value = true
  error.value = ''
  try {
    if (selected.value && !/^\d+$/.test(selected.value)) await categoriesReady
    if (controller.signal.aborted) return
    const matchingCategory = categories.value.find(
      (category) =>
        category.value === selected.value ||
        category.name.toLowerCase() === selected.value.toLowerCase() ||
        category.name
          .toLowerCase()
          .startsWith(`${selected.value.toLowerCase()} `),
    )
    const result = await getPublicEvents(
      {
        q: String(route.query.q || ''),
        category: matchingCategory?.value || selected.value,
        city: String(route.query.city || ''),
        page: page.value,
      },
      controller.signal,
    )
    if (controller.signal.aborted) return
    events.value = result.events
    total.value = result.total
    pages.value = result.pages
  } catch (failure) {
    if (!controller.signal.aborted) {
      events.value = []
      error.value =
        failure.userMessage || 'We could not load events. Please try again.'
    }
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}
function filter(key, value) {
  const query = { ...route.query }
  delete query.page
  if (value) query[key] = value
  else delete query[key]
  router.push({ name: 'find-events', query, hash: '#discover' })
}
function changePage(value) {
  router.push({
    name: 'find-events',
    query: {
      ...route.query,
      ...(selected.value ? { category: selected.value } : {}),
      page: value,
    },
    hash: '#discover',
  })
}
categoriesReady = loadCategories()
watch(() => [route.query, route.meta.discoveryCategory], loadEvents, {
  immediate: true,
})
onBeforeUnmount(() => {
  request?.abort()
  categoryRequest?.abort()
})
</script>

<template>
  <main id="top">
    <DiscoveryHero />
    <section id="categories" class="section categories-section" aria-labelledby="category-title"><div class="container">
      <div class="section-head"><h2 id="category-title">What’s your kind of event?</h2></div>
      <div v-if="categories.length" class="category-grid"><button v-for="category in categories" :key="category.value" type="button" class="category" :aria-pressed="selected === category.value" @click="filter('category', category.value)"><div class="category-art" :style="{ background: art(category.name).color }" v-html="art(category.name).svg" /><div class="category-title"><strong>{{ categoryLabel(category.name) }}</strong></div></button></div>
      <div v-else-if="categoryError" class="catalog-note"><p>We couldn’t load categories.</p><button class="text-link" type="button" @click="loadCategories">Try again</button></div>
      <p v-else-if="!loading" class="catalog-note">Event categories will appear here when they’re available.</p>
      <div v-else class="category-grid" aria-label="Getting categories ready…" aria-busy="true"><div v-for="i in 5" :key="i" class="catalog-skeleton category-placeholder" /></div>
    </div></section>
    <section id="discover" class="section events-section" aria-labelledby="events-title"><div class="container">
      <div class="section-head events-heading"><h2 id="events-title">Explore events</h2></div>
      <div class="filter-row"><div class="filter-chips" role="group" aria-label="Filter events by category"><button class="filter-chip" :class="{ active: !selected }" :aria-pressed="!selected" @click="filter('category', '')">All events</button><button v-for="category in categories" :key="category.value" class="filter-chip" :class="{ active: selected === category.value }" :aria-pressed="selected === category.value" @click="filter('category', category.value)">{{ categoryLabel(category.name) }}</button></div><span class="result-count" role="status">{{ loading ? 'Getting events ready…' : error ? '' : `${total} ${total === 1 ? 'event' : 'events'}` }}</span></div>
      <div v-if="loading" class="events-grid" aria-busy="true" aria-label="Getting events ready…"><div v-for="i in 6" :key="i"><div class="event-cover catalog-skeleton" /><div class="catalog-skeleton skeleton-title" /><div class="catalog-skeleton skeleton-meta" /></div></div>
      <div v-else-if="error" class="catalog-empty" role="alert"><h3>Events couldn’t load</h3><p>{{ error }}</p><button class="btn btn-outline" @click="loadEvents">Try again</button></div>
      <div v-else-if="!cards.length" class="catalog-empty"><h3>No events found</h3><p>{{ route.query.q || selected || route.query.city ? 'Try a different search, city, or category.' : 'Events will appear here when organisers publish them.' }}</p><RouterLink v-if="route.query.q || selected || route.query.city" class="btn btn-outline" to="/find-events#discover">Clear filters</RouterLink></div>
      <div v-else class="events-grid"><article v-for="event in cards" :key="event.id" class="event-card"><RouterLink class="event-card-action" :to="event.url" :aria-label="`View event information: ${event.title}`"><div class="event-cover"><img v-if="event.cover" :src="event.cover" :alt="event.title" loading="lazy" /><span v-else class="missing-cover">Cover photo will appear here</span><span v-if="event.date" class="date-card"><span>{{ profileDate(event.date, event.timezone, { month: 'short' }) }}</span><strong>{{ profileDate(event.date, event.timezone, { day: '2-digit' }) }}</strong></span></div><div class="event-body"><p class="event-type">{{ [event.category, event.city].filter(Boolean).join(' · ') }}</p><h3 class="event-title">{{ event.title }}</h3><p v-if="event.date" class="event-meta"><svg class="icon" aria-hidden="true"><use href="#i-clock" /></svg>{{ profileDate(event.date, event.timezone, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) }}</p><p v-if="event.venue" class="event-meta"><svg class="icon" aria-hidden="true"><use href="#i-pin" /></svg>{{ event.venue }}</p><p class="event-price">{{ event.priceText }}</p></div></RouterLink></article></div>
      <nav v-if="!loading && !error && pages > 1" class="catalog-pagination" aria-label="Event pages"><button class="btn btn-outline" :disabled="page <= 1" @click="changePage(page - 1)">Previous</button><span>Page {{ page }} of {{ pages }}</span><button class="btn btn-outline" :disabled="page >= pages" @click="changePage(page + 1)">Next</button></nav>
    </div></section>
    <DiscoveryCities @select="filter('city', $event)" />
  </main>
</template>

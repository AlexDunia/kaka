<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useEventStore } from '@/stores/events'
import { useSlug } from '@/composables/useSlug'

const router = useRouter()
const eventStore = useEventStore()
const { getEventUrl } = useSlug()
const activeIndex = ref(0)
const searchTerm = ref('')
let rotationTimer

const fallbackEvents = [
  { id: 'night', title: 'A good night starts here', location: 'Lagos', image: 'https://res.cloudinary.com/dnuhjsckk/image/upload/v1747162284/kakalink_elyn4g.jpg', link: '/search' },
  { id: 'music', title: 'Music, culture and more', location: 'Find your next plan', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=85', link: '/search' },
  { id: 'people', title: 'The plans worth showing up for', location: 'Tickets in a few taps', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=85', link: '/search' },
]

const slides = computed(() => {
  const featured = eventStore.featuredEvents || []
  if (!featured.length) return fallbackEvents
  return featured.slice(0, 5).map((event) => ({
    id: event.id,
    title: event.title || 'Event details coming soon',
    location: event.address?.venue_name || event.location || 'See event details',
    image: event.main_image || event.hero_image || event.banner || event.image || fallbackEvents[0].image,
    link: getEventUrl(event),
  }))
})

const activeSlide = computed(() => slides.value[activeIndex.value] || slides.value[0])
const submitSearch = () => {
  const query = searchTerm.value.trim()
  router.push(query ? { path: '/search', query: { q: query } } : '/search')
}

onMounted(() => {
  rotationTimer = window.setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % slides.value.length
  }, 6500)
})
onBeforeUnmount(() => window.clearInterval(rotationTimer))
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <div v-for="(slide, index) in slides" :key="slide.id" class="hero__image" :class="{ 'hero__image--active': index === activeIndex }" :style="{ backgroundImage: `url(${slide.image})` }"></div>
    <div class="hero__veil"></div>
    <div class="hero__content page-content">
      <p class="hero__eyebrow">KakaTickets</p>
      <h1 id="hero-title">Make plans.<br />Make it out.</h1>
      <p class="hero__lead">Find events worth showing up for.</p>
      <form class="hero__search" @submit.prevent="submitSearch">
        <label class="sr-only" for="hero-search">Search events</label>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 20-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
        <input id="hero-search" v-model="searchTerm" type="search" placeholder="Search events, artists or venues" />
        <button type="submit">Search</button>
      </form>
      <div class="hero__actions">
        <RouterLink to="/search" class="button button--solid">Browse events</RouterLink>
        <RouterLink to="/create-event" class="button button--quiet">Create an event</RouterLink>
      </div>
    </div>
    <RouterLink v-if="activeSlide" :to="activeSlide.link" class="hero__now"><span>Now on KakaTickets</span><strong>{{ activeSlide.title }}</strong><small>{{ activeSlide.location }}</small></RouterLink>
    <div class="hero__dots" aria-label="Featured events"><button v-for="(slide, index) in slides" :key="`dot-${slide.id}`" type="button" :class="{ active: index === activeIndex }" :aria-label="`Show ${slide.title}`" @click="activeIndex = index"></button></div>
  </section>
</template>

<style scoped>
.hero{position:relative;isolation:isolate;display:grid;min-height:min(760px,calc(100vh - var(--app-header-height)));overflow:hidden;background:#141316;color:#fff}.hero__image,.hero__veil{position:absolute;inset:0}.hero__image{background-position:center;background-size:cover;opacity:0;transform:scale(1.035);transition:opacity .8s ease,transform 7s ease}.hero__image--active{opacity:1;transform:scale(1);z-index:-2}.hero__veil{z-index:-1;background:linear-gradient(90deg,rgba(8,8,10,.92) 0%,rgba(8,8,10,.61) 47%,rgba(8,8,10,.17) 100%),linear-gradient(0deg,rgba(8,8,10,.7),transparent 50%)}.hero__content{align-self:center;padding-block:clamp(100px,13vw,180px) clamp(150px,18vw,215px)}.hero__eyebrow{margin:0 0 18px;color:#fff;font-size:.72rem;font-weight:800;letter-spacing:.17em;text-transform:uppercase}.hero h1{max-width:680px;margin:0;font-size:clamp(3.8rem,8vw,8rem);font-weight:750;letter-spacing:-.075em;line-height:.85}.hero__lead{margin:26px 0 32px;color:rgba(255,255,255,.82);font-size:clamp(1rem,1.4vw,1.2rem)}.hero__search{display:flex;align-items:center;width:min(650px,100%);gap:12px;padding:7px 7px 7px 18px;border:1px solid rgba(255,255,255,.22);border-radius:16px;background:rgba(20,19,22,.48);backdrop-filter:blur(14px)}.hero__search svg{width:20px;height:20px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8}.hero__search input{min-width:0;padding:9px 0;border:0;background:transparent;color:#fff;font:inherit;box-shadow:none}.hero__search input:focus{box-shadow:none}.hero__search input::placeholder{color:rgba(255,255,255,.64)}.hero__search button,.button{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:10px;font:inherit;font-size:.9rem;font-weight:750;letter-spacing:0;text-decoration:none;text-transform:none;white-space:nowrap}.hero__search button{padding:12px 18px;background:#fff;color:#17151a}.hero__actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}.button{min-height:46px;padding:0 18px}.button--solid{background:var(--color-accent);color:#fff}.button--quiet{border:1px solid rgba(255,255,255,.36);background:rgba(255,255,255,.08);color:#fff}.hero__now{position:absolute;right:7.5%;bottom:48px;display:grid;max-width:310px;gap:5px;padding:18px 20px;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(18,17,20,.5);color:#fff;text-decoration:none;backdrop-filter:blur(14px)}.hero__now span{font-size:.68rem;font-weight:750;letter-spacing:.11em;text-transform:uppercase;opacity:.65}.hero__now strong{font-size:1rem;line-height:1.25}.hero__now small{opacity:.72}.hero__dots{position:absolute;bottom:48px;left:7.5%;display:flex;gap:8px}.hero__dots button{width:26px;min-width:0;height:3px;padding:0;border:0;border-radius:999px;background:rgba(255,255,255,.4)}.hero__dots button.active{background:#fff}@media(max-width:760px){.hero{min-height:680px}.hero__veil{background:linear-gradient(180deg,rgba(8,8,10,.53),rgba(8,8,10,.93) 78%)}.hero__content{padding-block:112px 235px}.hero h1{font-size:clamp(3.35rem,17vw,5.8rem)}.hero__search{border-radius:14px}.hero__search button{padding-inline:14px}.hero__now{right:7.5%;bottom:66px;left:7.5%;max-width:none}.hero__dots{bottom:35px}}@media(max-width:460px){.hero__search{gap:9px;padding-left:13px}.hero__search input{font-size:.87rem}.hero__search button{font-size:.8rem}.button{flex:1}.hero__lead{margin-block:20px 25px}}@media(prefers-reduced-motion:reduce){.hero__image{transition:none}}
</style>
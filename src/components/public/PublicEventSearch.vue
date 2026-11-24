<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
defineProps({ discovery: Boolean })
const route = useRoute()
const router = useRouter()
const query = ref(String(route.query.q || ''))
const city = ref(String(route.query.city || 'all'))
const cities = ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt']
watch(() => route.query, (value) => { query.value = String(value.q || ''); city.value = String(value.city || 'all') })
function search() {
  router.push({ name: 'find-events', query: { ...(query.value.trim() ? { q: query.value.trim() } : {}), ...(city.value !== 'all' ? { city: city.value } : {}), ...(route.query.category ? { category: route.query.category } : {}) }, hash: '#discover' })
}
</script>
<template>
  <form class="hero-search" role="search" @submit.prevent="search">
    <label><svg class="icon" aria-hidden="true"><use href="#i-search" /></svg><span class="visually-hidden">Search events</span><input v-model="query" type="search" placeholder="Search events or artists" autocomplete="off" /></label>
    <label class="visually-hidden" for="public-city">Choose a city</label><select id="public-city" v-model="city" aria-label="Choose a city"><option value="all">All cities</option><option v-if="city !== 'all' && !cities.includes(city)" :value="city">{{ city }}</option><option v-for="place in cities" :key="place">{{ place }}</option></select>
    <button class="btn btn-primary" type="submit">Find events <svg class="icon" aria-hidden="true"><use href="#i-arrow" /></svg></button>
  </form>
</template>

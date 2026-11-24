<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import eventService from '@/services/eventService'
import { normalizeEventProfile } from '@/utils/eventProfile'
import { commitEventSelection } from '@/utils/eventSelection'
import EventTicketSelection from '@/components/EventTicketSelection.vue'
import PageSkeleton from '@/components/PageSkeleton.vue'
const route = useRoute(),
  router = useRouter(),
  cart = useCartStore(),
  event = ref(null),
  loading = ref(true),
  error = ref(''),
  now = ref(new Date())
const profile = computed(() => normalizeEventProfile(event.value || {}, now.value))
const selected = computed(() =>
  cart.items.filter((item) => Number(item.eventId) === Number(route.params.id)),
)
let version = 0,
  timer
const back = () => router.push({ name: 'event-details', params: route.params })
async function load() {
  const request = ++version
  loading.value = true
  error.value = ''
  event.value = null
  try {
    const response = await eventService.getEventById(route.params.id)
    if (request === version) {
      event.value = response.data
      if (normalizeEventProfile(response.data).canRegister)
        await router.replace({
          name: 'checkout',
          query: { event: route.params.id, registration: '1' },
        })
    }
  } catch {
    if (request === version) error.value = 'We couldn’t load these tickets. Please try again.'
  } finally {
    if (request === version) loading.value = false
  }
}
function checkout(items) {
  if (commitEventSelection(cart, profile.value, items))
    router.push({ name: 'checkout', query: { event: profile.value.id } })
}
watch(() => route.params.id, load)
onMounted(() => {
  load()
  timer = setInterval(() => {
    now.value = new Date()
  }, 30000)
})
onBeforeUnmount(() => {
  version++
  clearInterval(timer)
})
</script>
<template>
  <div v-if="loading" class="event-profile">
    <div class="ep-container ep-loading"><PageSkeleton variant="detail" /></div>
  </div>
  <section v-else-if="error" class="event-profile">
    <div class="ep-container ep-error">
      <h1>Your tickets are waiting</h1>
      <p role="alert">{{ error }}</p>
      <button type="button" class="ep-primary" @click="load">Try again</button>
    </div>
  </section>
  <EventTicketSelection
    v-else-if="event"
    :key="profile.id"
    :profile="profile"
    :initial-selection="selected"
    :initial-ticket="typeof route.query.ticket === 'string' ? route.query.ticket : ''"
    @close="back"
    @checkout="checkout"
  />
</template>
<style src="@/styles/event-profile.css"></style>

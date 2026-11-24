<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import CaptionLetters from '@/components/public/CaptionLetters.vue'
import { useAuthStore } from '@/stores/auth'
const props = defineProps({ seller: Boolean })
const auth = useAuthStore()

const visible = ref(false)
const greeting = ref(null)
const textReady = ref(false)
let frame = 0,
  observer,
  disposed = false,
  revealTimer = 0
function setVisible(next) {
  if (next === visible.value) return
  visible.value = next
  window.clearTimeout(revealTimer)
  if (!next) {
    textReady.value = false
    return
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    textReady.value = true
    return
  }
  revealTimer = window.setTimeout(() => {
    if (!disposed && visible.value) textReady.value = true
  }, 180)
}
function measure() {
  frame = 0
  const hero = document.querySelector(
    props.seller
      ? '.public-site--discovery .hero, .public-site--discovery .rh-discovery-hero'
      : '.public-site--home .hero',
  )
  const nav = document.querySelector('[data-public-header] .nav-shell')
  const ticker = document.querySelector('.rh-audience-strip')
  // The greeting adds height to the sticky header and shifts the hero itself.
  // Remove that shift, then use a small dead band to avoid threshold flicker.
  const heroBottom = hero
    ? hero.getBoundingClientRect().bottom - (visible.value ? greeting.value?.offsetHeight || 0 : 0)
    : Infinity
  const threshold = (nav?.offsetHeight || 76) + (ticker?.offsetHeight || 0)
  setVisible(Boolean(hero && heroBottom <= threshold + (visible.value ? 24 : 0)))
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(measure)
}
onMounted(async () => {
  await nextTick()
  if (disposed) return
  measure()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  observer = new ResizeObserver(schedule)
  const hero = document.querySelector(
    props.seller
      ? '.public-site--discovery .hero, .public-site--discovery .rh-discovery-hero'
      : '.public-site--home .hero',
  )
  if (hero) observer.observe(hero)
})
onBeforeUnmount(() => {
  disposed = true
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  cancelAnimationFrame(frame)
  window.clearTimeout(revealTimer)
  observer?.disconnect()
})
</script>

<template>
  <div
    ref="greeting"
    v-show="visible"
    class="home-scroll-greeting"
    :class="{ 'home-scroll-greeting--ready': textReady }"
  >
    <div class="container">
      <span class="home-greeting-text"
        ><CaptionLetters
          :text="seller ? 'Want to sell your event?' : 'Pssst! Hey stranger'"
          :ready="textReady"
      /></span>
      <RouterLink
        class="home-greeting-go"
        :to="
          seller
            ? auth.isAuthenticated
              ? '/create-event'
              : { path: '/register', query: { redirect: '/create-event' } }
            : '/find-events'
        "
        ><CaptionLetters :text="seller ? 'Start here' : 'Find events here'" :ready="textReady"
      /></RouterLink>
    </div>
  </div>
</template>

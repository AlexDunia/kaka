<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePublishGuidanceStore } from '@/stores/publishGuidance'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const guidance = usePublishGuidanceStore()
const auth = useAuthStore()
const panel = ref(null)
const toast = ref(false)
const spotlight = ref(null)
const guide = ref(false)
const dashboard = computed(() => ['dashboard', 'dashboard-event'].includes(route.name))
const eligible = computed(() => Boolean(guidance.notice && auth.user && !['CreateEvent', 'EditEvent'].includes(route.name)))
let timer
let generation = 0
function close() {
  panel.value?.close()
  spotlight.value = null
  guide.value = false
}
function openNotice() {
  toast.value = false
  guidance.prompted = true
  spotlight.value = null
  panel.value.showModal()
}
function dismissGuide() {
  guidance.guided = true
  close()
}
async function visitEvents() {
  dismissGuide()
  await router.push({ name: 'dashboard', query: { view: 'events' } })
}
async function visitDashboard() {
  close()
  await router.push({ name: 'dashboard' })
}
function positionSpotlight() {
  const target = document.querySelector('[data-publish-events]')
  if (!target || !target.getClientRects().length) return false
  const rect = target.getBoundingClientRect()
  if (rect.width <= 0 || rect.left < 0 || rect.right > window.innerWidth) return false
  spotlight.value = { left: `${rect.left - 4}px`, top: `${rect.top - 4}px`, width: `${rect.width + 8}px`, height: `${rect.height + 8}px` }
  return true
}
watch(() => auth.user?.id, () => { guidance.reset(); toast.value = false; close() })
watch(() => [route.fullPath, eligible.value, guidance.notice, guidance.guided], async () => {
  const run = ++generation
  clearTimeout(timer)
  toast.value = false
  close()
  if (!eligible.value) return
  await nextTick()
  if (run !== generation) return
  if (dashboard.value && !guidance.guided) {
    // Wait for the existing dashboard loader before locating its navigation.
    let attempts = 0
    const showGuide = () => {
      if (run !== generation) return
      if (document.querySelector('.event-workspace [data-publish-events]') && positionSpotlight()) {
        guide.value = true
        panel.value.showModal()
      } else if (++attempts < 20) timer = setTimeout(showGuide, 300)
      else if (document.querySelector('.event-workspace [data-publish-events]')) {
        guide.value = true
        panel.value.showModal()
      }
    }
    timer = setTimeout(showGuide, 600)
  } else if (!guidance.prompted) {
    timer = setTimeout(() => { toast.value = true; guidance.prompted = true }, 6000)
  }
}, { immediate: true })
function resize() {
  if (spotlight.value && !positionSpotlight()) dismissGuide()
}
window.addEventListener('resize', resize)
window.addEventListener('scroll', resize, true)
onBeforeUnmount(() => {
  generation++
  clearTimeout(timer)
  window.removeEventListener('resize', resize)
  window.removeEventListener('scroll', resize, true)
})
</script>

<template>
  <aside v-if="eligible" class="publish-notice" aria-label="Event notification">
    <span v-if="toast" role="status">You have one new notification.</span>
    <button type="button" @click="openNotice">{{ toast ? 'View' : 'Notifications' }}</button>
    <button v-if="toast" type="button" aria-label="Dismiss notification" @click="toast = false"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('close')" width="24" height="24" /></svg></button>
  </aside>
  <dialog ref="panel" class="publish-panel" :class="{ 'has-spotlight': spotlight }" aria-labelledby="publish-guidance-title" @cancel="dismissGuide" @close="spotlight = null">
    <div v-if="spotlight" class="publish-spotlight" :style="spotlight" aria-hidden="true"></div>
    <div class="publish-card">
      <button class="publish-close" type="button" aria-label="Close guidance" @click="dismissGuide"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('close')" width="24" height="24" /></svg></button>
      <template v-if="guide">
        <h2 id="publish-guidance-title">Your events, in one place</h2>
        <p>Open an event to manage tickets, bookings, and attendees.</p>
        <button type="button" @click="visitEvents">View my events</button>
        <button type="button" @click="dismissGuide">Maybe later</button>
      </template>
      <template v-else>
        <h2 id="publish-guidance-title">Your event is live</h2>
        <p v-if="guidance.notice"><strong>{{ guidance.notice.title }}</strong> is ready to share with attendees.</p>
        <p>Manage tickets and bookings in your dashboard. Find this event under My events.</p>
        <button type="button" @click="visitDashboard">Go to dashboard</button>
      </template>
    </div>
  </dialog>
</template>

<style scoped>
.publish-notice { position: fixed; top: 90px; right: 20px; z-index: 1500; display: flex; align-items: center; gap: 12px; max-width: calc(100vw - 40px); padding: 12px 16px; border: 1px solid var(--ds-color-border); border-radius: 12px; background: var(--ds-color-surface, white); color: var(--ds-color-text, #171717); box-shadow: 0 8px 30px #0002; }
.publish-notice button, .publish-panel button { min-height: 44px; cursor: pointer; border: 1px solid var(--ds-color-border); border-radius: 8px; padding: 8px 14px; background: var(--ds-color-surface, white); color: var(--ds-color-text, #171717); font: inherit; }
.publish-panel { padding: 0; border: 0; border-radius: 16px; max-width: min(440px, calc(100vw - 32px)); background: var(--ds-color-surface, white); color: var(--ds-color-text, #171717); }
.publish-panel::backdrop { background: #101118b3; }
.publish-card { position: relative; padding: 28px; }
.publish-card h2 { padding-right: 30px; font-size: 22px; }
.publish-card p { line-height: 1.65; margin: 16px 0; }
.publish-card > button { margin: 4px; }
.publish-card .publish-close { position: absolute; top: 8px; right: 8px; }
.publish-panel.has-spotlight { overflow: visible; }
.publish-panel.has-spotlight::backdrop { background: transparent; }
.publish-spotlight { position: fixed; pointer-events: none; border: 2px solid var(--ds-color-brand, #e85d24); border-radius: 8px; box-shadow: 0 0 0 100vmax #101118b3; z-index: -1; }
</style>

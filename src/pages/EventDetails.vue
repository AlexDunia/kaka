<script setup>
import FeedbackToast from '@/components/FeedbackToast.vue'
import { HeartIcon, ShareIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { pngIconUrl } from '@/constants/pngIcons'
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import {
  CalendarDaysIcon,
  MapPinIcon,
  GlobeAltIcon,
  ChevronRightIcon,
  XMarkIcon,
  SparklesIcon,
  TicketIcon,
  CheckIcon,
} from '@/components/icons/pngIcons'
import { useEventStore } from '@/stores/events'
import { useAuthStore } from '@/stores/auth'
import { useSeo } from '@/composables/useSeo'
import { useSlug } from '@/composables/useSlug'
import PageSkeleton from '@/components/PageSkeleton.vue'
import EventCover from '@/components/EventCover.vue'
import EventSharing from '@/components/EventSharing.vue'
import EventPublicControls from '@/components/EventPublicControls.vue'
import { eventProfileNavigation } from '@/utils/eventProfileNavigation'
import { staticEvents, getStaticEvent } from '@/services/staticEventCatalog'
import { trackEventView } from '@/services/eventViewService'
import eventService from '@/services/eventService'
import { isStaticPreview } from '@/services/staticPreviewMode'
import { initials, normalizeEventProfile, profileDate, safePublicUrl } from '@/utils/eventProfile'

const route = useRoute(),
  router = useRouter(),
  eventStore = useEventStore(),
  authStore = useAuthStore()
const { currentEvent } = storeToRefs(eventStore)
const { generateSlug } = useSlug()
const { updatePageTitle, updateMetaDescription, updateSocialMeta, addEventStructuredData } =
  useSeo()
const headerCollapsed = inject('eventProfileHeaderCollapsed', ref(false))
const now = ref(new Date())
const profile = computed(() => normalizeEventProfile(currentEvent.value || {}, now.value))
const loading = ref(true),
  error = ref(''),
  activeSection = ref('details'),
  navAnchor = ref(null),
  sectionNav = ref(null)
const toast = ref(''),
  saved = ref(false),
  saving = ref(false),
  selectedGuest = ref(null)
const guestDialog = ref(null),
  sharing = ref(null),
  galleryDialog = ref(null),
  galleryIndex = ref(0)
const selectedRelated = ref(null),
  relatedDialog = ref(null)
const relatedEvents = ref([]),
  following = ref([])
const preview = computed(() => isStaticPreview() || Boolean(getStaticEvent(route.params.id)))
const ticketPickerOpen = computed(
  () => route.query.tickets === '1' || typeof route.query.ticket === 'string',
)
const attendeeView = ref(false)
const canEdit = computed(
  () =>
    isStaticPreview() || (authStore.isAuthenticated &&
    Number(currentEvent.value?.created_by) === Number(authStore.user?.id)),
)
const showOwnerActions = computed(() => canEdit.value && !attendeeView.value)
watch(() => [route.params.id, authStore.user?.id], () => { attendeeView.value = false })
const sections = computed(() => [
  ...(paragraphs.value.length || profile.value.highlights.length ? [{ id: 'about', label: 'About' }] : []),
  { id: 'details', label: 'Details' },
  ...(profile.value.guests.length ? [{ id: 'guests', label: 'Guests' }] : []),
  ...(profile.value.schedule.length ? [{ id: 'schedule', label: 'Schedule' }] : []),
  ...(profile.value.images.length ? [{ id: 'moments', label: 'Moments' }] : []),
  ...(profile.value.faq.length ? [{ id: 'faq', label: 'FAQs' }] : []),
])
const money = (value) =>
  value == null
    ? 'Not available'
    : value === 0
      ? 'Free'
      : new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value)
const displayDate = computed(
  () =>
    profileDate(profile.value.date, profile.value.timezone, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) || 'Date to be confirmed',
)
const displayTime = computed(() =>
  profileDate(profile.value.date, profile.value.timezone, { hour: 'numeric', minute: '2-digit' }),
)
const paragraphs = computed(() => profile.value.description.split(/\n\s*\n/).filter(Boolean))
const purchaseLabel = computed(() =>
  profile.value.canRegister
    ? 'Register for this event'
    : profile.value.salesEnded
      ? 'Ticket sales have ended'
      : profile.value.canBuy
        ? 'View all tickets available'
        : 'Tickets unavailable',
)
const hasHeroSignal = computed(() => Boolean(
  profile.value.salesEnded || profile.value.captionTitle || profile.value.captionDescription || profile.value.summary,
))
const galleryImage = computed(() => profile.value.images[galleryIndex.value])
const shareUrl = computed(
  () =>
    `${window.location.origin}${router.resolve({ name: 'event-details', params: { id: profile.value.id || route.params.id, slug: currentEvent.value?.slug || generateSlug(profile.value.title) } }).href}`,
)
let requestVersion = 0,
  scrollFrame = 0,
  toastTimer,
  clockTimer,
  lastTrackedId
function notify(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 3500)
}
function backToEvents() {
  if (window.history.state?.back) router.back()
  else router.push('/find-events')
}
function eventLink(event) {
  return {
    name: 'event-details',
    params: {
      id: event.id,
      slug: event.slug || generateSlug(event.title || event.name || 'event'),
    },
    query: {},
  }
}
function openTickets() {
  if (profile.value.canRegister) {
    router.push({ name: 'checkout', query: { event: profile.value.id, registration: '1' } })
    return
  }
  if (profile.value.canBuy)
    router.push({
      name: 'event-tickets',
      params: {
        id: profile.value.id,
        slug: currentEvent.value?.slug || generateSlug(profile.value.title),
      },
      query: typeof route.query.ticket === 'string' ? { ticket: route.query.ticket } : {},
    })
}
function updateScroll() {
  scrollFrame = 0
  if (!navAnchor.value || loading.value || error.value) {
    headerCollapsed.value = false
    return
  }
  const publicHeader = document.querySelector('[data-public-header]')
  const headerHeight = publicHeader ? publicHeader.offsetHeight : 76
  const height = sectionNav.value?.offsetHeight || 82
  const navigation = eventProfileNavigation({
    anchorTop: navAnchor.value.getBoundingClientRect().top,
    headerHeight,
    navHeight: height,
    scrollY: window.scrollY,
  })
  headerCollapsed.value = navigation.collapsed
  document.body.classList.toggle('rh30-scrolled', navigation.collapsed)
  document.documentElement.style.setProperty('--rh30-brand-height', `${headerHeight}px`)
  document.documentElement.style.setProperty('--rh30-nav-height', `${height}px`)
  document.documentElement.style.setProperty('--rh28-header-height', `${headerHeight}px`)
  document.documentElement.style.setProperty('--rh28-tabs-height', `${height}px`)
  const threshold = navigation.activeThreshold
  let active = sections.value[0].id
  for (const section of sections.value) {
    const element = document.getElementById(`ep-${section.id}`)
    if (element && element.getBoundingClientRect().top <= threshold) active = section.id
  }
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 12)
    active = sections.value[sections.value.length - 1].id
  if (activeSection.value !== active) {
    activeSection.value = active
    const link = sectionNav.value?.querySelector(`[href="#ep-${active}"]`)
    if (link) {
      const rail = link.parentElement
      if (
        link.offsetLeft < rail.scrollLeft ||
        link.offsetLeft + link.offsetWidth > rail.scrollLeft + rail.clientWidth
      )
        rail.scrollTo({ left: link.offsetLeft - 12, behavior: 'auto' })
    }
  }
}
function scheduleScroll() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll)
}
function goToSection(id) {
  const element = document.getElementById(`ep-${id}`)
  if (!element) return
  activeSection.value = id
  element.scrollIntoView({
    block: 'start',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}
async function toggleSaved() {
  if (saving.value) return
  if (!authStore.isAuthenticated && !preview.value) {
    notify('Log in to save this event.')
    return
  }
  saving.value = true
  try {
    if (preview.value) saved.value = !saved.value
    else {
      const result = await eventStore.toggleLike(profile.value.id)
      saved.value = Boolean(result.liked ?? result.is_liked)
    }
    notify(
      saved.value
        ? 'Event saved. You can find it in your saved events.'
        : 'Event removed from your saved events.',
    )
  } catch {
    notify('We couldn’t save this event. Please try again.')
  } finally {
    saving.value = false
  }
}
async function openGuest(guest) {
  selectedGuest.value = guest
  await nextTick()
  guestDialog.value?.showModal()
}
function followKey(name) {
  return `${profile.value.id}:${name}`
}
function toggleFollow(name) {
  if (!preview.value) {
    notify('Following guests is not available yet.')
    return
  }
  const key = followKey(name),
    exists = following.value.includes(key)
  following.value = exists
    ? following.value.filter((item) => item !== key)
    : [...following.value, key]
  try {
    localStorage.setItem('rushhour-profile-follows', JSON.stringify(following.value))
  } catch {
    /* Browser storage may be disabled. */
  }
  notify(
    exists ? 'Removed from your follows on this device.' : 'Added to your follows on this device.',
  )
}
async function openRelated(event) {
  selectedRelated.value = event
  guestDialog.value?.close()
  await nextTick()
  relatedDialog.value?.showModal()
}
function backFromRelated() {
  relatedDialog.value?.close()
  if (selectedGuest.value) guestDialog.value?.showModal()
}
function openGallery(index) {
  galleryIndex.value = index
  galleryDialog.value?.showModal()
}
function moveGallery(delta) {
  galleryIndex.value =
    (galleryIndex.value + delta + profile.value.images.length) % profile.value.images.length
}
async function loadEvent() {
  const version = ++requestVersion
  loading.value = true
  error.value = ''
  saved.value = false
  relatedEvents.value = []
  headerCollapsed.value = false
  selectedGuest.value = null
  relatedDialog.value?.close()
  guestDialog.value?.close()
  galleryDialog.value?.close()

  try {
    {
      const response = await eventService.getEventById(Number(route.params.id))
      if (version !== requestVersion) return
      if (!response?.data) throw new Error('Event not found')
      currentEvent.value = response.data
    }
    if (version !== requestVersion) return
    const data = currentEvent.value,
      description = profile.value.description.slice(0, 155)
    updatePageTitle(data.title)
    updateMetaDescription(description)
    updateSocialMeta({
      title: data.title,
      description,
      image: profile.value.cover,
      url: shareUrl.value,
    })
    addEventStructuredData({
      ...data,
      event_date: profile.value.date,
      end_date: profile.value.end,
      main_image: profile.value.cover,
      venue: profile.value.venue,
      organizer: profile.value.organiser.name,
      price: profile.value.price,
      url: shareUrl.value,
    })
    if (!route.params.slug && !preview.value)
      await router.replace({
        name: 'event-details',
        params: { id: data.id, slug: data.slug || generateSlug(data.title) },
        query: route.query,
      })
    if (!preview.value && lastTrackedId !== data.id) {
      lastTrackedId = data.id
      void trackEventView(data.id, {
        sourceCode: typeof route.query.src === 'string' ? route.query.src : null,
      }).catch(() => {})
    }
    relatedEvents.value = [
      ...profile.value.related,
      ...(preview.value ? staticEvents : []).filter(
        (event) =>
          Number(event.id) !== Number(data.id) &&
          !profile.value.related.some((item) => Number(item.id) === Number(event.id)),
      ),
    ]
    if (authStore.isAuthenticated && !preview.value)
      void eventStore
        .checkLiked(data.id)
        .then((result) => {
          if (version === requestVersion) saved.value = Boolean(result.liked ?? result.is_liked)
        })
        .catch(() => {})
  } catch {
    if (version === requestVersion)
      error.value = 'We couldn’t load this event. Try again, or explore other events.'
  } finally {
    if (version === requestVersion) {
      loading.value = false
      await nextTick()
      updateScroll()
      if (ticketPickerOpen.value) openTickets()
    }
  }
}
watch(() => [route.params.id, preview.value], loadEvent)
watch(ticketPickerOpen, (open) => {
  if (open && !loading.value) openTickets()
  if (!open) nextTick(updateScroll)
  if (currentEvent.value) updatePageTitle(currentEvent.value.title)
})
onMounted(() => {
  try {
    const stored = preview.value
      ? JSON.parse(localStorage.getItem('rushhour-profile-follows') || '[]')
      : []
    following.value = Array.isArray(stored) ? stored : []
  } catch {
    following.value = []
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true })
  window.addEventListener('resize', scheduleScroll)
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 30000)
  loadEvent()
})
onBeforeUnmount(() => {
  requestVersion++
  headerCollapsed.value = false
  window.removeEventListener('scroll', scheduleScroll)
  window.removeEventListener('resize', scheduleScroll)
  cancelAnimationFrame(scrollFrame)
  clearInterval(clockTimer)
  clearTimeout(toastTimer)
  eventStore.clearCurrentEvent()
})
</script>

<template>
  <div
    data-route="event-page"
    class="event-profile rh24-event"
    :class="{ 'is-header-collapsed': headerCollapsed }"
  >
    <div v-if="loading" class="ep-container ep-loading"><PageSkeleton variant="detail" /></div>
    <section v-else-if="error" class="ep-container ep-error" role="alert">
      <h1>Let’s try that again</h1>
      <p>{{ error }}</p>
      <div class="ep-review-actions">
        <button type="button" class="ep-primary" @click="loadEvent">Try again</button
        ><RouterLink to="/find-events" class="ep-secondary">Explore events</RouterLink>
      </div>
    </section>
    <template v-else-if="currentEvent">
      <div class="ep-container ep-hero-container">
        <section class="ep-system-hero" aria-labelledby="ep-event-title">
          <div class="ep-system-hero-cover">
            <EventCover :src="profile.cover" :alt="profile.title" />
            <div class="ep-mobile-hero-actions" role="group" aria-label="Event actions">
              <button type="button" class="ep-cover-control" aria-label="Back to events" @click="backToEvents">
                <ChevronLeftIcon aria-hidden="true" />
              </button>
              <div class="ep-mobile-hero-actions-end">
                <button type="button" class="ep-cover-control" aria-label="Share event" @click="sharing?.openShare()">
                  <ShareIcon aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="ep-cover-control"
                  :aria-label="saved ? 'Remove event from saved events' : 'Save event'"
                  :aria-pressed="saved"
                  :disabled="saving"
                  :aria-busy="saving"
                  @click="toggleSaved"
                >
                  <span v-if="saving" class="rh-spinner" aria-hidden="true" />
                  <HeartIcon v-else :class="{ 'ep-heart-saved': saved }" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
          <div class="ep-system-hero-copy">
            <span class="ep-eyebrow">{{ profile.category }}</span>
            <h1 id="ep-event-title">{{ profile.title }}</h1>
            <p v-if="profile.lifecycleState === 'cancelled'" role="status">
              This event has been cancelled. Bookings are closed. Refund updates will be sent to
              buyers.
            </p>
            <p v-if="profile.summary">{{ profile.summary }}</p>
            <div v-if="profile.tags.length" class="ep-system-hero-tags">
              <span v-for="tag in profile.tags" :key="tag">{{ tag }}</span>
            </div>
            <div class="ep-system-hero-meta">
              <p>
                <CalendarDaysIcon aria-hidden="true" /><span
                  >{{ displayDate
                  }}<template v-if="displayTime"> &middot; {{ displayTime }}</template></span
                >
              </p>
              <p v-if="profile.venue">
                <component
                  :is="profile.isOnline ? GlobeAltIcon : MapPinIcon"
                  aria-hidden="true"
                /><span>{{ profile.venue }}</span>
              </p>
            </div>
          </div>
        </section>
        <div class="ep-action-strip rh24-action-strip" :class="{ 'ep-action-strip--empty-mobile': !hasHeroSignal && !canEdit }">
          <div v-if="hasHeroSignal" class="ep-signal rh24-signal">
            <span class="ep-signal-icon rh24-signal-icon"><SparklesIcon /></span>
            <div>
              <strong v-if="profile.salesEnded || profile.captionTitle">{{
                profile.salesEnded
                  ? 'Ticket sales have ended'
                  : profile.captionTitle
              }}</strong
              ><span v-if="profile.captionDescription || profile.summary">{{ profile.captionDescription || profile.summary }}</span>
            </div>
          </div>
          <div class="ep-inline-actions rh24-inline-actions">
            <button v-if="canEdit" type="button" class="ep-secondary" :aria-pressed="attendeeView" @click="attendeeView = !attendeeView">
              {{ attendeeView ? 'Return to organiser view' : 'Preview attendee view' }}
            </button>
            <RouterLink v-if="showOwnerActions" class="ep-secondary" :to="{ name: 'dashboard-event', params: { eventId: profile.id } }">Visit dashboard</RouterLink>
            <button
              v-if="showOwnerActions"
              type="button"
              class="ep-secondary"
              @click="
                router.push({
                  name: 'EditEvent',
                  params: { id: profile.id },
                  query: { returnTo: 'event' },
                })
              "
            >
              Edit event</button
            ><button
              type="button"
              class="ep-secondary rh24-quiet-button ep-desktop-hero-action"
              :aria-pressed="saved"
              :disabled="saving"
                  :aria-busy="saving"
              @click="toggleSaved"
            >
              <span v-if="saving" class="rh-spinner" aria-hidden="true" />
                  <HeartIcon v-else :class="{ 'ep-heart-saved': saved }" />{{
                saved ? 'Saved' : 'Save event'
              }}</button
            ><button
              type="button"
              class="ep-secondary rh24-quiet-button ep-desktop-hero-action"
              @click="sharing.openShare()"
            >
              <ShareIcon />Share
            </button>
            <EventSharing
              ref="sharing"
              :event-id="profile.id"
              :title="profile.title"
              :cover="profile.cover"
              :url="shareUrl"
              :owner="showOwnerActions"
            />
          </div>
        </div>
      </div>
      <div ref="navAnchor" class="ep-nav-anchor"></div>
      <div ref="sectionNav" class="ep-section-bar rh29-nav-row">
        <div class="ep-container ep-section-inner rh29-nav-inner">
          <button
            v-if="headerCollapsed"
            type="button"
            class="ep-back-button rh29-back-circle ep-sticky-control"
            :inert="!headerCollapsed || undefined"
            :aria-hidden="!headerCollapsed || undefined"
            aria-label="Back to events"
            @click="backToEvents"
          >
            <ChevronLeftIcon />
          </button>
          <nav class="rh24-section-nav" aria-label="Event sections">
            <a
              v-for="section in sections"
              :key="section.id"
              class="rh24-tab"
              :href="`#ep-${section.id}`"
              :class="{ active: activeSection === section.id }"
              :aria-current="activeSection === section.id ? 'location' : undefined"
              @click.prevent="goToSection(section.id)"
              >{{ section.label }}</a
            >
          </nav>
          <EventPublicControls
            v-if="headerCollapsed"
            class="ep-sticky-control"
            :inert="!headerCollapsed || undefined"
            :aria-hidden="!headerCollapsed || undefined"
          />
        </div>
      </div>
      <div class="ep-container ep-layout rh24-layout">
        <div class="ep-main rh24-primary">
          <section v-if="paragraphs.length || profile.highlights.length" id="ep-about" class="ep-chapter rh24-chapter rh24-about">
            <h2>About this event</h2>
            <div v-if="paragraphs.length" class="ep-description rh25-description">
              <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
            </div>
            <div v-if="profile.highlights.length" class="ep-highlights rh24-experience-points">
              <span v-for="highlight in profile.highlights" :key="highlight"
                ><CheckIcon />{{ highlight }}</span
              >
            </div>
          </section>
          <section id="ep-details" class="ep-chapter rh24-chapter">
            <h2>Event details</h2>
            <div class="ep-detail-grid rh24-detail-grid">
              <div>
                <CalendarDaysIcon />
                <small>Date and time</small>
                <strong>{{ displayDate }}</strong
                ><span
                  >{{ displayTime
                  }}<template v-if="displayTime"> · {{ profile.timezone }}</template></span
                ><span v-if="profile.end"
                  >Ends
                  {{
                    profileDate(profile.end, profile.timezone, {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  }}</span
                >
              </div>
              <div>
                <component :is="profile.isOnline ? GlobeAltIcon : MapPinIcon" />
                <small>{{ profile.isOnline ? 'Join online' : 'Venue' }}</small>
                <strong>{{ profile.venue || 'Venue to be confirmed' }}</strong
                ><span v-if="profile.location">{{ profile.location }}</span
                ><a
                  v-if="profile.venue && !profile.isOnline"
                  :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([profile.venue, profile.location].filter(Boolean).join(', '))}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  >Get directions</a
                ><span v-if="profile.isOnline">Joining details are shared by the organiser.</span>
              </div>
            </div>
            <div v-if="profile.extras.length" class="ep-extra-details rh25-extras">
              <div v-for="detail in profile.extras" :key="detail.label">
                <h3>{{ detail.label }}</h3>
                <p>{{ detail.value }}</p>
              </div>
            </div>
          </section>
          <section v-if="profile.guests.length" id="ep-guests" class="ep-chapter rh24-chapter">
            <div class="ep-section-heading rh24-section-heading">
              <div><h2>Special guests</h2></div>
              <p>See who’s joining the event.</p>
            </div>
            <div v-if="profile.guests.length" class="ep-people-grid rh24-people-grid">
              <button
                v-for="guest in profile.guests"
                :key="guest.id"
                type="button"
                class="ep-person rh24-person"
                @click="openGuest(guest)"
              >
                <span class="ep-portrait rh24-portrait"
                  ><span>{{ initials(guest.name) }}</span
                  ><img
                    v-if="guest.image"
                    :src="guest.image"
                    :alt="guest.name"
                    loading="lazy"
                    @error="$event.target.hidden = true" /></span
                ><span class="ep-person-meta rh24-person-meta"
                  ><small v-if="guest.role" class="rh24-role">{{ guest.role }}</small
                  ><strong>{{ guest.name }}</strong
                  ><span>View profile <ChevronRightIcon /></span
                ></span>
              </button>
            </div>
          </section>
          <section v-if="profile.schedule.length" id="ep-schedule" class="ep-chapter rh24-chapter">
            <div class="ep-section-heading rh24-section-heading">
              <div><h2>Schedule</h2></div>
              <p>See what’s planned.</p>
            </div>
            <div v-if="profile.schedule.length" class="ep-schedule rh24-schedule-list">
              <div v-for="(item, index) in profile.schedule" :key="index">
                <time>{{ item.time }}</time
                ><span class="ep-timeline-dot rh24-timeline-dot"></span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <p v-if="item.description">{{ item.description }}</p>
                </div>
                <span v-if="item.label" class="rh24-schedule-label">{{ item.label }}</span>
              </div>
            </div>
          </section>
          <section v-if="profile.images.length" id="ep-moments" class="ep-chapter rh24-chapter">
            <div class="ep-section-heading rh24-section-heading">
              <div><h2>Moments</h2></div>
              <p>Photos and highlights shared by the organiser.</p>
            </div>
            <div v-if="profile.images.length" class="ep-gallery rh24-gallery-grid">
              <button
                v-for="(image, index) in profile.images"
                :key="image.src"
                type="button"
                :aria-label="`View photo ${index + 1}${image.caption ? ': ' + image.caption : ''}`"
                @click="openGallery(index)"
              >
                <img
                  :src="image.src"
                  :alt="image.caption || `Event photo ${index + 1}`"
                  loading="lazy"
                /><span v-if="image.caption">{{ image.caption }}</span>
              </button>
            </div>
          </section>
          <section v-if="profile.faq.length" id="ep-faq" class="ep-chapter rh24-chapter">
            <div class="ep-section-heading rh24-section-heading">
              <h2>Common questions</h2>
              <p>Answers to help you plan your visit.</p>
            </div>
            <div v-if="profile.faq.length" class="ep-faq rh30-faq-list">
              <article class="rh30-faq-entry" v-for="(item, index) in profile.faq" :key="index">
                <h3 class="rh30-faq-question" v-if="item.question">{{ item.question }}</h3>
                <p class="rh30-faq-answer">{{ item.answer }}</p>
              </article>
            </div>
          </section>
          <section
            v-if="profile.organiser.name"
            class="ep-organiser rh24-organizer"
            aria-labelledby="ep-organiser-title"
          >
            <span class="ep-organiser-avatar rh24-organizer-badge">{{
              initials(profile.organiser.name)
            }}</span>
            <div>
              <span class="ep-small">Presented by</span>
              <h2 id="ep-organiser-title">{{ profile.organiser.name }}</h2>
              <p v-if="profile.organiser.bio">{{ profile.organiser.bio }}</p>
              <a
                v-if="profile.organiser.website"
                :href="profile.organiser.website"
                target="_blank"
                rel="noopener noreferrer"
                >Visit website</a
              >
            </div>
            <button
              type="button"
              class="ep-secondary"
              :aria-pressed="following.includes(followKey(profile.organiser.name))"
              @click="toggleFollow(profile.organiser.name)"
            >
              {{ following.includes(followKey(profile.organiser.name)) ? 'Following' : 'Follow' }}
            </button>
          </section>
          <section v-if="profile.crew.length" class="rh24-chapter rh26-crew">
            <div class="rh24-section-heading">
              <div><h2>The event team</h2></div>
              <p>Meet the people bringing this event to life.</p>
            </div>
            <div class="rh26-crew-tags">
              <div v-for="person in profile.crew" :key="person.name" class="rh26-creator-chip">
                <span>{{ initials(person.name) }}</span>
                <div>
                  <strong>{{ person.name }}</strong
                  ><small>{{ person.role }}</small>
                </div>
              </div>
            </div>
          </section>
        </div>
        <aside class="ep-ticket-aside rh24-aside" aria-label="Event tickets">
          <div class="ep-ticket-card rh24-ticket-card">
            <span class="ep-ticket-label"
              ><TicketIcon />{{ profile.price === 0 ? 'Free admission' : 'Tickets' }}</span
            >
            <div class="ep-starting-price rh24-ticket-head">
              <span>Starting from</span><strong>{{ money(profile.price) }}</strong>
            </div>
            <div class="ep-ticket-fact rh24-ticket-detail">
              <CalendarDaysIcon />
              <div>
                <strong>{{ displayDate }}</strong
                ><span
                  >{{ displayTime
                  }}<template v-if="displayTime"> · {{ profile.timezone }}</template></span
                >
              </div>
            </div>
            <div class="ep-ticket-fact rh24-ticket-detail">
              <component :is="profile.isOnline ? GlobeAltIcon : MapPinIcon" />
              <div>
                <strong>{{ profile.venue || 'Venue to be confirmed' }}</strong
                ><span v-if="profile.location">{{ profile.location }}</span>
              </div>
            </div>
            <button
              type="button"
              class="ep-primary rh24-cta rh26-main-buy"
              :disabled="!profile.canBuy && !profile.canRegister"
              @click="openTickets"
            >
              {{ purchaseLabel }} <span v-if="profile.canBuy" aria-hidden="true"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('next')" width="24" height="24" /></svg></span>
            </button>
          </div>
          <p class="ep-ticket-help">
            Need a hand with your booking? <RouterLink to="/contact">Get in touch</RouterLink>
          </p>
        </aside>
      </div>
      <section v-if="relatedEvents.length" class="ep-container ep-related rh24-related" aria-labelledby="ep-more-events">
        <div class="ep-section-heading rh24-section-heading">
          <h2 id="ep-more-events">More events</h2>
          <p>Find more events from this community.</p>
        </div>
        <div v-if="relatedEvents.length" class="ep-related-grid rh24-related-grid">
          <button
            type="button"
            v-for="related in relatedEvents.slice(0, 3)"
            :key="related.id"
            @click="openRelated(related)"
            class="ep-event-card rh24-event-card"
          >
            <img
              v-if="safePublicUrl(related.main_image || related.coverImage)"
              :src="safePublicUrl(related.main_image || related.coverImage)"
              :alt="related.title"
              loading="lazy"
            />
            <div class="ep-card-art" v-else><TicketIcon /></div>
            <div class="ep-card-copy rh24-card-details">
              <small>{{
                profileDate(
                  related.date || related.starts_at || related.startsAt || related.event_date,
                  related.timezone || related.timeZone || 'Africa/Lagos',
                  { weekday: 'short', day: 'numeric', month: 'short' },
                ) || 'Explore event'
              }}</small>
              <h3>{{ related.title || related.name }}</h3>
              <p>
                {{
                  related.venue ||
                  related.address?.venue_name ||
                  related.location ||
                  'View event details'
                }}
              </p>
            </div>
          </button>
        </div>

      </section>
      <div class="ep-mobile-buy rh24-mobile-buy">
        <div>
          <small>Starting from</small><strong>{{ money(profile.price) }}</strong>
        </div>
        <button
          type="button"
          class="ep-primary"
          :disabled="!profile.canBuy && !profile.canRegister"
          @click="openTickets"
        >
          {{
            profile.canRegister
              ? 'Register'
              : profile.canBuy
                ? 'View tickets'
                : profile.salesEnded
                  ? 'Sales ended'
                  : 'Unavailable'
          }}
        </button>
      </div>
      <dialog
        ref="guestDialog"
        class="ep-dialog ep-guest-dialog rh24-dialog"
        aria-labelledby="ep-guest-name"
        @click="$event.target === guestDialog && guestDialog.close()"
      >
        <button
          type="button"
          class="ep-dialog-close ep-icon-button"
          aria-label="Close guest profile"
          @click="guestDialog.close()"
        >
          <XMarkIcon /></button
        ><template v-if="selectedGuest"
          ><div class="ep-profile-banner rh24-profile-banner">
            <span class="ep-profile-avatar rh24-profile-photo"
              >{{ initials(selectedGuest.name)
              }}<img
                v-if="selectedGuest.image"
                :src="selectedGuest.image"
                :alt="selectedGuest.name"
                @error="$event.target.hidden = true"
            /></span>
          </div>
          <div class="ep-dialog-content ep-guest-content rh24-profile-inner">
            <small>{{ selectedGuest.role }}</small>
            <h2 id="ep-guest-name">{{ selectedGuest.name }}</h2>
            <button
              type="button"
              class="ep-secondary"
              :aria-pressed="following.includes(followKey(selectedGuest.name))"
              @click="toggleFollow(selectedGuest.name)"
            >
              {{ following.includes(followKey(selectedGuest.name)) ? 'Following' : 'Follow' }}
            </button>
            <p v-if="selectedGuest.bio">{{ selectedGuest.bio }}</p>
            <h3>At this event</h3>
            <p>{{ profile.title }}</p>
            <template v-if="selectedGuest.events.length"
              ><h3>More events</h3>
              <button
                type="button"
                v-for="guestEvent in selectedGuest.events.filter((item) => item.id)"
                :key="guestEvent.id"
                @click="openRelated(guestEvent)"
                class="ep-guest-event"
              >
                {{ guestEvent.title || guestEvent.name }}<ChevronRightIcon /></button
            ></template></div
        ></template>
      </dialog>
      <dialog
        ref="relatedDialog"
        class="ep-dialog rh24-dialog rh24-event-dialog"
        aria-labelledby="ep-related-name"
      >
        <button
          type="button"
          class="ep-dialog-close ep-icon-button"
          aria-label="Close event preview"
          @click="relatedDialog.close()"
        >
          <XMarkIcon /></button
        ><template v-if="selectedRelated"
          ><div
            class="rh24-event-modal-cover"
            :style="
              safePublicUrl(selectedRelated.main_image)
                ? {
                    backgroundImage: `linear-gradient(0deg,#17121ed9,#17121e66),url(${safePublicUrl(selectedRelated.main_image)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : {}
            "
          >
            <small>Event details</small>
            <h2 id="ep-related-name">{{ selectedRelated.title || selectedRelated.name }}</h2>
          </div>
          <div class="rh24-event-modal-info">
            <p>
              {{
                profileDate(
                  selectedRelated.date || selectedRelated.starts_at,
                  selectedRelated.timezone || 'Africa/Lagos',
                  { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
                )
              }}
            </p>
            <p>
              {{ selectedRelated.summary || selectedRelated.venue || selectedRelated.location }}
            </p>
            <div class="ep-review-actions">
              <button type="button" class="ep-secondary" @click="backFromRelated">
                {{ selectedGuest ? 'Back to guest profile' : 'Back to event' }}</button
              ><RouterLink
                :to="eventLink(selectedRelated)"
                class="ep-primary"
                @click="relatedDialog.close()"
                >View event</RouterLink
              >
            </div>
          </div></template
        >
      </dialog>
      <dialog
        ref="galleryDialog"
        class="ep-dialog ep-gallery-dialog"
        aria-label="Event photo viewer"
        @keydown.left.prevent="moveGallery(-1)"
        @keydown.right.prevent="moveGallery(1)"
      >
        <button
          type="button"
          class="ep-dialog-close ep-icon-button"
          aria-label="Close photo viewer"
          @click="galleryDialog.close()"
        >
          <XMarkIcon /></button
        ><template v-if="galleryImage"
          ><img
            :src="galleryImage.src"
            :alt="galleryImage.caption || `Event photo ${galleryIndex + 1}`" />
          <div class="ep-gallery-controls">
            <button
              type="button"
              class="ep-icon-button"
              aria-label="Previous photo"
              @click="moveGallery(-1)"
            >
              <ChevronLeftIcon /></button
            ><span>{{
              galleryImage.caption || `${galleryIndex + 1} of ${profile.images.length}`
            }}</span
            ><button
              type="button"
              class="ep-icon-button"
              aria-label="Next photo"
              @click="moveGallery(1)"
            >
              <ChevronRightIcon />
            </button></div
        ></template>
      </dialog>
    </template>
    <FeedbackToast :message="toast" @dismiss="toast = ''" />
  </div>
</template>

<style src="@/styles/event-profile.css"></style>
<style src="@/styles/event-profile-mobile.css"></style>

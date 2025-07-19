<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '@/stores/events'
import QRCode from 'qrcode.vue'
import { useCartStore } from '@/stores/cart'
import { useSeo } from '@/composables/useSeo'
import { useSlug } from '@/composables/useSlug'
import SeoImage from '@/components/SeoImage.vue'

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()
const cartStore = useCartStore()
const { updatePageTitle, updateMetaDescription, updateSocialMeta, addEventStructuredData } =
  useSeo()
const { generateSlug } = useSlug()

const loading = ref(true)
const error = ref(null)
const event = computed(() => eventStore.currentEvent)
const showPurchaseModal = ref(false)
const showQRModal = ref(false)
const qrValue = ref('')
const notification = ref(null)
const notificationTimeout = ref(null)
const toasterLoading = ref(false)
const toasterTimeout = ref(null)
const lastEventPage = ref(null)

// --- New refs for Share Modal ---
const showShareModal = ref(false)
const isSharing = ref(false)
const shareUrl = ref('')
const shareTitle = ref('')
const shareDescription = ref('')
const shareImage = ref('')
// --- End New refs for Share Modal ---

// Only use main_image from DB, no fallback
const eventImage = computed(() => {
  if (!event.value) return ''
  return event.value.main_image || ''
})

// Format date
const formattedDate = computed(() => {
  if (!event.value) return ''
  const eventDate = new Date(event.value.event_date)
  return isNaN(eventDate)
    ? ''
    : eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
})

// Update isExpired computed property to use backend sales_status
const isExpired = computed(() => {
  if (!event.value?.sales_status) return false
  return event.value.sales_status.is_expired
})

// Update formattedSalesEndDate to exclude time
const formattedSalesEndDate = computed(() => {
  if (!event.value?.sales_status?.sales_end) return ''
  const salesEnd = new Date(event.value.sales_status.sales_end)
  return salesEnd.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

// Add debounce utility
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Optimize event fetching
const fetchEventData = async () => {
  loading.value = true
  error.value = null

  try {
    const eventId = route.params.id
    if (!eventId) {
      throw new Error('No event ID provided')
    }

    // Check if we already have this event in the store
    if (eventStore.currentEvent?.id === parseInt(eventId)) {
      // If the event is expired, force a refresh
      if (eventStore.currentEvent.sales_status?.is_expired) {
        await eventStore.fetchEventById(eventId, true) // Force refresh
      }
      return
    }

    await eventStore.fetchEventById(eventId)

    if (!event.value) {
      throw new Error('Event not found')
    }
  } catch (err) {
    error.value = err.message || 'Failed to load event details'
    console.error('Error loading event:', err)
  } finally {
    loading.value = false
  }
}

// Add polling for expired events
const pollInterval = ref(null)

const startPollingIfNearExpiry = () => {
  if (!event.value?.sales_status?.sales_end) return

  const salesEnd = new Date(event.value.sales_status.sales_end)
  const now = new Date()
  const timeUntilExpiry = salesEnd - now

  // If within 5 minutes of expiry, poll every 30 seconds
  if (timeUntilExpiry > 0 && timeUntilExpiry <= 5 * 60 * 1000) {
    pollInterval.value = setInterval(() => {
      fetchEventData()
    }, 30000)
  }
}

// Cleanup polling on component unmount
onUnmounted(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
  }
})

// Update watch to handle polling
watch(
  event,
  (newEvent) => {
    if (newEvent) {
      // Clear existing poll interval
      if (pollInterval.value) {
        clearInterval(pollInterval.value)
      }

      // Start polling if near expiry
      startPollingIfNearExpiry()

      // Update SEO data
      updatePageTitle(newEvent.title)

      const description = newEvent.description
        ? newEvent.description.substring(0, 155) + (newEvent.description.length > 155 ? '...' : '')
        : `${newEvent.title} - Get tickets for this event on ${formattedDate.value}`

      updateMetaDescription(description)

      // Update URL if needed
      if (route.params.id && !route.params.slug && newEvent.title) {
        const slug = newEvent.slug || generateSlug(newEvent.title)
        router.replace(`/events/${slug}`)
      }

      // Update social sharing tags
      const canonical =
        window.location.origin +
        (newEvent.slug
          ? `/events/${newEvent.slug}`
          : newEvent.title
            ? `/events/${generateSlug(newEvent.title)}`
            : `/event/${newEvent.id}`)

      shareUrl.value = canonical
      shareTitle.value = newEvent.title
      shareDescription.value = description
      shareImage.value = eventImage.value

      updateSocialMeta({
        title: newEvent.title,
        description: description,
        image: eventImage.value,
        url: canonical,
      })

      addEventStructuredData({
        ...newEvent,
        url: canonical,
      })
    }
  },
  { immediate: true },
)

// Optimize ticket selection
const openPurchaseModalWithTicket = debounce((ticketTypeId) => {
  if (isExpired.value) {
    showToaster('This event has expired and tickets are no longer available', false)
    return
  }

  selectedTicketType.value = ticketTypeId

  // Small delay to ensure Vue has updated the props
  setTimeout(() => {
    showPurchaseModal.value = true
  }, 50)
}, 300) // Debounce for 300ms to prevent double-clicks

// Fetch event data when component mounts
onMounted(() => {
  fetchEventData()
})

// Watch for route changes to refetch data when navigating between events
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchEventData()
    }
  },
)

// Go back to events
const goBack = () => {
  router.back()
}

// Add the variables and functions for the modal
const ticketQuantity = ref(1)

// Get selected ticket name
const getSelectedTicketName = () => {
  const ticket = ticketTypes.value.find((t) => t.id === selectedTicketType.value)
  return ticket ? ticket.name : ''
}

// Get selected ticket price
const getSelectedTicketPrice = () => {
  const ticket = ticketTypes.value.find((t) => t.id === selectedTicketType.value)
  return ticket ? formatPrice(ticket.price) : ''
}

// Calculate total price
const calculateTotal = () => {
  const ticket = ticketTypes.value.find((t) => t.id === selectedTicketType.value)
  if (!ticket) return formatPrice(0)
  return formatPrice(ticket.price * ticketQuantity.value)
}

// Increment quantity
const incrementQuantity = () => {
  if (ticketQuantity.value < 10) {
    ticketQuantity.value++
  }
}

// Decrement quantity
const decrementQuantity = () => {
  if (ticketQuantity.value > 1) {
    ticketQuantity.value--
  }
}

// Close purchase modal - combined version
const closePurchaseModal = () => {
  showPurchaseModal.value = false
  selectedTicketType.value = null
  ticketQuantity.value = 1
}

// First, add a formattedCategory computed property for category name display
const formattedCategory = computed(() => {
  if (!event.value || !event.value.category) return ''

  // Convert category ID to readable name (capitalize and replace hyphens with spaces)
  return (
    event.value.category.charAt(0).toUpperCase() + event.value.category.slice(1).replace(/-/g, ' ')
  )
})

// After the existing computed properties, add a displaySubCategories computed property
const displaySubCategories = computed(() => {
  if (!event.value || !event.value.sub_categories) return []

  // The sub_categories field is stored as JSON in the database and decoded by the API
  // Filter out empty strings and return array of subcategories
  return event.value.sub_categories.filter((cat) => cat && cat.trim() !== '')
})

// Merge event options
const mergeEventOptions = () => {
  if (!event.value) return []

  // If event has selectedEventOptions, use those
  if (event.value.selectedEventOptions && event.value.selectedEventOptions.length > 0) {
    return event.value.selectedEventOptions
  }

  // If event has customEventOptions, combine with default options
  if (event.value.customEventOptions && event.value.customEventOptions.length > 0) {
    const defaultOptions = ['Live performance', 'Food & drinks available', 'Indoor event']
    return [...defaultOptions, ...event.value.customEventOptions]
  }

  // Default fallback options
  return ['Live performance', 'Food & drinks available', 'Indoor event']
}

// Replace the generateBarcode function with this
const generateQRCode = () => {
  if (!event.value || !selectedTicketType.value) return

  // Create a unique URL for this ticket type
  qrValue.value = `${window.location.origin}/event/${event.value.id}?ticket=${selectedTicketType.value}`
  showQRModal.value = true
}

const downloadQRCode = () => {
  const canvas = document.querySelector('.qr-code canvas')
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `${event.value.title}-${getSelectedTicketName()}-ticket.png`
  link.href = canvas.toDataURL('image/png')
  link.click()

  // Close the QR modal after download
  showQRModal.value = false
}

// Add this watch effect to handle URL parameters
watch(
  () => route.query,
  (query) => {
    if (query.ticket && event.value) {
      const ticketId = query.ticket
      const ticket = ticketTypes.value.find((t) => t.id === ticketId)
      if (ticket) {
        openPurchaseModalWithTicket(ticketId)
      }
    }
  },
  { immediate: true },
)

function showToaster(message, autoCheckout = false) {
  notification.value = message
  toasterLoading.value = autoCheckout
  if (notificationTimeout.value) clearTimeout(notificationTimeout.value)
  if (toasterTimeout.value) clearTimeout(toasterTimeout.value)
  if (autoCheckout) {
    lastEventPage.value = router.currentRoute.value.fullPath
    toasterTimeout.value = setTimeout(() => {
      notification.value = null
      toasterLoading.value = false
      router.push('/checkout')
    }, 4000) // 4 seconds
  } else {
    notificationTimeout.value = setTimeout(() => {
      notification.value = null
      toasterLoading.value = false
    }, 3000)
  }
}

const addToCart = () => {
  if (!event.value || !selectedTicketType.value) return
  const ticket = ticketTypes.value.find((t) => t.id === selectedTicketType.value)
  if (!ticket) return
  cartStore.addItem({
    eventId: event.value.id,
    eventTitle: event.value.title,
    eventDate: event.value.event_date,
    eventLocation: event.value.location,
    ticketType: ticket.name,
    ticketId: ticket.id,
    quantity: ticketQuantity.value,
    pricePerTicket: ticket.price,
    totalPrice: ticket.price * ticketQuantity.value,
    eventImage: eventImage.value,
  })
  closePurchaseModal()
  showToaster(`${ticketQuantity.value} of ${event.value.title} successfully added to cart`, true)
}

// --- Share Modal Functions ---
const openShareModal = async () => {
  if (!event.value) return // Ensure event data is loaded
  isSharing.value = true
  // Simulate loading/preparation time
  await new Promise((resolve) => setTimeout(resolve, 400))
  isSharing.value = false
  showShareModal.value = true
}

const closeShareModal = () => {
  showShareModal.value = false
}

const shareLink = (platform) => {
  const url = encodeURIComponent(shareUrl.value || window.location.href)
  const title = encodeURIComponent(shareTitle.value || document.title)
  const whatsAppText = encodeURIComponent(`${shareTitle.value} - Check out this event!`)
  const genericText = encodeURIComponent(shareDescription.value || '')

  let shareWindowUrl = ''

  switch (platform) {
    case 'twitter':
      shareWindowUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`
      break
    case 'facebook':
      shareWindowUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
      break
    case 'whatsapp':
      shareWindowUrl = `https://api.whatsapp.com/send?text=${whatsAppText}%20${url}`
      break
    case 'linkedin':
      shareWindowUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${genericText}`
      break
    case 'copy':
      navigator.clipboard
        .writeText(shareUrl.value || window.location.href)
        .then(() => {
          showToaster('Link copied to clipboard!')
          closeShareModal()
        })
        .catch(() => {
          showToaster('Failed to copy link.', false)
        })
      return
    default:
      return
  }

  window.open(shareWindowUrl, '_blank', 'noopener,noreferrer,width=600,height=450')
}
// --- End Share Modal Functions ---

// Add ref for ticket section
const ticketSectionRef = ref(null)

// Update scroll to tickets function with padding
const scrollToTickets = () => {
  if (ticketSectionRef.value) {
    const padding = 20 // Padding from top
    const elementPosition = ticketSectionRef.value.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - padding

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    })
  }
}

// Add back the necessary computed properties and refs
const selectedTicketType = ref(null)

// Calculate available tickets based on total tickets if not explicitly set
const availableTickets = computed(() => {
  if (!event.value) return 0

  // If availableTickets is explicitly set, use it
  if (event.value.availableTickets !== undefined) {
    return event.value.availableTickets
  }

  // Otherwise, use totalTickets (all tickets are initially available)
  return event.value.totalTickets || 0
})

// Update percentageSold to use the availableTickets computed property
const percentageSold = computed(() => {
  if (!event.value || !event.value.totalTickets) return 0

  const totalTickets = event.value.totalTickets
  const available = availableTickets.value
  const sold = totalTickets - available

  return Math.round((sold / totalTickets) * 100)
})

// Update ticketTypes to use the actual ticket types from the event data
const ticketTypes = computed(() => {
  if (!event.value) return []

  // If event has ticketTypes defined from the database, use those
  if (event.value.ticketTypes && Array.isArray(event.value.ticketTypes)) {
    // Find the max price among all ticket types
    const maxPrice = Math.max(...event.value.ticketTypes.map((t) => parseFloat(t.price) || 0))
    // Map event ticket types to display format
    return event.value.ticketTypes.map((ticket, index) => {
      // Generate different styles based on index
      const styles = [
        { icon: 'ticket', isTable: false },
        { icon: 'award', isTable: false },
        { icon: 'grid', isTable: ticket.name?.toLowerCase().includes('table') },
        { icon: 'ticket', isTable: ticket.name?.toLowerCase().includes('table') },
      ]
      const style = styles[index % styles.length]
      const isTableTicket = ticket.name?.toLowerCase().includes('table') || false
      const tableMatch = ticket.name?.match(/table for (\d+)/i)
      const seatsCount = tableMatch ? parseInt(tableMatch[1]) : isTableTicket ? 4 : 0
      const available = ticket.quantity || 0
      // Only highlight if this ticket is the most expensive
      const highlight = (parseFloat(ticket.price) || 0) === maxPrice
      return {
        id: ticket.name?.toLowerCase().replace(/\s+/g, '-') || `ticket-${index}`,
        name: ticket.name || `Ticket ${index + 1}`,
        description: ticket.description || `${ticket.name || 'Regular'} admission ticket`,
        price: parseFloat(ticket.price) || 0,
        available: available > 0,
        availableQuantity: available,
        maxPerPurchase: isTableTicket ? 2 : 10,
        highlight,
        icon: style.icon,
        isTable: isTableTicket,
        seatsCount: seatsCount,
      }
    })
  }
  // Fallback to generated ticket types based on base price
  const basePrice = event.value.price || 0
  const fallbackTypes = [
    {
      id: 'standard',
      name: 'Standard',
      description: 'Regular admission ticket',
      price: basePrice,
      available: true,
      maxPerPurchase: 10,
      icon: 'ticket',
    },
    {
      id: 'vip',
      name: 'VIP',
      description: 'Premium seating + complimentary drink',
      price: basePrice * 1.5,
      available: true,
      maxPerPurchase: 6,
      icon: 'award',
    },
    {
      id: 'group',
      name: 'Table for 4',
      description: 'Reserved seating for 4 people',
      price: basePrice * 3.6,
      available: true,
      maxPerPurchase: 3,
      isTable: true,
      seatsCount: 4,
      icon: 'grid',
    },
    {
      id: 'group8',
      name: 'Table for 8',
      description: 'Reserved seating for 8 people',
      price: basePrice * 7,
      available: true,
      maxPerPurchase: 2,
      isTable: true,
      seatsCount: 8,
      icon: 'grid',
    },
  ].filter((type) => type.available)
  // Find max price in fallback
  const maxFallbackPrice = Math.max(...fallbackTypes.map((t) => t.price))
  return fallbackTypes.map((t) => ({ ...t, highlight: t.price === maxFallbackPrice }))
})

// Format price with currency and make the function a named helper
function formatPrice(price) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price)
}
</script>

<template>
  <div class="event-details">
    <div class="container">
      <!-- Loading state -->
      <div v-if="loading" class="event-details__loading">Loading event details...</div>

      <!-- Error state -->
      <div v-else-if="error" class="event-details__error">
        <p>{{ error }}</p>
        <button @click="goBack" class="event-details__back-button">Go Back</button>
      </div>

      <!-- Event details -->
      <div v-else-if="event" class="event-details__content">
        <button @click="goBack" class="event-details__back-link">
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
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Events
        </button>

        <!-- Event Details Section - Now first in the layout -->
        <div class="event-info">
          <div class="event-info__main">
            <div class="event-info__image-container">
              <SeoImage
                :src="eventImage"
                :alt="event.title"
                :title="event.title"
                imgClass="event-info__image"
                responsive
              />
              <div class="event-info__category">{{ formattedCategory }}</div>
              <div v-if="percentageSold > 75" class="event-info__badge">Hot!</div>
              <div v-if="isExpired" class="event-info__badge event-info__badge--expired">
                Expired
              </div>
            </div>

            <div class="event-info__content">
              <h1 class="event-info__title">{{ event.title }}</h1>

              <div class="event-info__badges">
                <span class="event-info__badge-item">{{ formattedCategory }}</span>
                <span
                  v-if="percentageSold > 75"
                  class="event-info__badge-item event-info__badge-item--hot"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                    ></path>
                  </svg>
                  Popular
                </span>
                <!-- Display subcategories as badges -->
                <span
                  v-for="(subCategory, index) in displaySubCategories"
                  :key="index"
                  class="event-info__badge-item event-info__badge-item--subcategory"
                >
                  {{ subCategory }}
                </span>
              </div>

              <div class="event-info__meta">
                <div class="event-info__meta-item">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <div class="event-info__meta-content">
                    <span class="event-info__meta-label">Date & Time</span>
                    <span class="event-info__meta-value">{{ formattedDate }}</span>
                  </div>
                </div>

                <div class="event-info__meta-item">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <div class="event-info__meta-content">
                    <span class="event-info__meta-label">Location</span>
                    <span class="event-info__meta-value">{{ event.location }}</span>
                  </div>
                </div>

                <div class="event-info__meta-item">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <div class="event-info__meta-content">
                    <span class="event-info__meta-label">Duration</span>
                    <span class="event-info__meta-value">{{ event.duration || '3 hours' }}</span>
                  </div>
                </div>
              </div>

              <div class="event-info__description">
                <h3 class="event-info__section-title">About This Event</h3>
                <p>{{ event.description }}</p>
              </div>

              <div class="event-info__highlights">
                <div
                  v-for="(option, index) in event.eventOptions || mergeEventOptions()"
                  :key="index"
                  class="event-info__highlight-item"
                >
                  <div class="event-info__highlight-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="m9 10 2 2 4-4"></path>
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </div>
                  <span>{{ option }}</span>
                </div>
              </div>

              <div class="event-info__action">
                <!-- Updated Share Button -->
                <button class="event-info__share-btn" @click="openShareModal" :disabled="isSharing">
                  <div v-if="isSharing" class="spinner"></div>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span>{{ isSharing ? 'Preparing...' : 'Share Event' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Ticket Selection Grid -->
        <div
          class="ticket-grid"
          ref="ticketSectionRef"
          :class="{ 'ticket-grid--expired': isExpired }"
        >
          <h2 class="ticket-grid__title">
            <template v-if="isExpired">
              Event Sales Ended
              <div class="ticket-grid__subtitle">Sales ended on {{ formattedSalesEndDate }}</div>
            </template>
            <template v-else> Select Ticket Type </template>
          </h2>

          <div v-if="isExpired" class="ticket-grid__expired-message">
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
              <path d="M12 6v8l4 2"></path>
            </svg>
            <p>This event has expired and tickets are no longer available for purchase.</p>
            <div class="ticket-grid__expired-date">Sales ended on {{ formattedSalesEndDate }}</div>
          </div>

          <div v-else class="ticket-grid__container">
            <div
              v-for="ticket in ticketTypes"
              :key="ticket.id"
              class="ticket-card"
              :class="{
                'ticket-card--highlight': ticket.highlight,
                'ticket-card--table': ticket.isTable,
              }"
              @click="openPurchaseModalWithTicket(ticket.id)"
            >
              <div class="ticket-card__badge-container">
                <div v-if="ticket.highlight" class="ticket-card__badge">Popular</div>
                <div v-if="ticket.isTable" class="ticket-card__badge ticket-card__badge--table">
                  Table
                </div>
              </div>

              <div class="ticket-card__content">
                <div class="ticket-card__icon">
                  <svg
                    v-if="ticket.icon === 'ticket'"
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
                    <path d="M2 9a3 3 0 1 0 0 6v-6Z"></path>
                    <path d="M22 9a3 3 0 1 1 0 6v-6Z"></path>
                    <rect width="18" height="12" x="3" y="6" rx="1.5"></rect>
                    <path d="M12 6v12"></path>
                  </svg>
                  <svg
                    v-else-if="ticket.icon === 'award'"
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
                    <circle cx="12" cy="8" r="6"></circle>
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                  </svg>
                  <svg
                    v-else-if="ticket.icon === 'grid'"
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
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="15" y1="3" x2="15" y2="21"></line>
                  </svg>
                </div>

                <h3 class="ticket-card__name">{{ ticket.name }}</h3>
                <p class="ticket-card__description">{{ ticket.description }}</p>
              </div>

              <div class="ticket-card__price">
                <span class="ticket-card__price-amount">{{ formatPrice(ticket.price) }}</span>
                <span v-if="ticket.isTable" class="ticket-card__seats">
                  {{ ticket.seatsCount }} seats
                </span>
              </div>

              <div class="ticket-card__action">
                <button
                  class="ticket-card__button"
                  :disabled="!ticket.available"
                  @click.stop="openPurchaseModalWithTicket(ticket.id)"
                >
                  <span v-if="!ticket.available">Sold Out</span>
                  <span v-else-if="ticket.availableQuantity <= 5"
                    >Only {{ ticket.availableQuantity }} left</span
                  >
                  <span v-else>SELECT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed Footer - Mobile Only -->
    <div class="fixed-footer" v-if="!isExpired">
      <button class="fixed-footer__button" @click="scrollToTickets">
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
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span> Buy ticket now </span>
      </button>
    </div>

    <!-- Share Modal -->
    <transition name="modal-fade">
      <div v-if="showShareModal" class="share-modal-overlay" @click="closeShareModal">
        <div class="share-modal" @click.stop>
          <div class="share-modal__header">
            <h3 class="share-modal__title">Share this Event</h3>
            <button
              class="share-modal__close"
              @click="closeShareModal"
              aria-label="Close share modal"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="share-modal__body">
            <div class="share-modal__preview">
              <div class="share-modal__preview-image">
                <!-- Use SeoImage for consistent image handling -->
                <SeoImage :src="shareImage" :alt="shareTitle" imgClass="preview-img" />
              </div>
              <div class="share-modal__preview-content">
                <h4 class="share-modal__preview-title">{{ shareTitle }}</h4>
                <p class="share-modal__preview-description">{{ shareDescription }}</p>
                <span class="share-modal__preview-url">{{
                  shareUrl.replace(/^https?:\/\//, '')
                }}</span>
              </div>
            </div>

            <div class="share-modal__platforms">
              <button
                @click="shareLink('twitter')"
                class="share-platform share-platform--twitter"
                aria-label="Share on Twitter"
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"
                  ></path>
                </svg>
                <span>Twitter</span>
              </button>
              <button
                @click="shareLink('facebook')"
                class="share-platform share-platform--facebook"
                aria-label="Share on Facebook"
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                  ></path>
                </svg>
                <span>Facebook</span>
              </button>
              <button
                @click="shareLink('whatsapp')"
                class="share-platform share-platform--whatsapp"
                aria-label="Share on WhatsApp"
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52s-.669-1.611-.916-2.206c-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.204-1.634a11.86 11.86 0 005.79 1.502h.004c6.554 0 11.887-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413Z"
                  ></path>
                </svg>
                <span>WhatsApp</span>
              </button>
              <button
                @click="shareLink('linkedin')"
                class="share-platform share-platform--linkedin"
                aria-label="Share on LinkedIn"
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
                  ></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
                <span>LinkedIn</span>
              </button>
              <button
                @click="shareLink('copy')"
                class="share-platform share-platform--copy"
                aria-label="Copy link"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Premium modal -->
    <div v-if="showPurchaseModal" class="premium-modal-overlay" @click="closePurchaseModal">
      <div class="premium-modal" @click.stop>
        <div class="premium-modal__header">
          <h3 class="premium-modal__title">Quick Purchase</h3>
          <button class="premium-modal__close" @click="closePurchaseModal">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="premium-modal__body">
          <div v-if="event" class="premium-modal__content">
            <h4 class="premium-modal__event-title">{{ event.title }}</h4>
            <p class="premium-modal__event-details">{{ formattedDate }} • {{ event.location }}</p>

            <div class="premium-modal__ticket-section">
              <div class="premium-modal__ticket-info">
                <div class="premium-modal__ticket-type">
                  <span>Selected ticket:</span>
                  <strong>{{ getSelectedTicketName() }}</strong>
                </div>
                <div class="premium-modal__ticket-price">
                  <span>Price:</span>
                  <strong>{{ getSelectedTicketPrice() }}</strong>
                </div>
              </div>

              <div class="premium-modal__quantity-container">
                <div class="premium-modal__quantity-label">Quantity:</div>
                <div class="premium-modal__quantity-controls" aria-label="Change ticket quantity">
                  <button
                    class="premium-modal__quantity-btn premium-modal__quantity-btn--minus"
                    @click="decrementQuantity"
                    :disabled="ticketQuantity <= 1"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span class="premium-modal__quantity-value">{{ ticketQuantity }}</span>
                  <button
                    class="premium-modal__quantity-btn premium-modal__quantity-btn--plus"
                    @click="incrementQuantity"
                    :disabled="ticketQuantity >= 10"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div class="premium-modal__divider"></div>

            <div class="premium-modal__summary">
              <div class="premium-modal__total-label">Total</div>
              <div class="premium-modal__total-value">{{ calculateTotal() }}</div>
            </div>

            <div class="premium-modal__actions">
              <button
                class="premium-modal__favorite"
                @click="addToCart"
                :disabled="!selectedTicketType || ticketQuantity < 1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="3" y1="15" x2="21" y2="15"></line>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                  <line x1="15" y1="3" x2="15" y2="21"></line>
                </svg>
                <span>Buy Now</span>
              </button>
              <button class="premium-modal__qr" @click="generateQRCode">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Generate QR Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add this new QR Code modal after the premium modal -->
    <div v-if="showQRModal" class="qr-modal-overlay" @click="showQRModal = false">
      <div class="qr-modal" @click.stop>
        <div class="qr-modal__header">
          <h3 class="qr-modal__title">QR Code for {{ getSelectedTicketName() }}</h3>
          <button class="qr-modal__close" @click="showQRModal = false">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="qr-modal__body">
          <div class="qr-code">
            <QRCode
              :value="qrValue"
              :size="200"
              level="H"
              render-as="canvas"
              :foreground="'#000000'"
              :background="'#ffffff'"
            />
          </div>
          <p class="qr-modal__description">Scan this QR code to quickly access this ticket type</p>
          <button class="qr-modal__download" @click="downloadQRCode">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download QR Code
          </button>
        </div>
      </div>
    </div>

    <transition name="toaster-fade">
      <div v-if="notification" class="toaster-notification world-class-toaster">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="toaster-icon"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2l4-4" />
        </svg>
        <span class="toaster-message">{{ notification }}</span>
        <button class="toaster-close" @click="notification = null" aria-label="Close notification">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div v-if="toasterLoading" class="toaster-loading-bar world-class-loader"></div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.event-details {
  padding: 2rem 0;
}

.event-details__loading,
.event-details__error {
  text-align: center;
  padding: 3rem 0;
  color: rgba(255, 255, 255, 0.7);
}

.event-details__error {
  color: var(--error);
}

.event-details__back-button {
  margin-top: 1rem;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.event-details__back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 0;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: color 0.3s ease;
}

.event-details__back-link:hover {
  color: var(--text-color);
}

/* Ticket Grid Styles */
.ticket-grid {
  margin-bottom: 3.5rem;
  width: 90%;
  margin-left: auto;
  margin-right: auto;
  margin-top: 4rem;
  padding-top: 3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.ticket-grid__title {
  font-size: 2.25rem;
  margin-bottom: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-align: center;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.ticket-grid__container {
  display: grid;
  gap: 1.8rem;
  grid-template-columns: repeat(4, 1fr);
}

/* Event Info Styles - New section for event details */
.event-info {
  /* Styles for the event info section */
}

.event-info__main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
}

.event-info__image-container {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.event-info__image {
  width: 100%;
  height: auto;
  display: block;
}

.event-info__category {
  position: absolute;
  top: 15px;
  left: 15px;
  background-color: var(--primary);
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  text-transform: capitalize;
}

.event-info__badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: #ff9f43;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
}

.event-info__content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.event-info__title {
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.event-info__badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: -0.5rem;
}

.event-info__badge-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.event-info__badge-item--hot {
  background-color: rgba(255, 87, 34, 0.15);
  color: #ff7043;
  border-color: rgba(255, 87, 34, 0.3);
}

.event-info__badge-item--subcategory {
  background-color: rgba(110, 231, 183, 0.15);
  color: rgb(110, 231, 183);
  border-color: rgba(110, 231, 183, 0.3);
}

.event-info__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.25rem;
  margin-top: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.event-info__meta-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.event-info__meta-item svg {
  color: var(--primary);
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.event-info__meta-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.event-info__meta-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.event-info__meta-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: white;
  line-height: 1.4;
}

.event-info__description {
  margin-top: 0.5rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
}

.event-info__section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: white;
  position: relative;
  padding-bottom: 0.75rem;
}

.event-info__section-title:after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 3rem;
  height: 2px;
  background: var(--primary);
  border-radius: 2px;
}

.event-info__highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

.event-info__highlight-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
}

.event-info__highlight-icon {
  color: var(--primary);
}

.event-info__action {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

/* Updated Share Button Styles */
.event-info__share-btn {
  display: inline-flex; /* Use inline-flex for better alignment with spinner */
  align-items: center;
  justify-content: center; /* Center content */
  gap: 0.75rem;
  background-color: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px; /* Adjusted for slightly longer text */
  position: relative; /* Needed for spinner */
  overflow: hidden; /* To contain potential hover effects */
}

.event-info__share-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.event-info__share-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* Spinner Animation */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff; /* Or var(--primary) for branded spinner */
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Remove favorite specific styles if any were missed */
/*
.event-info__favorite-btn svg.filled {
  fill: var(--primary);
  stroke: var(--primary);
}
*/

/* Ticket Card Styles */
.ticket-card {
  background: linear-gradient(145deg, rgba(40, 40, 55, 0.8), rgba(30, 30, 45, 0.95));
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.2);
  height: 100%;
  cursor: pointer;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ticket-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.15);
  z-index: 1;
}

.ticket-card--highlight {
  background: linear-gradient(145deg, rgba(50, 20, 40, 0.9), rgba(70, 25, 55, 0.8));
  border-color: rgba(232, 67, 147, 0.3);
}

.ticket-card--highlight:hover {
  box-shadow: 0 10px 25px rgba(232, 67, 147, 0.2);
}

.ticket-card--table {
  background: linear-gradient(145deg, rgba(40, 35, 10, 0.9), rgba(60, 50, 15, 0.8));
  border-color: rgba(255, 215, 0, 0.2);
}

.ticket-card--table:hover {
  box-shadow: 0 10px 25px rgba(255, 215, 0, 0.15);
}

.ticket-card__badge-container {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  display: flex;
  gap: 0.5rem;
  z-index: 1;
}

.ticket-card__badge {
  background-color: var(--primary);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.ticket-card__badge--table {
  background-color: rgba(255, 215, 0, 0.8);
  color: #000;
}

.ticket-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.ticket-card__icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  padding: 8px;
}

.ticket-card--highlight .ticket-card__icon {
  color: var(--primary);
  background-color: rgba(232, 67, 147, 0.1);
}

.ticket-card--table .ticket-card__icon {
  color: rgba(255, 215, 0, 0.8);
  background-color: rgba(255, 215, 0, 0.1);
}

.ticket-card__name {
  font-size: 1.3rem;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.ticket-card__description {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.4;
}

.ticket-card__price {
  margin-bottom: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  z-index: 1;
}

.ticket-card__price-amount {
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  line-height: 1;
  word-break: break-all;
  overflow-wrap: break-word;
  max-width: 100%;
  white-space: normal;
  text-overflow: ellipsis;
  overflow: hidden;
  display: block;
}

.ticket-card--highlight .ticket-card__price-amount {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 0 10px rgba(232, 67, 147, 0.5);
}

.ticket-card--table .ticket-card__price-amount {
  color: rgba(255, 215, 0, 0.9);
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.ticket-card__seats {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.ticket-card__action {
  margin-top: auto;
  position: relative;
  z-index: 1;
}

.ticket-card__button {
  background-color: rgba(255, 255, 255, 0.12);
  color: white;
  border: none;
  padding: 0.75rem 0;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  letter-spacing: 0.05em;
  position: relative;
  overflow: hidden;
}

.ticket-card__button:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.ticket-card__button:hover:before {
  left: 100%;
}

.ticket-card__button:hover {
  background-color: var(--primary);
  box-shadow: 0 4px 10px rgba(232, 67, 147, 0.3);
}

.ticket-card--highlight .ticket-card__button {
  background-color: rgba(232, 67, 147, 0.25);
}

.ticket-card--highlight .ticket-card__button:hover {
  background-color: var(--primary);
}

.ticket-card--table .ticket-card__button {
  background-color: rgba(255, 215, 0, 0.2);
}

.ticket-card--table .ticket-card__button:hover {
  background-color: rgba(255, 215, 0, 0.8);
  color: #000;
  box-shadow: 0 4px 10px rgba(255, 215, 0, 0.3);
}

.ticket-card__button:disabled {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive styles */
@media (max-width: 1200px) {
  .ticket-grid__container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 960px) {
  .ticket-grid__container {
    grid-template-columns: repeat(2, 1fr);
  }

  .event-info__main {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .ticket-grid__container {
    grid-template-columns: 1fr;
  }

  .ticket-grid__title {
    font-size: 1.75rem;
  }

  .event-info__title {
    font-size: 1.75rem;
  }
}

/* Share Modal Styles */
.share-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(10, 10, 20, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000; /* Higher than purchase modal */
  backdrop-filter: blur(8px) saturate(150%);
  transition: opacity 0.3s ease;
}

.share-modal {
  background: linear-gradient(150deg, rgba(45, 45, 65, 0.98), rgba(35, 35, 55, 0.98));
  border-radius: 16px;
  width: 550px;
  max-width: calc(100vw - 40px); /* Ensure some padding on small screens */
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
}

/* Modal fade animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .share-modal,
.modal-fade-leave-active .share-modal {
  transition:
    transform 0.3s cubic-bezier(0.25, 1, 0.5, 1),
    opacity 0.3s ease;
}
.modal-fade-enter-from .share-modal,
.modal-fade-leave-to .share-modal {
  transform: translateY(30px) scale(0.95);
  opacity: 0;
}

.share-modal__header {
  padding: 1.25rem 1.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  flex-shrink: 0;
}

.share-modal__title {
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.share-modal__close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.35rem;
  display: flex;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.share-modal__close:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg) scale(1.1);
}

.share-modal__body {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem; /* Slightly reduced gap */
  overflow-y: auto; /* Allow scrolling for content if needed */
}

.share-modal__preview {
  display: flex;
  gap: 1.25rem; /* Reduced gap */
  background: rgba(255, 255, 255, 0.04);
  padding: 1.25rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.share-modal__preview-image {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.05); /* Placeholder bg */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.share-modal__preview-image .preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 8px; /* Ensure image itself has rounded corners if container clips */
}

.share-modal__preview-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden; /* Prevent text overflow */
  flex: 1; /* Allow content to take available space */
}

.share-modal__preview-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.4rem 0;
  line-height: 1.3;
  white-space: nowrap; /* Consider changing if titles are long */
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-modal__preview-description {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Show 2 lines, then ellipsis */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: calc(0.85rem * 1.4 * 2); /* Fallback for non-webkit */
}

.share-modal__preview-url {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: lowercase;
  margin-top: auto; /* Push to bottom if space allows */
}

.share-modal__platforms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  width: 100%;
}

.share-platform {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
  width: 100%; /* Ensure full width */
  min-width: 140px; /* Minimum width to prevent text wrapping */
  white-space: nowrap; /* Prevent text from wrapping */
  overflow: visible; /* Allow text to be visible */
}

.share-platform svg {
  width: 20px; /* Slightly smaller icons */
  height: 20px;
  fill: currentColor;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.share-platform span {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: visible;
}

@media (max-width: 480px) {
  .share-modal__platforms {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .share-platform {
    padding: 0.85rem 1rem;
    justify-content: flex-start;
    min-width: unset;
  }

  .share-platform span {
    font-size: 0.9rem;
  }
}

.share-platform:hover {
  transform: translateY(-3px) scale(1.02);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  color: white;
}

.share-platform:hover svg {
  transform: scale(1.1);
}

/* Platform-specific hover colors */
.share-platform--twitter:hover {
  color: #1da1f2;
  border-color: rgba(29, 161, 242, 0.4);
  background-color: rgba(29, 161, 242, 0.1);
}
.share-platform--facebook:hover {
  color: #1877f2;
  border-color: rgba(24, 119, 242, 0.4);
  background-color: rgba(24, 119, 242, 0.1);
}
.share-platform--whatsapp:hover {
  color: #25d366;
  border-color: rgba(37, 211, 102, 0.4);
  background-color: rgba(37, 211, 102, 0.1);
}
.share-platform--linkedin:hover {
  color: #0a66c2;
  border-color: rgba(10, 102, 194, 0.4);
  background-color: rgba(10, 102, 194, 0.1);
}
.share-platform--copy:hover {
  color: var(--primary);
  border-color: rgba(232, 67, 147, 0.4);
  background-color: rgba(232, 67, 147, 0.1);
}

/* Premium modal styles */
.premium-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;
}

.premium-modal {
  background: linear-gradient(145deg, rgba(40, 40, 55, 0.95), rgba(30, 30, 45, 0.98));
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transform: translateY(0);
  animation: modalSlideIn 0.3s ease;
}

@media (max-width: 480px) {
  .premium-modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .premium-modal {
    width: 100%;
    max-width: 100%;
    height: auto;
    max-height: 80vh;
    border-radius: 16px 16px 0 0;
    margin: 0;
    animation: modalSlideUp 0.3s ease;
  }

  .premium-modal__header {
    padding: 0.75rem 1rem;
    position: sticky;
    top: 0;
    background: inherit;
    z-index: 2;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .premium-modal__title {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .premium-modal__body {
    padding: 0.75rem 1rem;
  }

  .premium-modal__content {
    gap: 1rem;
  }

  .premium-modal__event-title {
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }

  .premium-modal__event-details {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .premium-modal__ticket-section {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .premium-modal__ticket-info {
    gap: 0.5rem;
  }

  .premium-modal__ticket-type,
  .premium-modal__ticket-price {
    font-size: 0.85rem;
  }

  .premium-modal__ticket-type span,
  .premium-modal__ticket-price span {
    font-size: 0.75rem;
  }

  .premium-modal__quantity-container {
    margin-top: 0.25rem;
  }

  .premium-modal__quantity-label {
    font-size: 0.85rem;
  }

  .premium-modal__quantity-controls {
    padding: 0.2rem 0.4rem;
    gap: 0.5rem;
  }

  .premium-modal__quantity-btn {
    width: 28px;
    height: 28px;
    font-size: 1.2rem;
  }

  .premium-modal__quantity-value {
    font-size: 0.9rem;
    min-width: 1.8rem;
  }

  .premium-modal__total-label {
    font-size: 0.9rem;
  }

  .premium-modal__total-value {
    font-size: 1.1rem;
  }

  .premium-modal__actions {
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .premium-modal__favorite,
  .premium-modal__qr {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.85rem;
    height: 42px;
  }
}

/* Adjust landscape mode */
@media (max-height: 480px) and (orientation: landscape) {
  .premium-modal {
    max-height: 100vh;
    border-radius: 0;
  }

  .premium-modal__body {
    max-height: calc(100vh - 50px);
  }

  .premium-modal__actions {
    position: sticky;
    bottom: 0;
    background: inherit;
    padding: 0.5rem 0;
    margin-top: 0.5rem;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.premium-modal__header {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.premium-modal__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
  color: white;
}

.premium-modal__close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.premium-modal__close:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.premium-modal__body {
  padding: 1.5rem;
}

.premium-modal__content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.premium-modal__event-title {
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.premium-modal__event-details {
  font-size: 0.9rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
}

.premium-modal__ticket-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: rgba(255, 255, 255, 0.04);
  padding: 1rem;
  border-radius: 8px;
}

.premium-modal__ticket-info {
  display: flex;
  justify-content: space-between;
}

.premium-modal__ticket-type,
.premium-modal__ticket-price {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.premium-modal__ticket-type span,
.premium-modal__ticket-price span {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.premium-modal__quantity-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.premium-modal__quantity-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.premium-modal__quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 2px 8px rgba(232, 67, 147, 0.04);
}

.premium-modal__quantity-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  transition:
    background 0.2s,
    border 0.2s,
    color 0.2s;
  font-size: 1.5rem;
  box-shadow: 0 2px 8px rgba(232, 67, 147, 0.08);
}

.premium-modal__quantity-btn svg {
  width: 24px;
  height: 24px;
  stroke: white !important;
  fill: none;
  display: block;
}

.premium-modal__quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.premium-modal__quantity-btn:not(:disabled):hover {
  background-color: var(--primary, #e84393);
  border-color: var(--primary, #e84393);
  color: #fff;
}

.premium-modal__quantity-value {
  font-weight: 700;
  font-size: 1.15rem;
  min-width: 2.2rem;
  text-align: center;
  color: #fff;
  letter-spacing: 0.03em;
}

.premium-modal__divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

.premium-modal__summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
}

.premium-modal__total-label {
  font-size: 1rem;
  font-weight: 600;
}

.premium-modal__total-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

.premium-modal__actions {
  display: block;
  margin-top: 1.5rem;
}

.premium-modal__actions button {
  width: 100%;
  margin-bottom: 0.75rem;
  justify-content: center;
}

.premium-modal__actions button:last-child {
  margin-bottom: 0;
}

@media (min-width: 768px) {
  .premium-modal__actions {
    display: flex;
    gap: 1rem;
  }

  .premium-modal__actions button {
    width: auto;
    margin-bottom: 0;
  }
}

.premium-modal__favorite,
.premium-modal__qr {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  font-size: 0.85rem;
}

.premium-modal__qr {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

@media (min-width: 768px) {
  .premium-modal__favorite,
  .premium-modal__qr {
    width: auto;
  }
}

.premium-modal__favorite:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.premium-modal__favorite svg {
  stroke: currentColor;
  fill: none;
  transition: all 0.2s ease;
}

.premium-modal__favorite svg.filled {
  fill: var(--primary);
  stroke: var(--primary);
}

.premium-modal__qr {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.premium-modal__qr:hover {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.premium-modal__qr svg {
  stroke: currentColor;
  fill: none;
}

.qr-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(5px);
}

.qr-modal {
  background: linear-gradient(145deg, rgba(40, 40, 55, 0.95), rgba(30, 30, 45, 0.98));
  border-radius: 12px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.qr-modal__header {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.qr-modal__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: white;
}

.qr-modal__close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.qr-modal__close:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.qr-modal__body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.qr-code {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.qr-modal__description {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin: 0;
  font-size: 0.9rem;
}

.qr-modal__download {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qr-modal__download:hover {
  background-color: var(--primary-dark, #d62e7e);
  box-shadow: 0 4px 10px rgba(232, 67, 147, 0.3);
}

.qr-modal__download svg {
  stroke: currentColor;
  fill: none;
}

.toaster-notification.world-class-toaster {
  position: fixed !important;
  top: 24px !important;
  right: 24px !important;
  z-index: 9999;
  min-width: 320px;
  max-width: 380px;
  background: rgba(28, 28, 35, 0.85);
  backdrop-filter: blur(8px);
  color: #fff;
  padding: 0.85rem 2.75rem 0.85rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow:
    0 2px 12px -3px rgba(0, 0, 0, 0.3),
    0 6px 24px -8px rgba(0, 0, 0, 0.6);
  transform-origin: top right;
  animation: toasterSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.toaster-message {
  font-weight: 400;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
  letter-spacing: 0.01em;
}

.toaster-icon {
  color: #10b981;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  animation: toasterIconScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-left: 0.25rem;
}

.toaster-close {
  position: absolute;
  top: 50%;
  right: 0.6rem;
  transform: translateY(-50%);
  padding: 0.35rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.toaster-close:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.08);
}

.toaster-close svg {
  width: 14px;
  height: 14px;
  stroke-width: 2.5;
}

.toaster-loading-bar.world-class-loader {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary), #f472b6);
  animation: loadingBarProgress 4s linear forwards;
  opacity: 0.8;
}

@keyframes toasterSlideIn {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toasterIconScale {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes loadingBarProgress {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}

.toaster-fade-enter-active,
.toaster-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.toaster-fade-enter-from,
.toaster-fade-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

@media (max-width: 480px) {
  .toaster-notification.world-class-toaster {
    top: 16px;
    right: 16px;
    left: 16px;
    min-width: unset;
    max-width: unset;
    padding: 0.75rem 2.5rem 0.75rem 0.85rem;
    border-radius: 6px;
    gap: 0.6rem;
  }

  .toaster-message {
    font-size: 0.8125rem;
  }

  .toaster-icon {
    width: 14px;
    height: 14px;
  }

  .toaster-close {
    padding: 0.3rem;
    right: 0.45rem;
  }

  .toaster-close svg {
    width: 13px;
    height: 13px;
  }

  .toaster-loading-bar.world-class-loader {
    height: 1.5px;
  }
}

/* Updated Fixed Footer Styles */
.fixed-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: none; /* Hidden by default for desktop */
  filter: drop-shadow(0 -4px 20px rgba(232, 67, 147, 0.2));
}

.fixed-footer__button {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #e84393;
  color: white;
  border: none;
  padding: 1.15rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-radius: 0;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.fixed-footer__button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.fixed-footer__button:active {
  transform: translateY(1px);
}

.fixed-footer__button:hover::before {
  left: 100%;
}

.fixed-footer__button svg {
  width: 22px;
  height: 22px;
  stroke: white;
  stroke-width: 1.75;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.fixed-footer__button:hover svg {
  transform: translateX(-3px);
}

.fixed-footer__button span {
  transform: translateX(0);
  transition: transform 0.3s ease;
}

.fixed-footer__button:hover span {
  transform: translateX(3px);
}

/* Show only on mobile */
@media (max-width: 768px) {
  .fixed-footer {
    display: block;
  }

  /* Adjust bottom padding for content on mobile */
  .event-details {
    padding-bottom: calc(2rem + 60px);
  }
}

/* Remove desktop styles */
@media (min-width: 769px) {
  .event-details {
    padding-bottom: 2rem;
  }
}

.event-info__badge--expired {
  background-color: rgba(255, 59, 48, 0.9);
  color: white;
}

.ticket-grid__subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
  font-weight: normal;
}

.ticket-grid__expired-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem;
  background: rgba(75, 75, 75, 0.1);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  gap: 1.5rem;
}

.ticket-grid__expired-message svg {
  color: rgba(255, 255, 255, 0.6);
}

.ticket-grid__expired-message p {
  font-size: 1.1rem;
  margin: 0;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7);
}

.ticket-grid__expired-date {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.ticket-grid__subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
  font-weight: normal;
}

.ticket-grid--expired {
  opacity: 0.8;
  background: rgba(18, 18, 24, 0.2);
  border-color: rgba(255, 255, 255, 0.03);
  padding: 2rem;
  border-radius: 12px;
}
</style>

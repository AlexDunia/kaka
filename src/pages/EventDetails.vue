<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '@/stores/events'

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()

const loading = ref(true)
const error = ref(null)
const event = computed(() => eventStore.currentEvent)
const showPurchaseModal = ref(false)

// Predefined event images - same as EventCard
const eventImages = [
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Miss-Treasure-Base_gh6jnz.jpg',
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/6th-Service-with-mudiaga_1_hjvlab.jpg',
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Comedy-Meets-dance_s2egap.jpg',
  'https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339804/IMG-20250219-WA0008_entmwi.jpg',
]

// Select a random image or use a specific one based on event index if available
const eventImage = computed(() => {
  if (!event.value) return eventImages[0]

  if (event.value.imageIndex !== undefined && eventImages[event.value.imageIndex]) {
    return eventImages[event.value.imageIndex]
  }

  // Use a deterministic "random" based on the event ID to keep it consistent
  const id = parseInt(event.value.id) || 0
  return eventImages[id % eventImages.length]
})

// Format date
const formattedDate = computed(() => {
  if (!event.value) return ''

  const eventDate = new Date(event.value.date)
  return eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

// Calculate percentage of tickets sold
const percentageSold = computed(() => {
  if (!event.value) return 0

  const sold = event.value.totalTickets - event.value.availableTickets
  return Math.round((sold / event.value.totalTickets) * 100)
})

// Simplified ticket types for display in cards
const ticketTypes = computed(() => {
  if (!event.value) return []

  const basePrice = event.value.price

  return [
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
      highlight: true,
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
})

const selectedTicketType = ref(null)

// Format price with currency and make the function a named helper
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

// Open purchase modal with pre-selected ticket type
const openPurchaseModalWithTicket = (ticketTypeId) => {
  console.log('Opening modal for ticket type:', ticketTypeId)

  selectedTicketType.value = ticketTypeId

  // Small delay to ensure Vue has updated the props
  setTimeout(() => {
    showPurchaseModal.value = true
    console.log('Modal should be visible now')
  }, 50)
}

// Load event on mount
onMounted(async () => {
  const eventId = route.params.id

  try {
    await eventStore.fetchEventById(eventId)

    if (!event.value) {
      error.value = 'Event not found'
    }
  } catch (err) {
    error.value = err.message || 'Failed to load event details'
  } finally {
    loading.value = false
  }
})

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

// Add favorites functionality
const favorites = ref([])

// Check if event is in favorites
const isEventInFavorites = computed(() => {
  return event.value && favorites.value.includes(event.value.id)
})

// Toggle favorite status
const toggleFavorite = () => {
  if (!event.value) return

  if (isEventInFavorites.value) {
    // Remove from favorites
    const index = favorites.value.indexOf(event.value.id)
    favorites.value.splice(index, 1)
    showToast('Removed from favorites')
  } else {
    // Add to favorites
    favorites.value.push(event.value.id)
    showToast('Added to favorites')
  }
}

// Toast notification
const showToast = (message) => {
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('show')
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 2000)
  }, 10)
}

// Simplified purchase function
const quickPurchase = () => {
  const ticket = ticketTypes.value.find((t) => t.id === selectedTicketType.value)
  if (!ticket) return

  alert(`Thank you! Your ${ticket.name} ticket has been booked. Check your email for confirmation.`)
  closePurchaseModal()
}

// Close purchase modal - combined version
const closePurchaseModal = () => {
  console.log('Closing purchase modal')
  showPurchaseModal.value = false
  selectedTicketType.value = null
  ticketQuantity.value = 1
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
              <img :src="eventImage" :alt="event.title" class="event-info__image" />
              <div class="event-info__category">{{ event.category }}</div>
              <div v-if="percentageSold > 75" class="event-info__badge">Hot!</div>
            </div>

            <div class="event-info__content">
              <h1 class="event-info__title">{{ event.title }}</h1>

              <div class="event-info__badges">
                <span class="event-info__badge-item">{{ event.category }}</span>
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
                <div class="event-info__highlight-item">
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
                  <span>Live performance</span>
                </div>
                <div class="event-info__highlight-item">
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
                  <span>Food & drinks available</span>
                </div>
                <div class="event-info__highlight-item">
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
                  <span>Indoor event</span>
                </div>
              </div>

              <div class="event-info__tickets-availability">
                <h3 class="event-info__section-title">Ticket Availability</h3>
                <div class="event-info__progress">
                  <div
                    class="event-info__progress-bar"
                    :style="{ width: `${percentageSold}%` }"
                  ></div>
                </div>
                <div class="event-info__progress-text">
                  <div class="event-info__progress-stats">
                    <span class="event-info__progress-number">{{ event.availableTickets }}</span>
                    <span class="event-info__progress-label">tickets left</span>
                  </div>
                  <div class="event-info__progress-stats">
                    <span class="event-info__progress-number">{{ percentageSold }}%</span>
                    <span class="event-info__progress-label">sold</span>
                  </div>
                </div>
              </div>

              <div class="event-info__action">
                <button class="event-info__favorite-btn" @click="toggleFavorite">
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
                    :class="{ filled: isEventInFavorites }"
                  >
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    ></path>
                  </svg>
                  <span>{{ isEventInFavorites ? 'Saved to Favorites' : 'Add to Favorites' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Ticket Selection Grid - Now below event details -->
        <div class="ticket-grid">
          <h2 class="ticket-grid__title">Select Ticket Type</h2>
          <div class="ticket-grid__container">
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
                  :disabled="event.availableTickets === 0"
                  @click.stop="openPurchaseModalWithTicket(ticket.id)"
                >
                  <span v-if="event.availableTickets === 0">Sold Out</span>
                  <span v-else>SELECT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
                <div class="premium-modal__quantity-controls">
                  <button
                    class="premium-modal__quantity-btn"
                    @click="decrementQuantity"
                    :disabled="ticketQuantity <= 1"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  <span class="premium-modal__quantity-value">{{ ticketQuantity }}</span>
                  <button
                    class="premium-modal__quantity-btn"
                    @click="incrementQuantity"
                    :disabled="ticketQuantity >= 10"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
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
              <button class="premium-modal__favorite" @click="toggleFavorite">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  ></path>
                </svg>
                <span>{{ isEventInFavorites ? 'Saved to Favorites' : 'Add to Favorites' }}</span>
              </button>
              <button class="premium-modal__purchase" @click="quickPurchase">
                <span>Buy now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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

.event-info__tickets-availability {
  margin-top: 0.5rem;
}

.event-info__progress {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 100px;
  overflow: hidden;
  margin-bottom: 0.85rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.event-info__progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), #ff6b9d);
  border-radius: 100px;
  box-shadow: 0 2px 5px rgba(232, 67, 147, 0.3);
}

.event-info__progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.event-info__progress-stats {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.event-info__progress-number {
  font-weight: 600;
  font-size: 1.1rem;
  color: white;
}

.event-info__progress-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.event-info__action {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

.event-info__favorite-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.event-info__favorite-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.event-info__favorite-btn svg {
  transition: all 0.2s;
}

.event-info__favorite-btn svg.filled {
  fill: var(--primary);
  stroke: var(--primary);
}

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
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transform: translateY(0);
  animation: modalSlideIn 0.3s ease;
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
  justify-content: space-between;
  align-items: center;
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
  background-color: rgba(255, 255, 255, 0.06);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.premium-modal__quantity-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.premium-modal__quantity-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}

.premium-modal__quantity-btn:disabled {
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
}

.premium-modal__quantity-value {
  font-weight: 600;
  font-size: 1rem;
  min-width: 1.5rem;
  text-align: center;
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
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.premium-modal__favorite {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
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

.premium-modal__purchase {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.premium-modal__purchase:hover {
  background-color: var(--primary-dark, #d62e7e);
  box-shadow: 0 4px 10px rgba(232, 67, 147, 0.3);
}

/* Toast notification styles */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background-color: rgba(40, 40, 55, 0.95);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 2000;
  opacity: 0;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}
</style>

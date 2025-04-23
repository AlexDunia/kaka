<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePurchaseStore } from '@/stores/purchases'
import Modal from '@/components/Modal.vue'

const authStore = useAuthStore()
const purchaseStore = usePurchaseStore()

const loading = ref(true)
const error = ref(null)
const selectedTicket = ref(null)
const showCancelModal = ref(false)
const cancelLoading = ref(false)
const cancelError = ref(null)
const cancelSuccess = ref(false)

// Load user's purchases
onMounted(async () => {
  try {
    await purchaseStore.fetchUserPurchases()
  } catch (err) {
    error.value = err.message || 'Failed to load your purchases'
  } finally {
    loading.value = false
  }
})

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

// Show cancel confirmation modal
const showCancelConfirmation = (ticket) => {
  selectedTicket.value = ticket
  showCancelModal.value = true
  cancelError.value = null
  cancelSuccess.value = false
}

// Cancel purchase
const cancelPurchase = async () => {
  if (!selectedTicket.value) return

  cancelLoading.value = true
  cancelError.value = null

  try {
    await purchaseStore.cancelPurchase(selectedTicket.value.id)
    cancelSuccess.value = true

    // Refresh purchases after a short delay
    setTimeout(() => {
      closeCancelModal()
      purchaseStore.fetchUserPurchases()
    }, 2000)
  } catch (err) {
    cancelError.value = err.message || 'Failed to cancel purchase'
  } finally {
    cancelLoading.value = false
  }
}

// Close cancel modal
const closeCancelModal = () => {
  if (!cancelLoading.value) {
    showCancelModal.value = false
    selectedTicket.value = null
    cancelSuccess.value = false
  }
}

// Computed properties
const hasUpcomingTickets = computed(() => {
  return purchaseStore.upcomingPurchases.length > 0
})

const hasPastTickets = computed(() => {
  return purchaseStore.pastPurchases.length > 0
})

const formattedTotalSpent = computed(() => {
  return formatPrice(purchaseStore.totalSpent)
})
</script>

<template>
  <div class="dashboard">
    <div class="container">
      <header class="dashboard__header">
        <h1 class="dashboard__title">Your Dashboard</h1>
        <p class="dashboard__greeting">Welcome back, {{ authStore.user?.name }}</p>
      </header>

      <div v-if="loading" class="dashboard__loading">Loading your purchases...</div>

      <div v-else-if="error" class="dashboard__error">
        {{ error }}
      </div>

      <div v-else class="dashboard__content">
        <!-- Purchase Stats -->
        <div class="dashboard__stats">
          <div class="dashboard__stat-card">
            <div class="dashboard__stat-value">{{ purchaseStore.purchases.length }}</div>
            <div class="dashboard__stat-label">Total Bookings</div>
          </div>

          <div class="dashboard__stat-card">
            <div class="dashboard__stat-value">{{ purchaseStore.upcomingPurchases.length }}</div>
            <div class="dashboard__stat-label">Upcoming Events</div>
          </div>

          <div class="dashboard__stat-card">
            <div class="dashboard__stat-value">{{ formattedTotalSpent }}</div>
            <div class="dashboard__stat-label">Total Spent</div>
          </div>
        </div>

        <!-- Upcoming Tickets -->
        <section class="dashboard__section">
          <h2 class="dashboard__section-title">Upcoming Tickets</h2>

          <div v-if="!hasUpcomingTickets" class="dashboard__empty">
            <p>You don't have any upcoming events.</p>
            <router-link to="/" class="dashboard__browse-link">Browse Events</router-link>
          </div>

          <div v-else class="dashboard__tickets">
            <div
              v-for="ticket in purchaseStore.upcomingPurchases"
              :key="ticket.id"
              class="ticket-card"
            >
              <div class="ticket-card__header">
                <div class="ticket-card__event">{{ ticket.eventTitle }}</div>
                <div
                  class="ticket-card__status"
                  :class="{ 'ticket-card__status--cancelled': ticket.status === 'cancelled' }"
                >
                  {{ ticket.status }}
                </div>
              </div>

              <div class="ticket-card__details">
                <div class="ticket-card__info">
                  <div class="ticket-card__info-item">
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
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>{{ formatDate(ticket.eventDate) }}</span>
                  </div>

                  <div class="ticket-card__info-item">
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
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{{ ticket.eventLocation }}</span>
                  </div>

                  <div class="ticket-card__info-item">
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
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <span
                      >{{ ticket.quantity }} {{ ticket.quantity > 1 ? 'tickets' : 'ticket' }}</span
                    >
                  </div>
                </div>

                <div class="ticket-card__actions">
                  <div class="ticket-card__price">{{ formatPrice(ticket.totalPrice) }}</div>

                  <button
                    v-if="ticket.status === 'confirmed'"
                    class="ticket-card__cancel-btn"
                    @click="showCancelConfirmation(ticket)"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Past Tickets -->
        <section class="dashboard__section" v-if="hasPastTickets">
          <h2 class="dashboard__section-title">Past Events</h2>

          <div class="dashboard__tickets">
            <div
              v-for="ticket in purchaseStore.pastPurchases"
              :key="ticket.id"
              class="ticket-card ticket-card--past"
            >
              <div class="ticket-card__header">
                <div class="ticket-card__event">{{ ticket.eventTitle }}</div>
                <div
                  class="ticket-card__status"
                  :class="{ 'ticket-card__status--cancelled': ticket.status === 'cancelled' }"
                >
                  {{ ticket.status }}
                </div>
              </div>

              <div class="ticket-card__details">
                <div class="ticket-card__info">
                  <div class="ticket-card__info-item">
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
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>{{ formatDate(ticket.eventDate) }}</span>
                  </div>

                  <div class="ticket-card__info-item">
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
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{{ ticket.eventLocation }}</span>
                  </div>

                  <div class="ticket-card__info-item">
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
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <span
                      >{{ ticket.quantity }} {{ ticket.quantity > 1 ? 'tickets' : 'ticket' }}</span
                    >
                  </div>
                </div>

                <div class="ticket-card__price">{{ formatPrice(ticket.totalPrice) }}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <Modal
      :show="showCancelModal"
      title="Cancel Ticket"
      @close="closeCancelModal"
      :prevent-close="cancelLoading"
    >
      <div v-if="!cancelSuccess" class="cancel-modal">
        <div v-if="cancelError" class="cancel-modal__error">
          {{ cancelError }}
        </div>

        <p class="cancel-modal__message">
          Are you sure you want to cancel your tickets for
          <strong>{{ selectedTicket?.eventTitle }}</strong
          >?
        </p>

        <p class="cancel-modal__details">
          You will receive a refund of {{ formatPrice(selectedTicket?.totalPrice) }} for
          {{ selectedTicket?.quantity }} {{ selectedTicket?.quantity > 1 ? 'tickets' : 'ticket' }}.
        </p>
      </div>

      <div v-else class="cancel-modal__success">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <h3>Cancellation Successful</h3>
        <p>Your tickets have been successfully cancelled and a refund will be processed.</p>
      </div>

      <template #footer>
        <button
          v-if="!cancelSuccess"
          type="button"
          class="cancel-modal__cancel"
          @click="closeCancelModal"
          :disabled="cancelLoading"
        >
          Keep Tickets
        </button>

        <button
          v-if="!cancelSuccess"
          type="button"
          class="cancel-modal__confirm"
          @click="cancelPurchase"
          :disabled="cancelLoading"
        >
          <span v-if="cancelLoading">Processing...</span>
          <span v-else>Confirm Cancellation</span>
        </button>

        <button v-else type="button" class="cancel-modal__close" @click="closeCancelModal">
          Close
        </button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 3rem 0;
}

.dashboard__header {
  margin-bottom: 2rem;
  text-align: center;
}

.dashboard__title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.dashboard__greeting {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
}

.dashboard__loading,
.dashboard__error {
  text-align: center;
  padding: 3rem 0;
  color: rgba(255, 255, 255, 0.7);
}

.dashboard__error {
  color: var(--error);
}

.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.dashboard__stat-card {
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
}

.dashboard__stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.dashboard__stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.dashboard__section {
  margin-bottom: 3rem;
}

.dashboard__section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dashboard__empty {
  text-align: center;
  padding: 3rem 0;
  color: rgba(255, 255, 255, 0.7);
}

.dashboard__browse-link {
  display: inline-block;
  margin-top: 1rem;
  background-color: var(--primary);
  color: var(--text-color);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.dashboard__browse-link:hover {
  background-color: var(--accent);
}

.dashboard__tickets {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ticket-card {
  background-color: var(--card-bg);
  border-radius: 10px;
  overflow: hidden;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.ticket-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.ticket-card--past {
  opacity: 0.7;
}

.ticket-card__header {
  background-color: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
}

.ticket-card__event {
  font-weight: 600;
  font-size: 1.1rem;
}

.ticket-card__status {
  font-size: 0.8rem;
  text-transform: uppercase;
  background-color: var(--success);
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.ticket-card__status--cancelled {
  background-color: var(--error);
}

.ticket-card__details {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.ticket-card__info {
  flex: 1;
}

.ticket-card__info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.ticket-card__info-item svg {
  flex-shrink: 0;
  color: var(--primary);
}

.ticket-card__info-item:last-child {
  margin-bottom: 0;
}

.ticket-card__actions {
  text-align: right;
}

.ticket-card__price {
  font-weight: 700;
  color: var(--primary);
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
}

.ticket-card__cancel-btn {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-color);
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.ticket-card__cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Cancel Modal Styles */
.cancel-modal__error {
  background-color: rgba(255, 77, 77, 0.2);
  color: var(--error);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.cancel-modal__message {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.cancel-modal__details {
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.8);
}

.cancel-modal__success {
  text-align: center;
  padding: 1rem 0;
}

.cancel-modal__success svg {
  color: var(--success);
  margin-bottom: 1rem;
}

.cancel-modal__success h3 {
  color: var(--success);
  margin-bottom: 1rem;
}

.cancel-modal__success p {
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
}

.cancel-modal__cancel {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-color);
}

.cancel-modal__confirm {
  background-color: var(--error);
}

.cancel-modal__confirm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cancel-modal__close {
  background-color: var(--primary);
}

@media (max-width: 768px) {
  .dashboard {
    padding: 2rem 0;
  }

  .dashboard__title {
    font-size: 2rem;
  }

  .dashboard__stats {
    grid-template-columns: 1fr;
  }

  .ticket-card__details {
    flex-direction: column;
  }

  .ticket-card__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    width: 100%;
  }

  .ticket-card__price {
    margin-bottom: 0;
  }
}
</style>
 
<script setup>
import { ref, computed, watch } from 'vue'
import { usePurchaseStore } from '@/stores/purchases'
import { useAuthStore } from '@/stores/auth'
import BaseModal from '@/components/Modal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  event: {
    type: Object,
    required: true,
  },
  initialTicketType: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['close', 'purchase-complete'])

const selectedTicketType = ref('standard')
const quantity = ref(1)
const vipQuantity = ref(1)
const loading = ref(false)
const error = ref('')
const success = ref(false)

const purchaseStore = usePurchaseStore()
const authStore = useAuthStore()

// Extract ticket types from the event
const ticketTypes = computed(() => {
  if (!props.event) return []

  // Convert ticket types object to array of [id, type] entries
  return Object.entries(props.event.ticketTypes)
    .filter((entry) => entry[1].available)
    .sort((a, b) => a[1].price - b[1].price)
})

// Get available ticket types for this event
const availableTicketTypes = computed(() => {
  return Object.entries(ticketTypes.value)
    .filter((item) => item[1].available)
    .map(([id, type]) => ({
      id,
      ...type,
    }))
})

// Watch for initialTicketType changes
watch(
  () => props.initialTicketType,
  (newType) => {
    if (newType && ticketTypes.value[newType]) {
      selectedTicketType.value = newType

      // If the selected ticket type has a fixed quantity, update it
      const ticketType = ticketTypes.value[newType]
      if (ticketType.fixedQuantity) {
        quantity.value = ticketType.fixedQuantity
      }
    }
  },
  { immediate: true },
)

// Reset form when modal opens
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      resetForm()
    }
  },
)

// Watch ticket type changes to adjust quantity if needed
watch(
  () => selectedTicketType.value,
  (newType) => {
    const ticketType = ticketTypes.value[newType]
    if (ticketType.fixedQuantity) {
      quantity.value = ticketType.fixedQuantity
    } else if (quantity.value > ticketType.maxPerPurchase) {
      quantity.value = ticketType.maxPerPurchase
    }
  },
)

// Get the currently selected ticket details
const selectedTicket = computed(() => {
  return ticketTypes.value[selectedTicketType.value]
})

// Calculate if quantity should be fixed
const isFixedQuantity = computed(() => {
  return !!selectedTicket.value.fixedQuantity
})

// Get max quantity available for selected ticket type
const maxQuantity = computed(() => {
  const max = Math.min(selectedTicket.value.maxPerPurchase, props.event.availableTickets)
  return max
})

// Calculate unit price
const unitPrice = computed(() => {
  return selectedTicket.value.price
})

// Calculate total price
const totalPrice = computed(() => {
  const ticketType = ticketTypes.value[selectedTicketType.value]
  const effectiveQuantity = ticketType.fixedQuantity || quantity.value
  return (unitPrice.value * effectiveQuantity).toFixed(2)
})

// Format price
const formattedUnitPrice = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(unitPrice.value)
})

// Check if quantity is valid
const isQuantityValid = computed(() => {
  const ticketType = ticketTypes.value[selectedTicketType.value]
  if (ticketType.fixedQuantity) {
    return props.event.availableTickets >= ticketType.fixedQuantity
  }

  return (
    quantity.value > 0 &&
    quantity.value <= props.event.availableTickets &&
    quantity.value <= ticketType.maxPerPurchase
  )
})

// Reset form
const resetForm = () => {
  selectedTicketType.value =
    availableTicketTypes.value.length > 0 ? availableTicketTypes.value[0].id : 'standard'
  quantity.value = isFixedQuantity.value ? selectedTicket.value.fixedQuantity : 1
  vipQuantity.value = 1
  error.value = ''
  success.value = false
}

// Increment quantity
const incrementQuantity = () => {
  if (!isFixedQuantity.value && quantity.value < maxQuantity.value) {
    quantity.value++
  }
}

// Decrement quantity
const decrementQuantity = () => {
  if (!isFixedQuantity.value && quantity.value > 1) {
    quantity.value--
  }
}

// Purchase tickets
const purchaseTickets = async () => {
  // Reset states
  error.value = ''
  success.value = false

  // Check if user is logged in
  if (!authStore.isAuthenticated) {
    error.value = 'Please log in to purchase tickets'
    return
  }

  // Validate quantity
  if (!isQuantityValid.value) {
    error.value = 'Invalid ticket quantity'
    return
  }

  // Set loading state
  loading.value = true

  try {
    // Create purchase
    await purchaseStore.createPurchase({
      eventId: props.event.id,
      quantity: isFixedQuantity.value ? selectedTicket.value.fixedQuantity : quantity.value,
      ticketType: selectedTicketType.value,
      unitPrice: unitPrice.value,
      totalPrice: parseFloat(totalPrice.value),
    })

    // Set success state
    success.value = true

    // Emit purchase complete event
    emit('purchase-complete')
  } catch (err) {
    error.value = err.message || 'Failed to complete purchase. Please try again.'
  } finally {
    loading.value = false
  }
}

// Format price helper
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

// Get total price for display
const getTotal = () => {
  if (selectedTicketType.value === 'standard') {
    return formatPrice(props.event.price * quantity.value)
  } else if (selectedTicketType.value === 'vip') {
    return formatPrice(props.event.price * 1.5 * vipQuantity.value)
  } else if (selectedTicketType.value === 'group') {
    return formatPrice(props.event.price * 3.6)
  } else if (selectedTicketType.value === 'group8') {
    return formatPrice(props.event.price * 7)
  }
  return formatPrice(0)
}

// Check if selection is valid for purchase button
const isValidSelection = computed(() => {
  if (selectedTicketType.value === 'standard' && quantity.value > 0) {
    return true
  }
  if (selectedTicketType.value === 'vip' && vipQuantity.value > 0) {
    return true
  }
  if (['group', 'group8'].includes(selectedTicketType.value)) {
    return true
  }
  return false
})

// Close modal
const closeModal = () => {
  if (!loading.value) {
    emit('close')
  }
}
</script>

<template>
  <BaseModal
    :show="show"
    title="Purchase Tickets"
    @close="closeModal"
    :prevent-close="loading"
    width="800px"
  >
    <div class="purchase-modal">
      <div v-if="error" class="purchase-modal__error">
        {{ error }}
      </div>

      <div v-if="success" class="purchase-modal__success">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="purchase-modal__success-icon"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <h2>Purchase Complete!</h2>
        <p class="purchase-modal__success-text">
          Your tickets for {{ event.title }} have been purchased successfully.
        </p>
        <p class="purchase-modal__success-details">Check your dashboard to view your tickets.</p>
      </div>

      <div v-if="!success" class="purchase-modal__content">
        <div class="purchase-modal__event">
          <h3 class="purchase-modal__event-title">{{ event.title }}</h3>
          <p class="purchase-modal__event-details">
            {{ new Date(event.date).toLocaleString() }} • {{ event.location }}
          </p>
        </div>

        <div class="purchase-modal__options">
          <div class="purchase-modal__section-header">
            <h4 class="purchase-modal__section-title">Ticket Options</h4>
            <p class="purchase-modal__available">
              {{ props.event.availableTickets }} tickets available
            </p>
          </div>

          <div class="purchase-modal__options-list">
            <!-- Standard Ticket Option -->
            <div
              class="purchase-modal__option"
              :class="{ 'purchase-modal__option--selected': selectedTicketType === 'standard' }"
              @click="selectedTicketType = 'standard'"
            >
              <div class="purchase-modal__option-details">
                <div class="purchase-modal__option-name">Standard</div>
                <div class="purchase-modal__option-description">Regular admission</div>
                <div class="purchase-modal__option-price">
                  {{ formattedUnitPrice }}
                </div>
              </div>
              <div class="purchase-modal__option-quantity">
                <div class="purchase-modal__quantity-control" @click.stop>
                  <button
                    type="button"
                    class="purchase-modal__quantity-btn"
                    @click="decrementQuantity"
                    :disabled="quantity <= 1"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    v-model.number="quantity"
                    min="1"
                    :max="maxQuantity"
                    class="purchase-modal__quantity-input"
                  />
                  <button
                    type="button"
                    class="purchase-modal__quantity-btn"
                    @click="incrementQuantity"
                    :disabled="quantity >= maxQuantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <!-- VIP Ticket Option -->
            <div
              class="purchase-modal__option purchase-modal__option--highlight"
              :class="{ 'purchase-modal__option--selected': selectedTicketType === 'vip' }"
              @click="selectedTicketType = 'vip'"
            >
              <div class="purchase-modal__popular-tag">Popular</div>
              <div class="purchase-modal__option-details">
                <div class="purchase-modal__option-name">VIP</div>
                <div class="purchase-modal__option-description">
                  Premium seating + complimentary drink
                </div>
                <div class="purchase-modal__option-price">
                  {{
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      event.price * 1.5,
                    )
                  }}
                </div>
              </div>
              <div class="purchase-modal__option-quantity">
                <div class="purchase-modal__quantity-control" @click.stop>
                  <button
                    type="button"
                    class="purchase-modal__quantity-btn"
                    @click="vipQuantity > 1 ? vipQuantity-- : null"
                    :disabled="vipQuantity <= 1"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    v-model.number="vipQuantity"
                    min="1"
                    max="6"
                    class="purchase-modal__quantity-input"
                  />
                  <button
                    type="button"
                    class="purchase-modal__quantity-btn"
                    @click="vipQuantity < 6 ? vipQuantity++ : null"
                    :disabled="vipQuantity >= 6"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <!-- Table for 4 Option -->
            <div
              class="purchase-modal__option purchase-modal__option--table"
              :class="{ 'purchase-modal__option--selected': selectedTicketType === 'group' }"
              @click="selectedTicketType = 'group'"
            >
              <div class="purchase-modal__option-details">
                <div class="purchase-modal__option-name">Table for 4</div>
                <div class="purchase-modal__option-description">Reserved seating for 4 people</div>
                <div class="purchase-modal__option-price">
                  {{
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      event.price * 3.6,
                    )
                  }}
                </div>
              </div>
              <div class="purchase-modal__option-quantity">
                <div class="purchase-modal__table-badge">
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
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="15" y1="3" x2="15" y2="21"></line>
                  </svg>
                  Table for 4
                </div>
              </div>
            </div>

            <!-- Table for 8 Option -->
            <div
              class="purchase-modal__option purchase-modal__option--table"
              :class="{ 'purchase-modal__option--selected': selectedTicketType === 'group8' }"
              @click="selectedTicketType = 'group8'"
            >
              <div class="purchase-modal__option-details">
                <div class="purchase-modal__option-name">Table for 8</div>
                <div class="purchase-modal__option-description">Reserved seating for 8 people</div>
                <div class="purchase-modal__option-price">
                  {{
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      event.price * 7,
                    )
                  }}
                </div>
              </div>
              <div class="purchase-modal__option-quantity">
                <div class="purchase-modal__table-badge">
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
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="3" y1="15" x2="21" y2="15"></line>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                    <line x1="15" y1="3" x2="15" y2="21"></line>
                  </svg>
                  Table for 8
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="purchase-modal__summary">
          <h4 class="purchase-modal__section-title">Order Summary</h4>

          <div class="purchase-modal__summary-items">
            <div
              v-if="quantity > 0 && selectedTicketType === 'standard'"
              class="purchase-modal__summary-item"
            >
              <div class="purchase-modal__summary-label">Standard Ticket × {{ quantity }}</div>
              <div class="purchase-modal__summary-value">
                {{ formatPrice(event.price * quantity) }}
              </div>
            </div>

            <div
              v-if="vipQuantity > 0 && selectedTicketType === 'vip'"
              class="purchase-modal__summary-item"
            >
              <div class="purchase-modal__summary-label">VIP Ticket × {{ vipQuantity }}</div>
              <div class="purchase-modal__summary-value">
                {{ formatPrice(event.price * 1.5 * vipQuantity) }}
              </div>
            </div>

            <div v-if="selectedTicketType === 'group'" class="purchase-modal__summary-item">
              <div class="purchase-modal__summary-label">Table for 4 × 1</div>
              <div class="purchase-modal__summary-value">{{ formatPrice(event.price * 3.6) }}</div>
            </div>

            <div v-if="selectedTicketType === 'group8'" class="purchase-modal__summary-item">
              <div class="purchase-modal__summary-label">Table for 8 × 1</div>
              <div class="purchase-modal__summary-value">{{ formatPrice(event.price * 7) }}</div>
            </div>
          </div>

          <div class="purchase-modal__total">
            <div class="purchase-modal__total-label">Total</div>
            <div class="purchase-modal__total-value">{{ getTotal() }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        v-if="!success"
        type="button"
        class="purchase-modal__cancel"
        @click="closeModal"
        :disabled="loading"
      >
        Cancel
      </button>
      <button
        v-if="!success"
        type="button"
        class="purchase-modal__submit"
        @click="purchaseTickets"
        :disabled="loading || !isValidSelection"
      >
        <span v-if="loading">Processing...</span>
        <span v-else>Complete Purchase</span>
      </button>
      <button v-else type="button" class="purchase-modal__close" @click="closeModal">Done</button>
    </template>
  </BaseModal>
</template>

<style scoped>
/* Add some CSS variables specific to the modal */
:root {
  --modal-border: rgba(255, 255, 255, 0.1);
  --modal-highlight: var(--primary);
  --modal-bg: var(--card-bg);
  --modal-bg-hover: var(--card-bg-hover);
}

.purchase-modal__error {
  background-color: rgba(255, 77, 77, 0.15);
  color: var(--error);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  border: 1px solid rgba(255, 77, 77, 0.3);
}

.purchase-modal__success {
  text-align: center;
  padding: 2.5rem 1.5rem;
}

.purchase-modal__success-icon {
  color: var(--success);
  margin-bottom: 1.5rem;
}

.purchase-modal__success h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 800;
  color: var(--success);
}

.purchase-modal__success-text {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.purchase-modal__success-details {
  color: var(--text-secondary);
}

.purchase-modal__content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.purchase-modal__event {
  border-bottom: 1px solid var(--modal-border);
  padding-bottom: 1.5rem;
}

.purchase-modal__event-title {
  font-size: 1.4rem;
  margin: 0 0 0.75rem 0;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.purchase-modal__event-details {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

.purchase-modal__section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.purchase-modal__section-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.purchase-modal__available {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.purchase-modal__options-list {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
}

.purchase-modal__option {
  background-color: var(--modal-bg);
  border: 1px solid var(--modal-border);
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.purchase-modal__option:hover {
  background-color: var(--modal-bg-hover);
  border-color: rgba(255, 255, 255, 0.2);
}

.purchase-modal__option--selected {
  border-color: var(--modal-highlight);
  background-color: rgba(232, 67, 147, 0.08);
}

.purchase-modal__option--highlight {
  border-color: var(--primary);
}

.purchase-modal__option--table {
  border-color: rgba(255, 215, 0, 0.3);
}

.purchase-modal__popular-tag {
  position: absolute;
  top: -10px;
  right: 10px;
  background-color: var(--primary);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--button-radius);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.purchase-modal__option-details {
  flex: 1;
}

.purchase-modal__option-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.purchase-modal__option-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.purchase-modal__option-price {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--primary);
}

.purchase-modal__option-quantity {
  margin-top: auto;
}

.purchase-modal__table-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 215, 0, 0.9);
  background-color: rgba(255, 215, 0, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  display: inline-flex;
}

.purchase-modal__quantity-control {
  display: flex;
  align-items: center;
  max-width: 120px;
}

.purchase-modal__quantity-btn {
  width: 34px;
  height: 34px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  user-select: none;
  color: var(--text-color);
  transition: all var(--transition-fast) ease;
}

.purchase-modal__quantity-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.purchase-modal__quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.purchase-modal__quantity-input {
  flex: 1;
  width: 40px;
  height: 34px;
  text-align: center;
  margin: 0 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: var(--text-color);
  font-size: 0.95rem;
  font-weight: 600;
}

.purchase-modal__quantity-input:focus {
  outline: none;
  border-color: var(--primary);
}

.purchase-modal__summary {
  border-top: 1px solid var(--modal-border);
  padding-top: 1.5rem;
}

.purchase-modal__summary-items {
  margin: 1rem 0;
}

.purchase-modal__summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.purchase-modal__summary-label {
  color: var(--text-secondary);
}

.purchase-modal__summary-value {
  font-weight: 600;
}

.purchase-modal__total {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--modal-border);
  font-weight: 700;
  font-size: 1.2rem;
}

.purchase-modal__total-value {
  color: var(--primary);
}

.purchase-modal__cancel {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-color);
  padding: 0.75rem 1.5rem;
  border-radius: var(--button-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.purchase-modal__cancel:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.purchase-modal__submit,
.purchase-modal__close {
  background-color: var(--primary);
  border: none;
  color: white;
  padding: 0.75rem 1.75rem;
  border-radius: var(--button-radius);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  margin-left: 1rem;
  min-width: 180px;
}

.purchase-modal__submit:hover,
.purchase-modal__close:hover {
  background-color: var(--accent);
  transform: scale(1.03);
}

.purchase-modal__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .purchase-modal__options-list {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'

// Set multi-word component name for linting
defineOptions({ name: 'EventCheckout' })

const router = useRouter()
const cartStore = useCartStore()
const loading = ref(true)
const error = ref(null)

// Paystack Public Key
const paystackPublicKey = 'pk_test_a23671022344a4de4ca87e5b42f68b3f5d84bfd9'

// Form data
const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

// Form validation
const errors = ref({})
const isSubmitting = ref(false)
const showSuccess = ref(false)

// Try to get last event page from sessionStorage
const lastEventPage = ref(sessionStorage.getItem('lastEventPage') || null)

// Load Paystack script when component mounts
onMounted(() => {
  try {
    if (cartStore.isEmpty) {
      error.value = 'Your cart is empty'
      return
    }

    // Load Paystack script dynamically
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => {
      console.log('Paystack script loaded successfully')
      loading.value = false
    }
    script.onerror = () => {
      console.error('Failed to load Paystack script')
      error.value = 'Failed to load payment gateway. Please try again later.'
      loading.value = false
    }
    document.head.appendChild(script)
  } catch (err) {
    console.error('Error during initialization:', err)
    error.value = 'Error loading checkout data'
    loading.value = false
  }
})

// Validate form
const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!formData.value.firstName.trim()) {
    errors.value.firstName = 'First name is required'
    isValid = false
  }

  if (!formData.value.lastName.trim()) {
    errors.value.lastName = 'Last name is required'
    isValid = false
  }

  if (!formData.value.email.trim()) {
    errors.value.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    errors.value.email = 'Invalid email format'
    isValid = false
  }

  if (!formData.value.phone.trim()) {
    errors.value.phone = 'Phone number is required'
    isValid = false
  } else if (!/^\+?[\d\s-]{10,}$/.test(formData.value.phone)) {
    errors.value.phone = 'Invalid phone number format'
    isValid = false
  }

  return isValid
}

// Function to initialize Paystack payment
const payWithPaystack = () => {
  try {
    // Generate a unique reference for this transaction
    const paymentReference = 'ref-' + Date.now() + '-' + Math.floor(Math.random() * 1000000)

    // Check if PaystackPop is available
    if (typeof window.PaystackPop === 'undefined') {
      error.value = 'Payment gateway not loaded. Please refresh the page and try again.'
      isSubmitting.value = false
      return
    }

    // Create individual custom fields for each order item
    const customFields = [
      {
        display_name: 'Customer Name',
        variable_name: 'customer_name',
        value: `${formData.value.firstName} ${formData.value.lastName}`,
      },
      {
        display_name: 'Phone Number',
        variable_name: 'phone_number',
        value: formData.value.phone,
      },
    ]

    // Add each cart item as a separate entry in custom fields
    cartStore.items.forEach((item, index) => {
      customFields.push({
        display_name: `Order Item ${index + 1}`,
        variable_name: `order_item_${index + 1}`,
        value: `${item.eventTitle} - ${item.ticketType} (Qty: ${item.quantity})`,
      })
    })

    // Add total tickets info
    customFields.push({
      display_name: 'Total Tickets',
      variable_name: 'total_tickets',
      value: cartStore.items.reduce((sum, item) => sum + item.quantity, 0) + ' tickets',
    })

    const handler = window.PaystackPop.setup({
      key: paystackPublicKey,
      email: formData.value.email,
      amount: cartStore.total * 100, // Amount in kobo
      currency: 'NGN',
      ref: paymentReference,
      metadata: {
        custom_fields: customFields,
        cart_id: `cart-${Date.now()}`,
        customer_details: {
          first_name: formData.value.firstName,
          last_name: formData.value.lastName,
          phone: formData.value.phone,
        },
      },
      callback: function (response) {
        console.log('Payment successful. Reference: ' + response.reference)

        // Simulate verification success
        const reference = response.reference
        handlePaymentSuccess(reference)
      },
      onClose: function () {
        if (!showSuccess.value) {
          console.log('Payment window closed')
          isSubmitting.value = false
        }
      },
    })

    handler.openIframe()
  } catch (err) {
    console.error('Paystack error:', err)
    error.value = 'Error initiating payment. Please try again.'
    isSubmitting.value = false
  }
}

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault()

  if (!validateForm()) return

  isSubmitting.value = true

  // Call Paystack payment function
  payWithPaystack()
}

// Handle successful payment
const handlePaymentSuccess = (reference) => {
  // Simulate verification
  // Store transaction data in localStorage
  localStorage.setItem(
    'lastTransaction',
    JSON.stringify({
      reference: reference,
      tickets: cartStore.items.map((item) => ({
        ticketId: `TKT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        eventId: item.eventId,
        eventTitle: item.eventTitle,
        ticketType: item.ticketType,
        quantity: item.quantity,
      })),
      amount: cartStore.total,
      date: new Date().toISOString(),
    }),
  )

  // Clear cart and show success
  cartStore.clearCart()
  showSuccess.value = true

  // Redirect after a delay
  setTimeout(() => router.push('/'), 2500)
}

// Format price in Naira
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price)
}

// Continue shopping handler
const continueShopping = () => {
  if (lastEventPage.value) {
    router.push(lastEventPage.value)
  } else {
    router.back()
  }
}
</script>

<template>
  <div class="checkout-bg-main">
    <div class="checkout-container">
      <div class="checkout-back" @click="router.back()">
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span>Back</span>
      </div>
      <h1 class="checkout-title">Checkout</h1>
      <button class="continue-shopping-checkout" @click="continueShopping">
        Continue Shopping
      </button>
      <div class="checkout-flex-cards">
        <div class="checkout-card left">
          <div class="section-title">Customer Information</div>
          <div class="divider"></div>
          <form
            @submit="handleSubmit"
            class="checkout__form"
            autocomplete="off"
            aria-label="Ticket purchase form"
          >
            <div class="form-row">
              <label for="email">Email Address</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                required
                aria-required="true"
                placeholder="Enter your email"
              />
              <span v-if="errors.email" class="checkout__error">{{ errors.email }}</span>
            </div>
            <div class="form-row">
              <label for="firstName">First Name</label>
              <input
                id="firstName"
                v-model="formData.firstName"
                type="text"
                required
                aria-required="true"
                placeholder="Enter your first name"
              />
              <span v-if="errors.firstName" class="checkout__error">{{ errors.firstName }}</span>
            </div>
            <div class="form-row">
              <label for="lastName">Last Name</label>
              <input
                id="lastName"
                v-model="formData.lastName"
                type="text"
                required
                aria-required="true"
                placeholder="Enter your last name"
              />
              <span v-if="errors.lastName" class="checkout__error">{{ errors.lastName }}</span>
            </div>
            <div class="form-row">
              <label for="phone">Phone Number</label>
              <input
                id="phone"
                v-model="formData.phone"
                type="tel"
                required
                aria-required="true"
                placeholder="Enter your phone number"
              />
              <span v-if="errors.phone" class="checkout__error">{{ errors.phone }}</span>
            </div>
            <button type="submit" class="checkout__submit" :disabled="isSubmitting">
              <span v-if="isSubmitting">Processing…</span>
              <span v-else>Pay with Paystack</span>
            </button>
          </form>
        </div>
        <div class="checkout-card right">
          <div class="section-title">Order Summary</div>
          <div class="divider"></div>
          <div v-if="!cartStore.isEmpty" class="summary-content">
            <div
              v-for="item in cartStore.items"
              :key="item.eventId + '-' + item.ticketId"
              class="summary-row summary-main"
            >
              <div>
                <div class="summary-event-title">{{ item.eventTitle }}</div>
                <div class="summary-event-id">{{ item.eventId }}</div>
                <div class="summary-ticket-type">{{ item.ticketType }}</div>
                <span class="summary-qty-badge">Qty: {{ item.quantity }}</span>
              </div>
              <div class="summary-total">
                {{ formatPrice(item.pricePerTicket * item.quantity) }}
              </div>
            </div>
            <div class="divider small"></div>
            <div class="summary-row">
              <span>Subtotal</span>
              <span>{{ formatPrice(cartStore.total) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="loading" class="checkout__loading">Loading payment gateway...</div>
      <div v-else-if="error" class="checkout__error">
        <p>{{ error }}</p>
        <button @click="router.push('/')" class="checkout__back-button">Return Home</button>
      </div>
      <div v-else-if="showSuccess" class="checkout__success">
        <div class="success-icon">✓</div>
        <div class="success-title">Thank you for your purchase</div>
        <div class="success-desc">A confirmation has been sent to your email.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-bg-main {
  min-height: 100vh;
  width: 100vw;
  background: #14121a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2vw 0;
}
.checkout-container {
  width: 100%;
  max-width: 950px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.checkout-back {
  position: absolute;
  left: 0;
  top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #bdbdbd;
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.18s;
  z-index: 2;
}
.checkout-back:hover {
  color: #fff;
}
.checkout-title {
  font-size: 2.1rem;
  font-weight: 700;
  color: #fff;
  margin: 2.5rem 0 2.2rem 0;
  letter-spacing: -0.01em;
  text-align: center;
}
.checkout-flex-cards {
  display: flex;
  flex-direction: row;
  gap: 2.5rem;
  width: 100%;
  align-items: flex-start;
  justify-content: center;
}
.checkout-card {
  background: #1b1822;
  border-radius: 16px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.1);
  border: 1.5px solid #23202b;
  padding: 2.2rem 2rem 2rem 2rem;
  min-width: 320px;
  max-width: 370px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.checkout-card.left {
  align-items: stretch;
}
.checkout-card.right {
  align-items: stretch;
}
.section-title {
  font-size: 1.18rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.2rem;
  letter-spacing: -0.01em;
}
.divider {
  border-bottom: 1px solid #23202b;
  margin: 0.5rem 0 1.2rem 0;
  width: 100%;
}
.divider.small {
  margin: 0.7rem 0 1rem 0;
}
.checkout__form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.checkout__form label {
  color: #bdbdbd;
  font-size: 1.01rem;
  font-weight: 500;
  margin-bottom: 0.2rem;
}
.checkout__form input {
  border: 1px solid #23202b;
  border-radius: 7px;
  padding: 0.85rem 1rem;
  font-size: 1.05rem;
  color: #fff;
  background: #18151f;
  transition:
    border 0.18s,
    background 0.18s;
  outline: none;
}
.checkout__form input:focus {
  border-color: #c04888;
  background: #201c29;
}
.checkout__error {
  color: #e74c3c;
  font-size: 0.92rem;
  margin-left: 0.1rem;
}
.checkout__submit {
  margin-top: 1.2rem;
  background: #c04888;
  color: #fff;
  border: none;
  padding: 1rem 0;
  border-radius: 7px;
  font-weight: 700;
  font-size: 1.08rem;
  cursor: pointer;
  transition:
    background 0.18s,
    box-shadow 0.18s,
    transform 0.1s;
  box-shadow: 0 2px 8px rgba(192, 72, 136, 0.08);
  width: 100%;
}
.checkout__submit:hover:not(:disabled) {
  background: #a13a6e;
  box-shadow: 0 4px 16px rgba(192, 72, 136, 0.13);
  transform: translateY(-1px) scale(1.01);
}
.checkout__submit:disabled {
  background: #23202b;
  color: #aaa;
  cursor: not-allowed;
}
.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: #e0e0e0;
  font-size: 1.04rem;
  font-weight: 500;
}
.summary-main {
  align-items: flex-start;
  gap: 1.2rem;
}
.summary-event-title {
  font-size: 1.08rem;
  font-weight: 700;
  color: #fff;
}
.summary-event-id {
  color: #bdbdbd;
  font-size: 0.97rem;
  margin-bottom: 0.2rem;
}
.summary-ticket-type {
  font-size: 1.01rem;
  color: #e0e0e0;
  margin-bottom: 0.2rem;
}
.summary-qty-badge {
  display: inline-block;
  background: #3b185f;
  color: #fff;
  border-radius: 8px;
  padding: 0.18rem 0.7rem;
  font-size: 0.95rem;
  margin-bottom: 0.7rem;
}
.summary-total {
  color: #fff;
  font-size: 1.25rem;
  font-weight: 700;
  margin-left: 0.5rem;
}
.checkout__loading,
.checkout__error {
  text-align: center;
  padding: 2.5rem 0;
  color: #e0e0e0;
}
.checkout__back-button {
  margin-top: 1.2rem;
  background: none;
  border: 1px solid #23202b;
  color: #fff;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition:
    background 0.18s,
    border 0.18s;
}
.checkout__back-button:hover {
  background: #23202b;
  border-color: #c04888;
}
.checkout__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  text-align: center;
  padding: 2.5rem 0 1.5rem 0;
}
.success-icon {
  font-size: 2.5rem;
  color: #fff;
  background: #c04888;
  border-radius: 50%;
  width: 3.2rem;
  height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}
.success-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
}
.success-desc {
  color: #e0e0e0;
  font-size: 1.05rem;
}
.continue-shopping-checkout {
  background: var(--primary, #c04888);
  color: #fff;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition:
    background 0.18s,
    color 0.18s;
}
.continue-shopping-checkout:hover {
  background: #a13a6e;
  color: #fff;
}
@media (max-width: 1100px) {
  .checkout-flex-cards {
    flex-direction: column;
    gap: 2rem;
    align-items: stretch;
  }
  .checkout-card {
    max-width: 100%;
    min-width: 0;
  }
  .checkout-back {
    position: static;
    margin-bottom: 1.2rem;
  }
}
@media (max-width: 600px) {
  .checkout-container {
    padding: 0 0.2rem;
  }
  .checkout-card {
    padding: 1.2rem 0.5rem 1.2rem 0.5rem;
  }
  .checkout-title {
    font-size: 1.4rem;
    margin: 1.5rem 0 1.2rem 0;
  }
}
</style>

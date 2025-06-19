<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'

defineOptions({ name: 'CartPage' })

const cart = useCartStore()
const router = useRouter()
const notification = ref(null)
const isMobile = ref(window.innerWidth <= 700)

function handleResize() {
  isMobile.value = window.innerWidth <= 700
}
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

function showNotification(msg) {
  notification.value = msg
  setTimeout(() => (notification.value = null), 1800)
}

function removeItem(item) {
  cart.removeItem(item.eventId, item.ticketId)
  if (cart.items.length === 0) {
    showNotification('Last item removed from cart')
  }
}

function updateQuantity(item, qty) {
  if (qty < 1) return
  cart.updateQuantity(item.eventId, item.ticketId, qty)
}

function clearCart() {
  cart.clearCart()
  showNotification('Cart cleared')
}

function proceedToCheckout() {
  if (cart.isEmpty) return
  // Save cart to session for checkout page
  sessionStorage.setItem('checkoutCart', JSON.stringify(cart.items))
  router.push('/checkout')
}
</script>

<template>
  <div class="cart-bg">
    <button class="back-button" @click="router.back()">← Back</button>
    <div class="cart-container">
      <h1 class="cart-title">Your Cart</h1>
      <div v-if="cart.isEmpty" class="cart-empty">
        <div class="empty-cart-icon">🛒</div>
        <p>Your cart is empty.</p>
        <button class="continue-shopping" @click="router.push('/')">Continue Shopping</button>
      </div>
      <div v-else class="cart-list">
        <div v-for="item in cart.items" :key="item.eventId + '-' + item.ticketId" class="cart-item">
          <div class="cart-item-image">
            <img
              :src="item.eventImage || '/placeholder.png'"
              :alt="item.eventTitle || 'Event image'"
            />
          </div>
          <div class="cart-item-content">
            <div class="cart-item-info">
              <div class="cart-event-title">{{ item.eventTitle }}</div>
              <div class="cart-ticket-type">{{ item.ticketType }}</div>
              <div class="cart-address">
                <i class="fas fa-map-marker-alt"></i>
                {{ item.eventAddress }}
              </div>
              <div class="cart-qty-label">Quantity: {{ item.quantity }}</div>
            </div>
            <div class="cart-item-actions">
              <div class="cart-qty-group">
                <button
                  @click="updateQuantity(item, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  class="qty-btn"
                >
                  -
                </button>
                <span class="cart-qty">{{ item.quantity }}</span>
                <button @click="updateQuantity(item, item.quantity + 1)" class="qty-btn">+</button>
                <button
                  class="cart-remove cart-remove-inline"
                  @click="removeItem(item)"
                  title="Remove item"
                  aria-label="Remove from cart"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="remove-svg"
                  >
                    <rect x="3" y="6" width="18" height="15" rx="2" />
                    <path d="M9 10v6M15 10v6" />
                    <path d="M5 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
                    <line x1="1" y1="6" x2="23" y2="6" />
                  </svg>
                </button>
              </div>
              <div class="cart-price">
                {{ '₦' + (item.pricePerTicket * item.quantity).toLocaleString('en-NG') }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <transition name="fade">
        <div v-if="notification" class="cart-notification">{{ notification }}</div>
      </transition>
    </div>
    <!-- Fixed footer summary for all screen sizes -->
    <div class="cart-footer-summary" v-if="!cart.isEmpty">
      <div class="cart-footer-row">
        <span>Subtotal</span>
        <span>{{ '₦' + cart.total.toLocaleString('en-NG') }}</span>
      </div>
      <div class="cart-footer-actions">
        <button class="cart-clear-btn" @click="clearCart">Clear Cart</button>
        <button class="cart-checkout-btn" @click="proceedToCheckout">Proceed to Checkout</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-bg {
  min-height: 100vh;
  width: 100vw;
  background: #14121a;
  display: flex;
  flex-direction: column;
  padding: 2vw 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  font-size: 0.85rem;
  padding: 0.8rem;
  cursor: pointer;
  background: none;
  border: none;
  width: fit-content;
  opacity: 0.8;
  margin-left: 5%;
  margin-bottom: 1rem;
}

.back-button:hover {
  color: #c04888;
  opacity: 1;
}

.cart-container {
  width: 90%;
  margin: 0 auto;
  background: #1b1822;
  border-radius: 16px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.1);
  border: 1.5px solid #23202b;
  padding: 30px;
  display: flex;
  flex-direction: column;
  padding-bottom: 8rem; /* Add space for fixed footer */
}

.cart-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
  margin: 0.8rem auto 1.5rem;
  letter-spacing: -0.01em;
  text-align: left;
  width: 95%;
}

.cart-empty {
  color: #bdbdbd;
  font-size: 1.15rem;
  text-align: center;
  padding: 2.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-cart-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.continue-shopping {
  background: #c04888;
  color: #fff;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 7px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}

.continue-shopping:hover {
  background: #a13a6e;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cart-item {
  display: flex;
  gap: 1.5rem;
  cursor: pointer;
  background: #18151f;
  border-radius: 14px;
  padding: 1.3rem 1.2rem;
  box-shadow:
    0 2px 12px rgba(192, 72, 136, 0.07),
    0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1.5px solid #23202b;
  align-items: center;
  transition:
    box-shadow 0.25s cubic-bezier(0.4, 1.6, 0.6, 1),
    transform 0.18s cubic-bezier(0.4, 1.6, 0.6, 1);
}

.cart-item-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.cart-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.2rem;
}

.cart-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cart-event-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.cart-ticket-type {
  font-size: 1.05rem;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-address {
  font-size: 0.95rem;
  color: #bdbdbd;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-qty-label {
  color: #bdbdbd;
  font-size: 0.95rem;
  margin-top: 0.2rem;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.cart-qty-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #23202b;
  border-radius: 8px;
  padding: 0.22rem 0.9rem;
  box-shadow: 0 1px 4px rgba(192, 72, 136, 0.04);
  transition: box-shadow 0.18s;
}

.cart-qty-group:focus-within,
.cart-qty-group:hover {
  box-shadow: 0 2px 12px rgba(192, 72, 136, 0.1);
}

.qty-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0 0.5rem;
  border-radius: 6px;
  transition:
    background 0.18s,
    color 0.18s,
    transform 0.18s;
  outline: none;
}

.qty-btn:focus,
.qty-btn:hover:not(:disabled) {
  background: rgba(192, 72, 136, 0.13);
  color: var(--primary, #c04888);
  transform: scale(1.13);
}

.qty-btn:disabled {
  color: #555;
  cursor: not-allowed;
  background: none;
  transform: none;
}

.cart-qty {
  font-size: 1.08rem;
  font-weight: 600;
  color: #fff;
  min-width: 1.5rem;
  text-align: center;
}

.cart-price {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
}

.cart-remove {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.18s;
  border-radius: 4px;
}

.cart-remove:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #fff;
}

.cart-remove-inline {
  margin-left: 0.7rem;
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  transition:
    background 0.18s,
    color 0.18s,
    box-shadow 0.18s,
    transform 0.18s;
  display: flex;
  align-items: center;
  outline: none;
}

.cart-remove-inline:focus,
.cart-remove-inline:hover {
  background: rgba(192, 72, 136, 0.13);
  color: var(--primary, #c04888);
  box-shadow: 0 2px 8px rgba(192, 72, 136, 0.13);
  transform: scale(1.13) rotate(-7deg);
}

.remove-svg {
  stroke: currentColor;
  width: 20px;
  height: 20px;
  display: block;
  transition:
    stroke 0.18s,
    transform 0.18s;
}

.cart-footer-summary {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1b1822;
  border-top: 1px solid #23202b;
  padding: 1rem 1.5rem;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  width: 90%;
  margin: 0 auto;
}

.cart-footer-actions {
  display: flex;
  gap: 1rem;
  width: 90%;
  margin: 0 auto;
}

.cart-clear-btn {
  padding: 0 1.2rem;
  height: 2.8rem;
  border-radius: 8px;
  font-size: 0.95rem;
  background: #23202b;
  color: #fff;
  border: none;
  cursor: pointer;
}

.cart-checkout-btn {
  flex: 1;
  height: 2.8rem;
  border-radius: 8px;
  font-size: 0.95rem;
  background: #c04888;
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.cart-notification {
  position: fixed;
  top: 2.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: #2d2a36;
  color: #fff;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -1rem);
}

@media (max-width: 700px) {
  .cart-bg {
    margin-top: 20px;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 0;
  }

  .cart-container {
    border-radius: 0;
    border: none;
    box-shadow: none;
  }

  .back-button {
    padding: 0.8rem 0.8rem;
    font-size: 0.85rem;
    margin-left: 0.4rem;
  }

  .cart-title {
    width: 95%;
    margin: 0.5rem auto 1.2rem;
    font-size: 20px;
  }

  .cart-list {
    display: flex;
    flex-direction: column;
  }

  .cart-item {
    width: 95%;
    margin: auto;
    padding: 1rem;
    border-radius: 0;
    background: #1b1822;
    border-bottom: 1px solid #23202b;
    display: flex;
    box-shadow: none;
  }

  .cart-item-image {
    width: 70px;
    height: 70px;
    border-radius: 0;
  }

  .cart-item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }

  .cart-event-title {
    font-size: 14px;
    line-height: 1.3;
    margin-bottom: 0.2rem;
  }

  .cart-price {
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cart-price::after {
    content: attr(data-original-price);
    text-decoration: line-through;
    color: #666;
    font-size: 0.9rem;
    font-weight: normal;
  }

  .cart-item-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;
  }

  .cart-qty-group {
    display: flex;
    align-items: center;
    padding: 0;
    background: transparent;
    min-width: 120px;
  }

  .qty-btn {
    display: none;
  }

  .cart-qty {
    display: none;
  }

  .cart-remove-inline {
    padding: 0.4rem;
    color: #666;
  }

  .cart-footer-summary {
    padding: 1rem;
  }

  .cart-footer-row,
  .cart-footer-actions {
    width: 95%;
    max-width: 100%;
  }

  .cart-footer-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
  }

  .cart-clear-btn,
  .cart-checkout-btn {
    height: 2.8rem;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: visible;
    padding: 0 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cart-clear-btn {
    min-width: 80px;
  }

  .cart-checkout-btn {
    min-width: 130px;
  }
}

@media (max-width: 480px) {
  .cart-container {
    padding: 0.8rem;
  }

  .cart-item {
    padding: 0.8rem;
  }

  .cart-item-image {
    width: 60px;
    height: 60px;
  }
}
</style>

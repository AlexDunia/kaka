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
  router.push('/checkout')
}
</script>

<template>
  <div class="cart-bg">
    <button class="back-button" @click="router.back()">â† Back</button>
    <div class="cart-container">
      <h1 class="cart-title">Your Cart</h1>
      <div v-if="cart.isEmpty" class="cart-empty">
        <div class="empty-cart-icon">ðŸ›’</div>
        <p>Your cart is empty.</p>
        <button class="continue-shopping" @click="router.push('/')">Continue Shopping</button>
      </div>
      <div v-else class="cart-list">
        <div v-for="item in cart.items" :key="item.eventId + '-' + item.ticketId" class="cart-item">
          <div class="cart-item-top">
            <div class="cart-item-image">
              <img
                :src="item.eventImage || '/placeholder.png'"
                :alt="item.eventTitle || 'Event image'"
              />
            </div>
            <div class="cart-item-info">
              <div class="cart-event-title">{{ item.eventTitle }}</div>
              <div class="cart-ticket-type">{{ item.ticketType }}</div>
              <div class="cart-address">
                <i class="fas fa-map-marker-alt"></i>
                {{ item.eventAddress }}
              </div>
            </div>
          </div>
          <div class="cart-item-bottom">
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
            </div>
            <div class="cart-actions">
              <div class="cart-price">
                {{ 'â‚¦' + (item.pricePerTicket * item.quantity).toLocaleString('en-NG') }}
              </div>
              <button
                class="cart-remove-inline"
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
          </div>
        </div>
      </div>
      <transition name="fade">
        <div v-if="notification" class="cart-notification">{{ notification }}</div>
      </transition>
    </div>
    <div class="cart-footer-summary" v-if="!cart.isEmpty">
      <div class="cart-footer-row">
        <span>Subtotal</span>
        <span>{{ 'â‚¦' + cart.total.toLocaleString('en-NG') }}</span>
      </div>
      <div class="cart-footer-actions">
        <button class="cart-clear-btn" @click="clearCart">Clear Cart</button>
        <button class="cart-checkout-btn" @click="proceedToCheckout">Proceed to Checkout</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/cart-mobile.css';

.cart-bg {
  min-height: 100vh;
  width: 100vw;
  background: #14121a;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  font-size: 1rem;
  padding: 1rem;
  cursor: pointer;
  background: none;
  border: none;
  width: fit-content;
  opacity: 0.9;
  margin: 0;
}

.back-button:hover {
  color: #c04888;
  opacity: 1;
}

.cart-container {
  width: 100%;
  margin: 0;
  background: #1b1822;
  border-radius: 0;
  box-shadow: none;
  border: none;
  padding: 16px;
  display: flex;
  flex-direction: column;
  padding-bottom: 8rem;
}

.cart-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0.5rem 1rem 1rem;
  letter-spacing: -0.01em;
  text-align: left;
  width: 90%;
}

.cart-empty {
  color: #bdbdbd;
  font-size: 1.15rem;
  text-align: center;
  padding: 2.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-cart-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.continue-shopping {
  background: #c04888;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

.continue-shopping:hover {
  background: #a13a6e;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem;
}

.cart-item {
  display: flex;
  gap: 1rem;
  background: #18151f;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #23202b;
  align-items: flex-start;
  width: 90%;
  margin: 0 auto;
}

.cart-item-top {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  flex: 1;
}

.cart-item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.cart-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cart-event-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
}

.cart-ticket-type {
  font-size: 0.9rem;
  color: #e0e0e0;
}

.cart-address {
  font-size: 0.85rem;
  color: #bdbdbd;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cart-item-bottom {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-qty-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #23202b;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
}

.qty-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.25rem;
  cursor: pointer;
  opacity: 0.9;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-qty {
  font-size: 0.95rem;
  font-weight: 500;
  color: #fff;
  min-width: 1.5rem;
  text-align: center;
}

.cart-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-price {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

.cart-remove-inline {
  padding: 0.35rem;
  color: #e74c3c;
  opacity: 0.9;
  background: none;
  border: none;
  cursor: pointer;
}

.cart-footer-summary {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1b1822;
  border-top: 1px solid #23202b;
  padding: 1rem;
  z-index: 100;
}

.cart-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  width: 90%;
  margin: 0 auto 0.75rem;
}

.cart-footer-actions {
  display: flex;
  gap: 0.75rem;
  width: 90%;
  margin: 0 auto;
}

.cart-clear-btn {
  padding: 0 1rem;
  height: 3rem;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #23202b;
  color: #fff;
  border: none;
  cursor: pointer;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-checkout-btn {
  flex: 1;
  height: 3rem;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #c04888;
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
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

@media (max-width: 480px) {
  .cart-container {
    padding: 12px;
  }

  .cart-list {
    padding: 0 0.75rem;
  }

  .cart-item {
    padding: 0.75rem;
  }

  .cart-item-image {
    width: 70px;
    height: 70px;
  }

  .cart-footer-summary {
    padding: 0.75rem;
  }

  .cart-clear-btn,
  .cart-checkout-btn {
    height: 2.8rem;
    font-size: 0.85rem;
  }
}
</style>


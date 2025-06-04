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
        <!-- Cart summary for desktop/tablet -->
        <div class="cart-summary">
          <div class="cart-summary-row">
            <span>Subtotal</span>
            <span>{{ '₦' + cart.total.toLocaleString('en-NG') }}</span>
          </div>
          <div class="cart-actions">
            <button class="cart-clear-btn" @click="clearCart">Clear Cart</button>
            <button class="cart-checkout-btn" @click="proceedToCheckout">
              Proceed to Checkout
            </button>
          </div>
        </div>
        <!-- Cart summary for mobile (fixed footer) -->
        <div class="cart-footer-summary" v-if="!cart.isEmpty && isMobile">
          <div class="cart-footer-row">
            <span>Subtotal</span>
            <span>{{ '₦' + cart.total.toLocaleString('en-NG') }}</span>
          </div>
          <div class="cart-footer-actions">
            <button class="cart-clear-btn" @click="clearCart">Clear Cart</button>
            <button class="cart-checkout-btn" @click="proceedToCheckout">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
      <transition name="fade">
        <div v-if="notification" class="cart-notification">{{ notification }}</div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.cart-bg {
  min-height: 100vh;
  width: 100vw;
  background: #14121a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2vw 0;
}

.cart-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: #1b1822;
  border-radius: 16px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.1);
  border: 1.5px solid #23202b;
  padding: 2.2rem 2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.cart-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.2rem;
  letter-spacing: -0.01em;
  text-align: center;
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

.cart-item:hover {
  box-shadow:
    0 8px 32px rgba(192, 72, 136, 0.13),
    0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px) scale(1.012);
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
}

.cart-ticket-type {
  font-size: 1.05rem;
  color: #e0e0e0;
}

.cart-address {
  font-size: 0.95rem;
  color: #bdbdbd;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.cart-summary {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  align-items: flex-end;
}

.cart-summary-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  color: #e0e0e0;
  font-size: 1.2rem;
  font-weight: 500;
}

.cart-actions {
  display: flex;
  gap: 0.7rem;
  width: 100%;
  justify-content: flex-end;
}

.cart-clear-btn,
.cart-checkout-btn {
  min-width: 96px;
  font-size: 0.97rem;
  font-weight: 700;
  border-radius: 7px;
  padding: 0.48rem 1.1rem;
  border: none;
  outline: none;
  transition:
    background 0.16s,
    color 0.16s,
    box-shadow 0.16s,
    transform 0.16s;
  box-shadow: 0 1px 3px rgba(192, 72, 136, 0.03);
  letter-spacing: 0.01em;
  margin: 0;
  height: 2.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-clear-btn {
  background: #23202b;
  color: #fff;
}
.cart-clear-btn:hover,
.cart-clear-btn:focus {
  background: #2d2a36;
  color: var(--primary, #c04888);
  box-shadow: 0 2px 6px rgba(192, 72, 136, 0.08);
  transform: translateY(-1px) scale(1.025);
}

.cart-checkout-btn {
  background: var(--primary, #c04888);
  color: #fff;
  box-shadow: 0 1px 4px rgba(192, 72, 136, 0.06);
}
.cart-checkout-btn:hover,
.cart-checkout-btn:focus {
  background: #a13a6e;
  color: #fff;
  box-shadow: 0 3px 10px rgba(192, 72, 136, 0.1);
  transform: translateY(-1px) scale(1.03);
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
    align-items: flex-start;
    justify-content: center;
    padding-top: 0.5rem;
  }
  .cart-container {
    width: 92%;
    max-width: 440px;
    margin: 0.5rem auto 0 auto;
    background: #18151f;
    border-radius: 18px;
    box-shadow: 0 4px 32px rgba(30, 30, 60, 0.18);
    padding: 0.2rem 1.1rem 6.5rem 1.1rem;
    gap: 1.2rem;
    box-sizing: border-box;
  }
  .cart-title {
    font-size: 1.05rem;
    margin: 0 0 0.8rem 0;
    color: #c04888;
    font-weight: 900;
    letter-spacing: 0.01em;
    text-align: left;
    padding-left: 0.2rem;
  }
  .cart-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 7.5rem; /* Ensure content is not hidden behind footer */
  }
  .cart-item {
    width: 75%;
    max-width: 320px;
    min-width: 180px;
    margin: 0 auto 0.7rem auto;
  }
  .cart-item:not(:last-child)::after {
    content: '';
    display: block;
    position: absolute;
    left: 1.2rem;
    right: 1.2rem;
    bottom: -0.5rem;
    height: 1px;
    background: linear-gradient(90deg, #23202b 60%, transparent 100%);
    opacity: 0.5;
    border-radius: 1px;
  }
  .cart-item:hover {
    box-shadow:
      0 8px 32px 0 rgba(192, 72, 136, 0.18),
      0 2px 12px 0 rgba(30, 30, 60, 0.13);
    transform: translateY(-2px) scale(1.012);
  }
  .cart-item-image {
    width: 62px;
    height: 62px;
    border-radius: 14px;
    overflow: hidden;
    background: #23202b;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin: 0;
    border: 2px solid #23202b;
    box-shadow: 0 2px 8px rgba(30, 30, 60, 0.13);
    transition: box-shadow 0.18s;
  }
  .cart-item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 14px;
    display: block;
  }
  .cart-item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    align-items: flex-start;
    padding: 0.1rem 0.1rem 0.1rem 0.2rem;
    min-width: 0;
  }
  .cart-item-info {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    gap: 0.7rem;
  }
  .cart-event-title {
    font-size: 1.09rem;
    font-weight: 800;
    color: #fff;
    margin-bottom: 0.1rem;
    line-height: 1.22;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.01em;
  }
  .cart-price {
    font-size: 1.09rem;
    font-weight: 800;
    color: #e04e95;
    margin-left: 0.7rem;
    white-space: nowrap;
    align-self: flex-start;
    letter-spacing: 0.01em;
  }
  .cart-ticket-type {
    font-size: 0.99rem;
    color: #bdbdbd;
    font-weight: 600;
    margin-bottom: 0.05rem;
    margin-top: 0.1rem;
    letter-spacing: 0.01em;
  }
  .cart-address {
    font-size: 0.93rem;
    color: #888;
    margin-bottom: 0.1rem;
    gap: 0.3rem;
    font-weight: 500;
  }
  .cart-qty-label {
    display: none;
  }
  .cart-item-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.7rem;
    margin-top: 0.3rem;
    width: 100%;
    justify-content: flex-start;
  }
  .cart-qty-group {
    padding: 0.12rem 0.4rem;
    gap: 0.18rem;
  }
  .qty-btn {
    font-size: 1.18rem;
    padding: 0 0.8rem;
    background: #18151f;
    color: #c04888;
    border: 1.5px solid #23202b;
    border-radius: 8px;
    min-width: 34px;
    min-height: 34px;
    font-weight: 900;
    transition:
      background 0.18s,
      color 0.18s,
      transform 0.18s,
      box-shadow 0.18s;
    box-shadow: 0 1px 4px rgba(192, 72, 136, 0.08);
  }
  .qty-btn:focus,
  .qty-btn:hover:not(:disabled) {
    background: #c04888;
    color: #fff;
    border-color: #e04e95;
    transform: scale(1.11);
    box-shadow: 0 2px 8px rgba(192, 72, 136, 0.18);
  }
  .cart-qty {
    font-size: 1.09rem;
    font-weight: 800;
    color: #fff;
    min-width: 2.2rem;
    text-align: center;
    background: none;
    letter-spacing: 0.01em;
  }
  .cart-remove-inline {
    margin-left: 0.7rem;
    background: none;
    border: none;
    color: #e74c3c;
    font-size: 1.18rem;
    cursor: pointer;
    padding: 0.3rem 0.5rem;
    border-radius: 8px;
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
    background: #23202b;
    color: #c04888;
    box-shadow: 0 2px 8px rgba(192, 72, 136, 0.18);
    transform: scale(1.13) rotate(-7deg);
  }
  .cart-summary {
    display: none !important;
  }
  .cart-footer-summary {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1200;
    background: linear-gradient(90deg, #18151f 80%, #23202b 100%);
    border-top: 1.5px solid #23202b;
    box-shadow: 0 -2px 16px rgba(30, 30, 60, 0.13);
    padding: 1.1rem 1.2rem 1.5rem 1.2rem;
    width: 100vw;
    max-width: 100vw;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    align-items: stretch;
  }
  .cart-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #fff;
    font-size: 1.13rem;
    font-weight: 900;
    margin-bottom: 0.3rem;
    letter-spacing: 0.01em;
  }
  .cart-footer-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
  .cart-clear-btn,
  .cart-checkout-btn {
    width: 100%;
    min-width: 0;
    font-size: 1.13rem;
    height: 3.1rem;
    padding: 0.9rem 0;
    border-radius: 12px;
    font-weight: 900;
    letter-spacing: 0.01em;
    box-shadow: 0 2px 8px rgba(192, 72, 136, 0.13);
    transition:
      box-shadow 0.18s,
      background 0.18s,
      color 0.18s,
      transform 0.18s;
  }
}
@media (max-width: 480px) {
  .cart-container {
    width: 99%;
    max-width: 99vw;
    padding: 0.1rem 0.5rem 6.5rem 0.5rem;
  }
  .cart-item {
    padding: 1.5rem 0.4rem 1.5rem 0.4rem;
    width: 100%;
    max-width: 100%;
    margin-bottom: 0.5rem;
  }
  .cart-item-image {
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }
  .cart-event-title {
    font-size: 0.99rem;
  }
  .cart-ticket-type,
  .cart-address {
    font-size: 0.81rem;
  }
  .cart-summary {
    padding: 0.8rem 0.4rem 1.1rem 0.4rem;
    border-radius: 13px;
    margin: 1.2rem 0 0.7rem 0;
  }
  .cart-checkout-btn,
  .cart-clear-btn {
    font-size: 1.01rem;
    height: 2.5rem;
    border-radius: 9px;
  }
}
</style>

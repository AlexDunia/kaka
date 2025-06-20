<template>
  <div class="cart-bg">
    <button class="back-button" @click="$emit('back')">← Back</button>
    <div class="cart-container">
      <h1 class="cart-title">Your Cart</h1>
      <div v-if="isEmpty" class="cart-empty">
        <div class="empty-cart-icon">🛒</div>
        <p>Your cart is empty.</p>
        <button class="continue-shopping" @click="$emit('continue-shopping')">
          Continue Shopping
        </button>
      </div>
      <div v-else class="cart-list">
        <div v-for="item in items" :key="item.eventId + '-' + item.ticketId" class="cart-item">
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
            </div>
            <div class="cart-item-actions">
              <div class="cart-qty-group">
                <button
                  @click="$emit('update-quantity', item, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  class="qty-btn"
                >
                  -
                </button>
                <span class="cart-qty">{{ item.quantity }}</span>
                <button @click="$emit('update-quantity', item, item.quantity + 1)" class="qty-btn">
                  +
                </button>
                <button
                  class="cart-remove cart-remove-inline"
                  @click="$emit('remove-item', item)"
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
    </div>
    <div class="cart-footer-summary" v-if="!isEmpty">
      <div class="cart-footer-row">
        <span>Subtotal</span>
        <span>{{ '₦' + total.toLocaleString('en-NG') }}</span>
      </div>
      <div class="cart-footer-actions">
        <button class="cart-clear-btn" @click="$emit('clear-cart')">Clear Cart</button>
        <button class="cart-checkout-btn" @click="$emit('checkout')">Proceed to Checkout</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
  isEmpty: {
    type: Boolean,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
})

defineEmits([
  'back',
  'continue-shopping',
  'update-quantity',
  'remove-item',
  'clear-cart',
  'checkout',
])
</script>

<style scoped>
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

.cart-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cart-item-info {
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

.cart-item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
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

.cart-price {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

.cart-remove-inline {
  padding: 0.35rem;
  color: #e74c3c;
  opacity: 0.9;
  margin-left: 0.25rem;
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

<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import EventCover from '@/components/EventCover.vue'
import FeedbackToast from '@/components/FeedbackToast.vue'
import {
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  MapPinIcon,
} from '@heroicons/vue/24/outline'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { quoteCheckout } from '@/services/checkoutService'

defineOptions({ name: 'CartPage' })

const cart = useCartStore()
const router = useRouter()
const notification = ref(null)
const quote = ref(null),
  quoteError = ref(''),
  quoting = ref(false)
let quoteVersion = 0,
  quoteTimer,
  notificationTimer
const money = (minor) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: quote.value?.currency || 'NGN',
  }).format(Number(minor) / 100)
const lineTotal = (item) =>
  quote.value?.items?.find((line) => Number(line.ticket_type_id) === Number(item.ticketId))
    ?.line_total_minor
watch(
  () => JSON.stringify(cart.checkoutItems),
  () => {
    const version = ++quoteVersion
    clearTimeout(quoteTimer)
    quote.value = null
    quoteError.value = ''
    quoting.value = !cart.isEmpty
    if (cart.isEmpty) return
    quoteTimer = setTimeout(async () => {
      try {
        const current = await quoteCheckout(cart.checkoutItems)
        if (version === quoteVersion) quote.value = current
      } catch {
        if (version === quoteVersion)
          quoteError.value = 'We couldn’t confirm these tickets. Review availability at checkout.'
      } finally {
        if (version === quoteVersion) quoting.value = false
      }
    }, 200)
  },
  { immediate: true },
)
onUnmounted(() => {
  quoteVersion++
  clearTimeout(quoteTimer)
  clearTimeout(notificationTimer)
})
const isMobile = ref(window.innerWidth <= 700)

function handleResize() {
  isMobile.value = window.innerWidth <= 700
}
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

function showNotification(msg) {
  notification.value = msg
  clearTimeout(notificationTimer)
  notificationTimer = setTimeout(() => (notification.value = null), 1800)
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
  <main class="cart-bg cart-page" aria-labelledby="cart-title">
    <button type="button" class="back-button" @click="router.back()">
      <ArrowLeftIcon aria-hidden="true" />Back
    </button>
    <div class="cart-container">
      <h1 id="cart-title" class="cart-title">Your cart</h1>
      <Transition name="cart-state" mode="out-in">
        <section v-if="cart.isEmpty" key="empty" class="cart-empty" aria-label="Empty cart">
          <img class="empty-cart-icon" :src="pngIconUrl('cart')" alt="" width="64" height="64" />
          <p>Your cart is empty.</p>
          <button type="button" class="continue-shopping" @click="router.push('/')">
            Find events
          </button>
        </section>
        <div v-else key="tickets" class="cart-layout">
          <TransitionGroup
            name="cart-item"
            tag="div"
            class="cart-list"
            aria-label="Tickets in your cart"
          >
            <article
              v-for="item in cart.items"
              :key="item.eventId + '-' + item.ticketId"
              class="cart-item"
            >
              <div class="cart-item-top">
                <div class="cart-item-image">
                  <EventCover
                    :src="item.eventImage || ''"
                    :alt="item.eventTitle || 'Event image'"
                  />
                </div>
                <div class="cart-item-info">
                  <h2 class="cart-event-title">{{ item.eventTitle }}</h2>
                  <p class="cart-ticket-type">{{ item.ticketType }}</p>
                  <p v-if="item.eventAddress" class="cart-address">
                    <MapPinIcon aria-hidden="true" />{{ item.eventAddress }}
                  </p>
                </div>
              </div>
              <div class="cart-item-bottom">
                <div
                  class="cart-qty-group"
                  role="group"
                  :aria-label="`Quantity for ${item.ticketType}`"
                >
                  <button
                    type="button"
                    @click="updateQuantity(item, item.quantity - 1)"
                    :disabled="item.quantity <= 1"
                    class="qty-btn"
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon aria-hidden="true" />
                  </button>
                  <span class="cart-qty" aria-live="polite">{{ item.quantity }}</span>
                  <button
                    type="button"
                    @click="updateQuantity(item, item.quantity + 1)"
                    class="qty-btn"
                    aria-label="Increase quantity"
                  >
                    <PlusIcon aria-hidden="true" />
                  </button>
                </div>
                <div class="cart-actions">
                  <span class="cart-price">{{
                    lineTotal(item) == null ? 'Checking price...' : money(lineTotal(item))
                  }}</span>
                  <button
                    type="button"
                    class="cart-remove-inline"
                    @click="removeItem(item)"
                    title="Remove item"
                    :aria-label="`Remove ${item.ticketType} from cart`"
                  >
                    <TrashIcon aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          </TransitionGroup>
          <aside
            class="cart-footer-summary"
            aria-labelledby="cart-summary-title"
            :aria-busy="quoting"
          >
            <h2 id="cart-summary-title">Order summary</h2>
            <div class="cart-footer-row" aria-live="polite">
              <span>Subtotal</span
              ><strong>{{
                quote ? money(quote.total_minor) : quoting ? 'Checking total...' : 'Unavailable'
              }}</strong>
            </div>
            <p v-if="quoteError" class="cart-quote-error" role="alert">{{ quoteError }}</p>
            <div class="cart-footer-actions">
              <button type="button" class="cart-checkout-btn" @click="proceedToCheckout">
                Go to checkout
              </button>
              <button type="button" class="cart-clear-btn" @click="clearCart">Clear cart</button>
            </div>
          </aside>
        </div>
      </Transition>
      <FeedbackToast :message="notification || ''" @dismiss="notification = null" />
    </div>
  </main>
</template>

<style scoped>
.cart-page {
  width: var(--ds-rhythm-page-width);
  max-width: var(--ds-rhythm-page-max);
  margin: 0 auto;
  padding: var(--ds-space-24) 0 var(--ds-rhythm-section-gap);
  min-height: 60vh;
  color: var(--ds-color-text);
}
.cart-container {
  width: 100%;
  padding: var(--ds-space-24) 0 0;
}
.back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-8);
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-color-text-secondary);
  cursor: pointer;
}
.back-button svg {
  width: 18px;
  height: 18px;
}
#app .cart-page .cart-title {
  font-size: var(--ds-size-public-h2) !important;
  margin: 0 0 var(--ds-rhythm-group-gap) !important;
}
.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: var(--ds-space-48) var(--ds-space-24);
  border-radius: var(--ds-radius-card);
  background: var(--ds-color-surface-subtle);
  text-align: center;
}
.empty-cart-icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
  margin-bottom: var(--ds-space-24);
}
.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: var(--ds-rhythm-card-gap);
}
.cart-list {
  display: grid;
  gap: var(--ds-space-24);
  min-width: 0;
}
.cart-item,
.cart-footer-summary {
  padding: var(--ds-space-24);
  background: var(--ds-color-surface);
  border-radius: var(--ds-radius-card);
  box-shadow: var(--ds-shadow-card);
  min-width: 0;
}
.cart-item {
  border: 1px solid var(--ds-color-border-card);
}
.cart-item-top {
  display: flex;
  align-items: start;
  gap: var(--ds-space-20);
}
.cart-item-image {
  width: 112px;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--ds-radius-control);
  flex-shrink: 0;
}
.cart-item-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cart-item-image :deep(.ep-system-hero-placeholder) {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: var(--ds-color-surface-subtle);
}
.cart-item-image :deep(.ep-system-hero-placeholder svg) {
  width: 28px;
  height: 28px;
}
.cart-item-image :deep(.ep-system-hero-placeholder span) {
  display: none;
}
.cart-item-info {
  flex: 1;
  min-width: 0;
}
#app .cart-page .cart-event-title {
  font-size: var(--ds-size-h4) !important;
  margin: 0 0 var(--ds-space-8) !important;
}
#app .cart-page :is(.cart-ticket-type, .cart-address) {
  margin: 0 0 var(--ds-space-8) !important;
  font-size: var(--ds-size-small) !important;
  color: var(--ds-color-text-secondary);
}
.cart-address {
  display: flex;
  align-items: start;
  gap: var(--ds-space-8);
  overflow-wrap: anywhere;
}
.cart-address svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.cart-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-16);
  margin-top: var(--ds-space-24);
}
.cart-qty-group,
.cart-actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-12);
}
.cart-qty-group {
  padding: 0 var(--ds-space-4);
  border-radius: var(--ds-radius-control);
  background: var(--ds-color-surface-subtle);
}
.cart-qty {
  min-width: 24px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.qty-btn,
.cart-remove-inline {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: var(--ds-space-12);
  border: 0;
  border-radius: var(--ds-radius-control);
  background: transparent;
  color: var(--ds-color-text);
  cursor: pointer;
}
.qty-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.cart-remove-inline {
  color: var(--ds-color-danger);
}
.cart-page button:hover:not(:disabled) {
  filter: brightness(0.97);
}
.cart-page :is(.qty-btn, .cart-remove-inline):hover:not(:disabled) {
  background: var(--ds-color-surface-subtle);
}
.cart-page button svg {
  width: 20px;
  height: 20px;
}
.cart-price {
  font-weight: var(--ds-weight-medium);
}
.cart-footer-summary {
  position: sticky;
  top: 120px;
  background: var(--ds-color-surface-subtle);
}
#app .cart-page #cart-summary-title {
  font-size: var(--ds-size-h4) !important;
  margin: 0 0 var(--ds-space-24) !important;
}
.cart-footer-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ds-space-12);
  margin-bottom: var(--ds-space-24);
}
.cart-footer-row strong {
  font-weight: var(--ds-weight-semibold);
}
.cart-footer-actions {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
}
.continue-shopping,
.cart-checkout-btn,
.cart-clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: var(--ds-space-12) var(--ds-space-24);
  border: 0;
  border-radius: var(--ds-radius-control);
  font-weight: var(--ds-weight-medium);
  cursor: pointer;
}
.continue-shopping,
.cart-checkout-btn {
  background: var(--ds-color-brand-accent);
  color: var(--ds-color-on-brand);
}
.continue-shopping:hover,
.cart-checkout-btn:hover {
  background: var(--ds-color-brand);
}
.cart-clear-btn {
  background: transparent;
  color: var(--ds-color-text-secondary);
}
#app .cart-page .cart-quote-error {
  color: var(--ds-color-danger);
  font-size: var(--ds-size-small) !important;
}
.cart-state-enter-active,
.cart-state-leave-active,
.cart-item-enter-active,
.cart-item-leave-active,
.cart-item-move {
  transition:
    opacity var(--ds-motion-reveal, 220ms) ease,
    transform var(--ds-motion-reveal, 220ms) ease;
}
.cart-state-enter-from,
.cart-state-leave-to,
.cart-item-enter-from,
.cart-item-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
@media (max-width: 1000px) {
  .cart-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .cart-footer-summary {
    position: static;
  }
}
@media (max-width: 760px) {
  .cart-page {
    width: var(--ds-rhythm-page-width-mobile);
    padding-top: var(--ds-space-16);
  }
  #app .cart-page .cart-title {
    font-size: var(--ds-size-public-h2-mobile) !important;
  }
  .cart-item,
  .cart-footer-summary {
    padding: var(--ds-space-20);
  }
  .cart-item-top {
    gap: var(--ds-space-12);
  }
  .cart-item-image {
    width: 80px;
  }
  .cart-actions {
    flex: 1;
    justify-content: flex-end;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cart-state-enter-active,
  .cart-state-leave-active,
  .cart-item-enter-active,
  .cart-item-leave-active,
  .cart-item-move {
    transition: none;
  }
}
</style>

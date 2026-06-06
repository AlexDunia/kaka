import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const getStoredItems = () => JSON.parse(sessionStorage.getItem('cartItems') || '[]')

export const useCartStore = defineStore('cart', () => {
  const items = ref(getStoredItems())

  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.pricePerTicket * item.quantity, 0),
  )
  const isEmpty = computed(() => items.value.length === 0)

  const persist = () => {
    sessionStorage.setItem('cartItems', JSON.stringify(items.value))
  }

  const addItem = (item) => {
    const existing = items.value.find(
      (cartItem) => cartItem.eventId === item.eventId && cartItem.ticketId === item.ticketId,
    )

    if (existing) {
      existing.quantity += item.quantity
    } else {
      items.value.push({ ...item })
    }

    persist()
  }

  const updateQuantity = (eventId, ticketId, quantity) => {
    const item = items.value.find(
      (cartItem) => cartItem.eventId === eventId && cartItem.ticketId === ticketId,
    )

    if (!item) return

    item.quantity = quantity

    if (item.quantity <= 0) {
      removeItem(eventId, ticketId)
      return
    }

    persist()
  }

  const removeItem = (eventId, ticketId) => {
    items.value = items.value.filter(
      (item) => !(item.eventId === eventId && item.ticketId === ticketId),
    )
    persist()
  }

  const clearCart = () => {
    items.value = []
    persist()
  }

  return {
    items,
    itemCount,
    total,
    isEmpty,
    persist,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }
})

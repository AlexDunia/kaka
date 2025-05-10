import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: JSON.parse(sessionStorage.getItem('cartItems') || '[]'),
  }),
  getters: {
    itemCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    total: (state) =>
      state.items.reduce((sum, item) => sum + item.pricePerTicket * item.quantity, 0),
    isEmpty: (state) => state.items.length === 0,
  },
  actions: {
    persist() {
      sessionStorage.setItem('cartItems', JSON.stringify(this.items))
    },
    addItem(item) {
      const existing = this.items.find(
        (i) => i.eventId === item.eventId && i.ticketId === item.ticketId,
      )
      if (existing) {
        existing.quantity += item.quantity
      } else {
        this.items.push({ ...item })
      }
      this.persist()
    },
    updateQuantity(eventId, ticketId, quantity) {
      const item = this.items.find((i) => i.eventId === eventId && i.ticketId === ticketId)
      if (item) {
        item.quantity = quantity
        if (item.quantity <= 0) this.removeItem(eventId, ticketId)
        this.persist()
      }
    },
    removeItem(eventId, ticketId) {
      this.items = this.items.filter((i) => !(i.eventId === eventId && i.ticketId === ticketId))
      this.persist()
    },
    clearCart() {
      this.items = []
      this.persist()
    },
  },
})

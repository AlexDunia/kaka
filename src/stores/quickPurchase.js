import { defineStore } from 'pinia'

export const useQuickPurchaseStore = defineStore('quickPurchase', {
  state: () => ({
    ticket: null,
  }),
  actions: {
    setTicket(ticket) {
      this.ticket = ticket
    },
    clearTicket() {
      this.ticket = null
    },
  },
})

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useQuickPurchaseStore = defineStore('quickPurchase', () => {
  const ticket = ref(null)

  const setTicket = (selectedTicket) => {
    ticket.value = selectedTicket
  }

  const clearTicket = () => {
    ticket.value = null
  }

  return {
    ticket,
    setTicket,
    clearTicket,
  }
})

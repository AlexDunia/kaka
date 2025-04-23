import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import purchaseService from '@/services/purchaseService'
import { useAuthStore } from './auth'

export const usePurchaseStore = defineStore('purchases', () => {
  // State
  const purchases = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchUserPurchases = async () => {
    const authStore = useAuthStore()
    if (!authStore.user) return []

    loading.value = true
    error.value = null

    try {
      const userPurchases = await purchaseService.getPurchasesByUser(authStore.user.id)
      purchases.value = userPurchases
      return userPurchases
    } catch (err) {
      error.value = err.message || 'Failed to fetch purchase history'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAllPurchases = async () => {
    const authStore = useAuthStore()
    // Only admins can fetch all purchases
    if (!authStore.isAdmin) {
      error.value = 'Unauthorized'
      return []
    }

    loading.value = true
    error.value = null

    try {
      const allPurchases = await purchaseService.getAllPurchases()
      purchases.value = allPurchases
      return allPurchases
    } catch (err) {
      error.value = err.message || 'Failed to fetch purchases'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createPurchase = async (purchaseData) => {
    const authStore = useAuthStore()
    if (!authStore.user) {
      error.value = 'You must be logged in to purchase tickets'
      throw new Error('Authentication required')
    }

    loading.value = true
    error.value = null

    try {
      // Add user ID to purchase data
      const data = {
        ...purchaseData,
        userId: authStore.user.id,
      }

      const purchase = await purchaseService.createPurchase(data)
      // Add to purchases array
      purchases.value.push(purchase)
      return purchase
    } catch (err) {
      error.value = err.message || 'Failed to complete purchase'
      throw err
    } finally {
      loading.value = false
    }
  }

  const cancelPurchase = async (purchaseId) => {
    const authStore = useAuthStore()
    if (!authStore.user) {
      error.value = 'You must be logged in to cancel a purchase'
      throw new Error('Authentication required')
    }

    loading.value = true
    error.value = null

    try {
      const result = await purchaseService.cancelPurchase(purchaseId, authStore.user.id)

      // Update purchase status in the purchases array
      const index = purchases.value.findIndex((p) => p.id === purchaseId)
      if (index !== -1) {
        purchases.value[index] = result
      }

      return result
    } catch (err) {
      error.value = err.message || 'Failed to cancel purchase'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getPurchaseStats = async () => {
    const authStore = useAuthStore()
    // Only admins can access stats
    if (!authStore.isAdmin) {
      error.value = 'Unauthorized'
      throw new Error('Admin privileges required')
    }

    loading.value = true
    error.value = null

    try {
      const stats = await purchaseService.getPurchaseStats()
      return stats
    } catch (err) {
      error.value = err.message || 'Failed to fetch purchase statistics'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed properties
  const upcomingPurchases = computed(() => {
    const now = new Date()
    return purchases.value
      .filter((p) => p.status === 'confirmed' && new Date(p.eventDate) > now)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
  })

  const pastPurchases = computed(() => {
    const now = new Date()
    return purchases.value
      .filter((p) => new Date(p.eventDate) < now)
      .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
  })

  const totalSpent = computed(() => {
    return purchases.value
      .filter((p) => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.totalPrice, 0)
  })

  return {
    purchases,
    loading,
    error,
    upcomingPurchases,
    pastPurchases,
    totalSpent,
    fetchUserPurchases,
    fetchAllPurchases,
    createPurchase,
    cancelPurchase,
    getPurchaseStats,
  }
})
 
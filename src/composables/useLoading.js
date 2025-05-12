import { ref } from 'vue'

/**
 * Composable for managing loading states across the application
 * @param {Object} options - Configuration options
 * @param {boolean} options.initialState - Initial loading state (default: true)
 * @param {number} options.safetyTimeout - Safety timeout in ms to prevent hanging (default: 8000)
 * @returns {Object} Loading state and control methods
 */
export function useLoading(options = {}) {
  const { initialState = true, safetyTimeout = 8000 } = options

  const isLoading = ref(initialState)
  const safetyTimer = ref(null)

  /**
   * Start loading and execute the provided operation with safety timeout
   * @param {Function} asyncOperation - Optional async operation to perform while loading
   * @returns {Promise} Promise that resolves when loading is complete
   */
  const startLoading = async (asyncOperation = null) => {
    // Clear any existing safety timer
    if (safetyTimer.value) {
      clearTimeout(safetyTimer.value)
    }

    isLoading.value = true

    // Set safety timeout to prevent hanging on network issues
    safetyTimer.value = setTimeout(() => {
      if (isLoading.value) {
        console.warn('Safety timeout triggered in useLoading')
        isLoading.value = false
      }
    }, safetyTimeout)

    try {
      // If there's an async operation, run it
      if (asyncOperation && typeof asyncOperation === 'function') {
        await asyncOperation()
      }
    } catch (error) {
      console.error('Error during loading operation:', error)

      // Check if it's a network error
      const isNetworkError =
        error.message?.includes('Network Error') || error.code === 'ECONNABORTED' || !error.response

      if (isNetworkError) {
        console.warn('Network error detected, content might not be available')
      }

      throw error
    } finally {
      clearTimeout(safetyTimer.value)
      isLoading.value = false
    }
  }

  /**
   * Manually stop loading
   */
  const stopLoading = () => {
    if (safetyTimer.value) {
      clearTimeout(safetyTimer.value)
    }
    isLoading.value = false
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
  }
}

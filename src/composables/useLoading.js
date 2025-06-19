import { ref } from 'vue'

/**
 * A composable for managing loading states with safety timeouts
 * @param {Object} options - Configuration options
 * @param {boolean} options.initialState - Initial loading state (default: true)
 * @param {number} options.timeout - Timeout in milliseconds (default: 5000)
 * @returns {Object} Loading state and control functions
 */
export function useLoading(options = {}) {
  const { initialState = true, timeout = 5000 } = options
  const isLoading = ref(initialState)
  let timeoutId = null

  const startLoading = async (loadingOperation) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    isLoading.value = true
    timeoutId = setTimeout(() => {
      isLoading.value = false
    }, timeout)

    try {
      const result = await loadingOperation()
      isLoading.value = false
      clearTimeout(timeoutId)
      return result
    } catch (error) {
      isLoading.value = false
      clearTimeout(timeoutId)
      throw error
    }
  }

  const stopLoading = () => {
    isLoading.value = false
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
  }
}

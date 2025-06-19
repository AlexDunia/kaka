import axios from 'axios'

// This service is for development debugging only
// It should be removed or disabled in production

export function logDebugInfo() {
  if (import.meta.env.DEV) {
    // No-op in production
  }
}

export function logError() {
  if (import.meta.env.DEV) {
    // No-op in production
  }
}

// Simple debug helper with consistent formatting
const debug = {
  log: () => {
    if (import.meta.env.DEV) {
      // No-op in development
    }
  },

  error: () => {
    if (import.meta.env.DEV) {
      // No-op in development
    }
  },

  // Test connection to API endpoints
  testAPI: async (url) => {
    try {
      const response = await axios.get(url)
      return {
        success: true,
        data: response.data,
      }
    } catch (err) {
      return {
        success: false,
        error: err.message,
      }
    }
  },
}

export default debug

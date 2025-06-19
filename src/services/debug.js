import axios from 'axios'

// Simple debug helper with consistent formatting
const debug = {
  log: (label, data) => {
    console.log(
      `%c ${label} `,
      'background: #0066cc; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
      data,
    )
  },

  error: (label, error) => {
    console.error(
      `%c ${label} `,
      'background: #cc0000; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
      error,
    )
  },

  // Test connection to API endpoints
  testAPI: async (url) => {
    try {
      debug.log('Testing API connection to', url)
      const response = await axios.get(url)
      debug.log('API Response', response.data)
      return {
        success: true,
        data: response.data,
      }
    } catch (err) {
      debug.error('API Connection Failed', err)
      return {
        success: false,
        error: err.message,
      }
    }
  },
}

export default debug

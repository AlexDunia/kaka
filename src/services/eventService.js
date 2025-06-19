// import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

// Configuration
const EVENTS_API_URL = '/api/events.php'
// const EVENTS_API_URL = 'http://localhost/api/events.php'
const EVENTS_FALLBACK_API_URL = 'http://localhost/api/test-search.php'

// Minimum loading time to ensure loaders are visible
const MIN_LOADING_TIME = 800 // milliseconds

/**
 * Ensures a minimum loading time for API calls
 * This helps ensure skeleton loaders are visible before content appears
 * @param {Promise} promise - The API call promise
 * @returns {Promise} - Promise that resolves after MIN_LOADING_TIME or the original promise
 */
const ensureMinLoadTime = async (promise) => {
  const startTime = Date.now()

  // Wait for the promise to resolve
  const result = await promise

  // Calculate how much time has passed
  const elapsedTime = Date.now() - startTime

  // If the API call was too fast, add a delay
  if (elapsedTime < MIN_LOADING_TIME) {
    await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME - elapsedTime))
  }

  return result
}

// Security enhancements
// CSRF token management
const generateCSRFToken = () => {
  const token =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  localStorage.setItem('csrf_token', token)
  return token
}

const getCSRFToken = () => {
  let token = localStorage.getItem('csrf_token')
  if (!token) {
    token = generateCSRFToken()
  }
  return token
}

// Input sanitization
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return str

  // Basic HTML sanitization - in production use a proper sanitizer library
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim()
}

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object'
            ? sanitizeObject(item)
            : item,
      )
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value)
    } else {
      result[key] = value
    }
  }

  return result
}

// Helper for API requests
const api = axios.create({
  baseURL: EVENTS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Reduce timeout to prevent hanging requests
  timeout: 8000,
})

// Add request interceptor for security
api.interceptors.request.use(
  (config) => {
    // Add CSRF token to all non-GET requests
    if (config.method.toUpperCase() !== 'GET') {
      config.headers['X-CSRF-Token'] = getCSRFToken()
    }

    // Add random request ID for tracing
    const requestId = Math.random().toString(36).substring(2, 15)
    config.headers['X-Request-ID'] = requestId

    // Sanitize request data for non-GET requests
    if (config.data && typeof config.data === 'object') {
      config.data = sanitizeObject(config.data)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor for enhanced error handling
api.interceptors.response.use(
  (response) => {
    // Verify response integrity
    if (!response.data) {
      throw new Error('Empty response received from server')
    }

    // Check for error signals in the response data
    if (response.data.error) {
      throw new Error(response.data.error)
    }

    return response
  },
  (error) => {
    let errorMessage = 'Network error or server unavailable'

    if (error.response) {
      // Server responded with an error status code
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message
      } else if (error.response.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.'
        // Handle authentication error - you might want to redirect to login page
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      } else if (error.response.status === 403) {
        errorMessage = 'You do not have permission to perform this action.'
      } else if (error.response.status === 404) {
        errorMessage = 'The requested resource was not found.'
      } else if (error.response.status === 422) {
        // Validation errors
        errorMessage = 'Validation failed. Please check your input.'
        if (error.response.data && error.response.data.errors) {
          const firstError = Object.values(error.response.data.errors)[0]
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0]
          }
        }
      } else if (error.response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      } else if (error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
    } else if (error.request) {
      // Request was made but no response
      errorMessage = 'No response from server. Please check your connection.'

      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again later.'
      }
    }

    // Modify the error object to include a user-friendly message
    error.userMessage = errorMessage
    return Promise.reject(error)
  },
)

// Configure auth token when available
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    // Also store token in localStorage for persistence
    localStorage.setItem('auth_token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('auth_token')
  }
}

// Initialize token from localStorage if exists
const storedToken = localStorage.getItem('auth_token')
if (storedToken) {
  setAuthToken(storedToken)
}

// Handle data storage (localStorage or API)
const dataService = {
  // Make API_URL accessible for advanced queries
  EVENTS_API_URL,

  // EVENTS
  async getAllEvents(page = 1, limit = 12) {
    const mainApiCall = async () => {
      // Add cache busting parameter for fresh results
      const cacheBuster = Date.now()
      const response = await axios.get(
        `${EVENTS_API_URL}?page=${page}&limit=${limit}&_=${cacheBuster}`,
        {
          headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
        },
      )
      return response.data
    }

    const fallbackApiCall = async () => {
      const response = await axios.get(
        `${EVENTS_FALLBACK_API_URL}?page=${page}&limit=${limit}&_=${Date.now()}`,
        {
          headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
        },
      )
      return response.data
    }

    // Ensure minimum loading time for skeleton visibility
    return ensureMinLoadTime(handleApiWithFallback(mainApiCall, fallbackApiCall))
  },

  async getEventById(id) {
    // Validate ID before sending to API
    if (!id || isNaN(parseInt(id))) {
      throw new Error('Invalid event ID')
    }

    const response = await axios.get(`${EVENTS_API_URL}?id=${parseInt(id)}`, {
      headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
    })
    return response.data // Single event doesn't use the data/pagination structure
  },

  async getEventsByCategory(category, page = 1, limit = 12) {
    // Sanitize and normalize category for consistency
    category = sanitizeString(category)
    const normalizedCategory = category.toLowerCase().trim()

    const mainApiCall = async () => {
      const url = `${EVENTS_API_URL}?category=${encodeURIComponent(normalizedCategory)}&page=${page}&limit=${limit}`
      const response = await axios.get(url, {
        headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
      })
      return response.data
    }

    const fallbackApiCall = async () => {
      const response = await axios.get(
        `${EVENTS_FALLBACK_API_URL}?category=${encodeURIComponent(normalizedCategory)}&page=${page}&limit=${limit}`,
        {
          headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
        },
      )
      return response.data
    }

    return ensureMinLoadTime(handleApiWithFallback(mainApiCall, fallbackApiCall))
  },

  async getFeaturedEvents(limit = 6) {
    const mainApiCall = async () => {
      const response = await axios.get(`${EVENTS_API_URL}?featured=1&limit=${limit}`, {
        headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
      })
      return response.data
    }

    const fallbackApiCall = async () => {
      const response = await axios.get(`${EVENTS_FALLBACK_API_URL}?featured=1&limit=${limit}`, {
        headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
      })
      return response.data
    }

    return ensureMinLoadTime(handleApiWithFallback(mainApiCall, fallbackApiCall))
  },

  async searchEvents(query, category = null, page = 1, limit = 12) {
    // Sanitize inputs
    query = sanitizeString(query)
    if (category) {
      category = sanitizeString(category)
    }

    const response = await axios.get(
      `${EVENTS_API_URL}?search=${encodeURIComponent(query)}${
        category ? `&category=${encodeURIComponent(category)}` : ''
      }&page=${page}&limit=${limit}`,
      {
        headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
      },
    )
    return response.data
  },

  async createEvent(eventData) {
    const response = await axios.post(EVENTS_API_URL, sanitizeObject(eventData), {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': Math.random().toString(36).substring(2, 15),
        'X-CSRF-Token': getCSRFToken(),
      },
    })
    return response.data
  },

  async updateEvent(id, eventData) {
    const response = await axios.put(`${EVENTS_API_URL}?id=${id}`, sanitizeObject(eventData), {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': Math.random().toString(36).substring(2, 15),
        'X-CSRF-Token': getCSRFToken(),
      },
    })
    return response.data
  },

  async deleteEvent(id) {
    const response = await axios.delete(`${EVENTS_API_URL}?id=${id}`, {
      headers: {
        'X-Request-ID': Math.random().toString(36).substring(2, 15),
        'X-CSRF-Token': getCSRFToken(),
      },
    })
    return response.data
  },

  // CATEGORIES
  async getAllCategories() {
    const response = await axios.get(`${EVENTS_API_URL}?type=categories`, {
      headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
    })
    return response.data
  },

  // SUBCATEGORIES
  async getAllSubCategories() {
    const response = await axios.get(`${EVENTS_API_URL}?type=subcategories`, {
      headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
    })
    return response.data
  },

  async getSubCategoriesByCategory(categoryId) {
    const response = await axios.get(
      `${EVENTS_API_URL}?type=subcategories&category=${categoryId}`,
      {
        headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
      },
    )
    return response.data
  },

  /**
   * Get event details by slug
   * @param {string} slug - The event slug
   * @returns {Promise<Object>} - Event details
   */
  async getEventBySlug(slug) {
    const mainApiCall = async () => {
      const response = await axios.get(`${EVENTS_API_URL}?slug=${encodeURIComponent(slug)}`, {
        headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
      })
      return response.data
    }

    const fallbackApiCall = async () => {
      const response = await axios.get(
        `${EVENTS_FALLBACK_API_URL}?slug=${encodeURIComponent(slug)}`,
        {
          headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
        },
      )
      return response.data
    }

    return handleApiWithFallback(mainApiCall, fallbackApiCall)
  },
}

// Helper function to handle API calls with fallback
const handleApiWithFallback = async (apiCall, fallbackCall = null) => {
  try {
    return await apiCall()
  } catch (error) {
    if (fallbackCall) {
      return await fallbackCall()
    }
    throw error
  }
}

export default dataService

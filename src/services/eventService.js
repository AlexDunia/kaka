// import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

// Configuration
// const EVENTS_API_URL = '/api/events.php'
const EVENTS_API_URL = 'http://localhost/api/events.php'
const EVENTS_FALLBACK_API_URL = 'http://localhost/api/test-search.php'

console.debug('EVENTS_API_URL configured as:', EVENTS_API_URL)
console.debug('EVENTS_FALLBACK_API_URL configured as:', EVENTS_FALLBACK_API_URL)

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
    console.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`)

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
    console.error('API Request Error:', error)
    return Promise.reject(error)
  },
)

// Add response interceptor for enhanced error handling
api.interceptors.response.use(
  (response) => {
    console.debug(`API Response: ${response.status} from ${response.config.url}`)

    // Verify response integrity
    if (!response.data) {
      console.error('Empty response data')
      throw new Error('Empty response received from server')
    }

    // Check for error signals in the response data
    if (response.data.error) {
      console.error('API Error in response data:', response.data.error)
      throw new Error(response.data.error)
    }

    return response
  },
  (error) => {
    let errorMessage = 'Network error or server unavailable'

    if (error.response) {
      // Server responded with an error status code
      console.error(
        `API Error: ${error.response.status} from ${error.config.url}`,
        error.response.data,
      )

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
      console.error('API No Response Error:', error.request)
      errorMessage = 'No response from server. Please check your connection.'

      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again later.'
      }
    } else {
      // Error in request configuration
      console.error('API Request Config Error:', error.message)
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
      console.log('Using fallback API for getAllEvents')
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
    try {
      // Validate ID before sending to API
      if (!id || isNaN(parseInt(id))) {
        throw new Error('Invalid event ID')
      }

      const response = await axios.get(`${EVENTS_API_URL}?id=${parseInt(id)}`, {
        headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
      })
      return response.data // Single event doesn't use the data/pagination structure
    } catch (error) {
      console.error(`Error fetching event ID ${id}:`, error)
      throw error
    }
  },

  async getEventsByCategory(category, page = 1, limit = 12) {
    // Sanitize inputs and add debug information
    console.log('getEventsByCategory called with raw category:', category)

    // Ensure category is properly formatted
    category = sanitizeString(category)

    // Make sure category is lowercase for consistency
    if (category) {
      category = category.toLowerCase().trim()
    }

    console.log('Sanitized and normalized category:', category)

    const mainApiCall = async () => {
      console.log(`Calling API with category=${category}, page=${page}, limit=${limit}`)

      const url = `${EVENTS_API_URL}?category=${encodeURIComponent(category)}&page=${page}&limit=${limit}&_=${Date.now()}`
      console.log('API URL:', url)

      const response = await axios.get(url, {
        headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
      })
      console.log('API response status:', response.status)
      console.log('API response data structure:', Object.keys(response.data))
      return response.data
    }

    const fallbackApiCall = async () => {
      console.log('Using fallback API for getEventsByCategory')
      const response = await axios.get(
        `${EVENTS_FALLBACK_API_URL}?category=${encodeURIComponent(category)}&page=${page}&limit=${limit}&_=${Date.now()}`,
        {
          headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
        },
      )
      return response.data
    }

    // Ensure consistent loading experience with skeleton visibility
    return ensureMinLoadTime(handleApiWithFallback(mainApiCall, fallbackApiCall))
  },

  async getFeaturedEvents(limit = 6) {
    const mainApiCall = async () => {
      // Add cache busting parameter for fresh results
      const cacheBuster = Date.now()
      const response = await axios.get(
        `${EVENTS_API_URL}?featured=1&limit=${limit}&_=${cacheBuster}`,
        {
          headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
        },
      )
      return response.data
    }

    const fallbackApiCall = async () => {
      console.log('Using fallback API for getFeaturedEvents')
      // Fallback for featured events - just use regular events and mark them as featured
      const response = await axios.get(
        `${EVENTS_FALLBACK_API_URL}?limit=${limit}&_=${Date.now()}`,
        {
          headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
        },
      )

      // Add featured flag to response data
      if (response.data && response.data.data) {
        response.data.data = response.data.data.map((event) => ({ ...event, featured: true }))
      }

      return response.data
    }

    // Wrap the API call with ensureMinLoadTime to guarantee skeleton display
    return ensureMinLoadTime(handleApiWithFallback(mainApiCall, fallbackApiCall))
  },

  async searchEvents(query, category = null, page = 1, limit = 12) {
    try {
      // Build URL with all parameters
      let url = `${EVENTS_API_URL}?page=${page}&limit=${limit}`

      // Add sanitized search query if provided
      if (query && query.trim()) {
        url += `&search=${encodeURIComponent(sanitizeString(query))}`
      }

      // Add category filter if provided
      if (category && category !== 'all') {
        url += `&category=${encodeURIComponent(sanitizeString(category))}`
      }

      // Add cache busting parameter
      url += `&_=${Date.now()}`

      // Wrap the API call with ensureMinLoadTime
      return ensureMinLoadTime(
        axios
          .get(url, {
            headers: {
              'X-Request-ID': Math.random().toString(36).substring(2, 15),
              'X-Search-Query': sanitizeString(query || ''), // For logging/debugging
            },
          })
          .then((response) => response.data),
      )
    } catch (error) {
      console.error(`Error searching events with query "${query}":`, error)
      throw error
    }
  },

  async createEvent(eventData) {
    try {
      // Generate CSRF token for this request
      const csrfToken = getCSRFToken()

      // Sanitize all input data
      const sanitizedData = sanitizeObject(eventData)

      const response = await api.post('/events.php', sanitizedData, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })
      return response.data
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  },

  async updateEvent(id, eventData) {
    try {
      // Validate ID
      if (!id || isNaN(parseInt(id))) {
        throw new Error('Invalid event ID')
      }

      // Generate CSRF token for this request
      const csrfToken = getCSRFToken()

      // Sanitize all input data
      const sanitizedData = sanitizeObject(eventData)

      const response = await api.put(`/events.php?id=${parseInt(id)}`, sanitizedData, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })
      return response.data
    } catch (error) {
      console.error(`Error updating event ${id}:`, error)
      throw error
    }
  },

  async deleteEvent(id) {
    try {
      // Validate ID
      if (!id || isNaN(parseInt(id))) {
        throw new Error('Invalid event ID')
      }

      // Generate CSRF token for this request
      const csrfToken = getCSRFToken()

      const response = await api.delete(`/events.php?id=${parseInt(id)}`, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })
      return response.data
    } catch (error) {
      console.error(`Error deleting event ${id}:`, error)
      throw error
    }
  },

  // CATEGORIES
  async getAllCategories() {
    try {
      const response = await api.get('/categories.php', {
        headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch categories from API:', error)
      throw error
    }
  },

  // SUBCATEGORIES
  async getAllSubCategories() {
    try {
      const response = await api.get('/subcategories.php', {
        headers: { 'X-Request-ID': Math.random().toString(36).substring(2, 15) },
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch subcategories from API:', error)
      throw error
    }
  },

  async getSubCategoriesByCategory(categoryId) {
    try {
      // Validate categoryId
      if (!categoryId) {
        throw new Error('Invalid category ID')
      }

      const allSubCategories = await this.getAllSubCategories()
      return allSubCategories.filter((subCat) => subCat.categoryId === categoryId)
    } catch (error) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, error)
      throw error
    }
  },

  /**
   * Get event details by slug
   * @param {string} slug - The event slug
   * @returns {Promise<Object>} - Event details
   */
  async getEventBySlug(slug) {
    const mainApiCall = async () => {
      try {
        const response = await api.get(`${EVENTS_API_URL}?slug=${encodeURIComponent(slug)}`)
        return response.data
      } catch (error) {
        console.error('Error fetching event by slug from main API:', error)
        throw error
      }
    }

    const fallbackApiCall = async () => {
      try {
        // For a fallback, we'll fetch all events and find the one with matching slug
        const allEvents = await this.getAllEvents()
        if (allEvents && allEvents.data && Array.isArray(allEvents.data)) {
          // Convert slug to lowercase and create a URL-friendly version for comparison
          const normalizedSlug = slug
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '')

          // Find event with matching slug or create one from the title
          const event = allEvents.data.find(
            (event) =>
              // If the event has a slug property, compare directly
              (event.slug && event.slug.toLowerCase() === slug.toLowerCase()) ||
              // Otherwise, create a slug from the title and compare
              (event.title &&
                event.title
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\w-]/g, '') === normalizedSlug),
          )

          if (event) {
            // Add the slug to the event object if it doesn't exist
            if (!event.slug) {
              event.slug = event.title
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]/g, '')
            }
            return event
          }
        }
        throw new Error('Event not found')
      } catch (error) {
        console.error('Error in fallback for getEventBySlug:', error)
        throw error
      }
    }

    return await handleApiWithFallback(mainApiCall, fallbackApiCall)
  },
}

// Fallback mechanism if the main API times out
const handleApiWithFallback = async (apiCall, fallbackCall = null) => {
  try {
    const result = await apiCall()
    return result
  } catch (error) {
    console.error('API Error occurred:', error)

    // If it's a timeout or network error and we have a fallback
    if ((error.code === 'ECONNABORTED' || !error.response) && fallbackCall) {
      console.log('Attempting fallback API call')
      try {
        return await fallbackCall()
      } catch (fallbackError) {
        console.error('Fallback API also failed:', fallbackError)
        throw fallbackError
      }
    }

    throw error
  }
}

export default dataService

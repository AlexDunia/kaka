// import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

// Configuration
const EVENTS_API_URL = 'http://localhost/api/events.php'
console.debug('EVENTS_API_URL configured as:', EVENTS_API_URL)

// Helper for API requests
const api = axios.create({
  baseURL: EVENTS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  },
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.debug(`API Response: ${response.status} from ${response.config.url}`)
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
      } else if (error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
    } else if (error.request) {
      // Request was made but no response
      console.error('API No Response Error:', error.request)
      errorMessage = 'No response from server. Please check your connection.'
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
  // EVENTS
  async getAllEvents() {
    const response = await axios.get(EVENTS_API_URL)
    return response.data
  },

  async getEventById(id) {
    const response = await axios.get(`${EVENTS_API_URL}?id=${id}`)
    return response.data
  },

  async getEventsByCategory(category) {
    const response = await axios.get(`${EVENTS_API_URL}?category=${category}`)
    return response.data
  },

  async getFeaturedEvents() {
    const response = await axios.get(`${EVENTS_API_URL}?featured=1`)
    return response.data
  },

  async searchEvents(query) {
    const response = await axios.get(`${EVENTS_API_URL}?search=${encodeURIComponent(query)}`)
    return response.data
  },

  async createEvent(eventData) {
    try {
      const response = await api.post('/events.php', eventData)
      return response.data
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  },

  async updateEvent(id, eventData) {
    try {
      const response = await api.put(`/events.php?id=${id}`, eventData)
      return response.data
    } catch (error) {
      console.error(`Error updating event ${id}:`, error)
      throw error
    }
  },

  async deleteEvent(id) {
    try {
      const response = await api.delete(`/events.php?id=${id}`)
      return response.data
    } catch (error) {
      console.error(`Error deleting event ${id}:`, error)
      throw error
    }
  },

  // CATEGORIES
  async getAllCategories() {
    try {
      const response = await api.get('/categories.php')
      return response.data
    } catch (error) {
      console.error('Failed to fetch categories from API:', error)
      throw error
    }
  },

  // SUBCATEGORIES
  async getAllSubCategories() {
    try {
      const response = await api.get('/subcategories.php')
      return response.data
    } catch (error) {
      console.error('Failed to fetch subcategories from API:', error)
      throw error
    }
  },

  async getSubCategoriesByCategory(categoryId) {
    try {
      const allSubCategories = await this.getAllSubCategories()
      return allSubCategories.filter((subCat) => subCat.categoryId === categoryId)
    } catch (error) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, error)
      throw error
    }
  },
}

export default dataService

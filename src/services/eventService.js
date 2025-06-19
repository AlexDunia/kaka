// import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

// API URLs from environment variables
export const EVENTS_API_URL = import.meta.env.VITE_EVENTS_API_URL || '/api'
export const EVENTS_FALLBACK_API_URL =
  import.meta.env.VITE_EVENTS_FALLBACK_API_URL || '/api/fallback'

// Create axios instance with default config
const api = axios.create({
  baseURL: EVENTS_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for logging and token handling
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    throw error
  },
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (!response.data) {
      throw new Error('Empty response data')
    }
    if (response.data.error) {
      throw new Error(response.data.error)
    }
    return response
  },
  (error) => {
    if (error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${error.response.statusText || 'Unknown error'}`,
      )
    } else if (error.request) {
      throw new Error('No response received from server')
    } else {
      throw new Error(`Request failed: ${error.message}`)
    }
  },
)

// Fallback data for when API is unavailable
const fallbackEvents = [
  {
    id: 1,
    title: 'Sample Event',
    description: 'This is a fallback event when the API is unavailable.',
    date: new Date().toISOString(),
    location: 'Default Location',
    price: 0,
  },
]

// Helper function to get fallback events
async function getFallbackEvents() {
  try {
    const response = await axios.get(EVENTS_FALLBACK_API_URL)
    return response.data
  } catch {
    return fallbackEvents
  }
}

// Main API functions
export async function getAllEvents(page = 1, limit = 10) {
  try {
    const response = await api.get(`/events?page=${page}&limit=${limit}`)
    return response.data
  } catch {
    return await getFallbackEvents()
  }
}

export async function getEventById(id) {
  try {
    const response = await api.get(`/events/${id}`)
    return response.data
  } catch {
    throw new Error(`Failed to fetch event ID ${id}`)
  }
}

export async function getEventsByCategory(category, page = 1, limit = 10) {
  if (!category) {
    return getAllEvents(page, limit)
  }

  const sanitizedCategory = category.toLowerCase().trim()

  try {
    const url = `/events/category/${sanitizedCategory}?page=${page}&limit=${limit}`
    const response = await api.get(url)
    return response.data
  } catch {
    return await getFallbackEvents()
  }
}

export async function getFeaturedEvents() {
  try {
    const response = await api.get('/events/featured')
    return response.data
  } catch {
    return await getFallbackEvents()
  }
}

export async function searchEvents(query, page = 1, limit = 10) {
  try {
    const response = await api.get(`/events/search?q=${query}&page=${page}&limit=${limit}`)
    return response.data
  } catch {
    throw new Error('Search failed')
  }
}

export async function createEvent(eventData) {
  try {
    const response = await api.post('/events', eventData)
    return response.data
  } catch {
    throw new Error('Event creation failed')
  }
}

export async function updateEvent(id, eventData) {
  try {
    const response = await api.put(`/events/${id}`, eventData)
    return response.data
  } catch {
    throw new Error('Event update failed')
  }
}

export async function deleteEvent(id) {
  try {
    const response = await api.delete(`/events/${id}`)
    return response.data
  } catch {
    throw new Error('Event deletion failed')
  }
}

export async function getCategories() {
  try {
    const response = await api.get('/categories')
    return response.data
  } catch {
    throw new Error('Failed to fetch categories')
  }
}

export async function getSubcategories() {
  try {
    const response = await api.get('/subcategories')
    return response.data
  } catch {
    throw new Error('Failed to fetch subcategories')
  }
}

export async function getSubcategoriesByCategory(categoryId) {
  try {
    const response = await api.get(`/categories/${categoryId}/subcategories`)
    return response.data
  } catch {
    throw new Error(`Failed to fetch subcategories for category ${categoryId}`)
  }
}

export async function getEventBySlug(slug) {
  try {
    const response = await api.get(`/events/slug/${slug}`)
    return response.data
  } catch {
    try {
      return await getFallbackEventBySlug(slug)
    } catch {
      throw new Error('Failed to fetch event by slug')
    }
  }
}

async function getFallbackEventBySlug(slug) {
  try {
    const response = await axios.get(`${EVENTS_FALLBACK_API_URL}/slug/${slug}`)
    return response.data
  } catch {
    throw new Error('Failed to fetch event by slug from fallback API')
  }
}

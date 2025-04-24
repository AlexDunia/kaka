import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const USE_LOCAL_STORAGE = true // Set to false when ready to use backend API

// Storage keys
const EVENTS_KEY = 'events'
const CATEGORIES_KEY = 'categories'
const SUB_CATEGORIES_KEY = 'subcategories'

// Demo data
const DEMO_EVENTS = [
  {
    id: '1',
    title: 'Summer Music Festival',
    description: 'Join us for three days of amazing music from top artists across the globe.',
    category: 'music',
    subCategories: ['sub1', 'sub7'],
    date: '2024-08-15T16:00:00.000Z',
    location: 'Central Park, New York',
    mainImage: '/images/events/music-festival.jpg',
    bannerImage: '/images/banners/music-festival-banner.jpg',
    price: 150.0,
    totalTickets: 5000,
    availableTickets: 2000,
    featured: true,
    organizer: 'Global Events Co.',
    duration: '3 days',
    ticketTypes: [
      {
        name: 'Early Bird',
        price: 120.0,
        quantity: 1000,
        description: 'Limited time offer at a discounted price',
        salesEndDate: '2024-07-15',
        salesEndTime: '23:59',
        isFeatured: true,
      },
      {
        name: 'VIP',
        price: 250.0,
        quantity: 500,
        description: 'Premium experience with exclusive benefits',
        salesEndDate: '2024-08-14',
        salesEndTime: '23:59',
        isFeatured: true,
      },
      {
        name: 'General Admission',
        price: 150.0,
        quantity: 3500,
        description: 'Standard festival entry',
        salesEndDate: '',
        salesEndTime: '',
        isFeatured: false,
      },
    ],
    faqs: [
      {
        question: "What's included in the ticket price?",
        answer:
          'Your ticket includes entry to all stages and performances throughout the festival.',
      },
      {
        question: 'Is there camping available?',
        answer: 'Yes, camping options are available for an additional fee.',
      },
    ],
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Comedy Night',
    description: 'An evening of laughter with the best stand-up comedians in the country.',
    category: 'comedy',
    date: '2024-07-22T19:30:00.000Z',
    location: 'Laugh Factory, Los Angeles',
    imageIndex: 2,
    price: 75.0,
    totalTickets: 800,
    availableTickets: 350,
    featured: true,
    organizer: 'Comedy Central',
    duration: '3 hours',
    created_at: '2024-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    title: 'Art Exhibition Opening',
    description: 'Exclusive opening night of contemporary art from emerging artists.',
    category: 'arts',
    date: '2024-08-05T18:00:00.000Z',
    location: 'Modern Gallery, Chicago',
    imageIndex: 1,
    price: 50.0,
    totalTickets: 600,
    availableTickets: 300,
    featured: false,
    organizer: 'Arts Council',
    duration: '4 hours',
    created_at: '2024-01-03T00:00:00.000Z',
  },
  {
    id: '4',
    title: 'Basketball Championship',
    description: 'The final game of the season. Who will be crowned champions?',
    category: 'sports',
    date: '2024-06-30T19:00:00.000Z',
    location: 'Sports Arena, Miami',
    imageIndex: 3,
    price: 120.0,
    totalTickets: 10000,
    availableTickets: 3000,
    featured: true,
    organizer: 'National Basketball Association',
    duration: '3 hours',
    created_at: '2024-01-04T00:00:00.000Z',
  },
  {
    id: '5',
    title: 'Food & Wine Festival',
    description: 'Taste the finest cuisines and wines from top chefs and wineries.',
    category: 'festivals',
    date: '2024-09-05T11:00:00.000Z',
    location: 'Waterfront Park, San Francisco',
    imageIndex: 2,
    price: 125.0,
    totalTickets: 3000,
    availableTickets: 1800,
    featured: false,
    organizer: 'Culinary Arts Foundation',
    duration: '2 days',
    created_at: '2024-01-05T00:00:00.000Z',
  },
  {
    id: '6',
    title: 'Tech Conference 2024',
    description: 'Learn about the latest technologies and network with industry professionals.',
    category: 'others',
    date: '2024-10-12T09:00:00.000Z',
    location: 'Convention Center, Seattle',
    imageIndex: 1,
    price: 499.99,
    totalTickets: 2000,
    availableTickets: 1200,
    featured: false,
    organizer: 'TechHub',
    duration: '3 days',
    created_at: '2024-01-06T00:00:00.000Z',
  },
]

const CATEGORIES = [
  { id: 'music', name: 'Music' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'art', name: 'Arts & Culture' },
  { id: 'sports', name: 'Sports' },
  { id: 'food', name: 'Food & Drink' },
  { id: 'tech', name: 'Technology' },
  { id: 'business', name: 'Business' },
  { id: 'health', name: 'Health & Wellness' },
  { id: 'education', name: 'Education' },
  { id: 'community', name: 'Community' },
]

const SUB_CATEGORIES = [
  { id: 'sub1', name: 'Workshop', categoryId: 'education' },
  { id: 'sub2', name: 'Conference', categoryId: 'business' },
  { id: 'sub3', name: 'Meetup', categoryId: 'community' },
  { id: 'sub4', name: 'Webinar', categoryId: 'tech' },
  { id: 'sub5', name: 'Party', categoryId: 'community' },
  { id: 'sub6', name: 'Exhibition', categoryId: 'art' },
  { id: 'sub7', name: 'Concert', categoryId: 'music' },
  { id: 'sub8', name: 'Tournament', categoryId: 'sports' },
  { id: 'sub9', name: 'Tasting', categoryId: 'food' },
  { id: 'sub10', name: 'Hackathon', categoryId: 'tech' },
  { id: 'sub11', name: 'Networking', categoryId: 'business' },
  { id: 'sub12', name: 'Retreat', categoryId: 'health' },
]

// Initialize local storage with demo data
const initializeStorage = () => {
  if (!localStorage.getItem(EVENTS_KEY)) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(DEMO_EVENTS))
  }

  if (!localStorage.getItem(CATEGORIES_KEY)) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(CATEGORIES))
  }

  if (!localStorage.getItem(SUB_CATEGORIES_KEY)) {
    localStorage.setItem(SUB_CATEGORIES_KEY, JSON.stringify(SUB_CATEGORIES))
  }
}

// Helper for API requests
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
})

// Configure auth token when available
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common['Authorization']
  }
}

// Handle data storage (localStorage or API)
const dataService = {
  // EVENTS
  async getAllEvents() {
    if (USE_LOCAL_STORAGE) {
      initializeStorage()
      return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]')
    } else {
      try {
        const response = await apiClient.get('/events')
        return response.data.data
      } catch (error) {
        console.error('Error fetching events:', error)
        throw error
      }
    }
  },

  async getEventById(id) {
    if (USE_LOCAL_STORAGE) {
      const events = await this.getAllEvents()
      return events.find((event) => event.id === id) || null
    } else {
      try {
        const response = await apiClient.get(`/events/${id}`)
        return response.data.data
      } catch (error) {
        console.error(`Error fetching event ${id}:`, error)
        throw error
      }
    }
  },

  async getEventsByCategory(category) {
    if (category === 'all') {
      return this.getAllEvents()
    }

    if (USE_LOCAL_STORAGE) {
      const events = await this.getAllEvents()
      return events.filter((event) => event.category === category)
    } else {
      try {
        const response = await apiClient.get(`/events/category/${category}`)
        return response.data.data
      } catch (error) {
        console.error(`Error fetching events by category ${category}:`, error)
        throw error
      }
    }
  },

  async getFeaturedEvents() {
    if (USE_LOCAL_STORAGE) {
      const events = await this.getAllEvents()
      return events.filter((event) => event.featured)
    } else {
      try {
        const response = await apiClient.get('/events/featured')
        return response.data.data
      } catch (error) {
        console.error('Error fetching featured events:', error)
        throw error
      }
    }
  },

  async searchEvents(query) {
    if (USE_LOCAL_STORAGE) {
      const events = await this.getAllEvents()
      const lowerQuery = query.toLowerCase()

      return events.filter(
        (event) =>
          event.title.toLowerCase().includes(lowerQuery) ||
          event.description.toLowerCase().includes(lowerQuery) ||
          event.location.toLowerCase().includes(lowerQuery) ||
          event.organizer.toLowerCase().includes(lowerQuery),
      )
    } else {
      try {
        const response = await apiClient.get(`/events/search?q=${encodeURIComponent(query)}`)
        return response.data.data
      } catch (error) {
        console.error(`Error searching events for "${query}":`, error)
        throw error
      }
    }
  },

  async createEvent(eventData) {
    if (USE_LOCAL_STORAGE) {
      const events = await this.getAllEvents()

      const newEvent = {
        id: uuidv4(),
        ...eventData,
        availableTickets: eventData.totalTickets,
        created_at: new Date().toISOString(),
      }

      events.push(newEvent)
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events))

      return newEvent
    } else {
      try {
        // For a real API, we'd use FormData for file uploads
        const response = await apiClient.post('/events', eventData)
        return response.data.data
      } catch (error) {
        console.error('Error creating event:', error)
        throw error
      }
    }
  },

  async updateEvent(id, eventData) {
    if (USE_LOCAL_STORAGE) {
      const events = await this.getAllEvents()
      const index = events.findIndex((event) => event.id === id)

      if (index === -1) {
        throw new Error('Event not found')
      }

      const updatedEvent = { ...events[index], ...eventData }
      events[index] = updatedEvent

      localStorage.setItem(EVENTS_KEY, JSON.stringify(events))

      return updatedEvent
    } else {
      try {
        const response = await apiClient.put(`/events/${id}`, eventData)
        return response.data.data
      } catch (error) {
        console.error(`Error updating event ${id}:`, error)
        throw error
      }
    }
  },

  async deleteEvent(id) {
    if (USE_LOCAL_STORAGE) {
      const events = await this.getAllEvents()
      const filteredEvents = events.filter((event) => event.id !== id)

      if (filteredEvents.length === events.length) {
        throw new Error('Event not found')
      }

      localStorage.setItem(EVENTS_KEY, JSON.stringify(filteredEvents))

      return { success: true }
    } else {
      try {
        await apiClient.delete(`/events/${id}`)
        return { success: true }
      } catch (error) {
        console.error(`Error deleting event ${id}:`, error)
        throw error
      }
    }
  },

  // CATEGORIES
  async getAllCategories() {
    if (USE_LOCAL_STORAGE) {
      initializeStorage()
      return JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]')
    } else {
      try {
        const response = await apiClient.get('/categories')
        return response.data.data
      } catch (error) {
        console.error('Error fetching categories:', error)
        throw error
      }
    }
  },

  // SUBCATEGORIES
  async getAllSubCategories() {
    if (USE_LOCAL_STORAGE) {
      initializeStorage()
      return JSON.parse(localStorage.getItem(SUB_CATEGORIES_KEY) || '[]')
    } else {
      try {
        const response = await apiClient.get('/subcategories')
        return response.data.data
      } catch (error) {
        console.error('Error fetching subcategories:', error)
        throw error
      }
    }
  },

  async getSubCategoriesByCategory(categoryId) {
    if (USE_LOCAL_STORAGE) {
      const subCategories = await this.getAllSubCategories()
      return subCategories.filter((subCat) => subCat.categoryId === categoryId)
    } else {
      try {
        const response = await apiClient.get(`/categories/${categoryId}/subcategories`)
        return response.data.data
      } catch (error) {
        console.error(`Error fetching subcategories for category ${categoryId}:`, error)
        throw error
      }
    }
  },
}

export default dataService

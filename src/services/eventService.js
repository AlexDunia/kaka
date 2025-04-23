import { v4 as uuidv4 } from 'uuid'

const DEMO_EVENTS = [
  {
    id: '1',
    title: 'Summer Music Festival',
    description: 'Join us for three days of amazing music from top artists across the globe.',
    category: 'music',
    date: '2024-08-15T16:00:00.000Z',
    location: 'Central Park, New York',
    imageIndex: 0,
    price: 150.0,
    totalTickets: 5000,
    availableTickets: 2000,
    featured: true,
    organizer: 'Global Events Co.',
    duration: '3 days',
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

const EVENTS_KEY = 'events'
const CATEGORIES = [
  { id: 'music', name: 'Music' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'arts', name: 'Arts & Culture' },
  { id: 'sports', name: 'Sports' },
  { id: 'festivals', name: 'Festivals' },
  { id: 'others', name: 'Others' },
]

// Initialize events storage
const initializeStorage = () => {
  const events = localStorage.getItem(EVENTS_KEY)
  if (!events) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(DEMO_EVENTS))
  }
}

// Get all events
const getAllEvents = () => {
  initializeStorage()
  return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]')
}

// Get event by ID
const getEventById = (id) => {
  const events = getAllEvents()
  return events.find((event) => event.id === id) || null
}

// Get events by category
const getEventsByCategory = (category) => {
  if (category === 'all') {
    return getAllEvents()
  }

  const events = getAllEvents()
  return events.filter((event) => event.category === category)
}

// Get featured events
const getFeaturedEvents = () => {
  const events = getAllEvents()
  return events.filter((event) => event.featured)
}

// Search events
const searchEvents = (query) => {
  const events = getAllEvents()
  const lowerQuery = query.toLowerCase()

  return events.filter(
    (event) =>
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description.toLowerCase().includes(lowerQuery) ||
      event.location.toLowerCase().includes(lowerQuery) ||
      event.organizer.toLowerCase().includes(lowerQuery),
  )
}

// Create a new event
const createEvent = (eventData) => {
  const events = getAllEvents()

  const newEvent = {
    id: uuidv4(),
    ...eventData,
    availableTickets: eventData.totalTickets,
    created_at: new Date().toISOString(),
  }

  events.push(newEvent)
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))

  return newEvent
}

// Update an event
const updateEvent = (id, eventData) => {
  const events = getAllEvents()
  const index = events.findIndex((event) => event.id === id)

  if (index === -1) {
    throw new Error('Event not found')
  }

  const updatedEvent = { ...events[index], ...eventData }
  events[index] = updatedEvent

  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))

  return updatedEvent
}

// Delete an event
const deleteEvent = (id) => {
  const events = getAllEvents()
  const filteredEvents = events.filter((event) => event.id !== id)

  if (filteredEvents.length === events.length) {
    throw new Error('Event not found')
  }

  localStorage.setItem(EVENTS_KEY, JSON.stringify(filteredEvents))

  return { success: true }
}

// Get all categories
const getAllCategories = () => {
  return CATEGORIES
}

export default {
  getAllEvents,
  getEventById,
  getEventsByCategory,
  getFeaturedEvents,
  searchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllCategories,
}

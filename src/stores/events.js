import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import eventService from '@/services/eventService'

export const useEventStore = defineStore('events', () => {
  // State
  const events = ref([])
  const currentEvent = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const searchQuery = ref('')
  const currentCategory = ref('all')

  // Actions
  const fetchAllEvents = async () => {
    loading.value = true
    error.value = null

    try {
      const allEvents = await eventService.getAllEvents()
      events.value = allEvents
      return allEvents
    } catch (err) {
      error.value = err.message || 'Failed to fetch events'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchEventById = async (id) => {
    loading.value = true
    error.value = null

    try {
      const event = await eventService.getEventById(id)
      if (event) {
        currentEvent.value = event
      } else {
        error.value = 'Event not found'
      }
      return event
    } catch (err) {
      error.value = err.message || 'Failed to fetch event details'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchEventsByCategory = async (category) => {
    loading.value = true
    error.value = null
    currentCategory.value = category

    try {
      const filteredEvents = await eventService.getEventsByCategory(category)
      events.value = filteredEvents
      return filteredEvents
    } catch (err) {
      error.value = err.message || 'Failed to fetch events by category'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchFeaturedEvents = async () => {
    loading.value = true
    error.value = null

    try {
      const featured = await eventService.getFeaturedEvents()
      return featured
    } catch (err) {
      error.value = err.message || 'Failed to fetch featured events'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createEvent = async (eventData) => {
    loading.value = true
    error.value = null

    try {
      const newEvent = await eventService.createEvent(eventData)
      events.value.push(newEvent)
      return newEvent
    } catch (err) {
      error.value = err.message || 'Failed to create event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateEvent = async (id, eventData) => {
    loading.value = true
    error.value = null

    try {
      const updatedEvent = await eventService.updateEvent(id, eventData)

      // Update event in the events array
      const index = events.value.findIndex((e) => e.id === id)
      if (index !== -1) {
        events.value[index] = updatedEvent
      }

      // Update currentEvent if it's the same event
      if (currentEvent.value && currentEvent.value.id === id) {
        currentEvent.value = updatedEvent
      }

      return updatedEvent
    } catch (err) {
      error.value = err.message || 'Failed to update event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteEvent = async (id) => {
    loading.value = true
    error.value = null

    try {
      await eventService.deleteEvent(id)

      // Remove from events array
      events.value = events.value.filter((e) => e.id !== id)

      // Clear currentEvent if it's the deleted event
      if (currentEvent.value && currentEvent.value.id === id) {
        currentEvent.value = null
      }

      return { success: true }
    } catch (err) {
      error.value = err.message || 'Failed to delete event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const searchEvents = async (query) => {
    loading.value = true
    error.value = null
    searchQuery.value = query

    try {
      const results = await eventService.searchEvents(query)
      events.value = results
      return results
    } catch (err) {
      error.value = err.message || 'Search failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Reset search and filters
  const resetFilters = () => {
    searchQuery.value = ''
    currentCategory.value = 'all'
    fetchAllEvents()
  }

  // Computed properties
  const filteredEvents = computed(() => {
    if (!searchQuery.value) return events.value

    const query = searchQuery.value.toLowerCase()
    return events.value.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query),
    )
  })

  const upcomingEvents = computed(() => {
    const now = new Date()
    return events.value
      .filter((event) => new Date(event.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  })

  return {
    events,
    currentEvent,
    loading,
    error,
    searchQuery,
    currentCategory,
    filteredEvents,
    upcomingEvents,
    fetchAllEvents,
    fetchEventById,
    fetchEventsByCategory,
    fetchFeaturedEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    searchEvents,
    resetFilters,
  }
})
 
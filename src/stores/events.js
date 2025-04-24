import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import eventService from '@/services/eventService'

export const useEventStore = defineStore('events', () => {
  // State
  const events = ref([])
  const currentEvent = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const searchQuery = ref('')
  const currentCategory = ref('all')
  const lastFetch = ref(null)
  const forceRefresh = ref(false)

  // Actions
  const fetchAllEvents = async (refresh = false) => {
    // Skip fetching if we already have events and it hasn't been 5 minutes since the last fetch
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    if (
      !refresh &&
      !forceRefresh.value &&
      events.value.length > 0 &&
      lastFetch.value &&
      lastFetch.value > fiveMinutesAgo
    ) {
      return events.value
    }

    isLoading.value = true
    error.value = null

    try {
      const allEvents = await eventService.getAllEvents()
      events.value = allEvents
      lastFetch.value = Date.now()
      forceRefresh.value = false
      return allEvents
    } catch (err) {
      error.value = err.message || 'Failed to fetch events'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchEventById = async (id, refresh = false) => {
    // If we already have the event loaded and refresh is not requested
    if (!refresh && currentEvent.value && currentEvent.value.id === id) {
      return currentEvent.value
    }

    isLoading.value = true
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
      isLoading.value = false
    }
  }

  const fetchEventsByCategory = async (category, refresh = false) => {
    // Skip fetching if we're already on this category and have events
    if (!refresh && currentCategory.value === category && events.value.length > 0) {
      return events.value
    }

    isLoading.value = true
    error.value = null
    currentCategory.value = category

    try {
      const filteredEvents = await eventService.getEventsByCategory(category)
      events.value = filteredEvents
      lastFetch.value = Date.now()
      return filteredEvents
    } catch (err) {
      error.value = err.message || 'Failed to fetch events by category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchFeaturedEvents = async () => {
    isLoading.value = true
    error.value = null

    try {
      const featured = await eventService.getFeaturedEvents()
      return featured
    } catch (err) {
      error.value = err.message || 'Failed to fetch featured events'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createEvent = async (eventData) => {
    isLoading.value = true
    error.value = null

    try {
      // Process image files if they exist
      const processedData = { ...eventData }

      // Upload happens in the service when not using localStorage
      // We just need to make sure we're sending the right data format

      const newEvent = await eventService.createEvent(processedData)

      // Add to local state and force a refresh on next fetch
      events.value.unshift(newEvent)
      forceRefresh.value = true

      return newEvent
    } catch (err) {
      error.value = err.message || 'Failed to create event'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateEvent = async (id, eventData) => {
    isLoading.value = true
    error.value = null

    try {
      const updatedEvent = await eventService.updateEvent(id, eventData)

      // Update local state
      const index = events.value.findIndex((e) => e.id === id)
      if (index !== -1) {
        events.value[index] = updatedEvent
      }

      // Update currentEvent if it's the same event
      if (currentEvent.value && currentEvent.value.id === id) {
        currentEvent.value = updatedEvent
      }

      forceRefresh.value = true

      return updatedEvent
    } catch (err) {
      error.value = err.message || 'Failed to update event'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteEvent = async (id) => {
    isLoading.value = true
    error.value = null

    try {
      await eventService.deleteEvent(id)

      // Remove from local state
      events.value = events.value.filter((e) => e.id !== id)

      // Clear currentEvent if it's the deleted event
      if (currentEvent.value && currentEvent.value.id === id) {
        currentEvent.value = null
      }

      forceRefresh.value = true

      return { success: true }
    } catch (err) {
      error.value = err.message || 'Failed to delete event'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const searchEvents = async (query) => {
    isLoading.value = true
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
      isLoading.value = false
    }
  }

  // Reset search and filters
  const resetFilters = async () => {
    searchQuery.value = ''
    currentCategory.value = 'all'
    return await fetchAllEvents(true)
  }

  // Computed properties
  const filteredEvents = computed(() => {
    if (!searchQuery.value) return events.value

    const query = searchQuery.value.toLowerCase()
    return events.value.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.organizer.toLowerCase().includes(query),
    )
  })

  const upcomingEvents = computed(() => {
    const now = new Date()
    return events.value
      .filter((event) => new Date(event.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  })

  const featuredEvents = computed(() => {
    return events.value.filter((event) => event.featured)
  })

  const recentlyAddedEvents = computed(() => {
    return [...events.value]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6)
  })

  return {
    // State
    events,
    currentEvent,
    isLoading,
    error,
    searchQuery,
    currentCategory,

    // Computed
    filteredEvents,
    upcomingEvents,
    featuredEvents,
    recentlyAddedEvents,

    // Actions
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

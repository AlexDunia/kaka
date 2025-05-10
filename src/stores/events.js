import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import eventService from '@/services/eventService'

export const useEventStore = defineStore('events', () => {
  // State
  const events = ref([])
  const featuredEvents = ref([])
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
    // Unless refresh is explicitly requested
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    if (
      !refresh &&
      !forceRefresh.value &&
      events.value.length > 0 &&
      lastFetch.value &&
      lastFetch.value > fiveMinutesAgo
    ) {
      console.log('Using cached events data')
      return events.value
    }

    isLoading.value = true
    error.value = null

    try {
      console.log('Fetching all events from API')
      const allEvents = await eventService.getAllEvents()

      if (allEvents && Array.isArray(allEvents)) {
        console.log(`Fetched ${allEvents.length} events from API`)
        events.value = allEvents
        lastFetch.value = Date.now()
        forceRefresh.value = false
        return allEvents
      } else {
        console.error('Invalid response format from events API:', allEvents)
        throw new Error('Invalid data format received from API')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch events'
      console.error('Error fetching events from API:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchEventById = async (id, refresh = false) => {
    // If we already have the event loaded and refresh is not requested
    if (!refresh && currentEvent.value && currentEvent.value.id === parseInt(id)) {
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

  const fetchFeaturedEvents = async (refresh = false) => {
    // Skip fetching if we already have featured events and refresh is not requested
    if (!refresh && !forceRefresh.value && featuredEvents.value.length > 0) {
      return featuredEvents.value
    }

    isLoading.value = true
    error.value = null

    try {
      const featured = await eventService.getFeaturedEvents()
      if (featured && Array.isArray(featured)) {
        featuredEvents.value = featured
        return featured
      } else {
        throw new Error('Invalid featured events data format')
      }
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

      // Send data to API through service
      console.log('Store: Sending event data to API')
      const newEvent = await eventService.createEvent(processedData)

      // If we get here, the API call was successful and the event was saved to the database
      console.log('Store: Event saved to database, updating frontend state', newEvent)

      // Only update the frontend state if we got a valid response with an ID
      if (newEvent && newEvent.id) {
        // Add to local state and force a refresh on next fetch
        events.value.unshift(newEvent)
        forceRefresh.value = true
        return newEvent
      } else {
        // If we didn't get a valid event back, throw an error
        throw new Error('Invalid response from server, event may not be saved')
      }
    } catch (err) {
      // Set error message and re-throw to let component handle it
      error.value = err.message || 'Failed to create event in database'
      console.error('Store: Failed to save event to database:', err)
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
      const index = events.value.findIndex((e) => e.id === parseInt(id))
      if (index !== -1) {
        events.value[index] = updatedEvent
      }

      // Update currentEvent if it's the same event
      if (currentEvent.value && currentEvent.value.id === parseInt(id)) {
        currentEvent.value = updatedEvent
      }

      // Update in featured events if present
      const featuredIndex = featuredEvents.value.findIndex((e) => e.id === parseInt(id))
      if (featuredIndex !== -1) {
        featuredEvents.value[featuredIndex] = updatedEvent
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
      events.value = events.value.filter((e) => e.id !== parseInt(id))

      // Remove from featured events if present
      featuredEvents.value = featuredEvents.value.filter((e) => e.id !== parseInt(id))

      // Clear currentEvent if it's the deleted event
      if (currentEvent.value && currentEvent.value.id === parseInt(id)) {
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

  const pastEvents = computed(() => {
    const now = new Date()
    return events.value
      .filter((event) => new Date(event.date) < now)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  })

  return {
    // State
    events,
    featuredEvents,
    currentEvent,
    isLoading,
    error,
    searchQuery,
    currentCategory,

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

    // Computed
    filteredEvents,
    upcomingEvents,
    pastEvents,
  }
})

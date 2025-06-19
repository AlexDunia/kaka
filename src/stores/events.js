import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import eventService from '@/services/eventService'
import axios from 'axios'

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

  // Pagination state
  const currentPage = ref(1)
  const totalItems = ref(0)
  const itemsPerPage = ref(12)
  const totalPages = ref(0)

  // Actions
  const fetchAllEvents = async (refresh = false, page = 1) => {
    // Skip fetching if we already have events and it hasn't been 5 minutes since the last fetch
    // Unless refresh is explicitly requested
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    if (
      !refresh &&
      !forceRefresh.value &&
      events.value.length > 0 &&
      lastFetch.value &&
      lastFetch.value > fiveMinutesAgo &&
      page === currentPage.value
    ) {
      return events.value
    }

    isLoading.value = true
    error.value = null
    currentPage.value = page

    try {
      const response = await eventService.getAllEvents(page, itemsPerPage.value)

      if (response && response.data && Array.isArray(response.data)) {
        events.value = response.data

        // Update pagination info if available
        if (response.pagination) {
          totalItems.value = response.pagination.total || 0
          totalPages.value = response.pagination.pages || 0
        }

        lastFetch.value = Date.now()
        forceRefresh.value = false
        return response.data
      } else {
        throw new Error('Invalid response format from events API')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch events from API:'
      events.value = []
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

  const fetchEventsByCategory = async (category, refresh = false, page = 1) => {
    // Skip fetching if we're already on this category and have events
    if (
      !refresh &&
      currentCategory.value === category &&
      events.value.length > 0 &&
      page === currentPage.value
    ) {
      return events.value
    }

    isLoading.value = true
    error.value = null
    currentCategory.value = category
    currentPage.value = page

    try {
      // Normalize the category to ensure consistency
      const normalizedCategory = category.toLowerCase().trim()

      const response = await eventService.getEventsByCategory(
        normalizedCategory,
        page,
        itemsPerPage.value,
      )

      if (response && response.data && Array.isArray(response.data)) {
        events.value = response.data

        // Update pagination info if available
        if (response.pagination) {
          totalItems.value = response.pagination.total || 0
          totalPages.value = response.pagination.pages || 0
        }

        lastFetch.value = Date.now()
        return response.data
      } else {
        throw new Error('Invalid data format received from API')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch events by category'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchFeaturedEvents = async (refresh = false, limit = 6) => {
    // Skip fetching if we already have featured events and refresh is not requested
    if (!refresh && !forceRefresh.value && featuredEvents.value.length > 0) {
      return featuredEvents.value
    }

    isLoading.value = true
    error.value = null

    try {
      const featured = await eventService.getFeaturedEvents(limit)
      if (featured && featured.data && Array.isArray(featured.data)) {
        featuredEvents.value = featured.data
        return featured.data
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
      const newEvent = await eventService.createEvent(processedData)

      // If we get here, the API call was successful and the event was saved to the database

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

  const searchEvents = async (
    query,
    category = null,
    page = 1,
    limit = 12,
    sort = 'event_date',
    direction = 'asc',
    dateFrom = null,
    dateTo = null,
    priceMin = null,
    priceMax = null,
  ) => {
    isLoading.value = true
    error.value = null
    searchQuery.value = query
    currentPage.value = page

    if (category) {
      currentCategory.value = category
    }

    try {
      // Build the query parameters with advanced filtering
      let url = `${eventService.EVENTS_API_URL}?page=${page}&limit=${limit}`

      // Add search query
      if (query && query.trim() !== '') {
        url += `&search=${encodeURIComponent(query.trim())}`
      }

      // Add category filter
      if (category && category !== 'all') {
        url += `&category=${encodeURIComponent(category)}`
      }

      // Add sort parameters
      if (sort) {
        url += `&sort=${encodeURIComponent(sort)}`
      }

      if (direction) {
        url += `&direction=${encodeURIComponent(direction)}`
      }

      // Add date range filters
      if (dateFrom) {
        url += `&date_from=${encodeURIComponent(dateFrom)}`
      }

      if (dateTo) {
        url += `&date_to=${encodeURIComponent(dateTo)}`
      }

      // Add price range filters
      if (priceMin !== null && priceMin !== '') {
        url += `&price_min=${encodeURIComponent(priceMin)}`
      }

      if (priceMax !== null && priceMax !== '') {
        url += `&price_max=${encodeURIComponent(priceMax)}`
      }

      // Add security token
      url += `&_token=${Math.random().toString(36).substring(2, 15)}`

      // Try the main API endpoint first
      let response
      try {
        response = await axios.get(url)
      } catch {
        // If main API fails, try the fallback endpoint
        let fallbackUrl = `${eventService.EVENTS_FALLBACK_API_URL}?page=${page}&limit=${limit}`
        if (query) {
          fallbackUrl += `&q=${encodeURIComponent(query)}`
        }
        if (category) {
          fallbackUrl += `&category=${encodeURIComponent(category)}`
        }
        response = await axios.get(fallbackUrl)
      }

      // Handle different response formats - robust approach
      let eventData = []

      // If response.data is an array, use it directly
      if (Array.isArray(response.data)) {
        eventData = response.data
      }
      // If response.data.data is an array, use that
      else if (response.data?.data && Array.isArray(response.data.data)) {
        eventData = response.data.data
      }
      // Otherwise, look for any array property in response.data that contains event objects
      else {
        for (const value of Object.values(response.data)) {
          if (Array.isArray(value) && value.length > 0 && value[0].id) {
            eventData = value
            break
          }
        }
      }

      events.value = eventData
      totalItems.value = response.data.total || eventData.length
      currentPage.value = page
      return eventData
    } catch (err) {
      error.value = err.message || 'Failed to search events'
      events.value = []
      totalItems.value = 0
      totalPages.value = 0
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Reset search and filters
  const resetFilters = async () => {
    searchQuery.value = ''
    currentCategory.value = 'all'

    try {
      // Try to fetch all events
      await fetchAllEvents(true)
    } catch {
      events.value = []
      totalItems.value = 0
    }
  }

  // Computed properties
  const filteredEvents = computed(() => {
    return events.value
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

  const fetchEventBySlug = async (slug, refresh = false) => {
    // If we already have the event loaded with the same slug and refresh is not requested
    if (!refresh && currentEvent.value && currentEvent.value.slug === slug) {
      return currentEvent.value
    }

    isLoading.value = true
    error.value = null

    try {
      const apiResponse = await eventService.getEventBySlug(slug)

      // Check if the response structure is { data: [eventObject, ...], ... }
      // and the data array is not empty.
      if (
        apiResponse &&
        apiResponse.data &&
        Array.isArray(apiResponse.data) &&
        apiResponse.data.length > 0
      ) {
        const fetchedEventObject = apiResponse.data[0]
        currentEvent.value = fetchedEventObject
        return fetchedEventObject
      } else {
        // If the structure is not as expected or data array is empty
        error.value = 'Event not found'
        currentEvent.value = null // Explicitly set to null
        return null // Indicate event was not found or data was malformed
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch event details'
      currentEvent.value = null // Clear currentEvent on error
      throw err // Re-throw the error so the component can handle it
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    events,
    featuredEvents,
    currentEvent,
    isLoading,
    error,
    searchQuery,
    currentCategory,
    currentPage,
    totalItems,
    itemsPerPage,
    totalPages,
    lastFetch,

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
    fetchEventBySlug,

    // Computed
    filteredEvents,
    upcomingEvents,
    pastEvents,
  }
})

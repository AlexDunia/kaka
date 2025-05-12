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
      console.log('Using cached events data')
      return events.value
    }

    isLoading.value = true
    error.value = null
    currentPage.value = page

    try {
      console.log('Fetching all events from API')
      const response = await eventService.getAllEvents(page, itemsPerPage.value)

      // Debug log the exact response
      console.log('Raw API response:', response)

      // Check if the response has the expected structure with data property
      if (response && response.data && Array.isArray(response.data)) {
        console.log(`Fetched ${response.data.length} events from API`)
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
        console.error('Invalid response format from events API:', response)
        throw new Error('Invalid data format received from API')
      }
    } catch (err) {
      error.value = err.message || 'Failed to fetch events from API:'
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
      console.log('Event by ID response:', event)

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
      const response = await eventService.getEventsByCategory(category, page, itemsPerPage.value)

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

    // Added detailed logging at start of search
    console.log(`Search initiated in store with: "${query}", category: ${category || 'all'}`)

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

      // Log the search request for debugging (remove in production)
      console.debug(`Performing search with URL: ${url}`)

      // Try the main API endpoint first
      let response
      try {
        response = await axios.get(url)
      } catch (apiError) {
        console.warn('Main API search failed, trying fallback:', apiError.message)

        // If main API fails, try the fallback endpoint
        let fallbackUrl = `${eventService.EVENTS_FALLBACK_API_URL}?page=${page}&limit=${limit}`

        // Add basic search parameters to fallback
        if (query && query.trim() !== '') {
          fallbackUrl += `&search=${encodeURIComponent(query.trim())}`
        }

        if (category && category !== 'all') {
          fallbackUrl += `&category=${encodeURIComponent(category)}`
        }

        console.debug(`Trying fallback search API: ${fallbackUrl}`)
        response = await axios.get(fallbackUrl)
      }

      // Debug the raw response
      console.debug('Raw search response:', response.data)
      console.log('Search response status:', response.status)
      console.log('Search response length:', response.data?.data?.length || 'N/A')

      // Handle different response formats - robust approach
      let eventData = []
      let paginationData = null

      // Case 1: Response has data property that is an array (standard format)
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        eventData = response.data.data
        paginationData = response.data.pagination || null
      }
      // Case 2: Response is an array directly
      else if (response.data && Array.isArray(response.data)) {
        eventData = response.data
      }
      // Case 3: Unexpected format, try to extract any array we can find
      else if (response.data && typeof response.data === 'object') {
        // Loop through all properties looking for an array
        for (const [key, value] of Object.entries(response.data)) {
          if (Array.isArray(value) && value.length > 0 && value[0].id) {
            console.debug(`Found events array in response.data.${key}`)
            eventData = value
            break
          }
        }
      }

      // If we found events, use them
      if (eventData.length > 0) {
        events.value = eventData

        // Update pagination if available
        if (paginationData) {
          totalItems.value = paginationData.total || eventData.length
          totalPages.value = paginationData.pages || 1
        } else {
          // Set reasonable defaults if no pagination info
          totalItems.value = eventData.length
          totalPages.value = 1
        }

        lastFetch.value = Date.now()
        return eventData
      } else {
        // No events found - this is a valid result (empty search result)
        events.value = []
        totalItems.value = 0
        totalPages.value = 0
        return []
      }
    } catch (err) {
      error.value = err.message || 'Failed to search events'
      console.error('Search error:', err)
      // Set empty results and return empty array
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
      return await fetchAllEvents(true)
    } catch (err) {
      // If fetching fails, at least reset the local state to avoid showing stale results
      console.error('Failed to fetch events when resetting filters:', err)
      events.value = []
      totalItems.value = 0
      totalPages.value = 0
      return []
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

    // Computed
    filteredEvents,
    upcomingEvents,
    pastEvents,
  }
})

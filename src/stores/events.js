import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import eventService from '@/services/eventService'
import api, { ensureCsrfCookie } from '@/api/axios'

export const useEventStore = defineStore('events', () => {
  // State
  const events = ref([])
  const featuredEvents = ref([])
  const currentEvent = ref(null)
  const isLoading = ref(false)
  const isLoadingEvent = ref(false)
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
  const toggleLike = async (eventId) => {
    await ensureCsrfCookie()
    return (await api.post(`/events/${encodeURIComponent(eventId)}/toggle-like`, {})).data
  }
  const checkLiked = async (eventId) =>
    (await api.get(`/events/${encodeURIComponent(eventId)}/check-liked`)).data
  const fetchLikedEvents = async (page = 1) =>
    (await api.get('/user/liked-events', { params: { page, per_page: 100 } })).data
  let detailRequest = 0
  let collectionRequest = 0

  const fetchAllEvents = async (refresh = false, page = 1, options = {}) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    if (
      !refresh &&
      currentCategory.value === 'all' &&
      !searchQuery.value &&
      !forceRefresh.value &&
      events.value.length > 0 &&
      lastFetch.value &&
      lastFetch.value > fiveMinutesAgo &&
      page === currentPage.value
    ) {
      return events.value
    }

    const request = ++collectionRequest
    currentCategory.value = 'all'
    searchQuery.value = ''
    isLoading.value = true
    error.value = null
    currentPage.value = page

    try {
      const response = await eventService.getAllEvents(page, itemsPerPage.value, options)

      if (request !== collectionRequest) return []

      // âœ… FIX: Check for the transformed structure
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
        throw new Error('Invalid data format received from API')
      }
    } catch (err) {
      if (request !== collectionRequest) return []
      error.value = err.message || 'Failed to fetch events from API'

      throw err
    } finally {
      if (request === collectionRequest) isLoading.value = false
    }
  }

  const fetchEventById = async (id, refresh = false) => {
    if (!refresh && currentEvent.value && currentEvent.value.id === parseInt(id)) {
      return currentEvent.value
    }

    const request = ++detailRequest
    currentEvent.value = null
    isLoadingEvent.value = true
    error.value = null

    try {
      const response = await eventService.getEventById(id)
      if (request !== detailRequest) return null

      // show() returns { data: singleEventObject }, not an array
      const event = response?.data ?? null

      if (event) {
        currentEvent.value = event
      } else {
        error.value = 'Event not found'
      }

      return event
    } catch (err) {
      if (request !== detailRequest) return null
      error.value = err.message || 'Failed to fetch event details'
      throw err
    } finally {
      if (request === detailRequest) isLoadingEvent.value = false
    }
  }

  const clearCurrentEvent = () => {
    detailRequest++
    currentEvent.value = null
  }

  const fetchEventsByCategory = async (category, refresh = false, page = 1) => {
    // Add debug log to check what category is being passed

    // Skip fetching if we're already on this category and have events
    if (
      !refresh &&
      currentCategory.value === category &&
      events.value.length > 0 &&
      page === currentPage.value
    ) {
      return events.value
    }

    const request = ++collectionRequest
    searchQuery.value = ''
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
      if (request !== collectionRequest) return []

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
      if (request !== collectionRequest) return []
      error.value = err.message || 'Failed to fetch events by category'

      throw err
    } finally {
      if (request === collectionRequest) isLoading.value = false
    }
  }

  const fetchFeaturedEvents = async (refresh = false, limit = 6) => {
    if (!refresh && !forceRefresh.value && featuredEvents.value.length > 0) {
      return featuredEvents.value
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await eventService.getFeaturedEvents(limit)

      // âœ… FIX: Check for the transformed structure
      if (response && response.data && Array.isArray(response.data)) {
        featuredEvents.value = response.data
        return response.data
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
  ) => {
    const request = ++collectionRequest
    isLoading.value = true
    error.value = null
    searchQuery.value = query
    currentPage.value = page

    if (category) {
      currentCategory.value = category
    }

    // Added detailed logging at start of search

    try {
      const result = await eventService.getFilteredEvents({
        page,
        per_page: limit,
        q: query?.trim() || undefined,
        ...(category && category !== 'all'
          ? { [/^\d+$/.test(String(category)) ? 'category_id' : 'category']: category }
          : {}),
        sort: ['date-asc', 'date-desc', 'price-asc', 'price-desc', 'latest'].includes(sort)
          ? sort
          : `${sort === 'price' ? 'price' : 'date'}-${direction === 'desc' ? 'desc' : 'asc'}`,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      if (request !== collectionRequest) return []
      if (!Array.isArray(result.data) || !result.pagination)
        throw new Error('We could not read the event results. Please try again.')
      events.value = result.data
      totalItems.value = result.pagination.total
      totalPages.value = result.pagination.pages
      lastFetch.value = Date.now()
      return result.data
    } catch (err) {
      if (request !== collectionRequest) return []
      error.value = err.message || 'Failed to search events'

      // Set empty results and return empty array
      events.value = []
      totalItems.value = 0
      totalPages.value = 0
      throw err
    } finally {
      if (request === collectionRequest) isLoading.value = false
    }
  }

  // Reset search and filters
  const resetFilters = async () => {
    searchQuery.value = ''
    currentCategory.value = 'all'

    try {
      // Try to fetch all events
      return await fetchAllEvents(true)
    } catch {
      // If fetching fails, at least reset the local state to avoid showing stale results

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

  const fetchEventBySlug = async (slug, refresh = false) => {
    // If we already have the event loaded with the same slug and refresh is not requested
    if (!refresh && currentEvent.value && currentEvent.value.slug === slug) {
      return currentEvent.value
    }

    const request = ++detailRequest
    currentEvent.value = null
    isLoadingEvent.value = true
    error.value = null

    try {
      const apiResponse = await eventService.getEventBySlug(slug)
      if (request !== detailRequest) return null

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
      if (request === detailRequest) isLoadingEvent.value = false
    }
  }

  const invalidateEvent = (id) => {
    collectionRequest++
    detailRequest++
    if (Number(currentEvent.value?.id) === Number(id)) currentEvent.value = null
    events.value = []
    featuredEvents.value = []
    lastFetch.value = null
    forceRefresh.value = true
    isLoading.value = false
    isLoadingEvent.value = false
  }

  return {
    // State
    events,
    featuredEvents,
    currentEvent,
    isLoading,
    isLoadingEvent,
    error,
    searchQuery,
    currentCategory,
    currentPage,
    totalItems,
    itemsPerPage,
    totalPages,
    lastFetch,
    toggleLike,
    checkLiked,
    fetchLikedEvents,

    // Actions
    invalidateEvent,
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
    clearCurrentEvent,

    // Computed
    filteredEvents,
    upcomingEvents,
    pastEvents,
  }
})

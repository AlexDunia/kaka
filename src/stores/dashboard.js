import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { getDashboardEvents, getDashboardOverview } from '@/services/dashboardService'

const OVERVIEW_MEMORY_TTL = 30_000

export const useDashboardStore = defineStore('dashboard', () => {
  let generation = 0
  let eventsRequest = 0
  const overviewRequests = new Map()
  const reset = () => {
    generation++
    events.value = []
    eventsLoaded.value = false
    eventsLoading.value = false
    eventsError.value = ''
    overviewByEvent.value = {}
    overviewLoadingIds.value = new Set()
    overviewErrorByEvent.value = {}
    overviewRequests.clear()
  }
  const events = shallowRef([])
  const eventsLoaded = ref(false)
  const eventsLoading = ref(false)
  const eventsError = ref('')
  const overviewByEvent = shallowRef({})
  const overviewLoadingIds = ref(new Set())
  const overviewErrorByEvent = shallowRef({})

  const getEventById = (eventId) =>
    events.value.find((event) => Number(event.id) === Number(eventId)) || null
  const getOverview = (eventId) => overviewByEvent.value[String(eventId)]?.data || null
  const isOverviewLoading = (eventId) => overviewLoadingIds.value.has(String(eventId))

  const fetchEvents = async ({ force = false, signal } = {}) => {
    if (eventsLoaded.value && !force) return events.value
    const version = generation
    const request = ++eventsRequest
    const current = () => version === generation && request === eventsRequest
    eventsLoading.value = true
    eventsError.value = ''
    try {
      const data = await getDashboardEvents({ signal })
      if (!current()) return []
      events.value = Array.isArray(data) ? data : []
      eventsLoaded.value = true
      return events.value
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
      if (!current()) return []
      eventsError.value = error?.response?.data?.message || 'We could not load your events.'
      throw error
    } finally {
      if (current()) eventsLoading.value = false
    }
  }

  const fetchOverview = async (eventId, { force = false, signal } = {}) => {
    const key = String(eventId)
    const existing = overviewByEvent.value[key]
    if (existing && !force && Date.now() - existing.fetchedAt < OVERVIEW_MEMORY_TTL)
      return existing.data
    const version = generation
    const request = Symbol(key)
    overviewRequests.set(key, request)
    const current = () => version === generation && overviewRequests.get(key) === request
    overviewLoadingIds.value = new Set([...overviewLoadingIds.value, key])
    overviewErrorByEvent.value = { ...overviewErrorByEvent.value, [key]: '' }
    try {
      const data = await getDashboardOverview(eventId, { signal })
      if (!current()) return null
      overviewByEvent.value = { ...overviewByEvent.value, [key]: { data, fetchedAt: Date.now() } }
      return data
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') throw error
      if (!current()) return null
      overviewErrorByEvent.value = {
        ...overviewErrorByEvent.value,
        [key]: error?.response?.data?.message || 'We could not load this event dashboard.',
      }
      throw error
    } finally {
      if (current()) {
        const next = new Set(overviewLoadingIds.value)
        next.delete(key)
        overviewLoadingIds.value = next
      }
    }
  }

  const invalidateOverview = (eventId) => {
    const next = { ...overviewByEvent.value }
    delete next[String(eventId)]
    overviewByEvent.value = next
  }

  const hasEvents = computed(() => events.value.length > 0)
  return {
    reset,
    events,
    eventsLoaded,
    eventsLoading,
    eventsError,
    overviewByEvent,
    overviewLoadingIds,
    overviewErrorByEvent,
    hasEvents,
    getEventById,
    getOverview,
    isOverviewLoading,
    fetchEvents,
    fetchOverview,
    invalidateOverview,
  }
})

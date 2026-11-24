import api, { apiUrl } from '@/api/axios'
import { DASHBOARD_PREVIEW } from './dashboardPreview'
import { getStaticEvent } from './staticEventCatalog'

const listEvents = async (params) => {
  const { data } = await api.get('/events', { params })
  return {
    ...data,
    pagination: data.meta
      ? {
          total: data.meta.total,
          pages: data.meta.last_page,
          current: data.meta.current_page,
          per_page: data.meta.per_page,
        }
      : null,
  }
}
const retiredMutation = async () => {
  const error = new Error(
    'Open the event editor to make changes. Event deletion isn’t available yet.',
  )
  error.status = 410
  throw error
}
export default {
  EVENTS_API_URL: apiUrl('/events'),
  getFilteredEvents: listEvents,
  getAllEvents: (page = 1, limit = 12) => listEvents({ page, per_page: limit }),
  getFeaturedEvents: (limit = 6) => listEvents({ featured: 1, per_page: limit }),
  getEventsByCategory: (category, page = 1, limit = 12) =>
    listEvents({ category, page, per_page: limit }),
  searchEvents: (search, category, page = 1, limit = 12) =>
    listEvents({ q: search, category, page, per_page: limit }),
  async getEventById(id) {
    if (!/^[1-9]\d*$/.test(String(id))) throw new Error('Choose an event to continue.')
    if (DASHBOARD_PREVIEW) {
      const sample = getStaticEvent(id)
      if (sample) return { data: structuredClone(sample) }
    }
    return (await api.get(`/events/${encodeURIComponent(id)}`)).data
  },
  createEvent: retiredMutation,
  updateEvent: retiredMutation,
  deleteEvent: retiredMutation,
  getAllCategories: async () => (await api.get('/categories')).data,
  getAllSubCategories: async () => (await api.get('/subcategories')).data,
  getSubCategoriesByCategory: async (categoryId) =>
    (await api.get('/subcategories', { params: { category_id: categoryId } })).data,
  // Public routes carry numeric IDs; the backend has no slug lookup contract.
  getEventBySlug: async () => {
    throw new Error('Open this event using its event link.')
  },
  clearExpiredEventCache() {},
}

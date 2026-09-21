import api from '@/api/axios'

export const getDashboardEvents = async ({ signal } = {}) => {
  const response = await api.get('/dashboard/events', { signal })
  return response.data.data
}

export const getDashboardOverview = async (eventId, { signal } = {}) => {
  const response = await api.get(
    `/dashboard/events/${encodeURIComponent(eventId)}/overview`,
    { signal },
  )
  return response.data.data
}

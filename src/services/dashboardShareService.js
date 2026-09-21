import api from '@/api/axios'

export const getEventShareLinks = async (eventId, { signal } = {}) => {
  const response = await api.get(
    `/dashboard/events/${encodeURIComponent(eventId)}/share-links`,
    { signal },
  )
  return response.data.data
}

export const createEventShareLink = async (eventId, label) => {
  const response = await api.post(
    `/dashboard/events/${encodeURIComponent(eventId)}/share-links`,
    { label },
  )
  return response.data.data
}

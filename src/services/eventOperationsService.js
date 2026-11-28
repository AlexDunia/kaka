import api, { ensureCsrfCookie } from '@/api/axios'
const root = (eventId) => `/event-operations/${encodeURIComponent(eventId)}`
const read = async (eventId, path, params) =>
  (await api.get(`${root(eventId)}${path}`, { params })).data
const mutate = async (method, eventId, path, payload) => {
  await ensureCsrfCookie()
  return (await api[method](`${root(eventId)}${path}`, payload)).data
}
export const getAttendees = (eventId, params) => read(eventId, '/attendees', params)
export const getPurchases = (eventId, params) => read(eventId, '/purchases', params)
export const getAdmissionContext = async (eventId) => (await read(eventId, '/admission')).data
export const getAdmissionHistory = (eventId, params) => read(eventId, '/admission/history', params)
export const lookupAdmission = async (eventId, payload) =>
  (await mutate('post', eventId, '/admission/lookup', payload)).data
export const recordAdmission = async (eventId, payload) =>
  (await mutate('post', eventId, '/admission/movements', payload)).data
export const updateAttendee = async (eventId, id, payload) =>
  (await mutate('patch', eventId, `/attendees/${encodeURIComponent(id)}`, payload)).data
export const saveEntrance = async (eventId, id, payload) =>
  (
    await mutate(
      id ? 'put' : 'post',
      eventId,
      `/entrances${id ? `/${encodeURIComponent(id)}` : ''}`,
      payload,
    )
  ).data
export const resendTicket = (eventId, id) =>
  mutate('post', eventId, `/tickets/${encodeURIComponent(id)}/resend`, {})
export const exportAttendees = async (eventId, q) =>
  (
    await api.get(`${root(eventId)}/attendees/export`, {
      params: { q: q || undefined },
      responseType: 'blob',
    })
  ).data
export const registerFreeEvent = async (eventId, payload) => {
  await ensureCsrfCookie()
  return (await api.post(`/events/${encodeURIComponent(eventId)}/registrations`, payload)).data.data
}
export const operationsError = (
  error,
  fallback = 'We couldn’t load these records. Please try again.',
) => {
  const status = error?.response?.status
  if (status === 401) return 'Please log in to continue.'
  if (status === 403) return 'You don’t have access to these event records.'
  if (status === 409) return 'This record changed on another device. Reload it before saving again.'
  if (status === 422)
    return (
      Object.values(error.response.data?.errors || {})
        .flat()
        .find((value) => typeof value === 'string') ||
      error.response.data?.message ||
      fallback
    )
  if (status === 429) return 'Please wait a moment before trying again.'
  return fallback
}

export const inviteDoorStaff = (eventId, email, entranceId) =>
  mutate('post', eventId, '/staff/invitations', { email, role: 'door', entrance_id: entranceId })

export const acceptEventInvitation = async (token) => {
  await ensureCsrfCookie()
  return (await api.post('/event-staff/invitations/accept', { token })).data.data
}

export const getFreeRegistration = async (eventId) =>
  (await api.get(`/events/${encodeURIComponent(eventId)}/registration`)).data.data

export const setAdmissionPolicy = (eventId, allow_reentry) =>
  mutate('put', eventId, '/admission/settings', { allow_reentry })
export const getEventStaff = (eventId, page = 1) => read(eventId, '/staff', { page, per_page: 30 })
export const revokeEventStaff = async (eventId, id, invitation = false) => {
  await ensureCsrfCookie()
  return (
    await api.delete(
      `${root(eventId)}/staff${invitation ? '/invitations' : ''}/${encodeURIComponent(id)}`,
    )
  ).data
}

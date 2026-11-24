import axios from 'axios'

export const API_BASE_URL = '/api'
export const apiUrl = (path) => `${API_BASE_URL}/${path.replace(/^\//, '')}`
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
})
let csrfCookieRequest = null
export const ensureCsrfCookie = () => {
  if (!csrfCookieRequest) {
    csrfCookieRequest = axios
      .get('/sanctum/csrf-cookie', { withCredentials: true, withXSRFToken: true })
      .finally(() => {
        csrfCookieRequest = null
      })
  }
  return csrfCookieRequest
}
export const getApiErrorMessage = (
  error,
  fallback = 'We couldn’t complete that. Please try again.',
) => {
  const status = error.response?.status
  if (status >= 500) return 'We couldn’t complete that. Please try again later.'
  const errors = error.response?.data?.errors
  const validation =
    typeof errors === 'string'
      ? errors
      : errors &&
        Object.values(errors)
          .flat()
          .find((value) => typeof value === 'string' && value)
  const messages = {
    401: 'Please log in to continue.',
    403: 'You don’t have access to this event.',
    419: 'Your session has expired. Please log in again.',
    410: 'This action is no longer available. Open the event editor to make changes.',
    429: 'Please wait a moment before trying again.',
  }
  return messages[status] || validation || error.response?.data?.message || fallback
}
export default api

import axios from 'axios'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
export const apiUrl = (path) => `${API_BASE_URL}/${path.replace(/^\//, '')}`
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
})
let csrfCookieRequest = null
export const ensureCsrfCookie = () => {
  if (!csrfCookieRequest) {
    csrfCookieRequest = api.get('/sanctum/csrf-cookie').finally(() => {
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    error.userMessage = getApiErrorMessage(error)
    if ([401, 419].includes(error.response?.status)) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      if (error.response.status === 419 && error.config?.url !== '/sanctum/csrf-cookie') {
        // Refresh protection for the next explicit attempt. Never replay a mutation.
        void ensureCsrfCookie().catch(() => {})
      }
    }
    return Promise.reject(error)
  },
)
export default api

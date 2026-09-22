import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  withXSRFToken: true,
})

let csrfCookieRequest = null

export const ensureCsrfCookie = () => {
  if (!csrfCookieRequest) {
    csrfCookieRequest = axios
      .get('/sanctum/csrf-cookie', { withCredentials: true, withXSRFToken: true })
      .finally(() => { csrfCookieRequest = null })
  }
  return csrfCookieRequest
}

export default api

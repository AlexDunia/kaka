// resources/js/api/axios.js
import axios from 'axios'

const apiOrigin = import.meta.env.DEV ? 'http://127.0.0.1:8000' : ''

// const api = axios.create({
//   baseURL: `${apiOrigin}/api`,
//   withCredentials: true,
//   withXSRFToken: true,
// })

const api = axios.create({
  baseURL: '/api', // use Vite proxy, no hardcoded origin
  withCredentials: true,
})

let csrfCookieRequest = null

export const ensureCsrfCookie = () => {
  if (!csrfCookieRequest) {
    csrfCookieRequest = axios
      .get(`${apiOrigin}/sanctum/csrf-cookie`, {
        withCredentials: true,
        withXSRFToken: true,
      })
      .catch((error) => {
        csrfCookieRequest = null
        throw error
      })
  }

  return csrfCookieRequest
}

export default api

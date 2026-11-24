import axios from 'axios'

// Configure auth token when available
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    // Also store token in localStorage for persistence
    localStorage.setItem('auth_token', token)
  } else {
    delete axios.defaults.headers.common['Authorization']
    localStorage.removeItem('auth_token')
  }
}

// Get the current auth token
export const getAuthToken = () => {
  return localStorage.getItem('auth_token')
}

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken()
}

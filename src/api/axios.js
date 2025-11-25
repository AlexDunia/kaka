// resources/js/api/axios.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // THIS IS THE ONLY LINE THAT MATTERS
})

export default api

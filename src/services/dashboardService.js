import api from '@/api/axios'
export const getDashboardEvents=async({signal}={})=>(await api.get('/dashboard/events',{signal})).data.data
export const getDashboardOverview=async(eventId,{signal}={})=>(await api.get(`/dashboard/events/${encodeURIComponent(eventId)}/overview`,{signal})).data.data

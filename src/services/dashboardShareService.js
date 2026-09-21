import api from '@/api/axios'
export const getEventShareLinks=async(eventId,{signal}={})=>(await api.get(`/dashboard/events/${encodeURIComponent(eventId)}/share-links`,{signal})).data.data
export const createEventShareLink=async(eventId,label)=>(await api.post(`/dashboard/events/${encodeURIComponent(eventId)}/share-links`,{label})).data.data

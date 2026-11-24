import api, { ensureCsrfCookie } from '@/api/axios'
const root = (id) => `/event-operations/${encodeURIComponent(id)}`
const post = async (path, payload) => {
  await ensureCsrfCookie()
  return (await api.post(path, payload)).data.data
}
export const getEventEarnings = async (id) => (await api.get(`${root(id)}/earnings`)).data.data
export const getRefunds = async (id, page = 1) =>
  (await api.get(`${root(id)}/refunds`, { params: { page, per_page: 30 } })).data
export const requestRefund = (id, order, payload) =>
  post(`${root(id)}/orders/${encodeURIComponent(order)}/refunds`, payload)
export const retryRefund = (id, refund) =>
  post(`${root(id)}/refunds/${encodeURIComponent(refund)}/retry`, {})
export const changeEventLifecycle = (id, payload) => post(`${root(id)}/lifecycle`, payload)
export const getPayoutAccounts = async (page = 1) =>
  (await api.get('/seller/payout-accounts', { params: { page } })).data
export const getBanks = async (page = 1) =>
  (await api.get('/seller/banks', { params: { page } })).data
export const createPayoutAccount = (payload) => post('/seller/payout-accounts', payload)

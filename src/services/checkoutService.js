import api,{ ensureCsrfCookie } from '@/api/axios'
const headers=token=>token?{'X-Checkout-Token':token}:{}
export const quoteCheckout=async items=>(await api.post('/checkout/quote',{items})).data.data
export const initializeCheckout=async({checkoutToken,visitorId,customer,items})=>{await ensureCsrfCookie();return(await api.post('/checkout/initialize',{checkout_token:checkoutToken,visitor_id:visitorId||null,customer,items})).data.data}
export const verifyCheckoutPayment=async({reference,checkoutToken})=>{await ensureCsrfCookie();return(await api.post(`/checkout/payments/${encodeURIComponent(reference)}/verify`,{},{headers:headers(checkoutToken)})).data.data}
export const getCheckoutOrder=async({orderId,checkoutToken})=>(await api.get(`/checkout/orders/${encodeURIComponent(orderId)}`,{headers:headers(checkoutToken)})).data.data


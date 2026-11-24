import assert from 'node:assert/strict'
import axios from 'axios'
import process from 'node:process'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { randomUUID } from 'node:crypto'
const origin = 'http://127.0.0.1:8013'
const fixture = JSON.parse(await readFile(process.env.PHASE03_FIXTURE, 'utf8'))
const values = new Map()
globalThis.window = new EventTarget()
globalThis.sessionStorage = {
  getItem: (k) => values.get(k) ?? null,
  setItem: (k, v) => values.set(k, String(v)),
  removeItem: (k) => values.delete(k),
}
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
try {
  const { default: api, ensureCsrfCookie } = await server.ssrLoadModule('/src/api/axios.js')
  const service = await server.ssrLoadModule('/src/services/checkoutService.js')
  const storage = await server.ssrLoadModule('/src/utils/checkoutStorage.js')
  api.defaults.baseURL = `${origin}/api`
  api.defaults.headers.common.Origin = 'http://localhost:5174'
  api.defaults.headers.common.Referer = 'http://localhost:5174/'
  const cookies = new Map()
  api.interceptors.request.use((config) => {
    if (cookies.size) config.headers.Cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ')
    if (cookies.has('XSRF-TOKEN'))
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(cookies.get('XSRF-TOKEN'))
    return config
  })
  const remember = (response) => {
    for (const raw of response.headers['set-cookie'] || []) {
      const pair = raw.split(';')[0],
        index = pair.indexOf('=')
      cookies.set(pair.slice(0, index), pair.slice(index + 1))
    }
    return response
  }
  api.interceptors.response.use(remember, (error) => {
    if (error.response) remember(error.response)
    throw error
  })
  axios.defaults.baseURL = origin
  axios.defaults.headers.common.Origin = 'http://localhost:5174'
  axios.defaults.headers.common.Referer = 'http://localhost:5174/'
  axios.interceptors.request.use((config) => {
    if (cookies.size) config.headers.Cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ')
    return config
  })
  axios.interceptors.response.use(remember)
  const email = `phase03-${Date.now()}@example.invalid`
  await ensureCsrfCookie()
  await api.post('/register', {
    name: 'Commerce buyer',
    email,
    password: 'Phase03-test-password-948!',
    password_confirmation: 'Phase03-test-password-948!',
  })
  const items = [{ ticket_type_id: fixture.ticket_type_id, quantity: 1 }]
  const quote = await service.quoteCheckout(items)
  assert.equal(quote.total_minor, 10000)
  const spoofed = await service.quoteCheckout([{ ...items[0], unit_price_minor: 1, price: 0 }])
  assert.equal(spoofed.total_minor, 10000, 'Only server prices determine totals')
  await assert.rejects(
    service.quoteCheckout([{ ticket_type_id: fixture.ticket_type_id, quantity: 1000000 }]),
    (error) => error.response?.status === 422,
  )
  await assert.rejects(
    service.quoteCheckout([{ ticket_type_id: 2147483647, quantity: 1 }]),
    (error) => error.response?.status === 422,
  )
  const token = randomUUID()
  const input = {
    checkoutToken: token,
    customer: { first_name: 'Ada', last_name: 'Buyer', email, phone: '08000000000' },
    items,
  }
  const checkout = await service.initializeCheckout(input)
  assert.equal(checkout.order.status, 'pending_payment')
  const duplicate = await service.initializeCheckout(input)
  assert.equal(duplicate.order.public_id, checkout.order.public_id)
  assert.equal(duplicate.payment.reference, checkout.payment.reference)
  const paid = await service.verifyCheckoutPayment({
    reference: checkout.payment.reference,
    checkoutToken: token,
  })
  assert.equal(paid.status, 'paid')
  assert.equal(paid.items[0].tickets.length, 1)
  assert.equal(paid.items[0].tickets[0].admit_count, 4)
  const repeated = await service.verifyCheckoutPayment({
    reference: checkout.payment.reference,
    checkoutToken: token,
  })
  assert.equal(repeated.items[0].tickets[0].public_id, paid.items[0].tickets[0].public_id)
  const history = await service.getBuyerOrders()
  assert.equal(history.data[0].public_id, paid.public_id)
  console.log(
    'PASS real HTTP quote, idempotent checkout, payment verification, ticket snapshots and authenticated history',
  )
  await ensureCsrfCookie()
  await api.post('/logout')
  cookies.clear()
  await assert.rejects(service.getBuyerOrders(), (error) => error.response?.status === 401)
  await assert.rejects(
    service.getCheckoutOrder({ orderId: paid.public_id }),
    (error) => error.response?.status === 403,
  )
  await service.requestOrderRecovery(paid.public_id, email)
  const drained = await (await fetch(`${origin}/_phase03/drain`)).json()
  const message = drained.messages.find((text) => text.includes(paid.public_id))
  assert.ok(message)
  const recoveryToken = message.match(/#token=([a-zA-Z0-9]{64})/)[1]
  const access = await service.exchangeOrderRecovery(recoveryToken)
  storage.rememberOrderRecovery(access)
  const recovered = await service.getCheckoutOrder({ orderId: paid.public_id })
  assert.equal(recovered.items[0].tickets[0].token, paid.items[0].tickets[0].token)
  await assert.rejects(
    service.exchangeOrderRecovery(recoveryToken),
    (error) => error.response?.status === 403,
  )
  values.clear()
  await assert.rejects(
    service.getCheckoutOrder({ orderId: paid.public_id }),
    (error) => error.response?.status === 403,
  )
  console.log(
    'PASS captured queued ticket email, guest link exchange, protected ticket recovery, single-use link and denied unauthorized access',
  )
} finally {
  await server.close()
}

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
import axios from 'axios'
import { createServer } from 'vite'
const origin = 'http://127.0.0.1:8014'
const fixture = JSON.parse(await readFile(process.env.PHASE04_FIXTURE, 'utf8'))
const http = axios.getAdapter('http')
async function actor(email) {
  const jar = new Map()
  const client = axios.create({
    baseURL: origin,
    adapter: http,
    headers: {
      Accept: 'application/json',
      Origin: 'http://localhost:5174',
      Referer: 'http://localhost:5174/',
    },
  })
  client.interceptors.request.use((config) => {
    config.headers.Cookie = [...jar].map(([key, value]) => `${key}=${value}`).join('; ')
    if (jar.has('XSRF-TOKEN'))
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(jar.get('XSRF-TOKEN'))
    return config
  })
  client.interceptors.response.use((response) => {
    for (const cookie of response.headers['set-cookie'] || []) {
      const pair = cookie.split(';')[0],
        index = pair.indexOf('=')
      jar.set(pair.slice(0, index), pair.slice(index + 1))
    }
    return response
  })
  await client.get('/sanctum/csrf-cookie')
  if (email) await client.post('/api/login', { email, password: 'Phase04-test-password!' })
  return client
}
const buyer = await actor(),
  owner = await actor('owner-phase04@example.invalid'),
  other = await actor('other-phase04@example.invalid')
let current = buyer
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const commerce = await server.ssrLoadModule('/src/services/checkoutService.js')
  const operations = await server.ssrLoadModule('/src/services/eventOperationsService.js')
  api.defaults.adapter = (config) =>
    current.request({ ...config, baseURL: origin, adapter: http, url: '/api' + config.url })
  axios.defaults.adapter = (config) =>
    current.request({ ...config, baseURL: origin, adapter: http })
  const finance = await server.ssrLoadModule('/src/services/eventFinanceService.js')
  const editor = await server.ssrLoadModule('/src/services/createEventService.js')
  const registration = {
    checkout_token: randomUUID(),
    quantity: 1,
    customer: { first_name: 'Finance', last_name: 'Buyer', email: 'finance@example.invalid' },
    attendees: [{ unit_index: 0, seat_index: 0, answers: { name: 'Finance guest' } }],
  }
  const order = await operations.registerFreeEvent(fixture.free_event, registration)
  assert.equal(order.status, 'registered')
  current = owner
  const metrics = await finance.getEventEarnings(fixture.free_event)
  assert.equal(metrics.by_currency[0].gross_minor, 0)
  assert.equal(metrics.by_currency[0].confirmed_settled_minor, 0)
  const purchases = await operations.getPurchases(fixture.free_event, { page: 1, per_page: 1 })
  assert.equal(purchases.data[0].id, order.items[0].id)
  const payload = {
    request_key: randomUUID(),
    order_item_ids: [purchases.data[0].id],
    reason: 'Registration no longer needed',
  }
  const refund = await finance.requestRefund(fixture.free_event, order.public_id, payload)
  const repeat = await finance.requestRefund(fixture.free_event, order.public_id, payload)
  assert.equal(repeat.public_id, refund.public_id)
  assert.equal(refund.status, 'queued')
  assert.equal(refund.amount_minor, 0)
  assert.equal((await finance.getRefunds(fixture.free_event)).data[0].public_id, refund.public_id)
  assert.equal((await finance.getEventEarnings(fixture.free_event)).by_currency[0].refunds_minor, 0)
  await assert.rejects(
    operations.lookupAdmission(fixture.free_event, {
      token: order.items[0].tickets[0].token,
      entrance_id: fixture.gates[fixture.free_event],
    }),
    (e) => [403, 422].includes(e.response?.status),
  )
  current = other
  await assert.rejects(
    finance.getEventEarnings(fixture.free_event),
    (e) => e.response?.status === 403,
  )
  await assert.rejects(
    finance.requestRefund(fixture.free_event, order.public_id, payload),
    (e) => e.response?.status === 403,
  )
  current = owner
  const record = (await editor.getEventForEditing(fixture.table_event)).data
  const closed = await finance.changeEventLifecycle(fixture.table_event, {
    version: record.version,
    action: 'cancel',
    reason: 'Venue no longer available',
  })
  assert.equal(closed.lifecycle_state, 'cancelled')
  await assert.rejects(
    finance.changeEventLifecycle(fixture.table_event, {
      version: record.version,
      action: 'open_sales',
    }),
    (e) => e.response?.status === 409,
  )
  current = buyer
  await assert.rejects(
    commerce.quoteCheckout([{ ticket_type_id: fixture.table_type, quantity: 1 }]),
    (e) => e.response?.status === 422,
  )
  const publicEvent = (await buyer.get(`/api/events/${fixture.table_event}`)).data.data
  assert.equal(publicEvent.lifecycle_state, 'cancelled')
  assert.equal(publicEvent.booking_supported, false)
  console.log(
    'PASS actual Vue services over isolated Laravel HTTP: canonical zero-charge finances, paginated persisted items, idempotent queued refunds, suspended credentials, owner isolation, versioned cancellation, rejected checkout and public cancellation contract; no provider charges',
  )
} finally {
  await server.close()
}

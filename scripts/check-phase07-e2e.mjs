import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
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
void other
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
  const { performance } = await import('node:perf_hooks')
  const { writeFile } = await import('node:fs/promises')
  const samples = []
  const percentile = (values, p) =>
    values.slice().sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * p) - 1)]
  async function workload(name, count, concurrency, operation) {
    const latencies = [],
      queryCounts = [],
      appMs = [],
      peaks = [],
      bytes = []
    let cursor = 0,
      failures = 0
    const started = performance.now()
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        while (cursor < count) {
          const index = cursor++,
            start = performance.now()
          try {
            const response = await operation(index)
            if (response?.headers) {
              queryCounts.push(Number(response.headers['x-test-query-count']))
              appMs.push(Number(response.headers['x-test-app-ms']))
              peaks.push(Number(response.headers['x-test-peak-bytes']))
              bytes.push(Buffer.byteLength(JSON.stringify(response.data)))
            }
          } catch (e) {
            failures++
            console.log(name, 'failed', e.response?.status || e.message)
          }
          latencies.push(performance.now() - start)
        }
      }),
    )
    const seconds = (performance.now() - started) / 1000
    const row = {
      name,
      count,
      concurrency,
      failures,
      error_rate: failures / count,
      requests_per_second: count / seconds,
      p50_ms: percentile(latencies, 0.5),
      p95_ms: percentile(latencies, 0.95),
      p99_ms: percentile(latencies, 0.99),
      max_queries: queryCounts.length ? Math.max(...queryCounts) : null,
      max_app_ms: appMs.length ? Math.max(...appMs) : null,
      max_php_peak_bytes: peaks.length ? Math.max(...peaks) : null,
      max_response_bytes: bytes.length ? Math.max(...bytes) : null,
    }
    samples.push(row)
    console.log(JSON.stringify(row))
    assert.equal(failures, 0, `${name} must complete without errors`)
  }
  const customer = {
    first_name: 'Load',
    last_name: 'Buyer',
    email: 'load-checkout@example.invalid',
    phone: '08000000000',
  }
  current = owner
  const dashboard = (
    await owner.get('/api/dashboard/events', { params: { page: 1, per_page: 30 } })
  ).data
  assert.equal(dashboard.total, 38)
  assert.equal(dashboard.data.length, 30)
  assert.equal(dashboard.last_page, 2)
  const secondPage = (
    await owner.get('/api/dashboard/events', { params: { page: 2, per_page: 30 } })
  ).data
  assert.equal(secondPage.data.length, 8)
  const attendeePage = await operations.getAttendees(fixture.free_event, { page: 1, per_page: 30 })
  assert.equal(attendeePage.total, 1000)
  assert.equal(attendeePage.data.length, 30)
  await workload('public discovery', 24, 4, () =>
    buyer.get('/api/events', { params: { page: 1, per_page: 12, q: 'Lifecycle', city: 'Lagos' } }),
  )
  await workload('popular launch quote', 20, 4, () =>
    buyer.post('/api/checkout/quote', {
      items: [{ ticket_type_id: fixture.table_type, quantity: 1 }],
    }),
  )
  current = buyer
  const attempts = []
  const tokens = []
  await workload('inventory reservations', 8, 4, async () => {
    const checkoutToken = randomUUID()
    const attempt = await commerce.initializeCheckout({
      checkoutToken,
      customer,
      items: [{ ticket_type_id: fixture.table_type, quantity: 1 }],
      attendees: Array.from({ length: 4 }, (_, seat_index) => ({
        ticket_type_id: fixture.table_type,
        unit_index: 0,
        seat_index,
        answers: { name: `Load seat ${seat_index}` },
      })),
    })
    attempts.push(attempt)
    tokens.push(checkoutToken)
  })
  await workload('payment verification', 8, 4, async (i) => {
    const attempt = attempts[i]
    return buyer.post(
      `/api/checkout/payments/${encodeURIComponent(attempt.payment.reference)}/verify`,
      {},
      { headers: { 'X-Checkout-Token': tokens[i] } },
    )
  })
  await workload('dashboard reads', 20, 4, () =>
    owner.get(`/api/dashboard/events/${fixture.free_event}/overview`),
  )
  await workload('large attendee pages', 20, 4, () =>
    owner.get(`/api/event-operations/${fixture.free_event}/attendees`, {
      params: { page: 1, per_page: 30 },
    }),
  )
  const admissionOrder = await operations.registerFreeEvent(fixture.free_event, {
    checkout_token: randomUUID(),
    quantity: 1,
    customer,
    attendees: [{ unit_index: 0, seat_index: 0, answers: { name: 'Scan load' } }],
  })
  const token = admissionOrder.items[0].tickets[0].token
  const requestKey = randomUUID()
  await workload('idempotent scan retries (one owner session)', 12, 4, () =>
    owner.post(`/api/event-operations/${fixture.free_event}/admission/movements`, {
      token,
      entrance_id: fixture.gates[fixture.free_event],
      direction: 'in',
      count: 1,
      request_key: requestKey,
    }),
  )
  const report = {
    environment:
      'Local single-worker PHP development server; disposable SQLite; provider fake; array cache; no production or distributed capacity inference',
    fixture: { events: 38, attendees: 1000 },
    samples,
    node_peak_rss_bytes: process.memoryUsage().rss,
    node_cpu_microseconds: process.cpuUsage(),
  }
  await writeFile('docs/phase-07-performance-results.json', JSON.stringify(report, null, 2))
  console.log(
    'PASS bounded owner pagination and seven local HTTP workloads; separate-process MariaDB tests are the concurrency integrity evidence',
  )
} finally {
  await server.close()
}

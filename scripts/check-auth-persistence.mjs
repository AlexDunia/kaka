import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'

const values = new Map()
globalThis.localStorage = {
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
  getItem: (key) => values.get(key) ?? null,
}
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const failure = (status) => Object.assign(new Error('Request failed'), status ? { response: { status } } : {})
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
  const account = { id: 1, name: 'Test organiser', role: 'organiser' }
  let getCalls = 0
  let getUser = async () => ({ data: account })
  let post = async () => ({ data: {} })
  api.get = async () => { getCalls++; return getUser() }
  api.post = (...args) => post(...args)
  // CSRF uses the default Axios instance rather than the API instance.
  axios.defaults.adapter = async (config) => ({ data: {}, status: 204, statusText: 'No Content', headers: {}, config })
  const fresh = () => { setActivePinia(createPinia()); return useAuthStore() }

  values.set('user', JSON.stringify({ id: 999, role: 'admin' }))
  let auth = fresh()
  assert.equal(auth.isAuthenticated, false, 'Stored profile cannot authorize access')
  let release
  getUser = () => new Promise((resolve) => { release = resolve })
  const startup = auth.initialize()
  const guard = auth.initialize()
  assert.equal(getCalls, 1, 'Concurrent startup and route check share a request')
  assert.equal(auth.isAuthenticated, false)
  release({ data: account })
  await Promise.all([startup, guard])
  assert.equal(auth.isAuthenticated, true)
  await auth.initialize()
  assert.equal(getCalls, 1)
  const recheck = auth.initialize({ force: true })
  assert.equal(auth.isAuthenticated, false, 'Unresolved verification blocks access')
  release({ data: account })
  await recheck

  getUser = async () => { throw failure(401) }
  auth = fresh()
  await auth.initialize()
  assert.equal(auth.initialized, true)
  assert.equal(auth.isAuthenticated, false)
  assert.equal(auth.error, null)

  for (const status of [undefined, 500, 503]) {
    auth = fresh()
    getUser = async () => { throw failure(status) }
    await auth.initialize()
    assert.equal(auth.initialized, false)
    assert.equal(auth.isAuthenticated, false)
    assert.ok(auth.error)
    getUser = async () => ({ data: account })
    await auth.initialize()
    assert.equal(auth.isAuthenticated, true, 'Retry recovers without a page reload')
  }

  post = async () => { throw failure(422) }
  auth = fresh()
  await assert.rejects(auth.login('invalid@example.com', 'incorrect'))
  assert.equal(auth.isAuthenticated, false)
  post = async (path, payload) => {
    assert.equal(path, '/login')
    assert.deepEqual(payload, { email: 'organiser@example.com', password: 'example-password' })
    return { data: {} }
  }
  getUser = async () => ({ data: account })
  await auth.login('organiser@example.com', 'example-password')
  assert.equal(auth.isAuthenticated, true)

  getUser = async () => ({ data: account })
  auth = fresh()
  await auth.initialize()
  post = async () => { throw failure(503) }
  await assert.rejects(auth.logout())
  assert.equal(auth.isAuthenticated, true, 'Failed logout preserves the verified account')
  assert.ok(auth.error)
  post = async () => ({ data: {} })
  await auth.logout()
  assert.equal(auth.isAuthenticated, false)
  assert.equal(auth.user, null)

  for (const status of [401, 419]) {
    auth = fresh()
    getUser = async () => ({ data: account })
    await auth.initialize()
    post = async () => { throw failure(status) }
    getUser = async () => { throw failure(401) }
    await auth.logout()
    assert.equal(auth.isAuthenticated, false, 'Expired session can be dismissed')
  }
  auth = fresh()
  getUser = async () => ({ data: account })
  await auth.initialize()
  post = async () => { throw failure(419) }
  await assert.rejects(auth.logout())
  assert.equal(auth.isAuthenticated, true, 'CSRF failure alone is not successful logout')

  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8')
  assert.ok(main.indexOf('useAuthStore().initialize()') < main.indexOf('app.use(router)'))
  const callback = await readFile(new URL('../src/components/GoogleCallback.vue', import.meta.url), 'utf8')
  assert.ok(callback.includes('authStore.initialize()'))
  assert.ok(!callback.includes('setUser') && !callback.includes("get('user')"))
  console.log('PASS: auth restoration, request deduplication, untrusted storage, 401, outage recovery, invalid login, logout retry, expired sessions, and callback source checks')
} finally {
  await server.close()
}

import assert from 'node:assert/strict'
import axios from 'axios'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
const originalAdapter = axios.defaults.adapter
try {
  const { default: Payouts } = await server.ssrLoadModule('/src/components/event-workspace/WorkspaceEarningsPayouts.vue')
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  let state
  const warnings = []
  async function render(destinationOnly) {
    const app = createSSRApp(Payouts, { destinationOnly })
    app.use(createPinia())
    app.config.warnHandler = message => warnings.push(message)
    app.mixin({ created() { if (this.$.type.__name === 'WorkspaceEarningsPayouts') {
      state = this.$.setupState
      state.editing = true
    } } })
    return renderToString(app)
  }
  const html = await render(true)
  assert.ok(html.includes('Select your bank'))
  assert.ok(html.includes('<select'))
  assert.ok(html.includes('Find your bank'))
  assert.ok(html.includes('type="search"'))
  assert.ok(!html.includes('Settlement history'))
  assert.ok(!html.includes('earnings-tab-payouts'))
  assert.ok((await render(false)).includes('Settlement history'), 'earnings keeps its existing section')
  await render(true)
  let mode = 'success', reads = 0, writes = 0
  const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
  const failure = status => Object.assign(new Error('Request failed'), { response: { status, data: {} } })
  api.defaults.adapter = async config => {
    if (config.url.endsWith('/banks')) {
      reads++
      if (mode === 'bank-failure') throw failure(503)
      if (mode === 'forbidden') throw failure(403)
      const page = config.params.page
      return response(config, { data: page === 1 ? [{ code: '001', name: 'First Bank' }, { code: '002', name: 'Second Bank' }] : [{ code: '002', name: 'Second Bank' }, { code: '003', name: 'Third Bank' }], meta: { next: page === 1 ? 2 : null } })
    }
    if (config.method === 'get') return response(config, { data: [{ id: 1, account_last4: '6789', status: 'pending' }], current_page: 1, last_page: 1 })
    writes++
    if (mode === 'save-failure') throw failure(503)
    if (mode === 'save-forbidden') throw failure(403)
    assert.deepEqual(JSON.parse(config.data), { bank_code: '003', account_number: '0123456789' })
    return response(config, { data: { id: 1 } })
  }
  axios.defaults.adapter = async config => response(config, {})
  await state.loadBanks()
  assert.equal(reads, 0, 'signed-out visitors cannot request banks')
  await state.saveBank()
  assert.equal(writes, 0)
  state.auth.user = { id: 5 }
  mode = 'forbidden'
  await state.loadBanks()
  assert.equal(state.bankPage, 0)
  assert.ok(state.bankError)
  mode = 'bank-failure'
  await state.loadBanks()
  assert.equal(state.banksLoading, false)
  assert.equal(state.bankPage, 0, 'failed page remains retryable')
  mode = 'success'
  const before = reads
  await Promise.all([state.loadBanks(), state.loadBanks()])
  assert.equal(reads - before, 1, 'double clicks request one page')
  assert.equal(state.banks.length, 2)
  state.bankSearch = '  SECOND '
  assert.equal(state.matchingBanks.length, 1)
  await state.loadBanks()
  assert.equal(state.banks.length, 3, 'pages deduplicate banks by code')
  assert.equal(state.moreBanks, false)
  const after = reads
  await state.loadBanks()
  assert.equal(reads, after, 'end of bank list stops further requests')
  state.chooseBank('003')
  assert.equal(state.form.bank_code, '003')
  state.form.account_number = '123'
  await state.saveBank()
  assert.equal(writes, 0, 'invalid account numbers are rejected')
  state.form.account_number = '0123456789'
  state.form.bank_code = '999'
  await state.saveBank()
  assert.equal(writes, 0, 'unknown banks are rejected')
  state.form.bank_code = '003'
  mode = 'save-forbidden'
  await state.saveBank()
  assert.ok(state.error)
  assert.equal(state.busy, false)
  mode = 'save-failure'
  await state.saveBank()
  assert.equal(state.form.account_number, '0123456789', 'failed requests preserve details for retry')
  mode = 'success'
  const priorWrites = writes
  await Promise.all([state.saveBank(), state.saveBank()])
  assert.equal(writes - priorWrites, 1)
  assert.equal(state.form.account_number, '', 'success clears the full account number')
  assert.equal(state.editing, false)
  assert.equal(state.accounts[0].status, 'pending', 'submission does not claim verification')
  state.form.account_number = '0123456789'
  state.closeForm()
  assert.equal(state.form.account_number, '')
  assert.deepEqual(warnings, [])
  console.log('PASS destination-only rendering, dropdown/search, paging, denied access, validation, duplicate requests and failure recovery')
} finally {
  axios.defaults.adapter = originalAdapter
  await server.close()
}

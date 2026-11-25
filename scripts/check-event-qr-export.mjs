import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { drawQrExport, qrFlyerLayout, qrPositions } from '../src/utils/eventQrExport.js'
import { useSlug } from '../src/composables/useSlug.js'

let placements = 0
for (const [width, height] of [
  [1080, 1350],
  [1080, 1920],
  [1600, 900],
  [1500, 1000],
]) {
  for (const position of qrPositions) {
    for (const size of [0.16, 0.22, 0.28]) {
      const box = qrFlyerLayout(width, height, position.key, size)
      assert.ok(box.x >= 0 && box.y >= 0)
      assert.ok(box.x + box.qrSize <= box.width)
      assert.ok(box.y + box.qrSize <= box.imageHeight)
      assert.ok(Math.abs(box.width / box.imageHeight - width / height) < 0.002)
      assert.ok(box.height > box.imageHeight)
      placements++
    }
  }
}
for (const bad of [
  [0, 10],
  [NaN, 10],
  [10, -2],
  [Infinity, 5],
])
  assert.throws(() => qrFlyerLayout(...bad))
assert.throws(() => qrFlyerLayout(100, 200, 'unknown'))
assert.throws(() => qrFlyerLayout(100, 200, 'top-left', 9))
const calls = []
const context = {
  drawImage: (...args) => calls.push(['image', ...args]),
  fillRect: (...args) => calls.push(['fill', ...args]),
  fillText: (...args) => calls.push(['text', ...args]),
}
const canvas = { getContext: () => context }
const qr = { width: 600, height: 600 }
assert.equal(drawQrExport(canvas, qr, null, { mode: 'qr' }), null)
assert.equal(canvas.width, 600)
assert.equal(canvas.height, 600)
assert.equal(calls.length, 1)
calls.length = 0
const image = { width: 1080, height: 1350 }
const layout = drawQrExport(canvas, qr, image, { mode: 'flyer', position: 'top-right', size: 0.22 })
assert.deepEqual(calls[0], ['image', image, 0, 0, layout.width, layout.imageHeight])
assert.equal(calls[2][2], layout.imageHeight)
assert.equal(calls[3][1], 'Powered by Rush Hour Tickets')
assert.throws(() => drawQrExport(canvas, qr, image, { mode: 'other' }))

// Run the real save handler with isolated persistence and navigation dependencies.
const source = await readFile(new URL('../src/pages/CreateEvent.vue', import.meta.url), 'utf8')
const handler = source.slice(
  source.indexOf('async function saveEventChanges()'),
  source.indexOf('const clock = ref'),
)
async function saveCase({
  fromEvent = true,
  failed = false,
  valid = true,
  conflict = false,
  saving = false,
  edit = true,
} = {}) {
  const navigation = [],
    order = []
  const sandbox = {
    isEditMode: { value: edit },
    editingEventId: { value: 30 },
    isSaving: { value: saving },
    isPublishing: { value: false },
    editorLoading: { value: false },
    editorLoadError: { value: '' },
    conflict: { value: conflict },
    editorStatus: { value: 'active' },
    validateAllEditableSteps: () => valid,
    saveError: { value: [] },
    publishErrors: { value: [] },
    persistDraft: async () => {
      order.push('save')
      if (failed) throw new Error('failed')
    },
    showToast: () => {},
    route: { query: fromEvent ? { returnTo: 'event' } : {} },
    form: { title: 'Updated event' },
    useSlug,
    router: {
      push: async (target) => {
        order.push('navigate')
        navigation.push(target)
      },
    },
    normalizeRequestErrors: () => ['save failed'],
    applyBackendErrors: () => {},
    handleWriteError: async () => {},
  }
  vm.createContext(sandbox)
  vm.runInContext(handler, sandbox)
  await sandbox.saveEventChanges()
  return { navigation, order, sandbox }
}
const saved = await saveCase()
assert.equal(saved.navigation[0].name, 'event-details')
assert.equal(saved.navigation[0].params.id, 30)
assert.equal(saved.navigation[0].params.slug, 'updated-event')
assert.deepEqual(saved.order, ['save', 'navigate'])
assert.equal((await saveCase({ fromEvent: false })).navigation.length, 0)
const failed = await saveCase({ failed: true })
assert.equal(failed.navigation.length, 0)
assert.equal(failed.sandbox.isSaving.value, false)
assert.equal((await saveCase({ valid: false })).order.length, 0)
assert.equal((await saveCase({ conflict: true })).order.length, 0)
assert.equal((await saveCase({ saving: true })).order.length, 0)
assert.equal((await saveCase({ edit: false })).order.length, 0)
console.log(
  `Passed: ${placements} QR placements, QR-only export, flyer composition, invalid options, save return, failures and duplicate-save guards.`,
)

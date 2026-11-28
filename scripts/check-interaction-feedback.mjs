import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { compileScript, parse } from '@vue/compiler-sfc'
import { createRenderer, nextTick, reactive } from 'vue'

const route = reactive({ query: {}, meta: {}, fullPath: '/' })
let navigate
const controls = { route, router: { push: (...args) => navigate(...args) } }
globalThis.__feedbackCheck = controls
async function component(file) {
  const { descriptor } = parse(
    await readFile(new URL('../src/components/public/' + file, import.meta.url), 'utf8'),
  )
  let code = compileScript(descriptor, { id: file, inlineTemplate: true }).content
  code = code.replace(
    /import \{[^}]+\} from ['"]vue-router['"];?/,
    `const { route, router } = globalThis.__feedbackCheck
const useRoute = () => route
const useRouter = () => router
const isNavigationFailure = value => value?.duplicated === true
const NavigationFailureType = { duplicated: 16 }`,
  )
  code = code.replace(
    /import \{([^}]+)\} from ['"]@\/components\/icons\/pngIcons['"];?/,
    (_, names) =>
      'const ' +
      names
        .split(',')
        .map((name) => name.trim() + ' = { render: () => null }')
        .join(', '),
  )
  code = code.replace(
    /import PublicEventSearch from ['"].+?['"];?/,
    'const PublicEventSearch = { render: () => null }',
  )
  code = code.replace(
    /import \{ getPublicCategories \} from ['"].+?['"];?/,
    'const getPublicCategories = async () => []',
  )
  code = code.replace(
    /from (["'])([^"']+)\1/g,
    (_, quote, specifier) => `from ${quote}${import.meta.resolve(specifier)}${quote}`,
  )
  return (await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64')))
    .default
}
globalThis.Document = class {}
globalThis.document = new Document()
globalThis.document.activeElement = null
const body = { children: [] }
const renderer = createRenderer({
  createElement: (tag) => ({
    tag,
    children: [],
    props: {},
    open: false,
    options: [],
    addEventListener() {},
    getRootNode() {
      return globalThis.document
    },
    showModal() {
      this.open = true
      this.opens = (this.opens || 0) + 1
    },
    close() {
      this.open = false
      this.props.onClose?.()
    },
    focus() {
      this.focused = true
    },
    querySelector() {
      return { focus() {} }
    },
  }),
  createText: (text) => ({ text }),
  createComment: (text) => ({ text }),
  insert(node, parent, anchor) {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index >= 0) parent.children.splice(index, 0, node)
    else parent.children.push(node)
    node.parent = parent
  },
  remove(node) {
    node?.parent?.children.splice(node.parent.children.indexOf(node), 1)
  },
  setText(node, text) {
    node.text = text
  },
  setElementText(node, text) {
    node.text = text
  },
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
  patchProp(node, key, old, value) {
    node.props[key] = value
  },
  querySelector: () => body,
})
const all = (node) => [node, ...(node.children || []).flatMap(all)]
const Search = await component('PublicEventSearch.vue')
const Header = await component('PublicHeaderSearch.vue')

test('search blocks duplicate submissions, preserves filters, and recovers after rejection', async () => {
  const root = { children: [] },
    calls = [],
    emitted = []
  let resolve, reject
  navigate = (value) => {
    calls.push(value)
    return new Promise((yes, no) => {
      resolve = yes
      reject = no
    })
  }
  const app = renderer.createApp(Search, { onSearched: () => emitted.push(true) })
  app.mount(root)
  await nextTick()
  const find = (predicate) => all(root).find(predicate)
  find((n) => n.tag === 'input').props['onUpdate:modelValue']('  Jazz  ')
  find((n) => n.tag === 'select').props['onUpdate:modelValue']('Lagos')
  const submit = () => find((n) => n.tag === 'form').props.onSubmit({ preventDefault() {} })
  const pending = submit()
  await nextTick()
  assert.equal(find((n) => n.tag === 'button').props['aria-busy'], true)
  await submit()
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].query, { q: 'Jazz', city: 'Lagos' })
  reject(new Error('network'))
  await pending
  await nextTick()
  assert.equal(find((n) => n.tag === 'button').props.disabled, false)
  assert.match(find((n) => n.props?.role === 'status').text, /try again/)
  assert.equal(emitted.length, 0)
  const retry = submit()
  resolve(undefined)
  await retry
  assert.equal(emitted.length, 1)
  app.unmount()
})

test('search preserves native close and focus handling without JS animation delays', async () => {
  const root = { children: [] }
  const app = renderer.createApp(Header)
  app.mount(root)
  const trigger = all(root).find((n) => n.props?.['aria-haspopup'] === 'dialog')
  await Promise.all([trigger.props.onClick(), trigger.props.onClick()])
  const dialog = all(body).find((n) => n.tag === 'dialog')
  assert.equal(dialog.open, true)
  assert.equal(dialog.opens, 1, 'rapid clicks do not reopen an already-open dialog')
  dialog.props.onCancel({ preventDefault() {} })
  assert.equal(dialog.open, false)
  assert.equal(trigger.focused, true)
  await trigger.props.onClick()
  assert.equal(dialog.open, true)
  route.fullPath = '/find-events'
  await nextTick()
  assert.equal(dialog.open, false, 'navigation closes the search dialog')
  app.unmount()
})


test('popup city entry accepts other cities, trims input and supports any city', async () => {
  route.query = {}
  const root = { children: [] }
  const calls = []
  navigate = async (value) => { calls.push(value) }
  const app = renderer.createApp(Search, { filters: true })
  app.mount(root)
  await nextTick()
  const cityField = all(root).find((node) => node.props?.placeholder === 'Any city')
  assert.ok(cityField)
  const submit = () => all(root).find((node) => node.tag === 'form').props.onSubmit({ preventDefault() {} })
  cityField.props['onUpdate:modelValue']('  Enugu  ')
  await submit()
  assert.equal(calls[0].query.city, 'Enugu')
  cityField.props['onUpdate:modelValue']('')
  await submit()
  assert.equal('city' in calls[1].query, false)
  app.unmount()
})

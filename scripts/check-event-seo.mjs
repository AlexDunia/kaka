import assert from 'node:assert/strict'
import { useSeo } from '../src/composables/useSeo.js'

const scripts = []
globalThis.window = { location: { href: 'http://localhost/events/30-lag-event' } }
globalThis.document = {
  querySelector: () => null,
  createElement: () => ({}),
  head: { appendChild: (element) => scripts.push(JSON.parse(element.textContent)) },
}

const { addEventStructuredData } = useSeo()
for (const category of [{ id: 10, name: 'Conference & Summit' }, 'Music', null, {}, 10]) {
  scripts.length = 0
  addEventStructuredData({ id: 30, title: 'Lag event', category })
  assert.equal(scripts.length, 2)
  const name = typeof category === 'string' ? category : category?.name || ''
  assert.equal(scripts[0].superEvent.name, name ? `${name} Events in Nigeria` : 'Events in Nigeria')
  assert.equal(scripts[1].itemListElement[1].name, name || 'Events')
  assert.ok(!JSON.stringify(scripts).includes('[object Object]'))
}
console.log(
  'PASS event metadata accepts API category objects, legacy strings, and missing categories',
)

import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { createRenderer, h, nextTick } from 'vue'
import * as icons from '../src/components/icons/pngIcons.js'

const assetDirectory = new URL('../public/icons/3d/', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('manifest.json', assetDirectory), 'utf8'))

test('every generated icon is a small transparent PNG with a reproducible prompt', async () => {
  assert.ok(manifest.icons.length >= 59)
  for (const icon of manifest.icons) {
    const png = await readFile(new URL(icon.file, assetDirectory))
    assert.equal(png.subarray(1, 4).toString(), 'PNG', icon.name)
    assert.equal(png.readUInt32BE(16), 256, icon.name)
    assert.equal(png.readUInt32BE(20), 256, icon.name)
    assert.equal(png[25], 6, `${icon.name} needs an alpha channel`)
    assert.ok(png.length < 256 * 1024, `${icon.name} exceeds the icon size budget`)
    assert.ok(icon.prompt)
  }
})

test('all literal PNG references in app source resolve to saved assets', async () => {
  const files = await readdir(new URL('../src/', import.meta.url), { recursive: true })
  let references = 0
  for (const file of files.filter((name) => /\.(vue|js)$/.test(name))) {
    const source = await readFile(
      new URL('../src/' + file.replaceAll('\\', '/'), import.meta.url),
      'utf8',
    )
    for (const match of source.matchAll(/(?:pngIconUrl|pngIcon)\('([a-z-]+)'\)/g)) {
      await readFile(new URL(`${match[1]}.png`, assetDirectory))
      references++
    }
  }
  assert.ok(references > 100)
})

const renderer = createRenderer({
  createElement: (tag) => ({ tag, props: {}, children: [] }),
  createText: () => ({}),
  createComment: () => ({}),
  insert: (child, parent) => parent.children.push(child),
  remove() {},
  setText() {},
  setElementText() {},
  patchProp: (node, key, _old, value) => {
    node.props[key] = value
  },
  parentNode() {},
  nextSibling() {},
})

test('PNG icon wrappers retain event handlers, sizing classes, labels, and state classes', () => {
  for (const [name, icon] of Object.entries(icons)) {
    const root = { children: [] }
    let clicks = 0
    const app = renderer.createApp({
      render: () =>
        h(icon, {
          class: 'icon ep-heart-saved',
          'aria-label': 'Test icon',
          onClick: () => {
            clicks++
          },
        }),
    })
    app.mount(root)
    const svg = root.children[0]
    assert.equal(svg.tag, 'svg', name)
    assert.equal(svg.props.class, 'icon ep-heart-saved', name)
    assert.equal(svg.props['aria-label'], 'Test icon', name)
    assert.equal(svg.props.focusable, 'false', name)
    assert.equal(svg.children[0].tag, 'image', name)
    assert.match(svg.children[0].props.href, /^\/icons\/3d\/[a-z-]+\.png$/, name)
    svg.props.onClick()
    assert.equal(clicks, 1, name)
    app.unmount()
  }
})

test('the back control keeps a visible arrow and its action when its PNG fails', async () => {
  const root = { children: [] }
  let clicks = 0
  const app = renderer.createApp({
    render: () => h(icons.ChevronLeftIcon, { onClick: () => { clicks++ } }),
  })
  app.mount(root)
  const svg = root.children[0]
  svg.children[0].props.onError()
  await nextTick()
  assert.ok(svg.children.some((node) => node.tag === 'path'))
  svg.props.onClick()
  assert.equal(clicks, 1)
  app.unmount()
})

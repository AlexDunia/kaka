import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { buildReferenceCss, referencePages } from './sync-public-reference.mjs'
import { categoryArt } from '../src/components/public/categoryArt.js'

const filename = process.argv[2] || 'C:/Users/HP/Downloads/Rushhour_Tickets_v13_Restored_Home_Seamless_Ticker.html'
const pages = referencePages(filename)
assert.equal(fs.readFileSync('src/styles/public-site.css', 'utf8'), buildReferenceCss(filename), 'Public reference CSS differs from the supplied HTML.')

const canonical = (svg) => svg.replace(/viewbox=/g, 'viewBox=').replace(/preserveaspectratio=/g, 'preserveAspectRatio=').replace(/\s+/g, ' ').trim()
const sourceCategories = [...pages.events.matchAll(/<div class="category-art" style="background:([^"]+)">([\s\S]*?)<\/div>/g)]
assert.equal(sourceCategories.length, categoryArt.length)
sourceCategories.forEach(([, color, svg], index) => {
  assert.equal(categoryArt[index].color, color)
  assert.equal(canonical(categoryArt[index].svg), canonical(svg), `Category illustration ${index + 1} changed`)
})

const hashes = new Set()
for (const html of Object.values(pages)) {
  for (const [, uri] of html.matchAll(/src="(data:image\/[^"\s]+)"/g)) {
    const comma = uri.indexOf(',')
    const bytes = uri.slice(0, comma).includes(';base64') ? Buffer.from(uri.slice(comma + 1), 'base64') : Buffer.from(decodeURIComponent(uri.slice(comma + 1)))
    hashes.add(createHash('sha256').update(bytes).digest('hex'))
  }
}
const assets = fs.readdirSync('public/images/public')
for (const asset of assets) {
  const hash = createHash('sha256').update(fs.readFileSync(`public/images/public/${asset}`)).digest('hex')
  assert.ok(hashes.has(hash), `Artwork ${asset} differs from the supplied HTML`)
}
const home = fs.readFileSync('src/pages/HomePage.vue', 'utf8')
for (const className of ['sales-chart', 'demo-qr']) {
  const expression = new RegExp(`<svg[^>]*class="${className}"[^>]*>[\\s\\S]*?</svg>`)
  assert.equal(canonical(home.match(expression)[0]), canonical(pages.home.match(expression)[0]), `${className} changed`)
}
for (const className of ['story-row', 'moment-card']) {
  const expression = new RegExp(`class="${className}(?: [^"]*)?"`, 'g')
  assert.equal([...home.matchAll(expression)].length, [...pages.home.matchAll(expression)].length, `${className} count differs`)
}
assert.ok(home.includes('Waterfront_City_Stroll_with_Hybrid_Car_1_qsrb26.png'), 'The requested hero replacement is missing')
console.log(`Reference comparison passed: all CSS declarations, ${categoryArt.length} category SVGs, ${assets.length} original artwork files, both product SVGs, all feature rows, and all moment cards.`)

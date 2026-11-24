import fs from 'node:fs'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

// Treat the supplied HTML as visual source data, never executable application code.
export function referencePages(filename) {
  const source = fs.readFileSync(filename, 'utf8')
  return Object.fromEntries(['home', 'events'].map((name) => {
    const encoded = source.match(new RegExp(`<script id="rh-embed-${name}"[^>]*>([\\s\\S]*?)</script>`))[1]
    return [name, Buffer.from(encoded, 'base64').toString('utf8')]
  }))
}

export function scopeReferenceStyles(css, scope) {
  const root = postcss.parse(css)
  root.walkRules((rule) => {
    if (rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return
    rule.selector = selectorParser((selectors) => selectors.each((selector) => {
      if (/^(?::root|html|body)$/.test(selector.toString().trim())) {
        selector.removeAll()
        selector.append(selectorParser.className({ value: scope }))
      } else {
        selector.prepend(selectorParser.combinator({ value: ' ' }))
        selector.prepend(selectorParser.className({ value: scope }))
      }
    })).processSync(rule.selector)
  })
  return root.toString()
}

export function buildReferenceCss(filename) {
  const pages = referencePages(filename)
  const styles = Object.fromEntries(Object.entries(pages).map(([name, html]) => [name, [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1])]))
  if (styles.home[0] !== styles.events[0]) throw new Error('The shared reference styles have changed; compare both pages before importing.')
  const tokens = fs.readFileSync('src/assets/event-workspace/rushhour-system.css', 'utf8').match(/:root\{([\s\S]*?)\}/)[1]
  return `/* Imported from the supplied v13 HTML. Regenerate with scripts/sync-public-reference.mjs. */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;750&display=swap');
.public-site {${tokens}}
/* Neutralise existing application defaults before applying the original rules. */
.public-site{display:block;width:100%;min-height:100vh}
.public-site .container{padding:0}
.public-site p,.public-site h1,.public-site h2,.public-site h3{color:inherit}
.public-site button,.public-site .btn{text-transform:none;letter-spacing:normal;box-shadow:none}
.public-site button:hover,.public-site .btn:hover{box-shadow:none}
.public-site input,.public-site select{padding:1px 2px;border-radius:0;box-shadow:none;width:auto}
.public-site a{padding:0;position:static}
.public-site a:hover{background-color:transparent}
.public-site .event-card{border:0;background:transparent;box-shadow:none;padding:0;border-radius:0}
${scopeReferenceStyles(styles.home[0], 'public-site')}
${scopeReferenceStyles(styles.home.slice(1).join('\n'), 'public-site--home')}
${scopeReferenceStyles(styles.events.slice(1).join('\n'), 'public-site--discovery')}
`
}

if (process.argv[1]?.endsWith('sync-public-reference.mjs')) {
  const filename = process.argv[2] || 'C:/Users/HP/Downloads/Rushhour_Tickets_v13_Restored_Home_Seamless_Ticker.html'
  fs.writeFileSync('src/styles/public-site.css', buildReferenceCss(filename))
  console.log('Restored all original v13 CSS declarations, scoped by page.')
}

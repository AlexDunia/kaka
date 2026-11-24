import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
const checks = [
  'check-phase07-contracts.mjs',
  'check-phase1b.mjs',
  'check-phase02.mjs',
  'check-phase03.mjs',
  'check-phase03-ui.mjs',
  'check-phase04-ui.mjs',
  'check-phase05-analytics.mjs',
  'check-phase06-ui.mjs',
  'check-event-profile.mjs',
  'check-public-site.mjs',
  'check-design-system.mjs',
]
const results = []
for (const file of checks) {
  const started = Date.now()
  const result = spawnSync(process.execPath, [`scripts/${file}`], {
    encoding: 'utf8',
    timeout: 120000,
  })
  const entry = {
    file,
    exit: result.status,
    seconds: (Date.now() - started) / 1000,
    output: result.stdout,
    errors: result.stderr,
  }
  results.push(entry)
  console.log(`${entry.exit === 0 ? 'PASS' : 'FAIL'} ${file} (${entry.seconds}s)`)
}
writeFileSync('docs/phase-07-frontend-test-results.json', JSON.stringify(results, null, 2))
if (results.some((result) => result.exit !== 0)) process.exitCode = 1

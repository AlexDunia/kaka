import assert from 'node:assert/strict'
import { test } from 'node:test'
import { weeklySales, salesChart } from '../src/components/event-workspace/overviewModel.js'

test('groups Monday to Sunday across a year boundary, retaining ticket totals', () => {
  const weeks = weeklySales([
    { date: '2026-01-05', units_sold: 15 },
    { date: '2025-12-29', units_sold: 3 },
    { date: '2026-01-04', units_sold: 5 },
  ])
  assert.deepEqual(weeks, [
    { date: '2025-12-29', end_date: '2026-01-04', units_sold: 8 },
    { date: '2026-01-05', end_date: '2026-01-05', units_sold: 15 },
  ])
  assert.equal(
    weeks.reduce((sum, point) => sum + point.units_sold, 0),
    23,
  )
})

test('keeps zero-sale weeks and the current partial week', () => {
  assert.deepEqual(
    weeklySales([
      { date: '2026-11-02', units_sold: 3 },
      { date: '2026-11-18', units_sold: 5 },
    ]),
    [
      { date: '2026-11-02', end_date: '2026-11-08', units_sold: 3 },
      { date: '2026-11-09', end_date: '2026-11-15', units_sold: 0 },
      { date: '2026-11-16', end_date: '2026-11-18', units_sold: 5 },
    ],
  )
})

test('rejects invalid dates and clamps unusable counts without fake sales', () => {
  assert.deepEqual(weeklySales([]), [])
  assert.deepEqual(weeklySales([{ date: 'bad' }, { date: '2026-02-30', units_sold: 50 }]), [])
  const weeks = weeklySales([
    { date: '2026-03-29', units_sold: Infinity },
    { date: '2026-03-30', units_sold: -3 },
    { date: '2026-03-31', units_sold: '5' },
  ])
  assert.deepEqual(
    weeks.map((point) => point.units_sold),
    [0, 5],
  )
  assert.equal(weeks[0].date, '2026-03-23')
})

test('long histories remain bounded and their graph widens for horizontal scrolling', () => {
  const weeks = weeklySales([
    { date: '2000-01-01', units_sold: 7 },
    { date: '2026-11-28', units_sold: 15 },
  ])
  assert.equal(weeks.length, 158)
  const width = weeks.length * 96 + 64
  const graph = salesChart(weeks, width)
  assert.ok(graph.coordinates.at(-1).x > 600)
  assert.ok(graph.coordinates.at(-1).x < width - 40)
  assert.doesNotMatch(graph.line + graph.area, /NaN|Infinity/)
  assert.equal(graph.maximum, 16)
})

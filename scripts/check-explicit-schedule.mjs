import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp, reactive, ref, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import axios from 'axios'
import * as rules from '../src/utils/explicitSchedule.js'

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
const originalAdapter = axios.defaults.adapter
const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
}
globalThis.requestAnimationFrame = () => 0
try {
  const { useExplicitScheduleEditor } = await server.ssrLoadModule(
    '/src/composables/useExplicitScheduleEditor.js',
  )
  function setup(start = '2026-11-25', end = '2026-12-10') {
    const schedule = ref(rules.createExplicitSchedule())
    Object.assign(schedule.value.configurations.weekly, { startDate: start, endDateExclusive: end })
    const mutate = (change) => {
      const next = rules.cloneSchedule(schedule.value)
      change(next.configurations[next.activeMode])
      schedule.value = next
    }
    const editor = reactive(useExplicitScheduleEditor(schedule, mutate, ref('2026-11-25')))
    return {
      schedule,
      editor,
      get config() {
        return schedule.value.configurations[schedule.value.activeMode]
      },
    }
  }
  assert.equal(rules.rangeMaximum('2026-11-25', 'weekly'), '2027-11-25')
  const blank = rules.createExplicitSchedule()
  blank.configurations.weekly.drafts['2026-11-26'] = {
    slots: [{ startTime: '', endTime: '' }],
  }
  const wire = rules.scheduleWireValue(blank)
  assert.equal(wire.configurations.monthly.startDate, null)
  assert.equal(wire.configurations.weekly.drafts['2026-11-26'].slots[0].startTime, null)
  assert.deepEqual(rules.readExplicitSchedule(wire), blank)
  const malformed = rules.cloneSchedule(wire)
  malformed.configurations.weekly.drafts['2026-11-26'].slots = [null]
  assert.throws(() => rules.readExplicitSchedule(malformed), /could not read/)
  malformed.configurations.weekly.days = []
  assert.throws(() => rules.readExplicitSchedule(malformed), /could not read/)
  assert.equal(rules.rangeMaximum('2028-02-29', 'monthly'), '2029-02-28')
  assert.deepEqual(
    rules.scheduleMonths(
      { ...rules.emptyConfiguration(), startDate: '2026-11-25', endDateExclusive: '2026-12-01' },
      'weekly',
    ),
    ['2026-11'],
  )
  assert.ok(rules.rangeError({ startDate: '2026-11-25', endDateExclusive: '2026-11-25' }, 'weekly'))
  const journey = setup(),
    e = journey.editor
  e.load('2026-11-26')
  assert.deepEqual(journey.config.days['2026-11-26'].sessions, [])
  assert.equal(e.canSave, false)
  e.setTime(0, 'startTime', '09:30')
  e.setTime(0, 'endTime', '10:30')
  e.load('2026-11-28')
  assert.equal(
    journey.config.days['2026-11-26'].sessions[0].startTime,
    '09:30',
    'ordinary complete changes park automatically',
  )
  assert.equal(e.copySource, '2026-11-26')
  e.copyTimes()
  assert.equal(journey.config.sharedTemplate, null, 'one-off copy does not activate sharing')
  e.load('2026-11-29')
  e.load('2026-11-26')
  e.setShare(true)
  assert.equal(journey.config.sharedTemplate, null, 'V12 checkbox does not propagate before Save')
  assert.equal(journey.config.days['2026-11-29'].sessions.length, 0)
  assert.equal(e.inherited, false)
  e.park()
  assert.equal(journey.config.sharedTemplate, null, 'Done does not apply a pending bulk operation')
  assert.equal(journey.config.drafts['2026-11-26'].share, true)
  e.save()
  assert.equal(journey.config.days['2026-11-29'].inheritance, 'linked')
  e.load('2026-11-29')
  assert.equal(e.inherited, true)
  e.changeTime()
  assert.equal(e.slots[0].startTime, '')
  e.setTime(0, 'startTime', '14:00')
  e.setTime(0, 'endTime', '15:00')
  e.save()
  assert.equal(journey.config.days['2026-11-29'].inheritance, 'exception')
  e.load('2026-11-30')
  assert.equal(journey.config.days['2026-11-30'].sessions[0].startTime, '09:30')
  e.clearTimes()
  assert.equal(journey.config.days['2026-11-30'].inheritance, 'exception')
  assert.equal(
    journey.config.days['2026-11-30'].sessions.length,
    0,
    'explicit no-time exception persists',
  )
  e.load('2026-11-26')
  e.setTime(0, 'startTime', '10:00')
  e.setTime(0, 'endTime', '11:00')
  e.park()
  assert.equal(
    journey.config.days['2026-11-28'].sessions[0].startTime,
    '09:30',
    'shared source changes require explicit Save',
  )
  e.save()
  assert.equal(journey.config.days['2026-11-28'].sessions[0].startTime, '10:00')
  assert.equal(journey.config.days['2026-11-29'].sessions[0].startTime, '14:00')
  assert.equal(journey.config.days['2026-11-30'].sessions.length, 0)
  e.setShare(false)
  assert.ok(journey.config.sharedTemplate)
  e.save()
  assert.equal(journey.config.sharedTemplate, null)
  assert.equal(
    journey.config.days['2026-11-28'].sessions.length,
    1,
    'turning sharing off keeps copied sessions',
  )
  e.load('2026-12-01')
  assert.equal(journey.config.days['2026-12-01'].sessions.length, 0)
  e.setTime(0, 'startTime', '12:00')
  assert.equal(e.openTime.field, 'endTime', 'start time leads directly to end time')
  assert.equal(e.validateCompletion(), false, 'a partial time cannot be finished')
  assert.equal(e.showValidation, true)
  e.addTime()
  assert.equal(e.slots.length, 1, 'complete the current time before adding another')
  e.load('2026-12-02')
  assert.equal(journey.config.drafts['2026-12-01'].slots[0].startTime, '12:00')
  e.load('2026-12-01')
  assert.ok(e.error)
  e.setTime(0, 'endTime', '13:00')
  assert.equal(e.validateCompletion(), true)
  e.addTime()
  e.setTime(1, 'startTime', '13:00')
  e.setTime(1, 'endTime', '14:00')
  e.save()
  assert.equal(journey.config.days['2026-12-01'].sessions.length, 2, 'adjacent sessions are valid')
  e.removeTime(1)
  assert.equal(journey.config.days['2026-12-01'].sessions.length, 1)
  e.removeTime(0)
  assert.equal(journey.config.days['2026-12-01'].sessions.length, 0)
  e.removeDay()
  assert.ok(!journey.config.days['2026-12-01'])
  const repeat = setup('2027-07-01', '2027-08-01'),
    r = repeat.editor
  r.load('2027-07-08')
  r.setRepeat(true)
  assert.deepEqual(
    [...r.previewDates],
    ['2027-07-01', '2027-07-08', '2027-07-15', '2027-07-22', '2027-07-29'],
  )
  r.load('2027-07-09')
  assert.equal(
    Object.keys(repeat.config.days).length,
    2,
    'pending weekday repetition adds no dates',
  )
  r.load('2027-07-08')
  r.save()
  assert.equal(Object.keys(repeat.config.days).length, 6)
  assert.ok(!repeat.config.days['2027-08-05'], 'weekday repeat stays within the open month')
  const conflicts = setup(),
    c = conflicts.editor
  c.load('2026-11-26')
  c.setTime(0, 'startTime', '09:00')
  c.setTime(0, 'endTime', '10:00')
  c.save()
  c.load('2026-11-28')
  c.setTime(0, 'startTime', '12:00')
  c.setTime(0, 'endTime', '13:00')
  c.save()
  c.load('2026-11-26')
  c.setShare(true)
  assert.equal(c.save(), false)
  assert.equal(c.confirmation, true)
  assert.equal(conflicts.config.days['2026-11-28'].sessions[0].startTime, '12:00')
  c.save(true)
  assert.equal(conflicts.config.days['2026-11-28'].sessions[0].startTime, '09:00')
  c.removeTime(0)
  assert.equal(conflicts.config.sharedTemplate, null)
  assert.equal(
    conflicts.config.days['2026-11-28'].sessions.length,
    1,
    'removing a shared source preserves other days',
  )
  assert.ok(rules.sessionError([{ startTime: '22:00', endTime: '02:00' }]))
  assert.ok(
    rules.sessionError([
      { startTime: '09:00', endTime: '11:00' },
      { startTime: '10:00', endTime: '12:00' },
    ]),
  )
  const before = rules.cloneSchedule(journey.config)
  journey.schedule.value.configurations.weekly.endDateExclusive = '2026-11-28'
  assert.ok(!rules.scheduledDays(journey.config).includes('2026-11-29'))
  assert.ok(journey.config.days['2026-11-29'], 'range trimming retains local draft data')
  journey.schedule.value.configurations.weekly = before
  journey.schedule.value.activeMode = 'monthly'
  assert.equal(Object.keys(journey.config.days).length, 0, 'modes are isolated')
  journey.schedule.value.activeMode = 'weekly'
  assert.ok(journey.config.days['2026-11-29'])
  assert.ok(!rules.withinRange('2026-12-10', journey.config), 'end date is exclusive')
  assert.equal(rules.monthGrid('2027-02').filter(Boolean).length, 28)
  const { default: Editor } = await server.ssrLoadModule('/src/pages/CreateEvent.vue')
  let editorState
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: {} },
      { path: '/create-event', name: 'CreateEvent', component: {} },
      { path: '/find-events', name: 'find-events', component: {} },
    ],
  })
  await router.push('/create-event')
  const defaultApp = createSSRApp(Editor)
  defaultApp.use(createPinia()).use(router)
  let defaultState
  defaultApp.mixin({
    created() {
      if (this.$.type.__name === 'CreateEvent') defaultState = this.$.setupState
    },
  })
  const defaultHtml = await renderToString(defaultApp)
  assert.equal(defaultState.form.eventType, 'one_time')
  assert.ok(defaultHtml.includes('One-time') && defaultHtml.includes('Recurring'))
  assert.ok(!defaultHtml.includes('How often does your event run?'))
  assert.ok(defaultHtml.includes('When'), 'one-time date controls remain visible by default')
  const app = createSSRApp(Editor)
  app.use(createPinia()).use(router)
  const warnings = []
  app.config.warnHandler = (message) => warnings.push(message)
  app.mixin({
    created() {
      if (this.$.type.__name === 'CreateEvent') {
        editorState = this.$.setupState
        editorState.selectEventType('recurring')
      }
    },
  })
  const html = await renderToString(app)
  assert.ok(html.includes('How often does your event run?'))
  assert.ok(html.includes('Every week') && html.includes('Every month'))
  assert.ok(html.includes('Start date for weekly events'))
  assert.ok(html.includes('End date for weekly events'))
  assert.ok(!html.includes('Pick when your event starts and ends.'))
  assert.ok(!html.includes('Every day'))
  assert.ok(!html.includes('Your schedule'), 'overview waits for a valid period')
  assert.equal(editorState.form.startsAt, null)
  editorState.form.recurrence = rules.cloneSchedule(journey.schedule.value)
  editorState.selectEventType('one_time')
  editorState.selectEventType('recurring')
  assert.ok(
    editorState.form.recurrence.configurations.weekly.days['2026-11-29'],
    'off/on keeps both mode drafts',
  )
  assert.equal(editorState.form.startsAt, null)
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const service = await server.ssrLoadModule('/src/services/createEventService.js')
  const { sectionChanges } = await server.ssrLoadModule('/src/utils/eventEditorSections.js')
  const payload = service.buildCreateEventPayload(editorState.form)
  assert.equal(payload.recurrence.schemaVersion, 2)
  assert.equal(payload.startsAtLocal, null)
  assert.ok(sectionChanges({ startsAtLocal: '2027-01-01T10:00:00' }, 'details').startsAtLocal)
  let behavior = 'success'
  axios.defaults.adapter = async (config) => ({
    config,
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
  })
  api.defaults.adapter = async (config) => {
    const request = JSON.parse(config.data)
    assert.equal(request.recurrence.schemaVersion, 2)
    if (
      behavior === 'conflict' ||
      behavior === 'forbidden' ||
      behavior === 'unsupported' ||
      behavior === 'failure'
    )
      throw Object.assign(new Error('Request failed'), {
        response: {
          status: { conflict: 409, forbidden: 403, unsupported: 422, failure: 503 }[behavior],
          data: {},
        },
      })
    const returned =
      behavior === 'legacy' ? { frequency: 'weekly' } : rules.cloneSchedule(request.recurrence)
    if (behavior === 'partial') delete returned.configurations.weekly.days['2026-11-29']
    return {
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {
        data: { id: 70, version: 3, status: 'draft', form: { ...request, recurrence: returned } },
      },
    }
  }
  assert.equal((await service.createEventDraft(editorState.form)).data.id, 70)
  assert.equal(
    (await service.patchEvent(70, { recurrence: payload.recurrence }, 2)).data.version,
    3,
  )
  for (behavior of ['legacy', 'partial'])
    await assert.rejects(() => service.createEventDraft(editorState.form), /could not confirm/)
  for (behavior of ['conflict', 'forbidden', 'unsupported', 'failure'])
    await assert.rejects(() => service.createEventDraft(editorState.form))
  assert.ok(
    editorState.form.recurrence.configurations.weekly.days['2026-11-29'],
    'failed saves retain the editable schedule',
  )
  const { isScheduleNavigation } = await server.ssrLoadModule('/src/utils/routePresentation.js')
  assert.equal(
    isScheduleNavigation(
      {
        name: 'CreateEvent',
        path: '/create-event',
        query: { scheduleMonth: '2026-11', scheduleMode: 'weekly' },
      },
      { path: '/create-event', query: {} },
    ),
    true,
  )
  assert.equal(
    isScheduleNavigation(
      { name: 'dashboard-event', path: '/dashboard/events/70', query: { view: 'attendees' } },
      { path: '/dashboard/events/70', query: { view: 'edit' } },
    ),
    false,
  )
  const fullRange = rules.createExplicitSchedule()
  Object.assign(fullRange.configurations.weekly, {
    startDate: '2026-11-25',
    endDateExclusive: '2026-12-30',
  })
  assert.equal(rules.rangeError(fullRange.configurations.weekly, 'weekly'), '')
  const { default: Section } = await server.ssrLoadModule(
    '/src/components/recurring/RecurringEventSection.vue',
  )
  const rangeApp = createSSRApp(Section, { modelValue: fullRange, today: '2026-11-25' })
  rangeApp.use(router)
  let rangeState
  rangeApp.mixin({
    created() {
      if (this.$.type.__name === 'RecurringEventSection') rangeState = this.$.setupState
    },
  })
  const rangeHtml = await renderToString(rangeApp)
  assert.ok(rangeHtml.includes('Add days here'))
  assert.ok(
    !rangeHtml.includes('schedule-month-card'),
    'one picker replaces the external month cards',
  )
  rangeState.month = '2026-11'
  await rangeState.navigateMonth(1)
  assert.equal(rangeState.month, '2026-12')
  await rangeState.navigateMonth(1)
  assert.equal(rangeState.month, '2026-12', 'navigation stops at the overall end month')
  const { default: Search } = await server.ssrLoadModule(
    '/src/components/public/PublicEventSearch.vue',
  )
  let searchState,
    searches = 0
  const searchApp = createSSRApp(Search, { filters: true, onSearched: () => searches++ })
  searchApp.use(router)
  searchApp.mixin({
    created() {
      if (this.$.type.__name === 'PublicEventSearch') searchState = this.$.setupState
    },
  })
  await renderToString(searchApp)
  searchState.query = '  live music  '
  searchState.city = 'Lagos'
  searchState.category = '4'
  await searchState.search()
  assert.equal(router.currentRoute.value.name, 'find-events')
  assert.deepEqual(router.currentRoute.value.query, {
    q: 'live music',
    city: 'Lagos',
    category: '4',
  })
  assert.equal(router.currentRoute.value.hash, '#discover')
  await searchState.search()
  assert.equal(searches, 2, 'repeating the same search still dismisses header search')
  await nextTick()
  assert.deepEqual(warnings, [])
  console.log(
    'PASS V12 ranges, day-only selection, sessions, unfinished drafts, pending bulk saves, shared exceptions, removal, mode isolation, Vue integration and verified persistence contracts',
  )
} finally {
  axios.defaults.adapter = originalAdapter
  await server.close()
}

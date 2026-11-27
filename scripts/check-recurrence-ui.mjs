import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { default: Editor } = await server.ssrLoadModule('/src/pages/CreateEvent.vue')
  const { buildCreateEventPayload } = await server.ssrLoadModule('/src/services/createEventService.js')
  const { generateOccurrences, scheduleHasOverlap } = await server.ssrLoadModule('/src/utils/recurrenceSchedule.js')
  const warnings = []
  async function render(frequency, mode = 'on_date', type = 'recurring') {
    let state
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', name: 'home', component: {} }, { path: '/create-event', name: 'CreateEvent', component: {} }] })
    await router.push('/create-event')
    const app = createSSRApp(Editor)
    app.use(createPinia()).use(router)
    app.config.warnHandler = message => warnings.push(message)
    app.mixin({ created() {
      if (this.$.type.__name !== 'CreateEvent') return
      state = this.$.setupState
      state.form.startsAt = new Date(2027, 0, 26, 18, 0)
      state.form.endsAt = new Date(2027, 0, 26, 22, 0)
      // This regression suite exercises existing saved rule-based schedules.
      state.legacyScheduleLoaded = type === 'recurring'
      state.selectEventType(type)
      if (frequency) state.selectRepeatRhythm(frequency)
      state.setSeriesEndType(mode)
      state.form.recurrence.seriesEndDate = '2027-05-31'
      state.form.recurrence.occurrenceCount = 4
    } })
    return { html: await renderToString(app), state }
  }
  const initial = await render(null)
  assert.ok(initial.html.includes('How often?'))
  assert.ok(!initial.html.includes('Stop repeating'))
  assert.ok(!initial.html.includes('Select start date and time'))
  const daily = await render('daily')
  assert.ok(daily.html.indexOf('How often?') < daily.html.indexOf('id="recurring-start-date"'))
  assert.ok(!daily.html.includes('Repeat until'))
  assert.ok(!daily.html.includes('Stop repeating'))
  for (const id of ['recurring-start-date', 'recurring-end-date', 'recurring-start-time', 'recurring-end-time']) assert.ok(daily.html.includes(`id="${id}"`))
  assert.ok(daily.html.includes('6:00 PM to 10:00 PM'))
  assert.ok(!/[??]/.test(daily.state.formatTimeRange()))
  assert.ok(daily.html.includes('Your schedule'))
  assert.ok(!daily.html.includes('Which days?'))
  assert.ok(!daily.html.includes('First occurrence'))
  assert.ok(!daily.html.includes('Tickets use one event-wide'))
  const weekly = await render('weekly', 'after_occurrences')
  assert.ok(weekly.html.includes('Which days?'))
  assert.ok(!weekly.html.includes('Number of events'))
  assert.ok(!weekly.html.includes('Stop repeating'))
  assert.ok(!weekly.html.includes('Repeat until'))
  assert.ok(weekly.html.includes('Overall start date'))
  assert.ok(weekly.html.includes('Overall end date'))
  assert.ok(weekly.html.includes('Scheduled dates'))
  assert.equal(weekly.state.scheduleEndDate, '2027-02-16', 'saved count-based weekly ranges display their last scheduled date')
  assert.ok(!weekly.html.includes('id="repeat-end-date"'))
  const startDay = weekly.state.form.startsAt.getDay()
  assert.ok(weekly.state.form.recurrence.weeklyDays.includes(startDay))
  weekly.state.toggleWeeklyDay(startDay)
  assert.ok(weekly.state.form.recurrence.weeklyDays.includes(startDay), 'existing start-day rule stays intact')
  weekly.state.toggleWeeklyDay(5)
  assert.deepEqual([...weekly.state.form.recurrence.weeklyDays], [2, 5])
  assert.deepEqual(buildCreateEventPayload(weekly.state.form).recurrence, {
    frequency: 'weekly', weeklyDays: [2, 5], monthlyMode: 'day_of_month', dayOfMonth: null,
    nthWeekday: { ordinal: null, weekday: null }, seriesEndType: 'after_occurrences', seriesEndDate: null, occurrenceCount: 4,
  }, 'saved recurrence contract stays unchanged')
  const monthly = await render('monthly')
  assert.ok(monthly.html.includes('When each month?'))
  assert.ok(monthly.html.includes('Same date'))
  assert.ok(monthly.html.includes('Same weekday'))
  assert.equal(monthly.state.form.recurrence.dayOfMonth, 26)
  monthly.state.setMonthlyMode('nth_weekday')
  assert.equal(monthly.state.form.recurrence.nthWeekday.ordinal, 4)
  assert.equal(monthly.state.form.recurrence.nthWeekday.weekday, 2)
  const monthDates = generateOccurrences(monthly.state.form.startsAt, monthly.state.form.recurrence, 3)
  assert.deepEqual(monthDates.map(date => [date.getMonth(), date.getDate(), date.getHours()]), [[0, 26, 18], [1, 23, 18], [2, 23, 18]])
  const dailyDates = generateOccurrences(daily.state.form.startsAt, daily.state.form.recurrence, 3)
  assert.deepEqual(dailyDates.map(date => date.getDate()), [26, 27, 28])
  assert.equal(scheduleHasOverlap(daily.state.form.startsAt, new Date(2027, 0, 27, 18), daily.state.form.recurrence), true)
  daily.state.form.recurrence.seriesEndDate = '2027-01-25'
  assert.equal(daily.state.seriesEndValid, false)
  weekly.state.form.recurrence.occurrenceCount = 0
  assert.equal(weekly.state.seriesEndValid, false)
  const legacyDaily = await render('daily', 'after_occurrences')
  assert.equal(legacyDaily.state.scheduleEndDate, '2027-01-29')
  assert.equal(buildCreateEventPayload(legacyDaily.state.form).recurrence.seriesEndType, 'after_occurrences', 'opening a saved daily schedule does not rewrite its end rule')
  const dailyRange = (await render('daily')).state
  dailyRange.scheduleStartDate = '2027-02-01'
  dailyRange.scheduleEndDate = '2027-02-03'
  let payload = buildCreateEventPayload(dailyRange.form)
  assert.equal(payload.startsAtLocal, '2027-02-01T18:00:00')
  assert.equal(payload.endsAtLocal, '2027-02-01T22:00:00', 'the overall end date never becomes one multi-day event')
  assert.equal(payload.recurrence.seriesEndDate, '2027-02-03')
  assert.equal(payload.recurrence.seriesEndType, 'on_date')
  assert.deepEqual(generateOccurrences(dailyRange.form.startsAt, dailyRange.form.recurrence, 5).map(date => date.getDate()), [1, 2, 3])
  dailyRange.scheduleEndDate = '2027-02-01'
  assert.equal(generateOccurrences(dailyRange.form.startsAt, dailyRange.form.recurrence, 5).length, 1, 'same-day ranges include one event')
  dailyRange.scheduleEndTime = '02:00'
  payload = buildCreateEventPayload(dailyRange.form)
  assert.equal(payload.endsAtLocal, '2027-02-02T02:00:00', 'overnight durations remain supported')
  assert.equal(dailyRange.recurrenceOverlaps, false)
  dailyRange.scheduleStartTime = ''
  assert.equal(dailyRange.form.startsAt, null)
  assert.equal(dailyRange.scheduleStartDate, '2027-02-01', 'clearing a time preserves the date for correction')
  dailyRange.scheduleStartTime = '19:00'
  assert.equal(buildCreateEventPayload(dailyRange.form).startsAtLocal, '2027-02-01T19:00:00')
  dailyRange.scheduleEndTime = '19:00'
  assert.equal(dailyRange.form.endsAt.getTime(), dailyRange.form.startsAt.getTime(), 'equal times are left invalid rather than inventing a duration')
  dailyRange.scheduleStartDate = '2020-01-01'
  assert.ok(dailyRange.errors.startsAt, 'native daily inputs retain the existing future-start rule')
  const weeklyRange = (await render('weekly')).state
  weeklyRange.scheduleStartDate = '2027-02-01'
  weeklyRange.form.recurrence.weeklyDays = [1, 3]
  weeklyRange.scheduleEndDate = '2027-02-10'
  const weeklyPayload = buildCreateEventPayload(weeklyRange.form)
  assert.equal(weeklyPayload.startsAtLocal, '2027-02-01T18:00:00')
  assert.equal(weeklyPayload.endsAtLocal, '2027-02-01T22:00:00')
  assert.equal(weeklyPayload.recurrence.seriesEndDate, '2027-02-10')
  assert.deepEqual(generateOccurrences(weeklyRange.form.startsAt, weeklyRange.form.recurrence, 10).map(date => date.getDate()), [1, 3, 8, 10])
  weeklyRange.scheduleEndDate = '2027-01-31'
  assert.equal(weeklyRange.seriesEndValid, false)
  const { default: Calendar } = await server.ssrLoadModule('/src/components/WeeklyScheduleCalendar.vue')
  async function renderCalendar(props) {
    let state
    const app = createSSRApp(Calendar, props)
    app.config.warnHandler = message => warnings.push(message)
    app.mixin({ created() { if (this.$.type.__name === 'WeeklyScheduleCalendar') state = this.$.setupState } })
    return { html: await renderToString(app), state }
  }
  const calendar = await renderCalendar({ startDate: '2027-02-01', endDate: '2027-03-10', weekdays: [1, 3], timeLabel: '6:00 PM to 10:00 PM' })
  assert.ok(calendar.html.includes('February 2027'))
  assert.equal(calendar.state.eventCount, 8)
  assert.deepEqual(calendar.state.cells.filter(day => day?.scheduled).map(day => day.day), [1, 3, 8, 10, 15, 17, 22, 24])
  calendar.state.changeMonth(-1)
  assert.equal(calendar.state.month, calendar.state.firstMonth, 'calendar cannot navigate before the overall start')
  calendar.state.changeMonth(1)
  assert.equal(calendar.state.monthLabel, 'March 2027')
  assert.equal(calendar.state.eventCount, 4)
  calendar.state.changeMonth(1)
  assert.equal(calendar.state.month, calendar.state.lastMonth, 'calendar cannot navigate beyond the overall end')
  const changedDays = await renderCalendar({ startDate: '2027-02-01', endDate: '2027-02-10', weekdays: [2] })
  assert.deepEqual(changedDays.state.cells.filter(day => day?.scheduled).map(day => day.day), [2, 9])
  const invalidRange = await renderCalendar({ startDate: '2027-02-10', endDate: '2027-02-01', weekdays: [1] })
  assert.equal(invalidRange.state.cells.length, 0)
  assert.ok(invalidRange.html.includes('Choose an overall start date'))
  const oneTime = await render(null, 'on_date', 'one_time')
  assert.ok(!oneTime.html.includes('How often?'))
  assert.ok(oneTime.html.includes('Select start date and time'))
  assert.deepEqual(warnings, [])
  console.log('PASS recurring controls, weekly calendar/navigation, overall date ranges, daily/weekly/monthly schedules, invalid input, overlap and unchanged payload')
} finally {
  await server.close()
}

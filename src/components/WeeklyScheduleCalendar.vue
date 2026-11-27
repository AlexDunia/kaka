<script setup>
import { computed, ref, watch } from 'vue'
import { WEEKDAYS, generateOccurrences } from '@/utils/recurrenceSchedule'
import { toLocalDateTimeString } from '@/utils/eventDateTime'

const props = defineProps({
  startDate: String,
  endDate: String,
  weekdays: { type: Array, default: () => [] },
  timeLabel: String,
})
const month = ref(0)
function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}
const start = computed(() => parseDate(props.startDate))
const end = computed(() => parseDate(props.endDate))
const validRange = computed(() => start.value && end.value && end.value >= start.value)
const monthNumber = date => date.getFullYear() * 12 + date.getMonth()
const firstMonth = computed(() => start.value ? monthNumber(start.value) : 0)
const lastMonth = computed(() => end.value ? monthNumber(end.value) : 0)
watch(() => [props.startDate, props.endDate], ([startDate], old) => {
  if (!validRange.value) return
  month.value = !old || startDate !== old[0] ? firstMonth.value : Math.min(lastMonth.value, Math.max(firstMonth.value, month.value))
}, { immediate: true })
const monthDate = computed(() => new Date(Math.floor(month.value / 12), month.value % 12, 1))
const monthLabel = computed(() => new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' }).format(monthDate.value))
const scheduledDays = computed(() => {
  if (!validRange.value) return new Set()
  const first = monthDate.value
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  const from = start.value > first ? start.value : first
  const until = end.value < last ? end.value : last
  const occurrences = generateOccurrences(from, {
    frequency: 'weekly',
    weeklyDays: props.weekdays,
    seriesEndType: 'on_date',
    seriesEndDate: toLocalDateTimeString(until).slice(0, 10),
  }, 31)
  return new Set(occurrences.map(date => date.getDate()))
})
const cells = computed(() => {
  if (!validRange.value) return []
  const first = monthDate.value
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const length = Math.ceil((first.getDay() + lastDay) / 7) * 7
  return Array.from({ length }, (_, index) => {
    const day = index - first.getDay() + 1
    if (day < 1 || day > lastDay) return null
    const date = new Date(first.getFullYear(), first.getMonth(), day)
    const scheduled = scheduledDays.value.has(day)
    const label = new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
    return { day, scheduled, label: scheduled ? `${label}, event ${props.timeLabel || ''}`.trim() : label }
  })
})
const weeks = computed(() => Array.from({ length: cells.value.length / 7 }, (_, row) => cells.value.slice(row * 7, row * 7 + 7)))
const eventCount = computed(() => cells.value.filter(day => day?.scheduled).length)
function changeMonth(offset) {
  month.value = Math.min(lastMonth.value, Math.max(firstMonth.value, month.value + offset))
}
</script>

<template>
  <section class="weekly-calendar" aria-label="Weekly schedule preview">
    <h3>Scheduled dates</h3>
    <p class="calendar-help">Highlighted dates follow your selected weekdays. Change the days above to update your schedule.</p>
    <template v-if="validRange">
      <div class="calendar-month">
        <button type="button" :disabled="month <= firstMonth" aria-label="Previous month" @click="changeMonth(-1)">Previous</button>
        <strong aria-live="polite">{{ monthLabel }}</strong>
        <button type="button" :disabled="month >= lastMonth" aria-label="Next month" @click="changeMonth(1)">Next</button>
      </div>
      <table :aria-label="monthLabel">
        <thead><tr><th v-for="day in WEEKDAYS" :key="day.value" scope="col" :aria-label="day.label">{{ day.short }}</th></tr></thead>
        <tbody>
          <tr v-for="(week, row) in weeks" :key="row">
            <td v-for="(day, column) in week" :key="column">
              <span v-if="day" class="calendar-date" :class="{ 'is-event': day.scheduled }" :aria-label="day.label">{{ day.day }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="calendar-help" role="status">{{ eventCount }} {{ eventCount === 1 ? 'event' : 'events' }} this month<span v-if="eventCount && timeLabel">, {{ timeLabel }}</span>.</p>
    </template>
    <p v-else class="calendar-help">Choose an overall start date and end date to see your scheduled dates.</p>
  </section>
</template>

<style scoped>
.weekly-calendar { margin-top: var(--ds-space-16); padding: var(--ds-space-16); border: 1px solid var(--ds-color-border-card); border-radius: var(--ds-radius-card); background: var(--ds-color-surface); }
.weekly-calendar h3 { margin: 0 0 var(--ds-space-8); color: var(--ds-color-text); font: var(--ds-weight-semibold) var(--ds-size-body)/1.5 var(--ds-font-body); }
.calendar-help { margin: var(--ds-space-8) 0; color: var(--ds-color-text-secondary); font-size: var(--ds-size-small); line-height: 1.6; }
.calendar-month { display: flex; align-items: center; justify-content: space-between; gap: var(--ds-space-8); margin: var(--ds-space-16) 0; }
.calendar-month button { min-height: 44px; padding: 8px; border: 1px solid var(--ds-color-border-control); border-radius: var(--ds-radius-control); background: var(--ds-color-surface); color: var(--ds-color-text); font: inherit; font-size: var(--ds-size-small); cursor: pointer; }
.calendar-month button:disabled { opacity: .5; cursor: default; }
.calendar-month strong { color: var(--ds-color-text); font-size: var(--ds-size-small); text-align: center; }
.weekly-calendar table { width: 100%; border-collapse: separate; border-spacing: 2px; table-layout: fixed; }
.weekly-calendar th { padding: 8px 0; font-size: var(--ds-size-small); color: var(--ds-color-text-secondary); text-align: center; }
.weekly-calendar td { border: 0; padding: 2px; text-align: center; }
.calendar-date { display: flex; min-height: 36px; align-items: center; justify-content: center; border: 1px solid transparent; border-radius: var(--ds-radius-control); color: var(--ds-color-text-secondary); font-size: var(--ds-size-small); }
.calendar-date.is-event { border-color: var(--ds-color-selection-border); background: var(--ds-color-selection-soft); color: var(--ds-color-text); font-weight: var(--ds-weight-semibold); }
@media (max-width: 420px) { .weekly-calendar { padding: var(--ds-space-8); } .weekly-calendar td { padding: 0; } }
</style>

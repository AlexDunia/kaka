<script setup>
import { computed, ref } from 'vue'
import { formatScheduleDate, monthGrid } from '@/utils/explicitSchedule'
const props = defineProps({
  month: String,
  minimum: String,
  maximum: String,
  days: { type: Object, default: () => ({}) },
  drafts: { type: Object, default: () => ({}) },
  active: String,
  preview: { type: Array, default: () => [] },
})
const emit = defineEmits(['select'])
const root = ref(null)
const cells = computed(() => monthGrid(props.month))
const previewDays = computed(() => new Set(props.preview))
const allowed = (date) =>
  date && (!props.minimum || date >= props.minimum) && (!props.maximum || date <= props.maximum)
function move(event, index) {
  const offsets = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
    Home: -(index % 7),
    End: 6 - (index % 7),
  }
  if (!(event.key in offsets)) return
  event.preventDefault()
  const target = root.value?.querySelector(
    `[data-cell="${index + offsets[event.key]}"]:not(:disabled)`,
  )
  target?.focus()
}
</script>
<template>
  <div
    ref="root"
    class="schedule-calendar"
    role="group"
    :aria-label="formatScheduleDate(`${month}-01`, { month: 'long', year: 'numeric' })"
  >
    <div class="schedule-week" aria-hidden="true">
      <span v-for="day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="day">{{
        day
      }}</span>
    </div>
    <div class="schedule-grid">
      <template v-for="(date, index) in cells" :key="index">
        <button
          v-if="date"
          type="button"
          :data-cell="index"
          :disabled="!allowed(date)"
          :aria-pressed="Boolean(days[date])"
          :aria-label="`${formatScheduleDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${drafts[date] ? ', unfinished times' : days[date] ? `, day added${days[date].sessions.length ? `, ${days[date].sessions.length} times` : ', no time selected'}` : ''}`"
          :class="{
            'is-added': days[date],
            'is-active': active === date,
            'is-preview': previewDays.has(date),
          }"
          @click="emit('select', date)"
          @keydown="move($event, index)"
        >
          <span>{{ Number(date.slice(-2)) }}</span
          ><small v-if="drafts[date]">Unfinished</small
          ><small v-else-if="days[date]">{{
            days[date].sessions.length ? `${days[date].sessions.length} times` : 'Added'
          }}</small>
        </button>
        <span v-else aria-hidden="true"></span>
      </template>
    </div>
  </div>
</template>

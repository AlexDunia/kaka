<template>
  <Transition name="rh-popup" appear><div data-popup-overlay v-if="isOpen" class="date-picker-overlay" @click.self="close">
    <div data-popup-panel class="date-picker-modal">
      <div class="date-picker-header">
        <h3>Select Date</h3>
        <button type="button" class="date-picker-close" @click="close">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          ><image :href="pngIconUrl('close')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
        </button>
      </div>
      <div class="date-picker-body">
        <div class="calendar-header">
          <button
            type="button"
            class="month-nav-btn"
            @click="previousMonth"
            :disabled="isPreviousMonthDisabled"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            ><image :href="pngIconUrl('back')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
          </button>
          <span class="current-month-year">{{ currentMonthYear }}</span>
          <button type="button" class="month-nav-btn" @click="nextMonth">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            ><image :href="pngIconUrl('next')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
          </button>
        </div>

        <div class="calendar-grid">
          <div class="weekdays">
            <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
          </div>
          <div class="days">
            <div
              v-for="{ date, isCurrentMonth, isToday, isSelected, isDisabled } in calendarDays"
              :key="date.toISOString()"
              class="day"
              :class="{
                'other-month': !isCurrentMonth,
                today: isToday,
                selected: isSelected,
                disabled: isDisabled,
              }"
              @click="selectDate(date, isDisabled)"
            >
              {{ date.getDate() }}
            </div>
          </div>
        </div>
      </div>
      <div class="date-picker-actions">
        <button type="button" class="date-picker-btn date-picker-cancel" @click="close">
          Cancel
        </button>
        <button type="button" class="date-picker-btn date-picker-apply" @click="apply">
          Apply
        </button>
      </div>
    </div>
  </div></Transition>
</template>

<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  initialDate: {
    type: Date,
    default: () => new Date(),
  },
  minDate: {
    type: Date,
    default: null,
  },
  maxDate: {
    type: Date,
    default: null,
  },
})

const emit = defineEmits(['close', 'update:date', 'apply'])

const selectedDate = ref(new Date(props.initialDate))
const currentMonth = ref(new Date(props.initialDate).getMonth())
const currentYear = ref(new Date(props.initialDate).getFullYear())

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Computed properties
const currentMonthYear = computed(() => {
  return `${monthNames[currentMonth.value]} ${currentYear.value}`
})

const isPreviousMonthDisabled = computed(() => {
  if (!props.minDate) return false

  const firstDayOfCurrentMonth = new Date(currentYear.value, currentMonth.value, 1)
  return firstDayOfCurrentMonth <= props.minDate
})

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)

  // Get the previous month's days that should appear in this month's calendar
  const dayOfWeek = firstDay.getDay()
  const previousMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()

  for (let i = dayOfWeek - 1; i >= 0; i--) {
    const date = new Date(currentYear.value, currentMonth.value - 1, previousMonthLastDay - i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, selectedDate.value),
      isDisabled: isDateDisabled(date),
    })
  }

  // Current month's days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(currentYear.value, currentMonth.value, i)
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, selectedDate.value),
      isDisabled: isDateDisabled(date),
    })
  }

  // Next month's days to fill out the calendar grid
  const remainingDays = 42 - days.length // 6 rows x 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(currentYear.value, currentMonth.value + 1, i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, selectedDate.value),
      isDisabled: isDateDisabled(date),
    })
  }

  return days
})

// Watch for external changes
watch(
  () => props.initialDate,
  (newDate) => {
    selectedDate.value = new Date(newDate)
    currentMonth.value = newDate.getMonth()
    currentYear.value = newDate.getFullYear()
  },
)

// Methods
function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}

function isDateDisabled(date) {
  if (props.minDate && date < props.minDate) return true
  if (props.maxDate && date > props.maxDate) return true
  return false
}

function selectDate(date, isDisabled) {
  if (isDisabled) return
  selectedDate.value = new Date(date)
}

function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function close() {
  emit('close')
}

function apply() {
  emit('update:date', selectedDate.value)
  emit('apply', selectedDate.value)
  close()
}

// If the initialDate is provided, use it
if (props.initialDate) {
  selectedDate.value = new Date(props.initialDate)
  currentMonth.value = selectedDate.value.getMonth()
  currentYear.value = selectedDate.value.getFullYear()
}
</script>

<style scoped>
/* Date Picker Modal */
.date-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.date-picker-modal {
  width: 320px;
  background-color: var(--color-surface);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-subtle);
  overflow: hidden;
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.date-picker-header h3 {
  font-size: 18px;
  font-weight: 500;
  color:var(--color-text);
  margin: 0;
  letter-spacing: 0.3px;
}

.date-picker-close {
  background: none;
  border: none;
  color:var(--color-muted);
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.date-picker-close:hover {
  color: var(--color-text);
  background-color: var(--color-surface-soft);
}

.date-picker-body {
  padding: 20px;
}

/* Calendar */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.month-nav-btn {
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.month-nav-btn:hover:not(:disabled) {
  background-color: var(--color-surface-soft);
  color: var(--color-text);
}

.month-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.current-month-year {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
}

.calendar-grid {
  margin-top: 10px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 10px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color:var(--color-muted);
  padding: 8px 0;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color:var(--color-muted);
  position: relative;
}

.day:hover:not(.disabled) {
  background-color: var(--color-surface-soft);
  transform: translateY(-2px);
}

.day.other-month {
  color:var(--color-muted);
}

.day.today {
  font-weight: 600;
  color: #e94b9f;
}

.day.today::after {
  content: '';
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #e94b9f;
}

.day.selected {
  background-color: rgba(233, 75, 159, 0.15);
  border: 1px solid rgba(233,75,159,0.165);
  color: var(--color-text);
  font-weight: 500;
}

.day.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.date-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
}

.date-picker-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.date-picker-cancel {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color:var(--color-muted);
}

.date-picker-cancel:hover {
  background-color: var(--color-surface-soft);
  color: var(--color-text);
}

.date-picker-apply {
  background-color: rgba(233, 75, 159, 0.15);
  border: 1px solid rgba(233,75,159,0.165);
  color: var(--color-on-action);
}

.date-picker-apply:hover {
  background-color: rgba(233, 75, 159, 0.25);
  transform: translateY(-2px);
}

@keyframes modalSlideIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>

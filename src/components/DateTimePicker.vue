<template>
  <div class="datetime-picker">
    <div class="datetime-picker-header">
      <h3>{{ title }}</h3>
      <button @click="$emit('close')" class="close-btn">
        <span>&times;</span>
      </button>
    </div>

    <div class="datetime-picker-tabs">
      <button @click="activeTab = 'date'" :class="{ active: activeTab === 'date' }">Date</button>
      <button @click="activeTab = 'time'" :class="{ active: activeTab === 'time' }">Time</button>
    </div>

    <div v-if="activeTab === 'date'" class="date-picker-container">
      <div class="calendar-header">
        <button @click="prevMonth" class="nav-btn">&lt;</button>
        <span>{{ monthYearDisplay }}</span>
        <button @click="nextMonth" class="nav-btn">&gt;</button>
      </div>

      <div class="calendar-weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
      </div>

      <div class="calendar-days">
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="day-cell"
          :class="{
            empty: !day.inMonth,
            today: day.isToday,
            selected: day.isSelected,
            disabled: day.isDisabled,
          }"
          @click="!day.isDisabled && selectDate(day.date)"
        >
          <span v-if="day.inMonth">{{ day.day }}</span>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'time'" class="time-picker-container">
      <div class="time-inputs">
        <div class="time-input-group">
          <label>Hours</label>
          <div class="time-buttons">
            <button @click="incrementHours" class="time-btn">+</button>
            <span>{{ formattedHours }}</span>
            <button @click="decrementHours" class="time-btn">-</button>
          </div>
        </div>

        <div class="time-separator">:</div>

        <div class="time-input-group">
          <label>Minutes</label>
          <div class="time-buttons">
            <button @click="incrementMinutes" class="time-btn">+</button>
            <span>{{ formattedMinutes }}</span>
            <button @click="decrementMinutes" class="time-btn">-</button>
          </div>
        </div>

        <div v-if="use12HourFormat" class="time-input-group">
          <label>AM/PM</label>
          <div class="ampm-toggle">
            <button @click="setPeriod('AM')" :class="{ active: period === 'AM' }">AM</button>
            <button @click="setPeriod('PM')" :class="{ active: period === 'PM' }">PM</button>
          </div>
        </div>
      </div>
    </div>

    <div class="datetime-picker-actions">
      <button @click="$emit('close')" class="cancel-btn">Cancel</button>
      <button @click="applySelection" class="apply-btn">Apply</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Select Date & Time',
  },
  initialDateTime: {
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
  use12HourFormat: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:dateTime', 'close'])

// State
const activeTab = ref('date')
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const selectedDate = ref(new Date(props.initialDateTime))
const hours = ref(props.initialDateTime.getHours())
const minutes = ref(props.initialDateTime.getMinutes())
const period = ref(hours.value >= 12 ? 'PM' : 'AM')

// Computed Properties
const weekDays = computed(() => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'])

const monthYearDisplay = computed(() => {
  const options = { month: 'long', year: 'numeric' }
  return new Date(currentYear.value, currentMonth.value).toLocaleDateString(undefined, options)
})

const calendarDays = computed(() => {
  const days = []
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Previous month days
  const prevMonthDays = new Date(currentYear.value, currentMonth.value, 0).getDate()
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const date = new Date(currentYear.value, currentMonth.value - 1, prevMonthDays - i)
    days.push({
      day: prevMonthDays - i,
      date,
      inMonth: false,
      isToday: false,
      isSelected: isSameDay(date, selectedDate.value),
      isDisabled: isDateDisabled(date),
    })
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentYear.value, currentMonth.value, i)
    days.push({
      day: i,
      date,
      inMonth: true,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate.value),
      isDisabled: isDateDisabled(date),
    })
  }

  // Next month days
  const daysNeeded = 42 - days.length
  for (let i = 1; i <= daysNeeded; i++) {
    const date = new Date(currentYear.value, currentMonth.value + 1, i)
    days.push({
      day: i,
      date,
      inMonth: false,
      isToday: false,
      isSelected: isSameDay(date, selectedDate.value),
      isDisabled: isDateDisabled(date),
    })
  }

  return days
})

const formattedHours = computed(() => {
  if (props.use12HourFormat) {
    let h = hours.value % 12
    return h === 0 ? 12 : h < 10 ? '0' + h : h
  }
  return hours.value < 10 ? '0' + hours.value : hours.value
})

const formattedMinutes = computed(() => {
  return minutes.value < 10 ? '0' + minutes.value : minutes.value
})

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

function prevMonth() {
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

function selectDate(date) {
  const newDate = new Date(date)
  newDate.setHours(hours.value, minutes.value, 0, 0)
  selectedDate.value = newDate
}

function incrementHours() {
  if (props.use12HourFormat) {
    hours.value = (hours.value + 1) % 12
    if (hours.value === 0) hours.value = 12
  } else {
    hours.value = (hours.value + 1) % 24
  }
  updateSelectedDateTime()
}

function decrementHours() {
  if (props.use12HourFormat) {
    hours.value = (hours.value - 1 + 12) % 12
    if (hours.value === 0) hours.value = 12
  } else {
    hours.value = (hours.value - 1 + 24) % 24
  }
  updateSelectedDateTime()
}

function incrementMinutes() {
  minutes.value = (minutes.value + 5) % 60
  updateSelectedDateTime()
}

function decrementMinutes() {
  minutes.value = (minutes.value - 5 + 60) % 60
  updateSelectedDateTime()
}

function setPeriod(newPeriod) {
  if (period.value !== newPeriod) {
    period.value = newPeriod
    if (newPeriod === 'AM' && hours.value >= 12) {
      hours.value -= 12
    } else if (newPeriod === 'PM' && hours.value < 12) {
      hours.value += 12
    }
    updateSelectedDateTime()
  }
}

function updateSelectedDateTime() {
  const newDateTime = new Date(selectedDate.value)
  let h = hours.value
  if (props.use12HourFormat && period.value === 'PM' && h < 12) {
    h += 12
  } else if (props.use12HourFormat && period.value === 'AM' && h === 12) {
    h = 0
  }
  newDateTime.setHours(h, minutes.value, 0, 0)
  selectedDate.value = newDateTime
}

function applySelection() {
  emit('update:dateTime', selectedDate.value)
  emit('close')
}

// Initialize
onMounted(() => {
  if (props.initialDateTime) {
    currentMonth.value = props.initialDateTime.getMonth()
    currentYear.value = props.initialDateTime.getFullYear()
    selectedDate.value = new Date(props.initialDateTime)
    hours.value = props.initialDateTime.getHours()
    minutes.value = props.initialDateTime.getMinutes()
    period.value = hours.value >= 12 ? 'PM' : 'AM'

    if (props.use12HourFormat && hours.value > 12) {
      hours.value = hours.value % 12
    }
    if (props.use12HourFormat && hours.value === 0) {
      hours.value = 12
    }
  }
})

// Watch for prop changes
watch(
  () => props.initialDateTime,
  (newValue) => {
    if (newValue) {
      currentMonth.value = newValue.getMonth()
      currentYear.value = newValue.getFullYear()
      selectedDate.value = new Date(newValue)
      hours.value = newValue.getHours()
      minutes.value = newValue.getMinutes()
      period.value = hours.value >= 12 ? 'PM' : 'AM'

      if (props.use12HourFormat && hours.value > 12) {
        hours.value = hours.value % 12
      }
      if (props.use12HourFormat && hours.value === 0) {
        hours.value = 12
      }
    }
  },
)
</script>

<style scoped>
.datetime-picker {
  width: 320px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.datetime-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.datetime-picker-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  color: #666;
  cursor: pointer;
}

.datetime-picker-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.datetime-picker-tabs button {
  flex: 1;
  background: none;
  border: none;
  padding: 12px;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.datetime-picker-tabs button.active {
  color: #4a6cf7;
  font-weight: 500;
}

.datetime-picker-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #4a6cf7;
}

.date-picker-container,
.time-picker-container {
  padding: 15px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
}

.nav-btn:hover {
  background-color: #f0f0f0;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 10px;
}

.weekday {
  text-align: center;
  font-size: 13px;
  color: #888;
  padding: 5px 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  border-radius: 50%;
}

.day-cell.empty {
  color: #ccc;
  cursor: default;
}

.day-cell:not(.empty):not(.disabled):hover {
  background-color: #f0f0f0;
}

.day-cell.today {
  font-weight: bold;
  color: #4a6cf7;
}

.day-cell.selected {
  background-color: #4a6cf7;
  color: white;
}

.day-cell.disabled {
  color: #ddd;
  cursor: not-allowed;
}

.time-picker-container {
  padding: 20px;
}

.time-inputs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time-input-group label {
  font-size: 12px;
  color: #888;
  margin-bottom: 5px;
}

.time-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.time-buttons span {
  font-size: 18px;
  font-weight: 500;
  width: 40px;
  text-align: center;
}

.time-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background-color: #f5f5f5;
  color: #666;
  cursor: pointer;
}

.time-btn:hover {
  background-color: #e0e0e0;
}

.time-separator {
  font-size: 24px;
  font-weight: 300;
  margin: 0 5px;
  padding-top: 20px;
}

.ampm-toggle {
  display: flex;
  gap: 5px;
}

.ampm-toggle button {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: none;
  cursor: pointer;
  border-radius: 4px;
}

.ampm-toggle button.active {
  background-color: #4a6cf7;
  color: white;
  border-color: #4a6cf7;
}

.datetime-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn,
.apply-btn {
  padding: 8px 15px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.apply-btn {
  background-color: #4a6cf7;
  color: white;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.apply-btn:hover {
  background-color: #3755d8;
}
</style>

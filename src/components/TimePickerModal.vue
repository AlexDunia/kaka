<template>
  <div v-if="isOpen" class="time-picker-overlay" @click.self="close">
    <div class="time-picker-modal">
      <div class="time-picker-header">
        <h3>Select Time</h3>
        <button type="button" class="time-picker-close" @click="close">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M6 6L18 18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      <div class="time-picker-body">
        <!-- Custom time input -->
        <div class="custom-time-input">
          <div class="time-input-group">
            <input
              type="number"
              v-model="hours"
              min="1"
              max="12"
              class="time-input-field"
              @dblclick="$event.target.select()"
            />
            <span class="time-divider">:</span>
            <input
              type="number"
              v-model="minutes"
              min="0"
              max="59"
              class="time-input-field"
              @dblclick="$event.target.select()"
            />
          </div>
          <div class="time-input-note">Double-tap to edit</div>
        </div>

        <div class="time-picker-grid">
          <div
            v-for="time in timeOptions"
            :key="time"
            class="time-option"
            :class="{ selected: selectedTime === time }"
            @click="selectTime(time)"
          >
            {{ time }}
          </div>
        </div>
        <div class="time-period-selector">
          <button
            type="button"
            class="time-period-btn"
            :class="{ selected: period === 'AM' }"
            @click="selectPeriod('AM')"
          >
            AM
          </button>
          <button
            type="button"
            class="time-period-btn"
            :class="{ selected: period === 'PM' }"
            @click="selectPeriod('PM')"
          >
            PM
          </button>
        </div>
      </div>
      <div class="time-picker-actions">
        <button type="button" class="time-picker-btn time-picker-cancel" @click="close">
          Cancel
        </button>
        <button type="button" class="time-picker-btn time-picker-apply" @click="apply">
          Apply
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  initialTime: {
    type: String,
    default: '07:00',
  },
  initialPeriod: {
    type: String,
    default: 'AM',
  },
})

const emit = defineEmits(['close', 'update:time', 'update:period', 'apply'])

const selectedTime = ref(props.initialTime)
const period = ref(props.initialPeriod)

// Custom time input variables
const hours = ref(props.initialTime.split(':')[0])
const minutes = ref(props.initialTime.split(':')[1])

// Available time options
const timeOptions = [
  '01:00',
  '01:30',
  '02:00',
  '02:30',
  '03:00',
  '03:30',
  '04:00',
  '04:30',
  '05:00',
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
]

// Watch for changes to custom hours/minutes and update selectedTime
watch([hours, minutes], ([newHours, newMinutes]) => {
  // Validate and format hours
  let formattedHours = parseInt(newHours) || 1
  if (formattedHours < 1) formattedHours = 1
  if (formattedHours > 12) formattedHours = 12

  // Validate and format minutes
  let formattedMinutes = parseInt(newMinutes) || 0
  if (formattedMinutes < 0) formattedMinutes = 0
  if (formattedMinutes > 59) formattedMinutes = 59

  // Update the ref values with formatted strings
  hours.value = formattedHours.toString().padStart(2, '0')
  minutes.value = formattedMinutes.toString().padStart(2, '0')

  // Update selectedTime with formatted values
  selectedTime.value = `${formattedHours.toString().padStart(2, '0')}:${formattedMinutes.toString().padStart(2, '0')}`
})

// Update custom time input fields when selectedTime changes
watch(selectedTime, (newTime) => {
  const [newHours, newMinutes] = newTime.split(':')
  hours.value = newHours
  minutes.value = newMinutes
})

// Watch props for external changes
watch(
  () => props.initialTime,
  (newTime) => {
    selectedTime.value = newTime
    const [newHours, newMinutes] = newTime.split(':')
    hours.value = newHours
    minutes.value = newMinutes
  },
)

watch(
  () => props.initialPeriod,
  (newPeriod) => {
    period.value = newPeriod
  },
)

// Methods
const selectTime = (time) => {
  selectedTime.value = time
}

const selectPeriod = (newPeriod) => {
  period.value = newPeriod
}

const close = () => {
  emit('close')
}

const apply = () => {
  emit('update:time', selectedTime.value)
  emit('update:period', period.value)
  emit('apply', { time: selectedTime.value, period: period.value })
  close()
}
</script>

<style scoped>
/* Time Picker Modal */
.time-picker-overlay {
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
  animation: fadeIn 0.3s ease-out forwards;
}

.time-picker-modal {
  width: 320px;
  background-color: #19181e;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  overflow: hidden;
}

.time-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.time-picker-header h3 {
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.3px;
}

.time-picker-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.time-picker-close:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.time-picker-body {
  padding: 20px;
}

/* Custom Time Input */
.custom-time-input {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time-input-group {
  display: flex;
  align-items: center;
  background-color: rgba(233, 75, 159, 0.08);
  border: 1px solid rgba(233, 75, 159, 0.2);
  border-radius: 10px;
  padding: 8px 16px;
  margin-bottom: 8px;
}

.time-input-field {
  width: 40px;
  background: transparent;
  border: none;
  color: white;
  font-size: 20px;
  font-weight: 500;
  text-align: center;
  -moz-appearance: textfield;
}

.time-input-field::-webkit-outer-spin-button,
.time-input-field::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.time-input-field:focus {
  outline: none;
}

.time-divider {
  color: white;
  font-size: 20px;
  margin: 0 5px;
}

.time-input-note {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.time-picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 5px;
  scrollbar-width: thin;
  scrollbar-color: rgba(170, 170, 170, 0.3) transparent;
  position: relative;
}

.time-picker-grid::-webkit-scrollbar {
  width: 4px;
}

.time-picker-grid::-webkit-scrollbar-track {
  background: rgba(25, 24, 30, 0.3);
  border-radius: 2px;
}

.time-picker-grid::-webkit-scrollbar-thumb {
  background-color: rgba(233, 75, 159, 0.3);
  border-radius: 2px;
}

.time-picker-grid::after {
  content: 'Scroll for more options';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  padding: 30px 0 5px;
  background: linear-gradient(to bottom, transparent, #19181e);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.time-picker-grid:hover::after {
  opacity: 1;
}

.time-option {
  padding: 10px 0;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid transparent;
}

.time-option:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.time-option.selected {
  background-color: rgba(233, 75, 159, 0.15);
  border-color: rgba(233, 75, 159, 0.3);
  color: white;
  font-weight: 500;
}

.time-period-selector {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
}

.time-period-btn {
  padding: 8px 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.time-period-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.time-period-btn.selected {
  background-color: rgba(233, 75, 159, 0.15);
  border-color: rgba(233, 75, 159, 0.3);
  color: white;
}

.time-picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.time-picker-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-picker-cancel {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.time-picker-cancel:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}

.time-picker-apply {
  background-color: rgba(233, 75, 159, 0.15);
  border: 1px solid rgba(233, 75, 159, 0.3);
  color: white;
}

.time-picker-apply:hover {
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

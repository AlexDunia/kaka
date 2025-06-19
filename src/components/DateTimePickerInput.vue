<template>
  <div class="datetime-picker-input">
    <label v-if="label" :for="id" class="input-label">{{ label }}</label>
    <div class="input-wrapper" :class="{ 'has-error': error }">
      <input
        :id="id"
        type="text"
        readonly
        :placeholder="placeholder"
        :value="formattedValue"
        @click="openPicker"
        class="datetime-input"
        :class="{ 'is-placeholder': !modelValue }"
      />
      <button type="button" @click="openPicker" class="calendar-icon-btn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>
    </div>
    <p v-if="error" class="error-message">{{ error }}</p>

    <Teleport to="body">
      <div v-if="isPickerOpen" class="datetime-picker-modal-overlay" @click.self="closePicker">
        <div class="datetime-picker-modal">
          <DateTimePicker
            :title="modalTitle"
            :initial-date-time="modelValue || new Date()"
            :min-date="minDate"
            :max-date="maxDate"
            :use12-hour-format="use12HourFormat"
            @update:date-time="updateDateTime"
            @close="closePicker"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import DateTimePicker from './DateTimePicker.vue'

const props = defineProps({
  modelValue: {
    type: Date,
    default: null,
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Select date and time',
  },
  error: {
    type: String,
    default: '',
  },
  modalTitle: {
    type: String,
    default: 'Select Date & Time',
  },
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY',
  },
  timeFormat: {
    type: String,
    default: 'hh:mm A',
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

const emit = defineEmits(['update:modelValue'])

const isPickerOpen = ref(false)
const id = ref(`datetime-picker-${uuidv4()}`)

const formattedValue = computed(() => {
  if (!props.modelValue) return ''

  try {
    const date = new Date(props.modelValue)

    // Replace format tokens with actual values
    let formattedDate = props.dateFormat
      .replace('YYYY', date.getFullYear())
      .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(date.getDate()).padStart(2, '0'))

    // Time formatting
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    let period = ''

    if (props.use12HourFormat) {
      period = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours === 0 ? 12 : hours
    }

    const formattedHours = String(hours).padStart(2, '0')

    let formattedTime = props.timeFormat
      .replace('hh', formattedHours)
      .replace('HH', String(date.getHours()).padStart(2, '0'))
      .replace('mm', minutes)
      .replace('A', period)

    return `${formattedDate} ${formattedTime}`
  } catch {
    return ''
  }
})

function openPicker() {
  isPickerOpen.value = true
}

function closePicker() {
  isPickerOpen.value = false
}

function updateDateTime(dateTime) {
  emit('update:modelValue', dateTime)
  closePicker()
}
</script>

<style scoped>
.datetime-picker-input {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 15px;
}

.input-label {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.input-wrapper {
  position: relative;
  display: flex;
  width: 100%;
}

.datetime-input {
  flex: 1;
  height: 40px;
  padding: 0 40px 0 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background-color: #fff;
}

.datetime-input:focus {
  outline: none;
  border-color: #4a6cf7;
  box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.1);
}

.is-placeholder {
  color: #999;
}

.calendar-icon-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-icon-btn:hover {
  color: #4a6cf7;
}

.input-wrapper.has-error .datetime-input {
  border-color: #ff4d4f;
}

.error-message {
  margin-top: 5px;
  font-size: 12px;
  color: #ff4d4f;
}

.datetime-picker-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.datetime-picker-modal {
  animation: modal-fade-in 0.2s ease-out;
}

@keyframes modal-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

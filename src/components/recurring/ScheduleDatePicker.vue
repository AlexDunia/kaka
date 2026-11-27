<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import ScheduleCalendar from './ScheduleCalendar.vue'
import { formatScheduleDate } from '@/utils/explicitSchedule'
const props = defineProps({
  modelValue: String,
  label: String,
  minimum: String,
  maximum: String,
  disabled: Boolean,
  placeholder: { type: String, default: 'Choose date' },
})
const emit = defineEmits(['update:modelValue'])
const dialog = ref(null),
  trigger = ref(null),
  month = ref('')
const minimumMonth = computed(() => props.minimum?.slice(0, 7))
const maximumMonth = computed(() => props.maximum?.slice(0, 7))
function open() {
  month.value = (props.modelValue || props.minimum).slice(0, 7)
  dialog.value.showModal()
}
function navigate(offset) {
  const [year, number] = month.value.split('-').map(Number)
  const date = new Date(year, number - 1 + offset, 1)
  month.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
function select(date) {
  emit('update:modelValue', date)
  dialog.value.close()
}
async function restoreFocus() {
  await nextTick()
  trigger.value?.focus()
}
watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) dialog.value?.close()
  },
)
</script>
<template>
  <div class="schedule-date-field">
    <span class="schedule-label">{{ label }}</span>
    <button
      ref="trigger"
      type="button"
      class="schedule-date-button"
      :aria-label="label"
      aria-haspopup="dialog"
      :disabled="disabled"
      @click="open"
    >
      <span>{{ modelValue ? formatScheduleDate(modelValue) : placeholder }}</span
      ><CalendarDaysIcon aria-hidden="true" />
    </button>
    <Teleport to="body">
      <dialog
        ref="dialog"
        class="rh-schedule schedule-date-dialog"
        :aria-label="label"
        @close="restoreFocus"
      >
        <div class="schedule-month-nav">
          <button
            type="button"
            class="schedule-icon"
            aria-label="Previous month"
            :disabled="minimumMonth && month <= minimumMonth"
            :style="{ visibility: minimumMonth && month <= minimumMonth ? 'hidden' : undefined }"
            @click="navigate(-1)"
          >
            <ChevronLeftIcon /></button
          ><strong>{{
            formatScheduleDate(`${month}-01`, { month: 'long', year: 'numeric' })
          }}</strong
          ><button
            type="button"
            class="schedule-icon"
            aria-label="Next month"
            :disabled="maximumMonth && month >= maximumMonth"
            :style="{ visibility: maximumMonth && month >= maximumMonth ? 'hidden' : undefined }"
            @click="navigate(1)"
          >
            <ChevronRightIcon />
          </button>
          <button
            type="button"
            class="schedule-icon schedule-close"
            aria-label="Close calendar"
            @click="dialog.close()"
          >
            <XMarkIcon />
          </button>
        </div>
        <ScheduleCalendar
          :month="month"
          :minimum="minimum"
          :maximum="maximum"
          :active="modelValue"
          @select="select"
        />
      </dialog>
    </Teleport>
  </div>
</template>

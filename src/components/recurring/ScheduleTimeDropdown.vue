<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { formatSessionTime } from '@/utils/explicitSchedule'
const props = defineProps({ modelValue: String, label: String, open: Boolean, anchor: String })
const emit = defineEmits(['update:modelValue', 'toggle'])
const precise = ref(false),
  list = ref(null),
  trigger = ref(null)
const options = computed(() =>
  Array.from({ length: precise.value ? 1440 : 96 }, (_, index) => {
    const minutes = index * (precise.value ? 1 : 15)
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  }),
)
async function focusOption() {
  await nextTick()
  const anchor = props.modelValue || props.anchor || '09:00'
  const [hour, minute] = anchor.split(':').map(Number)
  const index = Math.floor((hour * 60 + minute) / (precise.value ? 1 : 15))
  const option = list.value?.children[index]
  if (option) {
    list.value.scrollTop = option.offsetTop - list.value.offsetTop
    option.focus({ preventScroll: true })
  }
}
function togglePrecision() {
  precise.value = !precise.value
  focusOption()
}
watch(
  () => props.open,
  (open) => {
    if (open) {
      precise.value = Boolean(props.modelValue && Number(props.modelValue.slice(3)) % 15)
      void focusOption()
    }
  },
  { immediate: true },
)
async function select(value) {
  emit('update:modelValue', value)
  await nextTick()
  if (!document.activeElement?.closest('.schedule-time-options')) trigger.value?.focus()
}
function keys(event, index) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('toggle')
    trigger.value?.focus()
    return
  }
  const next =
    event.key === 'ArrowDown'
      ? index + 1
      : event.key === 'ArrowUp'
        ? index - 1
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? options.value.length - 1
            : null
  if (next !== null) {
    event.preventDefault()
    list.value?.children[Math.max(0, Math.min(options.value.length - 1, next))]?.focus()
  }
}
</script>
<template>
  <div class="schedule-time-control">
    <button
      ref="trigger"
      type="button"
      class="schedule-time-field"
      :aria-label="`${label}: ${formatSessionTime(modelValue)}`"
      :aria-expanded="open"
      @click="emit('toggle')"
    >
      <span
        ><small>{{ label }}</small
        ><strong>{{ formatSessionTime(modelValue) }}</strong></span
      ><ChevronDownIcon aria-hidden="true" />
    </button>
    <div v-if="open" class="schedule-time-picker">
      <div ref="list" class="schedule-time-options" role="group" :aria-label="label">
        <button
          v-for="(value, index) in options"
          :key="value"
          type="button"
          :aria-pressed="value === modelValue"
          :tabindex="value === modelValue ? 0 : -1"
          @click="select(value)"
          @keydown="keys($event, index)"
        >
          {{ formatSessionTime(value) }}
        </button>
      </div>
      <button type="button" class="schedule-link" @click="togglePrecision">
        {{ precise ? 'Show fewer times' : 'Show every minute' }}
      </button>
    </div>
  </div>
</template>

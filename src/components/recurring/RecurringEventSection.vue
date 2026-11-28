<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@/components/icons/pngIcons'
import ScheduleCalendar from './ScheduleCalendar.vue'
import ScheduleDatePicker from './ScheduleDatePicker.vue'
import ScheduleDayEditor from './ScheduleDayEditor.vue'
import { useExplicitScheduleEditor } from '@/composables/useExplicitScheduleEditor'
import {
  addCalendarDays,
  cloneSchedule,
  createExplicitSchedule,
  formatScheduleDate,
  formatSessionTime,
  isExplicitSchedule,
  rangeError,
  rangeMaximum,
  removeScheduleDay,
  scheduledDays,
  scheduleMonths,
  withinRange,
} from '@/utils/explicitSchedule'

const props = defineProps({ modelValue: Object, today: String, error: String })
const emit = defineEmits(['update:modelValue'])
const route = useRoute(),
  router = useRouter()
const schedule = ref(
  cloneSchedule(isExplicitSchedule(props.modelValue) ? props.modelValue : createExplicitSchedule()),
)
watch(
  () => props.modelValue,
  (value) => {
    if (value !== schedule.value && isExplicitSchedule(value)) schedule.value = cloneSchedule(value)
  },
)
const today = computed(() => props.today)
const mode = computed(() => schedule.value.activeMode)
const config = computed(() => schedule.value.configurations[mode.value])
function update(change) {
  const next = cloneSchedule(schedule.value)
  change(next)
  schedule.value = next
  emit('update:modelValue', next)
}
const editor = reactive(
  useExplicitScheduleEditor(
    schedule,
    (change) => update((next) => change(next.configurations[next.activeMode])),
    today,
  ),
)
const months = computed(() => scheduleMonths(config.value, mode.value))
const added = computed(() => scheduledDays(config.value))
const validRange = computed(() => !rangeError(config.value, mode.value))
const maximum = computed(() => rangeMaximum(config.value.startDate, mode.value))
const mounted = ref(false)
const finishAfterConfirmation = ref(false)
const month = ref(''),
  workspaceOpen = ref(false),
  mobile = ref(false)
const monthDialog = ref(null),
  dayDialog = ref(null),
  confirmDialog = ref(null),
  desktopHost = ref(null),
  mobileHost = ref(null)
const returnFocus = ref(null)
let ownsHistory = false,
  media
const daysThisMonth = computed(() => added.value.filter((date) => date.startsWith(month.value)))
const unfinishedThisMonth = computed(() =>
  Object.keys(config.value.drafts).filter(
    (date) => date.startsWith(month.value) && withinRange(date, config.value),
  ),
)
const sessionsThisMonth = computed(() =>
  daysThisMonth.value.reduce((sum, date) => sum + config.value.days[date].sessions.length, 0),
)
const minimumDay = computed(() =>
  config.value.startDate > today.value ? config.value.startDate : today.value,
)
function chooseMode(value) {
  editor.park()
  editor.reset()
  update((next) => {
    next.activeMode = value
  })
}
function changeStart(value) {
  editor.park()
  update((next) => {
    const current = next.configurations[next.activeMode]
    current.startDate = value
    if (current.endDateExclusive && rangeError(current, next.activeMode))
      current.endDateExclusive = ''
  })
}
function changeEnd(value) {
  update((next) => {
    next.configurations[next.activeMode].endDateExclusive = value
  })
}
async function openMonth(value, date = '', push = true) {
  if (!months.value.includes(value)) return
  returnFocus.value = typeof document !== 'undefined' ? document.activeElement : null
  month.value = value
  workspaceOpen.value = true
  if (date) editor.load(date, false)
  else editor.reset()
  await nextTick()
  if (!monthDialog.value) return
  if (!monthDialog.value.open) monthDialog.value.showModal()
  if (mobile.value && push) {
    await router.push({ query: { ...route.query, scheduleMonth: value, scheduleMode: mode.value } })
    ownsHistory = true
  }
}
async function selectDay(date) {
  if (!editor.validateCompletion()) return
  editor.load(date)
  if (mobile.value) {
    await nextTick()
    dayDialog.value.showModal()
  }
}
function closeDay() {
  if (!editor.validateCompletion()) return false
  editor.park()
  dayDialog.value?.close()
  return true
}
async function closeMonth(fromRoute = false) {
  if (!closeDay()) return
  editor.park()
  monthDialog.value?.close()
  workspaceOpen.value = false
  editor.reset()
  if (!fromRoute && route.query.scheduleMonth) {
    if (ownsHistory) router.back()
    else {
      const query = { ...route.query }
      delete query.scheduleMonth
      delete query.scheduleMode
      await router.replace({ query })
    }
  }
  ownsHistory = false
  await nextTick()
  returnFocus.value?.focus?.()
}
watch(
  () => editor.confirmation,
  async (pending) => {
    if (pending) {
      await nextTick()
      confirmDialog.value?.showModal()
    }
  },
)
function confirmBulk() {
  const saved = editor.save(true)
  confirmDialog.value.close()
  if (saved && finishAfterConfirmation.value) finishDay()
  finishAfterConfirmation.value = false
}
function cancelBulk() {
  finishAfterConfirmation.value = false
  editor.confirmation = null
  confirmDialog.value?.close()
}
function finishDay() {
  if (!editor.validateCompletion()) return
  if (editor.canSave && !editor.save()) {
    finishAfterConfirmation.value = true
    return
  }
  editor.park()
  editor.reset()
  dayDialog.value?.close()
}
function removeOverviewDay(date) {
  if (date < today.value) return
  update((next) => removeScheduleDay(next.configurations[next.activeMode], date))
}
function addDays() {
  const first =
    months.value.find((value) => value >= minimumDay.value.slice(0, 7)) || months.value[0]
  if (first) void openMonth(first)
}
async function navigateMonth(offset) {
  if (!editor.validateCompletion()) return
  const next = months.value[months.value.indexOf(month.value) + offset]
  if (!next) return
  editor.park()
  editor.reset()
  month.value = next
  if (mobile.value)
    await router.replace({
      query: { ...route.query, scheduleMonth: next, scheduleMode: mode.value },
    })
}

watch(
  () => [
    route.query.scheduleMonth,
    route.query.scheduleMode,
    validRange.value,
    mode.value,
    mounted.value,
  ],
  ([target, targetMode]) => {
    if (!mounted.value) return
    if (target && ['weekly', 'monthly'].includes(targetMode) && targetMode !== mode.value) {
      update((next) => {
        next.activeMode = targetMode
      })
      return
    }
    if (
      target &&
      targetMode === mode.value &&
      validRange.value &&
      months.value.includes(target) &&
      !workspaceOpen.value
    )
      void openMonth(target, '', false)
    else if (!target && workspaceOpen.value && mobile.value) void closeMonth(true)
  },
  { immediate: true, flush: 'post' },
)
function viewportChange(event) {
  if (workspaceOpen.value) void closeMonth()
  mobile.value = event.matches
}
onMounted(() => {
  media = window.matchMedia('(max-width: 650px)')
  mobile.value = media.matches
  mounted.value = true
  media.addEventListener('change', viewportChange)
})
onBeforeUnmount(() => {
  media?.removeEventListener('change', viewportChange)
})
</script>

<template>
  <section
    class="rh-schedule"
    aria-label="Recurring event schedule"
    data-error-key="repeatSchedule"
  >
    <div class="schedule-field">
      <span class="schedule-label">How often does your event run?</span>
      <div class="schedule-frequency" role="group" aria-label="How often">
        <button
          v-for="option in [
            { key: 'weekly', label: 'Every week' },
            { key: 'monthly', label: 'Every month' },
          ]"
          :key="option.key"
          type="button"
          :aria-pressed="mode === option.key"
          @click="chooseMode(option.key)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
    <div class="schedule-dates">
      <ScheduleDatePicker
        :model-value="config.startDate"
        :label="
          mode === 'weekly' ? 'Start date for weekly events' : 'Start date for monthly events'
        "
        :minimum="today"
        @update:model-value="changeStart"
      />
      <ScheduleDatePicker
        :model-value="config.endDateExclusive"
        :label="mode === 'weekly' ? 'End date for weekly events' : 'End date for monthly events'"
        :disabled="!config.startDate"
        :minimum="addCalendarDays(config.startDate, 1)"
        :maximum="maximum"
        :placeholder="config.startDate ? 'Choose date' : 'Choose start date first'"
        @update:model-value="changeEnd"
      />
    </div>
    <p v-if="error" class="schedule-error" role="alert">{{ error }}</p>
    <template v-if="validRange">
      <section class="schedule-overview">
        <div class="schedule-row">
          <h2>Your schedule</h2>
          <button v-if="added.length" type="button" class="schedule-secondary" @click="addDays">
            Add days
          </button>
        </div>
        <p v-if="!added.length" class="schedule-muted">
          No days added yet. Choose your event days and times.
          <button type="button" class="schedule-link" @click="addDays">Add days here</button>
        </p>
        <ul v-else class="schedule-overview-list">
          <li v-for="date in added" :key="date">
            <div class="schedule-row">
              <strong>{{
                formatScheduleDate(date, { weekday: 'long', day: 'numeric', month: 'long' })
              }}</strong>
              <div class="schedule-day-actions">
                <button
                  type="button"
                  class="schedule-link"
                  :aria-label="`Edit ${formatScheduleDate(date)}`"
                  @click="openMonth(date.slice(0, 7), date)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="schedule-icon schedule-close"
                  :aria-label="`Remove ${formatScheduleDate(date)} from your schedule`"
                  :disabled="date < today"
                  @click="removeOverviewDay(date)"
                >
                  <XMarkIcon />
                </button>
              </div>
            </div>
            <p v-if="!config.days[date].sessions.length" class="schedule-muted">No time selected</p>
            <p
              v-for="slot in config.days[date].sessions"
              :key="`${slot.startTime}-${slot.endTime}`"
            >
              {{ formatSessionTime(slot.startTime) }} to {{ formatSessionTime(slot.endTime) }}
            </p>
          </li>
        </ul>
      </section>
      <p class="schedule-muted">
        Add days and times, then save your event.
      </p>
    </template>
    <Teleport to="body">
      <dialog
        ref="monthDialog"
        class="rh-schedule schedule-month-dialog"
        :class="{ 'schedule-mobile-page': mobile }"
        aria-labelledby="schedule-month-title"
        @cancel.prevent="closeMonth()"
      >
        <header class="schedule-dialog-head">
          <button
            v-if="mobile"
            type="button"
            class="schedule-icon"
            aria-label="Back to event"
            @click="closeMonth()"
          >
            <ChevronLeftIcon />
          </button>
          <div>
            <h2 id="schedule-month-title">
              {{
                month ? formatScheduleDate(`${month}-01`, { month: 'long', year: 'numeric' }) : ''
              }}
            </h2>
            <p>Choose your event days.</p>
          </div>
          <button
            v-if="!mobile"
            type="button"
            class="schedule-icon"
            aria-label="Close month"
            @click="closeMonth()"
          >
            <XMarkIcon />
          </button>
        </header>
        <div class="schedule-workspace">
          <section class="schedule-calendar-pane">
            <p class="schedule-muted">
              {{ formatScheduleDate(config.startDate) }} to
              {{ formatScheduleDate(config.endDateExclusive) }}
            </p>
            <div class="schedule-month-nav">
              <button
                type="button"
                class="schedule-icon"
                aria-label="Previous month"
                :disabled="month === months[0]"
                @click="navigateMonth(-1)"
              >
                <ChevronLeftIcon />
              </button>
              <strong>{{
                month ? formatScheduleDate(`${month}-01`, { month: 'long', year: 'numeric' }) : ''
              }}</strong>
              <button
                type="button"
                class="schedule-icon"
                aria-label="Next month"
                :disabled="month === months[months.length - 1]"
                @click="navigateMonth(1)"
              >
                <ChevronRightIcon />
              </button>
            </div>
            <ScheduleCalendar
              v-if="month"
              :month="month"
              :minimum="minimumDay"
              :maximum="addCalendarDays(config.endDateExclusive, -1)"
              :days="config.days"
              :drafts="config.drafts"
              :active="editor.selected"
              :preview="editor.previewDates"
              @select="selectDay"
            />
            <p class="schedule-muted">Highlighted dates are your event days.</p>
          </section>
          <section v-show="!mobile" ref="desktopHost" class="schedule-editor-pane"></section>
        </div>
        <footer class="schedule-dialog-foot">
          <p role="status">
            {{ daysThisMonth.length }} event days · {{ sessionsThisMonth }} times<span
              v-if="unfinishedThisMonth.length"
            >
              · {{ unfinishedThisMonth.length }} unfinished</span
            >
          </p>
          <button
            v-if="!editor.selected || mobile"
            type="button"
            class="schedule-secondary"
            @click="closeMonth()"
          >
            Done
          </button>
        </footer>
      </dialog>
      <dialog
        ref="dayDialog"
        class="rh-schedule schedule-day-dialog"
        aria-label="Event day times"
        @cancel.prevent="closeDay"
      >
        <header class="schedule-day-close">
          <button type="button" class="schedule-icon" aria-label="Close day" @click="closeDay">
            <XMarkIcon />
          </button>
        </header>
        <div ref="mobileHost"></div>
      </dialog>
      <Teleport
        v-if="workspaceOpen && desktopHost && mobileHost"
        :to="mobile ? mobileHost : desktopHost"
        ><ScheduleDayEditor :editor="editor" @done="finishDay" @removed="dayDialog?.close()"
      /></Teleport>
      <dialog
        ref="confirmDialog"
        class="rh-schedule schedule-confirm-dialog"
        aria-label="Replace existing times"
        @cancel.prevent="cancelBulk"
      >
        <h2>Replace the times on your other added days?</h2>
        <p>
          This replaces different times and unfinished changes on your other days.
        </p>
        <div class="schedule-save-row">
          <button type="button" class="schedule-primary" @click="confirmBulk">Replace times</button
          ><button type="button" class="schedule-secondary" @click="cancelBulk">
            Keep existing times
          </button>
        </div>
      </dialog>
    </Teleport>
  </section>
</template>
<style src="@/styles/recurring-schedule.css"></style>

import { computed, ref } from 'vue'
import {
  addScheduleDay,
  bulkConflicts,
  calendarDate,
  cloneSchedule,
  commitScheduleDay,
  completeSessions,
  MAX_SESSIONS_PER_DAY,
  removeScheduleDay,
  sameSessions,
  scheduledDays,
  sessionError,
  weekdayTargets,
  withinRange,
} from '@/utils/explicitSchedule'

const blank = () => ({ startTime: '', endTime: '' })

export function useExplicitScheduleEditor(schedule, mutate, today) {
  const selected = ref('')
  const slots = ref([blank()])
  const repeat = ref(false)
  const share = ref(null)
  const dirty = ref(false)
  const detached = ref(false)
  const openTime = ref(null)
  const confirmation = ref(null)
  const showValidation = ref(false)
  const config = computed(() => schedule.value.configurations[schedule.value.activeMode])
  const day = computed(() => config.value.days[selected.value])
  const sharingEnabled = computed(() =>
    Boolean(config.value.sharedTemplate && ['source', 'linked'].includes(day.value?.inheritance)),
  )
  const inherited = computed(
    () => day.value?.inheritance === 'linked' && !detached.value && !dirty.value,
  )
  const readOnly = computed(() => Boolean(selected.value && selected.value < today.value))
  const error = computed(() => sessionError(slots.value))
  const targets = computed(() =>
    selected.value ? weekdayTargets(selected.value, config.value, today.value) : [],
  )
  const previewDates = computed(() => (repeat.value ? targets.value : []))
  const unchanged = computed(
    () => sameSessions(completeSessions(slots.value), day.value?.sessions || []) && !error.value,
  )
  const canSave = computed(() =>
    Boolean(
      day.value &&
        !readOnly.value &&
        !error.value &&
        (dirty.value || repeat.value || share.value !== null),
    ),
  )
  const copySource = computed(() => {
    if (
      !day.value ||
      inherited.value ||
      slots.value.some((s) => s.startTime || s.endTime) ||
      day.value.sessions.length
    )
      return ''
    return (
      scheduledDays(config.value)
        .filter((date) => date !== selected.value && config.value.days[date].sessions.length)
        .sort(
          (a, b) =>
            Math.abs(calendarDate(a) - calendarDate(selected.value)) -
            Math.abs(calendarDate(b) - calendarDate(selected.value)),
        )[0] || ''
    )
  })
  function remember() {
    if (!selected.value || !dirty.value) return
    mutate((c) => {
      c.drafts[selected.value] = {
        slots: cloneSchedule(slots.value),
        repeat: repeat.value,
        share: share.value,
        detached: detached.value,
      }
    })
  }
  function park() {
    if (!dirty.value || !selected.value) return
    if (
      !repeat.value &&
      share.value === null &&
      !error.value &&
      !readOnly.value &&
      (!sharingEnabled.value || detached.value)
    ) {
      mutate((c) => commitScheduleDay(c, selected.value, slots.value, [selected.value], undefined))
      dirty.value = false
    } else remember()
  }
  function load(date, add = true) {
    park()
    selected.value = date
    if (add && date >= today.value && withinRange(date, config.value))
      mutate((c) => addScheduleDay(c, date))
    const draft = config.value.drafts[date]
    slots.value = cloneSchedule(
      draft?.slots ||
        (config.value.days[date]?.sessions.length ? config.value.days[date].sessions : [blank()]),
    )
    repeat.value = draft?.repeat || false
    share.value = draft?.share ?? null
    detached.value = draft?.detached || false
    dirty.value = Boolean(draft)
    openTime.value = null
    showValidation.value = false
  }
  function touch() {
    dirty.value = true
    remember()
  }
  function toggleTime(index, field) {
    openTime.value =
      openTime.value?.index === index && openTime.value.field === field ? null : { index, field }
  }
  function setTime(index, field, value) {
    slots.value[index][field] = value
    openTime.value =
      field === 'startTime' && !slots.value[index].endTime ? { index, field: 'endTime' } : null
    touch()
  }
  function addTime() {
    if (!validateCompletion()) return
    if (slots.value.length >= MAX_SESSIONS_PER_DAY) return
    slots.value.push(blank())
    openTime.value = { index: slots.value.length - 1, field: 'startTime' }
    touch()
  }
  function validateCompletion() {
    if (readOnly.value || !error.value) {
      showValidation.value = false
      return true
    }
    showValidation.value = true
    const index = slots.value.findIndex((slot) => Boolean(slot.startTime) !== Boolean(slot.endTime))
    if (index >= 0)
      openTime.value = { index, field: slots.value[index].startTime ? 'endTime' : 'startTime' }
    return false
  }
  function changeTime() {
    detached.value = true
    slots.value = [blank()]
    share.value = null
    repeat.value = false
    dirty.value = false
    openTime.value = null
  }
  function setRepeat(value) {
    repeat.value = value
    touch()
  }
  function setShare(value) {
    share.value = value === sharingEnabled.value ? null : value
    dirty.value = !unchanged.value || repeat.value || share.value !== null
    if (dirty.value) remember()
    else
      mutate((c) => {
        delete c.drafts[selected.value]
      })
  }
  function save(confirmed = false) {
    if (!canSave.value) return false
    const dates = repeat.value ? targets.value : [selected.value]
    const sharing = share.value ?? (sharingEnabled.value && !detached.value ? true : undefined)
    if (
      !confirmed &&
      bulkConflicts(config.value, selected.value, completeSessions(slots.value), dates, sharing)
        .length
    ) {
      confirmation.value = true
      return false
    }
    mutate((c) => commitScheduleDay(c, selected.value, slots.value, dates, sharing))
    dirty.value = false
    repeat.value = false
    share.value = null
    detached.value = false
    confirmation.value = null
    slots.value = cloneSchedule(day.value.sessions.length ? day.value.sessions : [blank()])
    return true
  }
  function removeTime(index) {
    if (readOnly.value) return
    const removed = slots.value[index]
    slots.value.splice(index, 1)
    if (!slots.value.length) slots.value = [blank()]
    mutate((c) => {
      const current = c.days[selected.value]
      if (!current) return
      current.sessions = current.sessions.filter(
        (s) => !(s.startTime === removed.startTime && s.endTime === removed.endTime),
      )
      if (c.sharedTemplate?.sourceDate === selected.value) {
        // Removing a source time detaches sharing; other copied times remain.
        c.sharedTemplate = null
        Object.values(c.days).forEach((day) => {
          if (['source', 'linked'].includes(day.inheritance)) day.inheritance = 'independent'
        })
      }
    })
    dirty.value = !unchanged.value
    openTime.value = null
    if (dirty.value) remember()
    else
      mutate((c) => {
        delete c.drafts[selected.value]
      })
  }
  function removeDay() {
    if (readOnly.value) return
    mutate((c) => removeScheduleDay(c, selected.value))
    slots.value = [blank()]
    dirty.value = false
    repeat.value = false
    share.value = null
    selected.value = ''
  }
  function clearTimes() {
    if (readOnly.value) return
    mutate((c) => {
      commitScheduleDay(c, selected.value, [], [selected.value], undefined)
      c.days[selected.value].inheritance = 'exception'
    })
    slots.value = [blank()]
    dirty.value = false
    detached.value = false
  }
  function copyTimes() {
    if (!copySource.value) return
    slots.value = config.value.days[copySource.value].sessions.map((s) => ({
      startTime: s.startTime,
      endTime: s.endTime,
    }))
    touch()
    save()
  }
  function reset() {
    selected.value = ''
    dirty.value = false
    slots.value = [blank()]
    repeat.value = false
    share.value = null
    openTime.value = null
    showValidation.value = false
  }
  return {
    selected,
    slots,
    repeat,
    share,
    dirty,
    detached,
    openTime,
    confirmation,
    showValidation,
    config,
    day,
    sharingEnabled,
    inherited,
    readOnly,
    error,
    targets,
    previewDates,
    canSave,
    copySource,
    load,
    park,
    toggleTime,
    setTime,
    addTime,
    validateCompletion,
    changeTime,
    setRepeat,
    setShare,
    save,
    removeTime,
    removeDay,
    clearTimes,
    copyTimes,
    reset,
    maxSessions: MAX_SESSIONS_PER_DAY,
  }
}

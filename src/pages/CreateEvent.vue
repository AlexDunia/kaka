<script setup>
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSlug } from '@/composables/useSlug'
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  HeartIcon,
  InformationCircleIcon,
  LinkIcon,
  MapPinIcon,
  MoonIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  PhotoIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  SunIcon,
  TicketIcon,
  TrashIcon,
  TrophyIcon,
  UserIcon,
  XMarkIcon,
} from '@/components/icons/pngIcons'
import { usePublishGuidanceStore } from '@/stores/publishGuidance'
import RecurringEventSection from '@/components/recurring/RecurringEventSection.vue'
import { createExplicitSchedule, explicitScheduleError, isExplicitSchedule } from '@/utils/explicitSchedule'
import WeeklyScheduleCalendar from '@/components/WeeklyScheduleCalendar.vue'
import EventEditorConflict from '@/components/EventEditorConflict.vue'
import { editorSections, sectionChanges, retainOtherSections } from '@/utils/eventEditorSections'
import { hydrateEditorForm } from '@/utils/eventEditor'
import { getPublicCategories } from '@/services/publicCatalog'
import DateTimePickerInput from '@/components/DateTimePickerInput.vue'
import CreateEventStepSkeleton from '@/components/CreateEventStepSkeleton.vue'
import EventCard from '@/components/EventCard.vue'
import { getRushHourLogo } from '@/constants/brand'
import { playThemeToggleClick } from '@/utils/themeClickSound'
import {
  DEFAULT_CREATE_EVENT_TIPS,
  buildCreateEventPayload,
  patchEvent,
  createEventDraft,
  getEventForEditing,
  publishEvent as publishEventRequest,
  updateEventDraft,
} from '@/services/createEventService'
import {
  APP_DEFAULT_TIME_ZONE,
  instantToLocalDate,
  fromLocalDateTimeString,
  isValidTimeZone,
  getMinimumStartDateTime,
  getVenueToday,
  isAfter,
  isStartDateTimeValid,
  toLocalDateTimeString,
} from '@/utils/eventDateTime'
import {
  WEEKDAYS,
  deriveMonthlyPattern,
  generateOccurrences,
  scheduleHasOverlap,
} from '@/utils/recurrenceSchedule'

const route = useRoute()
const router = useRouter()
const themeController = inject('themeController', null)

const steps = ['Basics', 'Details', 'Tickets', 'Attendees']
const repeatRhythmOptions = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
]
const categoryPresentation = [
  { name: 'Conference & Summit', icon: CalendarDaysIcon },
  { name: 'Music & Concert', icon: MusicalNoteIcon },
  { name: 'Food & Dining', icon: TicketIcon },
  { name: 'Art & Culture', icon: PaintBrushIcon },
  { name: 'Business & Networking', icon: BanknotesIcon },
  { name: 'Sports & Fitness', icon: TrophyIcon },
  { name: 'Workshop & Training', icon: DocumentTextIcon },
  { name: 'Party & Social', icon: SparklesIcon },
  { name: 'Startup & Tech', icon: ComputerDesktopIcon },
  { name: 'Faith & Community', icon: HeartIcon },
  { name: 'Theatre & Performing Arts', icon: UserIcon },
  { name: 'Education & Learning', icon: AcademicCapIcon },
]

const categoryOptions = ref([])
const categoryLoadError = ref('')
async function loadCategories() {
  categoryLoadError.value = ''
  try {
    categoryOptions.value = (await getPublicCategories()).map((category) => ({
      ...category,
      icon:
        categoryPresentation.find((item) => item.name === category.name)
          ?.icon || TicketIcon,
    }))
  } catch {
    categoryLoadError.value = 'We could not load categories. Please try again.'
  }
}

const venues = [
  [
    'Eko Hotel & Suites',
    'Plot 1415 Adetokunbo Ademola St, Victoria Island, Lagos',
    'Africa/Lagos',
  ],
  [
    'The Civic Centre',
    'Ozumba Mbadiwe Ave, Victoria Island, Lagos',
    'Africa/Lagos',
  ],
  [
    'Landmark Event Centre',
    'Water Corporation Dr, Oniru, Lagos',
    'Africa/Lagos',
  ],
  [
    'Terra Kulture',
    '1376 Tiamiyu Savage St, Victoria Island, Lagos',
    'Africa/Lagos',
  ],
  [
    'Transcorp Hilton Abuja',
    '1 Aguiyi-Ironsi St, Maitama, Abuja',
    'Africa/Lagos',
  ],
]

const detailOptions = [
  {
    type: 'parking',
    label: 'Parking',
    icon: MapPinIcon,
    placeholder: 'Free parking on-site from 5pm.',
  },
  {
    type: 'dress',
    label: 'Dress code',
    icon: SparklesIcon,
    placeholder: 'Smart casual, formal, or themed attire.',
  },
  {
    type: 'bring',
    label: 'What to bring',
    icon: DocumentTextIcon,
    placeholder: 'Valid ID, ticket, business cards, or supplies.',
  },
  {
    type: 'agenda',
    label: 'Agenda',
    icon: ClockIcon,
    placeholder: '9:00 AM registration, 10:00 AM keynote...',
  },
  {
    type: 'speakers',
    label: 'Speakers',
    icon: UserIcon,
    placeholder: 'Speaker names, roles, and session topics.',
  },
  {
    type: 'food',
    label: 'Food & drinks',
    icon: InformationCircleIcon,
    placeholder: 'Cocktails, light bites, vegetarian or halal options.',
  },
  {
    type: 'transport',
    label: 'Getting there',
    icon: MapPinIcon,
    placeholder: 'Ride-share, public transport, or parking notes.',
  },
  {
    type: 'faq',
    label: 'FAQs',
    icon: QuestionMarkCircleIcon,
    placeholder: 'Answer common attendee questions.',
  },
]

const ticketTemplates = [
  { name: 'Early Bird', unitType: 'individual', color: '#1a7a4a', price: 5000 },
  {
    name: 'General Admission',
    unitType: 'individual',
    color: '#1a5fa6',
    price: 10000,
  },
  { name: 'VIP', unitType: 'individual', color: '#ec4899', price: 30000 },
  { name: 'Gold Table', unitType: 'table', color: '#ec4899', price: 250000 },
  { name: 'Silver Table', unitType: 'table', color: '#7a8fa6', price: 150000 },
  { name: 'Student', unitType: 'individual', color: '#302b63', price: 3000 },
]

const attendeeFieldDefaults = [
  {
    id: 'name',
    label: 'Full name',
    help: 'First and last name',
    enabled: true,
    required: true,
  },
  {
    id: 'email',
    label: 'Email address',
    help: 'For ticket delivery and updates',
    enabled: true,
    required: true,
  },
  {
    id: 'phone',
    label: 'Phone number',
    help: 'For WhatsApp updates and emergency contact',
    enabled: true,
    required: false,
  },
  {
    id: 'company',
    label: 'Organisation',
    help: 'Where they work or study',
    enabled: false,
    required: false,
  },
  {
    id: 'job',
    label: 'Job title',
    help: 'Their role or position',
    enabled: false,
    required: false,
  },
  {
    id: 'dietary',
    label: 'Food needs',
    help: 'Useful for catered events',
    enabled: false,
    required: false,
  },
  {
    id: 'shirt',
    label: 'T-shirt size',
    help: 'If giving out merchandise',
    enabled: false,
    required: false,
  },
  {
    id: 'source',
    label: 'How did you hear about us?',
    help: 'Useful for marketing insight',
    enabled: false,
    required: false,
  },
]

const coverTemplates = [
  'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#134e5e,#71b280)',
  'linear-gradient(135deg,#831843,#f9a8d4)',
  'linear-gradient(135deg,#c850c0,#ec4899)',
  'linear-gradient(135deg,#1a1a1a,#434343)',
]

const form = reactive({
  title: '',
  startsAt: tomorrowAt(18),
  endsAt: tomorrowAt(22),
  eventType: 'one_time',
  recurrence: {
    frequency: null,
    weeklyDays: [],
    monthlyMode: 'day_of_month',
    dayOfMonth: null,
    nthWeekday: {
      ordinal: null,
      weekday: null,
    },
    seriesEndType: 'on_date',
    seriesEndDate: '',
    occurrenceCount: null,
  },
  format: 'in-person',
  venue: '',
  city: '',
  version: null,
  venueTimezone: APP_DEFAULT_TIME_ZONE,
  meetingLink: '',
  category: '',
  coverImage: '',
  coverGradient: coverTemplates[0],
  secondaryImages: [],
  urlImages: [],
  description: '',
  organiser: '',
  organiserWebsite: '',
  tags: '',
  extraDetails: [],
  ticketMode: 'free',
  freeCapacity: '',
  tickets: [],
  attendeeFields: attendeeFieldDefaults.map((field) => ({ ...field })),
})

const legacyScheduleLoaded = ref(false)
const oneTimeTiming = ref(null)
const explicitSchedule = computed(() => form.eventType === 'recurring' && isExplicitSchedule(form.recurrence))
const scheduleTimingDraft = reactive({ date: '', startTime: '', endTime: '' })

const props = defineProps({ embedded: Boolean, eventId: [Number, String], editorSection: { type: String, default: 'details' } })
const emit = defineEmits(['section-change'])
const isEditMode = computed(() => props.embedded || route.name === 'EditEvent')
const editingEventId = computed(() => {
  if (!isEditMode.value) return null
  const id = Number(props.eventId || route.params.id)
  return Number.isInteger(id) && id > 0 ? id : null
})
const editorLoading = ref(false)
const editorLoadError = ref('')
const editorStatus = ref(null)
const hydrating = ref(false)
const conflict = ref(false),
  conflictRecord = ref(null),
  conflictLoading = ref(false),
  conflictError = ref('')
function hydrateEventForm(payload = {}) {
  hydrating.value = true
  Object.assign(scheduleTimingDraft, { date: '', startTime: '', endTime: '' })
  const next = hydrateEditorForm(payload)
  legacyScheduleLoaded.value = next.eventType === 'recurring' && !isExplicitSchedule(next.recurrence)
  Object.assign(form, next, {
    title: next.title || '',
    city: next.city || '',
    venue: next.venue || '',
    description: next.description || '',
    organiser: next.organiser || '',
    organiserWebsite: next.organiserWebsite || '',
    tags: next.tags || '',
    meetingLink: next.meetingLink || '',
    coverImage: next.coverImage || '',
    freeCapacity: next.freeCapacity ?? '',
    recurrence: isExplicitSchedule(next.recurrence) ? next.recurrence : {
      frequency: null,
      weeklyDays: [],
      monthlyMode: 'day_of_month',
      dayOfMonth: null,
      nthWeekday: { ordinal: null, weekday: null },
      seriesEndType: 'on_date',
      seriesEndDate: '',
      occurrenceCount: null,
      ...(next.recurrence || {}),
    },
    attendeeFields: next.attendeeFields?.length
      ? next.attendeeFields.map((field) => ({ ...field }))
      : attendeeFieldDefaults.map((field) => ({ ...field })),
    extraDetails: (next.extraDetails || []).map((detail) => ({
      ...detail,
      icon:
        detailOptions.find((item) => item.type === detail.type)?.icon ||
        InformationCircleIcon,
    })),
  })
  nextTick(() => {
    hydrating.value = false
  })
}
function acceptSavedEvent(record) {
  hydrateEventForm({ ...record.form, version: record.version })
  draftId.value = record.id
  editorStatus.value = record.status
}
async function loadEventForEditing() {
  const id = editingEventId.value || draftId.value
  if (!id) {
    editorLoadError.value = 'Choose an event to open the editor.'
    return
  }
  editorLoading.value = true
  editorLoadError.value = ''
  try {
    const record = (await getEventForEditing(id)).data
    acceptSavedEvent(record)
    maxStepReached.value = steps.length
  } catch (error) {
    editorLoadError.value =
      error.userMessage || 'We could not load this event. Please try again.'
  } finally {
    editorLoading.value = false
  }
}
async function loadConflictRecord() {
  conflictLoading.value = true
  conflictError.value = ''
  try {
    conflictRecord.value = (
      await getEventForEditing(draftId.value || editingEventId.value)
    ).data
  } catch {
    conflictError.value =
      'We could not load the saved event. Your edits are still here.'
  } finally {
    conflictLoading.value = false
  }
}
async function handleWriteError(error) {
  if ([409, 428].includes(error.response?.status)) {
    conflict.value = true
    await loadConflictRecord()
  }
}
async function reloadConflictedEvent() {
  await loadConflictRecord()
  if (!conflictRecord.value || conflictError.value) return
  acceptSavedEvent(conflictRecord.value)
  conflict.value = false
  saveError.value = []
  publishErrors.value = []
  Object.keys(errors).forEach(clearError)
}
function validateAllEditableSteps() {
  for (const step of [1, 2, 3])
    if (!validateStep(step)) {
      currentStep.value = step
      if (props.embedded) emit('section-change', step === 3 ? 'tickets' : 'details')
      maxStepReached.value = steps.length
      return false
    }
  return true
}
async function saveEventChanges() {
  if (
    !isEditMode.value ||
    !editingEventId.value ||
    isSaving.value ||
    isPublishing.value ||
    editorLoading.value ||
    editorLoadError.value ||
    conflict.value
  )
    return
  if (props.embedded) {
    const section = editorSections[props.editorSection]
    if (!section || !section.steps.every(validateStep)) return
  } else if (editorStatus.value === 'active' && !validateAllEditableSteps()) return
  isSaving.value = true
  saveError.value = []
  publishErrors.value = []
  try {
    if (props.embedded) {
      const section = props.editorSection
      const retained = retainOtherSections(form, section)
      const retainedScheduleTiming = { ...scheduleTimingDraft }
      const response = await patchEvent(editingEventId.value, sectionChanges(buildCreateEventPayload(form), section), form.version)
      acceptSavedEvent(response.data)
      Object.assign(form, retained)
      if (section !== 'details') Object.assign(scheduleTimingDraft, retainedScheduleTiming)
      lastSavedAt.value = new Date()
    } else await persistDraft()
    showToast('Your changes are saved.')
    if (!props.embedded && route.query.returnTo === 'event') {
      await router.push({ name: 'event-details', params: { id: editingEventId.value, slug: useSlug().generateSlug(form.title) || 'event' } })
    }
  } catch (error) {
    saveError.value = normalizeRequestErrors(error)
    applyBackendErrors(saveError.value, error.response?.status === 422)
    if (props.embedded && error.response?.status === 422) emit('section-change', currentStep.value === 3 ? 'tickets' : currentStep.value === 4 ? 'checkout' : 'details')
    await handleWriteError(error)
  } finally {
    isSaving.value = false
  }
}
const clock = ref(new Date())
const eventTimeZone = computed(() =>
  isValidTimeZone(form.venueTimezone)
    ? form.venueTimezone
    : APP_DEFAULT_TIME_ZONE,
)
const venueToday = computed(() =>
  getVenueToday(eventTimeZone.value, clock.value),
)
const minimumStartDateTime = computed(() =>
  isEditMode.value
    ? null
    : getMinimumStartDateTime(eventTimeZone.value, clock.value),
)
const minimumEndDateTime = computed(() => {
  if (!form.startsAt) return minimumStartDateTime.value
  return new Date(new Date(form.startsAt).getTime() + 60_000)
})
const themePreferenceKey = 'kaka-theme-preference'
const fallbackTheme = ref('dark')
const theme = computed(
  () => themeController?.theme?.value || fallbackTheme.value,
)
const brandLogoUrl = computed(() => getRushHourLogo(theme.value))
let themeInstantToken = 0
const currentStep = ref(1)
const maxStepReached = ref(1)
const isStepLoading = ref(false)
const loadingStep = ref(1)
let stepLoadingToken = 0
const previewOn = ref(
  typeof window !== 'undefined' && window.localStorage?.getItem('kaka-create-preview') !== 'false',
)
const draftSaved = ref(false)
const activeUploadTab = ref('files')
const showTemplates = ref(false)
const showCategoryMenu = ref(false)
const showVenueResults = ref(false)
const dragActive = ref(false)
const urlImageValue = ref('')
const tipIndex = ref(0)
const toast = ref('')
const published = ref(false)
const publishedResponse = ref(null)
const draftId = ref(null)
const isSaving = ref(false)
const isPublishing = ref(false)
const saveError = ref([])
const publishErrors = ref([])
const lastSavedAt = ref(null)
const errors = reactive({})
const ticketId = ref(0)
let toastTimer
let draftTimer
let clockTimer
let tipTimer

const activeTips = computed(() =>
  DEFAULT_CREATE_EVENT_TIPS.filter((tip) => tip.status === 'active').sort(
    (a, b) => a.sortOrder - b.sortOrder,
  ),
)

const currentTip = computed(
  () => activeTips.value[tipIndex.value]?.body || activeTips.value[0]?.body,
)

const publishedEvent = computed(() => publishedResponse.value?.data || {})
const publishedMessage = computed(
  () =>
    publishedResponse.value?.message ||
    'Share it and start collecting attendees. Your dashboard can track everything live.',
)
const publicEventRoute = computed(() => ({
  name: 'event-details',
  params: { id: publishedEvent.value.id || draftId.value, slug: useSlug().generateSlug(form.title) || 'event' },
}))
const publishedUrl = computed(() => new URL(router.resolve(publicEventRoute.value).href, window.location.origin).href)
async function copyPublishedLink() {
  try {
    await navigator.clipboard.writeText(publishedUrl.value)
    showToast('Event link copied')
  } catch {
    showToast('We could not copy the link. Select the link to copy it.')
  }
}
const lastSavedLabel = computed(() =>
  lastSavedAt.value
    ? `Saved ${lastSavedAt.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '',
)

const venueResults = computed(() => {
  const query = form.venue.toLowerCase().trim()
  if (!query) return []
  return venues
    .filter(([name, address]) =>
      `${name} ${address}`.toLowerCase().includes(query),
    )
    .slice(0, 5)
})

const selectedDetailTypes = computed(
  () => new Set(form.extraDetails.map((detail) => detail.type)),
)

const visibleTickets = computed(() =>
  form.tickets.filter((ticket) => ticket.visible),
)

const hasCommitments = (ticket) =>
  Number(ticket.inventory?.sold_units || 0) +
    Number(ticket.inventory?.reserved_units || 0) >
  0

const totalCapacity = computed(() =>
  form.tickets.reduce((sum, ticket) => {
    if (ticket.unitType === 'table')
      return sum + ticket.units * ticket.peoplePerUnit
    return sum + ticket.units
  }, 0),
)

const previewEvent = computed(() => ({
  id: 'preview',
  title: form.title || 'Your event name appears here',
  main_image: form.coverImage,
  date: toLocalDateTimeString(form.startsAt),
  event_timezone: eventTimeZone.value,
  location:
    form.format === 'online'
      ? 'Online event'
      : form.venue ||
        (form.format === 'hybrid' ? 'In-person & online' : 'Location TBC'),
  category: { name: form.category || 'Event' },
  ticket_mode: form.ticketMode,
  price:
    form.ticketMode === 'free'
      ? 0
      : visibleTickets.value.length
        ? Math.min(
            ...visibleTickets.value.map((ticket) => Number(ticket.price) || 0),
          )
        : null,
}))

const emailDate = computed(() => formatDateTime(form.startsAt))
const isMultiDayEvent = computed(() => {
  if (form.eventType !== 'one_time' || !form.startsAt || !form.endsAt)
    return false
  const start = new Date(form.startsAt)
  const end = new Date(form.endsAt)
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  )
    return false
  return (
    start.getFullYear() !== end.getFullYear() ||
    start.getMonth() !== end.getMonth() ||
    start.getDate() !== end.getDate()
  )
})
const multiDayDurationLabel = computed(() => {
  if (!isMultiDayEvent.value) return ''
  const totalMinutes = Math.floor(
    (new Date(form.endsAt).getTime() - new Date(form.startsAt).getTime()) /
      60_000,
  )
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  const parts = []
  if (days) parts.push(`${days} day${days === 1 ? '' : 's'}`)
  if (hours) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`)
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  return parts.join(', ')
})
const firstOccurrenceDate = computed(() =>
  form.startsAt ? new Date(form.startsAt) : null,
)
const firstOccurrenceWeekday = computed(
  () => firstOccurrenceDate.value?.getDay() ?? null,
)
const monthlyPattern = computed(() => deriveMonthlyPattern(form.startsAt))
const seriesEndMinDate = computed(() => {
  if (!firstOccurrenceDate.value) return toDateInputValue(venueToday.value)
  const minimum = new Date(firstOccurrenceDate.value)
  minimum.setDate(minimum.getDate() + 1)
  return toDateInputValue(minimum)
})
// Daily and weekly controls present the overall range while retaining the existing
// event-local start/end timestamps and recurrence end rule in saved data.
const isDailySchedule = computed(() => form.eventType === 'recurring' && form.recurrence.frequency === 'daily')
const isWeeklySchedule = computed(() => form.eventType === 'recurring' && form.recurrence.frequency === 'weekly')
const usesDateRange = computed(() => isDailySchedule.value || isWeeklySchedule.value)
function updateScheduleTiming(date, startTime, endTime) {
  Object.assign(scheduleTimingDraft, { date, startTime, endTime })
  const endDate = dateOnlyToDate(date)
  if (endDate && startTime && endTime < startTime) endDate.setDate(endDate.getDate() + 1)
  form.startsAt = date && startTime ? fromLocalDateTimeString(`${date}T${startTime}:00`) : null
  form.endsAt = endDate && endTime ? fromLocalDateTimeString(`${toDateInputValue(endDate)}T${endTime}:00`) : null
  clearError('startsAt')
  clearError('endsAt')
  if (!isEditMode.value && form.startsAt && !isStartDateTimeValid(form.startsAt, eventTimeZone.value, clock.value))
    setError('startsAt', 'Choose a start time at least 30 minutes from now.')
}
const scheduleStartDate = computed({
  get: () => form.startsAt ? toLocalDateTimeString(form.startsAt).slice(0, 10) : scheduleTimingDraft.date,
  set: value => updateScheduleTiming(value, scheduleStartTime.value, scheduleEndTime.value),
})
const scheduleStartTime = computed({
  get: () => form.startsAt ? toTimeInputValue(form.startsAt) : scheduleTimingDraft.startTime,
  set: value => updateScheduleTiming(scheduleStartDate.value, value, scheduleEndTime.value),
})
const scheduleEndTime = computed({
  get: () => form.endsAt ? toTimeInputValue(form.endsAt) : scheduleTimingDraft.endTime,
  set: value => updateScheduleTiming(scheduleStartDate.value, scheduleStartTime.value, value),
})
const scheduleEndDate = computed({
  get: () => {
    if (form.recurrence.seriesEndType === 'on_date') return form.recurrence.seriesEndDate
    const count = Number(form.recurrence.occurrenceCount)
    if (!form.startsAt || !Number.isSafeInteger(count) || count < 1) return ''
    if (isWeeklySchedule.value) {
      const end = generateOccurrences(form.startsAt, form.recurrence, count).at(-1)
      return end ? toDateInputValue(end) : ''
    }
    const end = new Date(form.startsAt)
    end.setDate(end.getDate() + count - 1)
    return Number.isNaN(end.getTime()) ? '' : toDateInputValue(end)
  },
  set: value => {
    form.recurrence.seriesEndType = 'on_date'
    form.recurrence.seriesEndDate = value
    clearError('repeatSchedule')
  },
})
const recurrenceOverlaps = computed(() =>
  form.eventType === 'recurring'
    ? scheduleHasOverlap(form.startsAt, form.endsAt, form.recurrence)
    : false,
)
const seriesEndValid = computed(() => {
  if (form.recurrence.seriesEndType === 'after_occurrences') {
    const count = Number(form.recurrence.occurrenceCount)
    return Number.isInteger(count) && count > 0
  }
  if (!form.recurrence.seriesEndDate || !firstOccurrenceDate.value) return false
  const endDate = dateOnlyToDate(form.recurrence.seriesEndDate)
  const startDate = new Date(firstOccurrenceDate.value)
  startDate.setHours(0, 0, 0, 0)
  return Boolean(endDate && endDate >= startDate)
})
const recurrenceReady = computed(() => {
  if (explicitSchedule.value) return !explicitScheduleError(form.recurrence, { publish: true, today: toDateInputValue(venueToday.value) })
  if (
    !form.recurrence.frequency ||
    !seriesEndValid.value ||
    recurrenceOverlaps.value
  )
    return false
  if (
    form.recurrence.frequency === 'weekly' &&
    !form.recurrence.weeklyDays.length
  )
    return false
  return true
})
const recurrenceInlineError = computed(() => {
  if (recurrenceOverlaps.value) {
    return 'Events overlap. Shorten the event or choose a different repeat pattern.'
  }
  if (
    form.recurrence.seriesEndType === 'on_date' &&
    form.recurrence.seriesEndDate &&
    !seriesEndValid.value
  ) {
    return 'Choose a repeat end date after your start date.'
  }
  if (
    form.recurrence.seriesEndType === 'after_occurrences' &&
    form.recurrence.occurrenceCount !== null &&
    form.recurrence.occurrenceCount !== '' &&
    !seriesEndValid.value
  ) {
    return 'Enter a whole number of events, starting at 1.'
  }
  return ''
})
const nextOccurrences = computed(() =>
  recurrenceReady.value
    ? generateOccurrences(form.startsAt, form.recurrence, 5)
    : [],
)
const recurrencePatternText = computed(() => {
  const recurrence = form.recurrence
  if (recurrence.frequency === 'daily') return 'Every day'
  if (recurrence.frequency === 'weekly') {
    const names = WEEKDAYS.filter((day) =>
      recurrence.weeklyDays.includes(day.value),
    ).map((day) => day.label)
    return names.length ? `Every week on ${joinWithAnd(names)}` : 'Every week'
  }
  if (recurrence.frequency === 'monthly') {
    if (recurrence.monthlyMode === 'nth_weekday') {
      const weekday = WEEKDAYS.find(
        (day) => day.value === recurrence.nthWeekday.weekday,
      )?.label
      return `Every month on the ${ordinalWord(recurrence.nthWeekday.ordinal)} ${weekday || ''}`.trim()
    }
    return `Every month on the ${ordinalNumber(recurrence.dayOfMonth)}`
  }
  return 'Choose a repeat pattern'
})
const seriesEndText = computed(() => {
  if (form.recurrence.seriesEndType === 'after_occurrences') {
    const count = Number(form.recurrence.occurrenceCount)
    return count > 0
      ? `After ${count} event${count === 1 ? '' : 's'}`
      : 'Choose how many events'
  }
  return form.recurrence.seriesEndDate
    ? `Until ${formatReviewDate(form.recurrence.seriesEndDate)}`
    : 'End date not set'
})
const canContinue = computed(() => isStepComplete(currentStep.value))
function tomorrowAt(hour) {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(hour, 0, 0, 0)
  return date
}

function formatDateTime(value) {
  if (!value) return 'Date and time'
  return new Date(`${toLocalDateTimeString(value)}Z`).toLocaleString('en-NG', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatReviewDate(value) {
  if (!value) return 'Date not set'
  const parts = new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(new Date(value))
  const byType = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )
  return `${byType.day} ${byType.month} ${byType.year}`
}

function joinWithAnd(values) {
  if (values.length <= 1) return values[0] || ''
  if (values.length === 2) return `${values[0]} and ${values[1]}`
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`
}

function ordinalNumber(value) {
  const number = Number(value)
  if (!number) return ''
  const remainder = number % 100
  if (remainder >= 11 && remainder <= 13) return `${number}th`
  return `${number}${{ 1: 'st', 2: 'nd', 3: 'rd' }[number % 10] || 'th'}`
}

function ordinalWord(value) {
  return (
    ['', 'first', 'second', 'third', 'fourth', 'fifth'][Number(value)] || ''
  )
}

function formatOccurrenceDate(value) {
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function formatTimeRange() {
  return `${formatTimeLabel(form.startsAt ? toTimeInputValue(form.startsAt) : '')} to ${formatTimeLabel(
    form.endsAt ? toTimeInputValue(form.endsAt) : '',
  )}`
}
function toDateInputValue(value) {
  const date = value ? new Date(value) : new Date()
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

function dateOnlyToDate(value) {
  if (!value) return null
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function formatTimeLabel(value) {
  if (!value) return 'time not set'
  const [hourValue, minute = '00'] = value.split(':')
  let hour = Number(hourValue)
  const period = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  return `${hour}:${minute} ${period}`
}

function toTimeInputValue(value) {
  return toLocalDateTimeString(value || new Date()).slice(11, 16)
}

function showToast(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2400)
}

function markDraftSaved() {
  draftSaved.value = true
  clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    draftSaved.value = false
  }, 2200)
}

const backendErrorMap = {
  title: { field: 'title', step: 1 },
  startsAt: { field: 'startsAt', step: 1 },
  startsAtLocal: { field: 'startsAt', step: 1 },
  endsAt: { field: 'endsAt', step: 1 },
  endsAtLocal: { field: 'endsAt', step: 1 },
  timeZone: { field: 'timeZone', step: 1 },
  city: { field: 'city', step: 1 },
  description: { field: 'description', step: 2 },
  organiser: { field: 'organiser', step: 2 },
  organiserWebsite: { field: 'organiserWebsite', step: 2 },
  secondaryImages: { field: 'coverImage', step: 2 },
  freeCapacity: { field: 'freeCapacity', step: 3 },
  ticketMode: { field: 'tickets', step: 3 },
  category: { field: 'category', step: 1 },
  coverImage: { field: 'coverImage', step: 2 },
  venue: { field: 'venue', step: 1 },
  meetingLink: { field: 'meetingLink', step: 1 },
  tickets: { field: 'tickets', step: 3 },
  ticketPrice: { field: 'tickets', step: 3 },
  recurrence: { field: 'repeatSchedule', step: 1 },
  seriesEnd: { field: 'repeatSchedule', step: 1 },
}

function normalizeRequestErrors(error) {
  const responseErrors = error?.response?.data?.errors
  if (typeof responseErrors === 'string')
    return [{ key: 'request', message: responseErrors }]
  if (responseErrors && typeof responseErrors === 'object') {
    return Object.entries(responseErrors).flatMap(([key, value]) => {
      const messages = Array.isArray(value) ? value : [value]
      return messages.map((message) => ({ key, message: String(message) }))
    })
  }

  return [
    {
      key: 'request',
      message:
        error?.userMessage ||
        error?.response?.data?.message ||
        error?.message ||
        'We could not save your event. Please try again.',
    },
  ]
}

function backendErrorTarget(key) {
  const match = key.match(/^tickets\.(\d+)\.(.+)$/)
  if (match) {
    const ticket = form.tickets[Number(match[1])]
    const field = match[2].replace(/Local$/, '')
    if (ticket) return { field: `ticket-${ticket.id}-${field}`, step: 3 }
  }
  const rootKey = key.split('.')[0]
  if (backendErrorMap[key] || backendErrorMap[rootKey]) {
    return backendErrorMap[key] || backendErrorMap[rootKey]
  }
  if (rootKey.startsWith('ticketPrice')) return backendErrorMap.ticketPrice
  if (rootKey.startsWith('seriesEnd')) return backendErrorMap.seriesEnd
  return null
}

function applyBackendErrors(requestErrors, navigate = false) {
  Object.keys(errors).forEach(clearError)

  requestErrors.forEach(({ key, message }) => {
    const target = backendErrorTarget(key)
    if (!target) return
    errors[target.field] = errors[target.field]
      ? `${errors[target.field]} ${message}`
      : message
  })

  if (!navigate) return
  const firstTarget = requestErrors
    .map(({ key }) => backendErrorTarget(key))
    .find(Boolean)
  if (!firstTarget) return

  maxStepReached.value = Math.max(maxStepReached.value, firstTarget.step)
  currentStep.value = firstTarget.step
  requestAnimationFrame(() => {
    document
      .querySelector(`[data-error-key="${firstTarget.field}"]`)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
  })
}

async function persistDraft() {
  const response = draftId.value
    ? await updateEventDraft(draftId.value, form)
    : await createEventDraft(form)

  acceptSavedEvent(response.data)

  lastSavedAt.value = new Date()
  markDraftSaved()
  return response
}

async function saveDraft() {
  if (isEditMode.value && editorStatus.value === 'active') {
    await saveEventChanges()
    return
  }
  if (
    isSaving.value ||
    isPublishing.value ||
    conflict.value ||
    editorLoading.value ||
    editorLoadError.value
  )
    return

  isSaving.value = true
  saveError.value = []
  publishErrors.value = []
  try {
    await persistDraft()
  } catch (error) {
    saveError.value = normalizeRequestErrors(error)
    applyBackendErrors(saveError.value, error.response?.status === 422)
    await handleWriteError(error)
  } finally {
    isSaving.value = false
  }
}

function togglePreview() {
  previewOn.value = !previewOn.value
  window.localStorage?.setItem(
    'kaka-create-preview',
    previewOn.value ? 'true' : 'false',
  )
}

function applyTheme(value) {
  if (themeController?.applyTheme) {
    themeController.applyTheme(value)
    return
  }
  fallbackTheme.value = value
  const root = document.documentElement
  const token = ++themeInstantToken
  root.classList.add('theme-instant')
  void root.offsetHeight
  root.classList.toggle('light', value === 'light')
  const releaseInstantTheme = () => {
    if (themeInstantToken === token) root.classList.remove('theme-instant')
  }
  if (window.requestAnimationFrame) {
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(releaseInstantTheme),
    )
  } else {
    releaseInstantTheme()
  }
  window.localStorage?.setItem(themePreferenceKey, value)
}

function initializeTheme() {
  if (themeController?.theme) return
  const stored = window.localStorage?.getItem(themePreferenceKey)
  if (stored === 'light' || stored === 'dark') {
    applyTheme(stored)
    return
  }
  const prefersLight =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  applyTheme(prefersLight ? 'light' : 'dark')
}

function toggleTheme() {
  if (themeController?.toggleTheme) {
    themeController.toggleTheme()
    return
  }
  playThemeToggleClick()
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}

function setStep(step) {
  if (step > maxStepReached.value) return
  if (step === currentStep.value || isStepLoading.value) return
  const token = ++stepLoadingToken
  const rtt = Number(navigator.connection?.rtt) || 120
  const duration = Math.min(1450, Math.max(1050, 900 + rtt))
  loadingStep.value = step
  isStepLoading.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
  window.setTimeout(() => {
    if (token !== stepLoadingToken) return
    currentStep.value = step
    isStepLoading.value = false
  }, duration)
}

function goNext() {
  if (!validateStep(currentStep.value)) return
  if (currentStep.value < steps.length) {
    maxStepReached.value = Math.max(maxStepReached.value, currentStep.value + 1)
    setStep(currentStep.value + 1)
  }
}

function goBack() {
  if (currentStep.value > 1) setStep(currentStep.value - 1)
}

function handleHeaderBack() {
  if (currentStep.value > 1) {
    goBack()
    return
  }
  router.push('/')
}

function isStepComplete(step) {
  if (step === 1) {
    if (!form.title.trim()) return false
    if (!explicitSchedule.value && (!form.startsAt || !form.endsAt)) return false
    if (
      form.endsAt &&
      form.startsAt &&
      new Date(form.endsAt) <= new Date(form.startsAt)
    ) {
      return false
    }
    if (form.format !== 'online' && !form.venue.trim()) return false
    if (
      (form.format === 'online' || form.format === 'hybrid') &&
      !form.meetingLink.trim()
    ) {
      return false
    }
    if (!form.category) return false
    if (usesDateRange.value && !isEditMode.value && !isStartDateTimeValid(form.startsAt, eventTimeZone.value, clock.value)) return false
    if (form.eventType === 'recurring') return recurrenceReady.value
    return true
  }

  if (step === 2) return Boolean(form.coverImage)

  if (step === 3 && form.ticketMode === 'paid') {
    return (
      form.tickets.length > 0 &&
      form.tickets.every(
        (ticket) => ticket.name.trim() && Number(ticket.price) > 0,
      )
    )
  }

  return true
}

function setError(key, message) {
  errors[key] = message
}

function clearError(key) {
  delete errors[key]
}

function validateStep(step) {
  Object.keys(errors).forEach(clearError)

  if (step === 1) {
    if (!isValidTimeZone(form.venueTimezone))
      setError(
        'timeZone',
        'Choose a valid IANA timezone, such as Africa/Lagos.',
      )
    if (form.title.length > 100)
      setError('title', 'Use 100 characters or fewer for the event name.')
    if (form.meetingLink && !/^https?:\/\//i.test(form.meetingLink))
      setError('meetingLink', 'Enter a meeting link starting with http:// or https://.')
    if (!form.title.trim()) setError('title', 'Enter an event name.')
    if (!explicitSchedule.value && !form.startsAt)
      setError('startsAt', 'Choose a start date and time.')
    if (!explicitSchedule.value && !form.endsAt) setError('endsAt', 'Choose an end date and time.')
    if (usesDateRange.value && !isEditMode.value && form.startsAt && !isStartDateTimeValid(form.startsAt, eventTimeZone.value, clock.value))
      setError('startsAt', 'Choose a start time at least 30 minutes from now.')
    if (
      form.endsAt &&
      form.startsAt &&
      new Date(form.endsAt) <= new Date(form.startsAt)
    ) {
      setError('endsAt', 'End time must be after the start time.')
    }
    if (form.format !== 'online' && !form.venue.trim()) {
      setError('venue', 'Enter the venue or address.')
    }
    if (
      (form.format === 'online' || form.format === 'hybrid') &&
      !form.meetingLink.trim()
    ) {
      setError(
        'meetingLink',
        'Please add the meeting link for online attendees.',
      )
    }
    if (!form.category) setError('category', 'Choose a category.')
    if (explicitSchedule.value) {
      const scheduleError = explicitScheduleError(form.recurrence, { publish: true, today: toDateInputValue(venueToday.value) })
      if (scheduleError) setError('repeatSchedule', scheduleError)
    } else if (form.eventType === 'recurring') {
      if (!form.recurrence.frequency) {
        setError('repeatSchedule', 'Choose how often this event repeats.')
      } else if (
        form.recurrence.frequency === 'weekly' &&
        !form.recurrence.weeklyDays.length
      ) {
        setError('repeatSchedule', 'Choose at least one weekday.')
      } else if (
        form.recurrence.seriesEndType === 'on_date' &&
        !form.recurrence.seriesEndDate
      ) {
        setError('repeatSchedule', 'Choose when to stop repeating.')
      } else if (!seriesEndValid.value) {
        setError(
          'repeatSchedule',
          form.recurrence.seriesEndType === 'after_occurrences'
            ? 'Enter a whole number of events, starting at 1.'
            : 'Choose a repeat end date after your start date.',
        )
      } else if (recurrenceOverlaps.value) {
        setError(
          'repeatSchedule',
          'Events overlap. Shorten the event or choose a different repeat pattern.',
        )
      }
    }
  }

  if (step === 2) {
    if (
      form.description.length > 20000 ||
      new TextEncoder().encode(form.description).length > 65535
    )
      setError('description', 'Shorten the event description before saving.')
    if (form.organiser.length > 100)
      setError('organiser', 'Keep the organiser name within 100 characters.')
    if (
      form.organiserWebsite &&
      (!/^https?:\/\//i.test(form.organiserWebsite) ||
        form.organiserWebsite.length > 500)
    )
      setError(
        'organiserWebsite',
        'Enter a website link starting with http:// or https://, up to 500 characters.',
      )
  }
  if (step === 2 && !form.coverImage) {
    setError(
      'coverImage',
      'Add a cover photo for your event.',
    )
  }

  if (step === 3 && form.ticketMode === 'paid') {
    if (!form.tickets.length)
      setError('tickets', 'Add at least one paid ticket type.')
    form.tickets.forEach((ticket) => {
      if (!ticket.name.trim())
        setError(`ticket-${ticket.id}-name`, 'Enter a ticket name.')
      if (
        !/^\d+(?:\.\d{1,2})?$/.test(String(ticket.price)) ||
        Number(ticket.price) <= 0 ||
        Number(ticket.price) > 999999.99
      )
        setError(
          `ticket-${ticket.id}-price`,
          'Enter a price above 0 and up to 999,999.99, with no more than two decimal places.',
        )
      if (ticket.name.length > 50)
        setError(
          `ticket-${ticket.id}-name`,
          'Use 50 characters or fewer for the ticket name.',
        )
      if (
        !Number.isInteger(Number(ticket.units)) ||
        Number(ticket.units) < 0 ||
        Number(ticket.units) > 1000000
      )
        setError(
          `ticket-${ticket.id}-units`,
          'Enter 0 to 1,000,000 tickets or tables. Zero means none available.',
        )
      if (
        Number(ticket.units) <
        Number(ticket.inventory?.sold_units || 0) +
          Number(ticket.inventory?.reserved_units || 0)
      )
        setError(
          `ticket-${ticket.id}-units`,
          'Keep enough tickets or tables for existing sales and reservations.',
        )
      if (
        ticket.unitType === 'table' &&
        (!Number.isInteger(Number(ticket.peoplePerUnit)) ||
          Number(ticket.peoplePerUnit) < 1 ||
          Number(ticket.peoplePerUnit) > 10000)
      )
        setError(
          `ticket-${ticket.id}-peoplePerUnit`,
          'Enter 1 to 10,000 people per table.',
        )
      if (
        ticket.maxPerPerson != null &&
        ticket.maxPerPerson !== '' &&
        (!Number.isInteger(Number(ticket.maxPerPerson)) ||
          Number(ticket.maxPerPerson) < 1 ||
          Number(ticket.maxPerPerson) > 1000000)
      )
        setError(
          `ticket-${ticket.id}-maxPerPerson`,
          'Enter a purchase limit from 1 to 1,000,000.',
        )
      if (
        ticket.salesStart &&
        ticket.salesEnd &&
        !isAfter(ticket.salesEnd, ticket.salesStart)
      ) {
        setError(
          `ticket-${ticket.id}-salesEnd`,
          'Sales must end after they start.',
        )
      }
      if (
        ticket.salesEnd &&
        form.endsAt &&
        isAfter(ticket.salesEnd, form.endsAt)
      ) {
        setError(
          `ticket-${ticket.id}-salesEnd`,
          'Ticket sales must end by the event end time.',
        )
      }
    })
  }

  if (
    step === 3 &&
    form.ticketMode === 'free' &&
    form.freeCapacity !== '' &&
    (!Number.isInteger(Number(form.freeCapacity)) ||
      Number(form.freeCapacity) < 0 ||
      Number(form.freeCapacity) > 1000000)
  )
    setError('freeCapacity', 'Enter a guest limit from 0 to 1,000,000.')
  if (step === 3 && totalCapacity.value > 2147483647)
    setError('tickets', 'Lower the total guest limit before saving.')

  const firstError = Object.keys(errors)[0]
  if (firstError) {
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-error-key="${firstError}"]`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
    })
    return false
  }
  return true
}

function pickVenue(name, timeZone) {
  form.venue = name
  form.venueTimezone = timeZone || ''
  showVenueResults.value = false
  clearError('venue')
}

function selectCategory(category) {
  form.category = category.name
  showCategoryMenu.value = false
  clearError('category')
}

function selectEventType(type) {
  if (type === 'recurring' && !legacyScheduleLoaded.value && form.eventType !== 'recurring') {
    oneTimeTiming.value = { startsAt: form.startsAt, endsAt: form.endsAt }
    if (!isExplicitSchedule(form.recurrence)) form.recurrence = createExplicitSchedule()
    form.startsAt = null
    form.endsAt = null
  } else if (type === 'one_time' && isExplicitSchedule(form.recurrence) && oneTimeTiming.value) {
    Object.assign(form, oneTimeTiming.value)
  }
  form.eventType = type
  clearError('repeatSchedule')
  if (type === 'recurring' && form.recurrence.frequency === 'weekly') {
    ensureFirstOccurrenceWeekday()
  }
}

function selectRepeatRhythm(frequency) {
  form.recurrence.frequency = frequency
  if (frequency === 'weekly') ensureFirstOccurrenceWeekday()
  if (frequency === 'monthly') syncMonthlyPattern()
  clearError('repeatSchedule')
}

function ensureFirstOccurrenceWeekday() {
  const weekday = firstOccurrenceWeekday.value
  if (weekday === null || form.recurrence.weeklyDays.includes(weekday)) return
  form.recurrence.weeklyDays.push(weekday)
  form.recurrence.weeklyDays.sort((left, right) => left - right)
}

function toggleWeeklyDay(day) {
  if (day === firstOccurrenceWeekday.value) return
  if (form.recurrence.weeklyDays.includes(day)) {
    form.recurrence.weeklyDays = form.recurrence.weeklyDays.filter(
      (value) => value !== day,
    )
  } else {
    form.recurrence.weeklyDays.push(day)
    form.recurrence.weeklyDays.sort((left, right) => left - right)
  }
  clearError('repeatSchedule')
}

function syncMonthlyPattern() {
  if (isExplicitSchedule(form.recurrence)) return
  form.recurrence.dayOfMonth = monthlyPattern.value.dayOfMonth
  form.recurrence.nthWeekday.ordinal = monthlyPattern.value.ordinal
  form.recurrence.nthWeekday.weekday = monthlyPattern.value.weekday
}

function setMonthlyMode(mode) {
  form.recurrence.monthlyMode = mode
  syncMonthlyPattern()
  clearError('repeatSchedule')
}

function setSeriesEndType(type) {
  form.recurrence.seriesEndType = type
  clearError('repeatSchedule')
}

const flyerFormat = ref('4:5')
const flyerFormats = [{ value: '4:5', label: 'Portrait ? 4:5', width: 1080, height: 1350 }, { value: '9:16', label: 'Tall portrait ? 9:16', width: 1080, height: 1920 }, { value: '16:9', label: 'Landscape ? 16:9', width: 1600, height: 900 }, { value: '3:2', label: 'Wide landscape ? 3:2', width: 1500, height: 1000 }]

async function handleFiles(files) {
  dragActive.value = false
  for (const file of Array.from(files)) {
    if (
      !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
        file.type,
      ) ||
      file.size > 5 * 1024 * 1024
    ) {
      showToast('Choose a JPEG, PNG, GIF or WebP image up to 5 MB.')
      continue
    }
    if (form.secondaryImages.length + (form.coverImage ? 1 : 0) >= 6) break
    try {
      const bitmap = await createImageBitmap(file)
      const pixels = bitmap.width * bitmap.height
      if (pixels > 40000000) {
        bitmap.close()
        showToast('Choose an image with no more than 40 million pixels.')
        continue
      }
      const format = flyerFormats.find(format => format.value === flyerFormat.value)
      const canvas = document.createElement('canvas')
      canvas.width = format.width
      canvas.height = format.height
      const context = canvas.getContext('2d')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      const scale = Math.max(canvas.width / bitmap.width, canvas.height / bitmap.height)
      context.drawImage(bitmap, (canvas.width - bitmap.width * scale) / 2, (canvas.height - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale)
      bitmap.close()
      const src = canvas.toDataURL('image/jpeg', 0.92)
      if (!form.coverImage) form.coverImage = src
      else form.secondaryImages.push(src)
      clearError('coverImage')
    } catch {
      showToast('We could not read this image. Please choose another file.')
    }
  }
}

function addUrlImage() {
  const url = urlImageValue.value.trim()
  if (!url || !/^https?:\/\//i.test(url) || url.length > 2000) {
    showToast('Use an HTTP or HTTPS image URL within 2,000 characters.')
    return
  }
  if (form.secondaryImages.includes(url) || form.coverImage === url) return
  if (form.secondaryImages.length >= 20) {
    showToast('You can add up to 20 gallery images.')
    return
  }
  if (!form.coverImage) form.coverImage = url
  else form.secondaryImages.push(url)
  form.urlImages.push(url)
  urlImageValue.value = ''
  clearError('coverImage')
}

function setCover(src, secondaryIndex = null) {
  if (secondaryIndex !== null) {
    const previousCover = form.coverImage
    form.coverImage = src
    form.secondaryImages.splice(secondaryIndex, 1)
    if (previousCover) form.secondaryImages.unshift(previousCover)
  } else {
    form.coverImage = src
  }
}

function removeCover() {
  form.coverImage = form.secondaryImages.shift() || ''
}

function removeSecondaryImage(index) {
  form.secondaryImages.splice(index, 1)
}

function applyCoverTemplate(gradient) {
  form.coverGradient = gradient
  showTemplates.value = false
}

function addDetail(option) {
  if (selectedDetailTypes.value.has(option.type)) return
  form.extraDetails.push({
    type: option.type,
    label: option.label,
    icon: option.icon,
    value: '',
  })
}

function removeDetail(type) {
  form.extraDetails = form.extraDetails.filter((detail) => detail.type !== type)
}

function selectTicketMode(mode) {
  form.ticketMode = mode
  clearError('tickets')
}

function addTicket(
  template = { name: '', unitType: 'individual', color: '#3d3935', price: 0 },
) {
  if (form.tickets.length >= 100) {
    showToast('You can add up to 100 ticket products.')
    return
  }
  form.tickets.push({
    id: `new-${++ticketId.value}`,
    name: template.name,
    unitType: template.unitType,
    color: template.color,
    price: template.price,
    units: 0,
    peoplePerUnit: template.unitType === 'table' ? 10 : 1,
    maxPerPerson: 1,
    visible: true,
    perks: '',
    salesStart: '',
    salesEnd: '',
  })
  clearError('tickets')
}

function removeTicket(id) {
  form.tickets = form.tickets.filter((ticket) => ticket.id !== id)
}

function ticketSeatCount(ticket) {
  return ticket.unitType === 'table'
    ? ticket.units * ticket.peoplePerUnit
    : ticket.units
}

async function publishEvent() {
  if (isEditMode.value && editorStatus.value === 'active') {
    await saveEventChanges()
    return
  }
  if (
    isSaving.value ||
    isPublishing.value ||
    conflict.value ||
    editorLoading.value ||
    editorLoadError.value
  )
    return
  if (!validateStep(1)) {
    currentStep.value = 1
    return
  }
  if (!validateStep(2)) {
    currentStep.value = 2
    return
  }
  if (!validateStep(3)) {
    currentStep.value = 3
    return
  }

  isPublishing.value = true
  saveError.value = []
  publishErrors.value = []

  try {
    await persistDraft()
    const response = await publishEventRequest(draftId.value, form.version)
    acceptSavedEvent(response.data)
    publishedResponse.value = response
    published.value = true
    usePublishGuidanceStore().begin(response.data.id || draftId.value, form.title)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    publishErrors.value = normalizeRequestErrors(error)
    applyBackendErrors(publishErrors.value, error?.response?.status === 422)
    await handleWriteError(error)
  } finally {
    isPublishing.value = false
  }
}

onMounted(async () => {
  initializeTheme()
  void loadCategories()
  clockTimer = setInterval(() => {
    clock.value = new Date()
  }, 60_000)
  tipTimer = setInterval(() => {
    tipIndex.value = (tipIndex.value + 1) % activeTips.value.length
  }, 7000)
  if (isEditMode.value) await loadEventForEditing()
})

onBeforeUnmount(() => {
  clearInterval(clockTimer)
  clearInterval(tipTimer)
  clearTimeout(toastTimer)
  clearTimeout(draftTimer)
})

watch(
  () => form.startsAt,
  (value) => {
    if (hydrating.value || explicitSchedule.value) return
    if (
      value &&
      isStartDateTimeValid(value, eventTimeZone.value, clock.value)
    ) {
      clearError('startsAt')
    }
    if (value && form.endsAt && !isAfter(form.endsAt, value)) {
      form.endsAt = null
      setError('endsAt', 'End time must be after the start time.')
    }
    syncMonthlyPattern()
    if (
      form.eventType === 'recurring' &&
      form.recurrence.frequency === 'weekly'
    ) {
      ensureFirstOccurrenceWeekday()
    }
    if (
      form.recurrence.seriesEndType === 'on_date' &&
      form.recurrence.seriesEndDate &&
      !seriesEndValid.value
    ) {
      form.recurrence.seriesEndDate = ''
      setError(
        'repeatSchedule',
        'Choose a new repeat end date after your start date.',
      )
    }
  },
)

watch(
  () => form.endsAt,
  (value) => {
    if (hydrating.value) return
    if (value && form.startsAt && isAfter(value, form.startsAt))
      clearError('endsAt')
  },
)
watch(
  () => form.recurrence,
  () => {
    if (errors.repeatSchedule && recurrenceReady.value)
      clearError('repeatSchedule')
  },
  { deep: true },
)
watch(
  () => form.venueTimezone,
  (timeZone, previousTimeZone) => {
    if (hydrating.value || timeZone === previousTimeZone) return
    try {
      new Intl.DateTimeFormat('en', { timeZone }).format()
      for (const [source, keys] of [
        [form, ['startsAt', 'endsAt']],
        ...form.tickets.map((ticket) => [ticket, ['salesStart', 'salesEnd']]),
      ]) {
        for (const key of keys) {
          const saved = source._savedTimes?.[key]
          if (
            saved?.instant &&
            saved.local === toLocalDateTimeString(source[key])
          ) {
            source[key] = instantToLocalDate(saved.instant, timeZone)
            saved.local = toLocalDateTimeString(source[key])
            saved.timeZone = timeZone
          }
        }
      }
      clearError('timeZone')
    } catch {
      setError(
        'timeZone',
        'Choose a valid IANA timezone, such as Africa/Lagos.',
      )
    }
  },
)
</script>

<template>
  <div class="create-event-page" :class="[{ 'ce-embedded': embedded }, theme === 'dark' ? 'is-dark' : 'is-light']">
    <div v-if="toast" class="ce-toast">{{ toast }}</div>

    <header v-if="!published && !embedded" class="ce-header">
      <RouterLink to="/" class="ce-logo" aria-label="Go home">
        <img
          :src="brandLogoUrl"
          alt="Rush Hour"
        />
      </RouterLink>
      <button
        type="button"
        class="ce-header-back"
        :aria-label="currentStep > 1 ? 'Back to previous step' : 'Back to home'"
        @click="handleHeaderBack"
      >
        <ArrowLeftIcon aria-hidden="true" />
      </button>
      <nav class="ce-progress" aria-label="Create event progress">
        <button
          v-for="(step, index) in steps"
          :key="step"
          type="button"
          class="ce-step"
          :class="{
            active: currentStep === index + 1,
            done: maxStepReached > index + 1 && currentStep !== index + 1,
            future: maxStepReached < index + 1,
          }"
          :disabled="maxStepReached < index + 1"
          @click="setStep(index + 1)"
        >
          <span class="ce-step-number">{{ index + 1 }}</span>
          <span>{{ step }}</span>
        </button>
      </nav>
      <div class="ce-header-actions">
        <button
          type="button"
          class="theme-btn"
          @click="toggleTheme"
          :aria-label="theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
        >
          <MoonIcon v-if="theme === 'light'" aria-hidden="true" />
          <SunIcon v-else aria-hidden="true" />
        </button>
        <span class="draft-badge" :class="{ show: draftSaved || lastSavedAt }">
          <CheckIcon aria-hidden="true" /> {{ draftSaved ? 'Draft saved' : lastSavedLabel }}
        </span>
        <button
          type="button"
          class="ghost-btn"
          :disabled="isSaving || isPublishing || conflict || editorLoading || Boolean(editorLoadError)"
          @click="saveDraft"
         :aria-busy="isSaving">
          {{ isSaving ? 'Saving...' : editorStatus === 'active' ? 'Save changes' : 'Save draft' }}
        </button>
      </div>
    </header>

    <main v-if="!published" class="ce-wrap">
      <EventEditorConflict v-if="conflict" :record="conflictRecord" :loading="conflictLoading" :error="conflictError" @retry="loadConflictRecord" @reload="reloadConflictedEvent" />
      <div v-if="editorLoading || editorLoadError" class="api-error-summary" role="status">
        {{ editorLoading ? 'Getting your event ready...' : editorLoadError }}
        <button v-if="editorLoadError" type="button" @click="loadEventForEditing">Try again</button>
      </div>
      <div v-if="saveError.length || publishErrors.length" class="api-error-summary" role="alert">
        <strong>{{ publishErrors.length ? 'We could not publish this event.' : 'We could not save this draft.' }}</strong>
        <ul>
          <li
            v-for="error in (publishErrors.length ? publishErrors : saveError)"
            :key="error.key + error.message"
          >
            {{ error.message }}
          </li>
        </ul>
      </div>

      <div v-if="!embedded" class="preview-toggle">
        <span>See your event as attendees will</span>
        <button type="button" class="preview-btn" :class="{ on: previewOn }" @click="togglePreview">
          <EyeIcon v-if="previewOn" aria-hidden="true" />
          <EyeSlashIcon v-else aria-hidden="true" />
          Preview: {{ previewOn ? 'On' : 'Off' }}
        </button>
      </div>

      <div v-if="!editorLoading && !editorLoadError" :inert="isSaving || isPublishing" class="ce-columns" :class="{ 'preview-off': !previewOn }">
        <CreateEventStepSkeleton v-if="isStepLoading" :step="loadingStep" :preview-on="previewOn" />
        <section v-if="!isStepLoading" class="ce-form">
          <div v-if="embedded ? editorSection === 'details' : currentStep === 1" class="screen">
            <div v-if="!embedded" class="screen-head">
              <h1>
                Let's build your<br /><em>event.</em>
                <SparklesIcon class="headline-icon" aria-hidden="true" />
              </h1>
              <p>Start with the basics. You can update these details later.</p>
            </div>

            <div class="ce-card">
              <div class="field" data-error-key="title">
                <label for="event-name">Event name</label>
                <input
                  id="event-name"
                  v-model="form.title"
                  class="field-input field-input-xl"
                  :class="{ error: errors.title }"
                  maxlength="100"
                  placeholder="e.g. Lagos Tech Summit 2026"
                  @input="clearError('title')"
                />
                <p v-if="errors.title" class="error-text">{{ errors.title }}</p>
              </div>

              <div class="divider"><span>Event type</span></div>
              <div class="pill-row event-type-options" role="group" aria-label="Event type">
                <button type="button" class="pill" :class="{ selected: form.eventType === 'one_time' }" :aria-pressed="form.eventType === 'one_time'" @click="selectEventType('one_time')">
                  <CalendarDaysIcon aria-hidden="true" /> One-time
                </button>
                <button type="button" class="pill" :class="{ selected: form.eventType === 'recurring' }" :aria-pressed="form.eventType === 'recurring'" @click="selectEventType('recurring')">
                  <ClockIcon aria-hidden="true" /> Recurring
                </button>
              </div>
              <RecurringEventSection v-if="explicitSchedule" v-model="form.recurrence" :today="toDateInputValue(venueToday)" :error="errors.repeatSchedule" @update:model-value="clearError('repeatSchedule')" />
              <template v-else>
              <div class="divider"><span>When</span></div>
              <section v-if="form.eventType === 'recurring'" class="recurrence-step recurrence-frequency" :class="{ 'recurring-range': usesDateRange }" data-error-key="repeatSchedule">
                <span class="recurrence-label">How often?</span>
                <div class="repeat-frequency-row" role="group" aria-label="Repeat frequency">
                  <button
                    v-for="option in repeatRhythmOptions"
                    :key="option.value"
                    type="button"
                    class="repeat-frequency-pill"
                    :class="{ selected: form.recurrence.frequency === option.value }"
                    :aria-pressed="form.recurrence.frequency === option.value"
                    @click="selectRepeatRhythm(option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
                <p v-if="!form.recurrence.frequency && errors.repeatSchedule" class="error-text">{{ errors.repeatSchedule }}</p>
              </section>
              <section v-if="usesDateRange" class="recurring-range recurring-range-fields" :aria-label="isWeeklySchedule ? 'Weekly event dates and times' : 'Daily event dates and times'">
                <div class="two-col">
                  <div class="field" data-error-key="startsAt">
                    <label for="recurring-start-date">{{ isWeeklySchedule ? 'Overall start date' : 'Start date' }}</label>
                    <input id="recurring-start-date" v-model="scheduleStartDate" type="date" class="field-input" :min="isEditMode ? undefined : toDateInputValue(venueToday)" :aria-invalid="Boolean(errors.startsAt)" />
                    <p v-if="errors.startsAt" class="error-text">{{ errors.startsAt }}</p>
                  </div>
                  <div class="field">
                    <label for="recurring-end-date">{{ isWeeklySchedule ? 'Overall end date' : 'End date' }}</label>
                    <input id="recurring-end-date" v-model="scheduleEndDate" type="date" class="field-input" :min="scheduleStartDate" :aria-invalid="Boolean(errors.repeatSchedule || recurrenceInlineError)" />
                  </div>
                </div>
                <div class="two-col">
                  <div class="field">
                    <label for="recurring-start-time">Start time</label>
                    <input id="recurring-start-time" v-model="scheduleStartTime" type="time" class="field-input" :aria-invalid="Boolean(errors.startsAt)" />
                  </div>
                  <div class="field" data-error-key="endsAt">
                    <label for="recurring-end-time">End time</label>
                    <input id="recurring-end-time" v-model="scheduleEndTime" type="time" class="field-input" :aria-invalid="Boolean(errors.endsAt)" />
                    <p v-if="errors.endsAt" class="error-text">{{ errors.endsAt }}</p>
                  </div>
                </div>
                <p v-if="isDailySchedule" class="help">Your event runs every day between these dates, at the same times.</p>
                <p v-else class="help">Choose the date range, event times, and weekdays.</p>
                <p v-if="form.startsAt && form.endsAt && toDateInputValue(form.endsAt) > scheduleStartDate" class="help">Each event ends the following day.</p>
              </section>
              <template v-if="!usesDateRange && (form.eventType !== 'recurring' || form.recurrence.frequency)">
                <p v-if="form.eventType === 'recurring'" class="help recurrence-timing-help">Choose when your event starts and ends. These times repeat on your chosen days.</p>
                <div class="two-col">
                  <div data-error-key="startsAt">
                    <DateTimePickerInput
                      v-model="form.startsAt"
                      label="Starts"
                      placeholder="Select start date and time"
                      modal-title="Select start date and time"
                      :min-date="isEditMode ? null : venueToday"
                      :min-date-time="minimumStartDateTime"
                      invalid-time-message="Choose a start time at least 30 minutes from now."
                      :error="errors.startsAt"
                      date-format="YYYY-MM-DD"
                      time-format="hh:mm A"
                    />
                  </div>
                  <div data-error-key="endsAt">
                    <DateTimePickerInput
                      v-model="form.endsAt"
                      label="Ends"
                      placeholder="Select end date and time"
                      modal-title="Select end date and time"
                      :min-date="form.startsAt || (isEditMode ? null : venueToday)"
                      :min-date-time="minimumEndDateTime"
                      invalid-time-message="End time must be after the start time."
                      :error="errors.endsAt"
                      date-format="YYYY-MM-DD"
                      time-format="hh:mm A"
                    />
                  </div>
                </div>
                <div v-if="isMultiDayEvent" class="multi-day-hint" aria-live="polite">
                  <CalendarDaysIcon aria-hidden="true" />
                  <div>
                    <strong>This is a multi-day event</strong>
                    <span>Duration: {{ multiDayDurationLabel }}</span>
                  </div>
                </div>
              </template>

              <div v-if="form.eventType === 'recurring' && form.recurrence.frequency" class="sub-panel recurrence-options" :class="{ 'recurring-range': usesDateRange }">
                <div class="recurrence-steps">
                  <section
                    v-if="form.recurrence.frequency === 'weekly'"
                    class="recurrence-step reveal-step"
                  >
                    <span class="recurrence-label">Which days?</span>
                    <div class="day-row" role="group" aria-label="Repeat on weekdays">
                      <button
                        v-for="day in WEEKDAYS"
                        :key="day.value"
                        type="button"
                        class="day-chip"
                        :class="{ selected: form.recurrence.weeklyDays.includes(day.value) }"
                        :aria-pressed="form.recurrence.weeklyDays.includes(day.value)"
                        :title="day.label"
                        :aria-label="day.label"
                        :disabled="day.value === firstOccurrenceWeekday"
                        @click="toggleWeeklyDay(day.value)"
                      >
                        {{ day.short }}
                      </button>
                    </div>
                    <p v-if="firstOccurrenceWeekday !== null" class="help">{{ WEEKDAYS.find(day => day.value === firstOccurrenceWeekday)?.label }} is included because your event starts that day. Choose any other days you need.</p>
                    <WeeklyScheduleCalendar :start-date="scheduleStartDate" :end-date="scheduleEndDate" :weekdays="form.recurrence.weeklyDays" :time-label="formatTimeRange()" />
                  </section>

                  <section
                    v-if="form.recurrence.frequency === 'monthly'"
                    class="recurrence-step reveal-step"
                  >
                    <span class="recurrence-label">When each month?</span>
                    <div class="recurrence-choice-list">
                      <label class="recurrence-choice" :class="{ selected: form.recurrence.monthlyMode === 'day_of_month' }">
                        <input
                          type="radio"
                          name="monthly-mode"
                          value="day_of_month"
                          :checked="form.recurrence.monthlyMode === 'day_of_month'"
                          @change="setMonthlyMode('day_of_month')"
                        />
                        <span>
                          <strong>Same date</strong>
                          <small>{{ ordinalNumber(form.recurrence.dayOfMonth) }} of every month</small>
                        </span>
                      </label>
                      <label class="recurrence-choice" :class="{ selected: form.recurrence.monthlyMode === 'nth_weekday' }">
                        <input
                          type="radio"
                          name="monthly-mode"
                          value="nth_weekday"
                          :checked="form.recurrence.monthlyMode === 'nth_weekday'"
                          @change="setMonthlyMode('nth_weekday')"
                        />
                        <span>
                          <strong>Same weekday</strong>
                          <small>
                            {{ ordinalWord(form.recurrence.nthWeekday.ordinal) }}
                            {{ WEEKDAYS.find((day) => day.value === form.recurrence.nthWeekday.weekday)?.label }}
                            of every month
                          </small>
                        </span>
                      </label>
                    </div>
                    <p class="help">Change your start date to choose a different date or weekday.</p>
                  </section>

                  <section v-if="!usesDateRange" class="recurrence-step reveal-step">
                    <div class="two-col recurrence-end-fields">
                      <div class="field">
                        <label for="repeat-end-rule">Stop repeating</label>
                        <select id="repeat-end-rule" class="field-input" :value="form.recurrence.seriesEndType" @change="setSeriesEndType($event.target.value)">
                          <option value="on_date">On a date</option>
                          <option value="after_occurrences">After a number of events</option>
                        </select>
                      </div>
                      <div v-if="form.recurrence.seriesEndType === 'on_date'" class="field">
                        <label for="repeat-end-date">Repeat until</label>
                        <input id="repeat-end-date" v-model="form.recurrence.seriesEndDate" type="date" class="field-input" :min="seriesEndMinDate" @input="clearError('repeatSchedule')" />
                      </div>
                      <div v-else class="field">
                        <label for="repeat-event-count">Number of events</label>
                        <input id="repeat-event-count" v-model.number="form.recurrence.occurrenceCount" type="number" class="field-input" min="1" step="1" inputmode="numeric" @input="clearError('repeatSchedule')" />
                        <p class="help">Includes the event on your start date.</p>
                      </div>
                    </div>
                  </section>

                  <p v-if="errors.repeatSchedule || recurrenceInlineError" class="error-text">
                    {{ errors.repeatSchedule || recurrenceInlineError }}
                  </p>

                  <section
                    v-if="form.recurrence.frequency"
                    class="recurrence-step recurrence-schedule-preview reveal-step"
                    aria-live="polite"
                  >
                    <span class="recurrence-label">Your schedule</span>
                    <strong>{{ recurrencePatternText }}</strong>
                    <p>{{ formatTimeRange() }}</p>
                    <p v-if="usesDateRange && scheduleEndDate">{{ formatReviewDate(form.startsAt) }} to {{ formatReviewDate(scheduleEndDate) }}</p>
                    <p v-else-if="!usesDateRange">
                      Starts {{ formatReviewDate(form.startsAt) }}
                      <span aria-hidden="true">&middot;</span>
                      {{ seriesEndText }}
                    </p>
                    <div v-if="nextOccurrences.length" class="next-occurrences">
                      <span>Next dates</span>
                      <ul>
                        <li v-for="occurrence in nextOccurrences" :key="occurrence.toISOString()">
                          {{ formatOccurrenceDate(occurrence) }}
                        </li>
                      </ul>
                    </div>
                  </section>
                </div>
              </div>
              </template>
              <div class="divider"><span>Format</span></div>
              <div class="field">
                <label>Where is it happening?</label>
                <div class="pill-row">
                  <button
                    v-for="format in [
                      ['in-person', 'In-person', MapPinIcon],
                      ['online', 'Online', GlobeAltIcon],
                      ['hybrid', 'Hybrid', LinkIcon],
                    ]"
                    :key="format[0]"
                    type="button"
                    class="pill"
                    :class="{ selected: form.format === format[0] }"
                    @click="form.format = format[0]"
                  >
                    <component :is="format[2]" aria-hidden="true" /> {{ format[1] }}
                  </button>
                </div>
              </div>

              <div v-if="form.format !== 'online'" class="field" data-error-key="venue">
                <label for="venue">Venue or address</label>
                <div class="input-with-icon">
                  <MapPinIcon aria-hidden="true" />
                  <input
                    id="venue"
                    v-model="form.venue"
                    maxlength="255"
                    class="field-input"
                    :class="{ error: errors.venue }"
                    placeholder="Type a venue name or address"
                    @focus="showVenueResults = true"
                    @input="clearError('venue')"
                  />
                </div>
                <div v-if="showVenueResults && venueResults.length" class="venue-results">
                  <button
                    v-for="[name, address, timeZone] in venueResults"
                    :key="name"
                    type="button"
                    @click="pickVenue(name, timeZone)"
                  >
                    <strong>{{ name }}</strong>
                    <span>{{ address }}</span>
                  </button>
                </div>
                <p v-if="errors.venue" class="error-text">{{ errors.venue }}</p>
              </div>

              <div class="two-col">
                <div class="field" data-error-key="city"><label for="event-city">City <span>Optional</span></label><input id="event-city" v-model="form.city" maxlength="255" class="field-input" /><p v-if="errors.city" class="error-text">{{ errors.city }}</p></div>
                <div class="field" data-error-key="timeZone"><label for="event-timezone">Event time zone</label><input id="event-timezone" v-model.lazy="form.venueTimezone" maxlength="60" class="field-input" placeholder="Africa/Lagos" /><p v-if="errors.timeZone" class="error-text">{{ errors.timeZone }}</p></div>
              </div>
              <div v-if="form.format !== 'in-person'" class="field" data-error-key="meetingLink">
                <label for="meeting-link">Meeting link</label>
                <input
                  id="meeting-link"
                  v-model="form.meetingLink"
                  maxlength="1000"
                  type="url"
                  class="field-input"
                  :class="{ error: errors.meetingLink }"
                  placeholder="https://meet.google.com/... or Zoom link"
                  @input="clearError('meetingLink')"
                />
                <p v-if="errors.meetingLink" class="error-text">{{ errors.meetingLink }}</p>
                <p v-else class="help">Joining details are shared by the organiser.</p>
              </div>

              <div class="divider"><span>Category</span></div>
              <p v-if="categoryLoadError" role="alert">{{ categoryLoadError }} <button type="button" @click="loadCategories">Try again</button></p>
              <div class="field" data-error-key="category">
                <label id="category-label">What type of event?</label>
                <button
                  type="button"
                  class="category-trigger"
                  :class="{ error: errors.category, open: showCategoryMenu }"
                  aria-haspopup="listbox"
                  :aria-expanded="showCategoryMenu"
                  aria-labelledby="category-label"
                  @click="showCategoryMenu = !showCategoryMenu"
                >
                  <span class="category-trigger-copy">
                    <component
                      :is="
                        categoryOptions.find((category) => category.name === form.category)?.icon ||
                        TicketIcon
                      "
                      aria-hidden="true"
                    />
                    {{ form.category || 'Choose a category...' }}
                  </span>
                  <ArrowRightIcon aria-hidden="true" />
                </button>
                <div v-if="showCategoryMenu" class="category-menu" role="listbox">
                  <button
                    v-for="category in categoryOptions"
                    :key="category.name"
                    type="button"
                    class="category-option"
                    :class="{ selected: form.category === category.name }"
                    role="option"
                    :aria-selected="form.category === category.name"
                    @click="selectCategory(category)"
                  >
                    <component :is="category.icon" aria-hidden="true" />
                    <span>{{ category.name }}</span>
                  </button>
                </div>
                <p v-if="errors.category" class="error-text">{{ errors.category }}</p>
              </div>
            </div>
          </div>

          <div v-if="embedded ? editorSection === 'details' : currentStep === 2" class="screen">
            <div v-if="!embedded" class="screen-head">
              <h1>Make it<br /><em>unforgettable.</em></h1>
              <p>Events with great photos and descriptions get more sign-ups.</p>
            </div>

            <div class="ce-card">
              <div class="field" data-error-key="coverImage">
                <div class="field-top">
                  <div>
                    <label>Event images <span>Required cover Â· max 6</span></label>
                    <p class="help">Add a cover photo, then up to five gallery images.</p>
                  </div>
                  <button type="button" class="text-btn" @click="showTemplates = !showTemplates">
                    <SparklesIcon aria-hidden="true" /> Templates
                  </button>
                </div>

                <label for="flyer-format">Image format</label>
                <select id="flyer-format" v-model="flyerFormat" class="field-input"><option v-for="format in flyerFormats" :key="format.value" :value="format.value">{{ format.label }}</option></select>
                <p class="help">Choose a shape before uploading. Images are cropped to fit. Linked images keep their shape.</p>
                <div class="upload-tabs">
                  <button
                    type="button"
                    :class="{ active: activeUploadTab === 'files' }"
                    @click="activeUploadTab = 'files'"
                  >
                    <PhotoIcon aria-hidden="true" /> Upload files
                  </button>
                  <button
                    type="button"
                    :class="{ active: activeUploadTab === 'url' }"
                    @click="activeUploadTab = 'url'"
                  >
                    <LinkIcon aria-hidden="true" /> Image URL
                  </button>
                </div>

                <div
                  v-if="activeUploadTab === 'files'"
                  class="upload-zone"
                  :class="{ error: errors.coverImage, dragging: dragActive }"
                  @click="$refs.fileInput.click()"
                  @dragenter.prevent="dragActive = true"
                  @dragover.prevent
                  @dragleave.prevent="dragActive = false"
                  @drop.prevent="handleFiles($event.dataTransfer.files)"
                >
                  <div class="upload-ring"><PhotoIcon aria-hidden="true" /></div>
                  <strong>Drop cover and gallery images here</strong>
                  <span>Browse files or drag them in. The first image becomes the cover photo.</span>
                  <span>JPG, PNG, or WebP Â· best 1600x900px Â· up to 6 images</span>
                  <input ref="fileInput" type="file" hidden multiple accept="image/jpeg,image/png,image/gif,image/webp" @change="handleFiles($event.target.files)" />
                </div>

                <div v-else class="url-panel">
                  <input
                    v-model="urlImageValue"
                    type="url"
                    class="field-input"
                    placeholder="https://example.com/photo.jpg"
                    @keyup.enter="addUrlImage"
                  />
                  <button type="button" class="inline-btn" @click="addUrlImage">
                    <PlusIcon aria-hidden="true" /> Add image
                  </button>
                </div>

                <div v-if="showTemplates" class="template-grid">
                  <button
                    v-for="gradient in coverTemplates"
                    :key="gradient"
                    type="button"
                    :style="{ background: gradient }"
                    @click="applyCoverTemplate(gradient)"
                    aria-label="Apply cover template"
                  />
                </div>

                <p v-if="errors.coverImage" class="error-text">{{ errors.coverImage }}</p>

                <div v-if="form.coverImage || form.secondaryImages.length" class="image-manager">
                  <div class="cover-preview">
                    <span class="image-label">Cover photo</span>
                    <div v-if="form.coverImage" class="cover-frame">
                      <img :src="form.coverImage" alt="Cover preview" />
                      <button type="button" class="cover-remove" @click="removeCover" aria-label="Remove cover">
                        <XMarkIcon aria-hidden="true" />
                      </button>
                    </div>
                    <div v-else class="cover-empty">No cover selected yet</div>
                  </div>
                  <div v-if="form.secondaryImages.length" class="gallery-preview">
                    <span class="image-label">Additional images</span>
                    <div class="image-strip">
                      <div
                        v-for="(image, index) in form.secondaryImages"
                        :key="image + index"
                        class="image-thumb"
                      >
                        <img :src="image" alt="Gallery preview" />
                        <div class="thumb-actions">
                          <button type="button" @click="setCover(image, index)">Set cover</button>
                          <button type="button" @click="removeSecondaryImage(index)" aria-label="Remove image">
                            <TrashIcon aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="divider"><span>Description</span></div>
              <div class="field" data-error-key="description">
                <p v-if="errors.description" class="error-text">{{ errors.description }}</p>
                <label for="description">Tell people what to expect <span>Optional</span></label>
                <textarea
                  id="description"
                  v-model="form.description"
                  maxlength="20000"
                  class="field-input"
                  rows="4"
                  placeholder="What will people experience? What's the agenda? Who should come?"
                />
              </div>

              <div class="divider"><span>Organiser</span></div>
              <div class="two-col">
                <div class="field" data-error-key="organiser">
                  <p v-if="errors.organiser" class="error-text">{{ errors.organiser }}</p>
                  <label for="organiser">Name or organisation <span>Optional</span></label>
                  <input id="organiser" v-model="form.organiser" maxlength="100" class="field-input" placeholder="e.g. TechHub Lagos" />
                </div>
                <div class="field" data-error-key="organiserWebsite">
                  <p v-if="errors.organiserWebsite" class="error-text">{{ errors.organiserWebsite }}</p>
                  <label for="website">Website <span>Optional</span></label>
                  <input id="website" v-model="form.organiserWebsite" maxlength="500" type="url" class="field-input" placeholder="https://..." />
                </div>
              </div>

              <div class="divider"><span>Extra details</span></div>
              <div class="detail-hint">ðŸ’¡ <strong>Add details that help attendees plan.</strong></div>
              <div class="detail-chip-row">
                <button
                  v-for="option in detailOptions"
                  :key="option.type"
                  type="button"
                  class="detail-chip"
                  :class="{ selected: selectedDetailTypes.has(option.type) }"
                  @click="addDetail(option)"
                >
                  <component :is="option.icon" aria-hidden="true" />
                  {{ option.label }}
                </button>
              </div>
              <div v-if="form.extraDetails.length" class="detail-fields">
                <div v-for="detail in form.extraDetails" :key="detail.type" class="detail-field-card">
                  <button type="button" class="icon-btn danger" @click="removeDetail(detail.type)">
                    <XMarkIcon aria-hidden="true" />
                  </button>
                  <label>{{ detail.label }}</label>
                  <textarea
                    v-model="detail.value"
                    class="field-input"
                    rows="2"
                    :placeholder="detailOptions.find((item) => item.type === detail.type)?.placeholder"
                  />
                </div>
              </div>

              <div class="divider"><span>Tags</span></div>
              <div class="field">
                <label for="tags">Tags <span>Optional</span></label>
                <input id="tags" v-model="form.tags" class="field-input" placeholder="networking, AI, Lagos" />
              </div>
            </div>
          </div>

          <div v-if="embedded ? editorSection === 'tickets' : currentStep === 3" class="screen">
            <div v-if="!embedded" class="screen-head">
              <h1>Set up your<br /><em>tickets.</em></h1>
              <p>Choose free entry or set ticket prices.</p>
            </div>

            <div v-if="!embedded" class="info-card pink">
              <TicketIcon aria-hidden="true" />
              <div>
                <strong>What are ticket types?</strong>
                <p>Offer options like early bird, general admission, VIP, or tables.</p>
              </div>
            </div>

            <div class="ce-card">
              <div class="field">
                <label>How are people attending?</label>
                <div class="ticket-mode-grid">
                  <button
                    type="button"
                    class="ticket-mode-card"
                    :class="{ selected: form.ticketMode === 'free' }"
                    @click="selectTicketMode('free')"
                  >
                    <TicketIcon aria-hidden="true" />
                    <strong>Free admission</strong>
                    <span>Anyone can register at no cost.</span>
                  </button>
                  <button
                    type="button"
                    class="ticket-mode-card"
                    :class="{ selected: form.ticketMode === 'paid' }"
                    @click="selectTicketMode('paid')"
                  >
                    <BanknotesIcon aria-hidden="true" />
                    <strong>Paid tickets</strong>
                    <span>Set ticket types and prices.</span>
                  </button>
                </div>
              </div>

              <div v-if="form.ticketMode === 'free'" class="sub-panel">
                <div class="info-card green">
                  <CheckIcon aria-hidden="true" />
                  <div>
                    <strong>Free event</strong>
                    <p>Set the guest limit. Zero or blank means no spaces. Registration isn’t available yet.</p>
                  </div>
                </div>
                <div class="field">
                  <label for="free-capacity">Guest limit <span>Optional</span></label>
                  <p v-if="errors.freeCapacity" class="error-text">{{ errors.freeCapacity }}</p>
                  <input data-error-key="freeCapacity" id="free-capacity" v-model="form.freeCapacity" type="number" min="0" max="1000000" step="1" class="field-input" placeholder="e.g. 200" />
                </div>
              </div>

              <div v-else class="paid-block" data-error-key="tickets">
                <div class="field-top">
                  <div>
                    <label>Ticket types</label>
                    <p class="help">Choose a template, then set the price, quantity, and perks.</p>
                  </div>
                  <span class="count-badge">{{ form.tickets.length }} added</span>
                </div>
                <div class="quick-chip-row">
                  <button
                    v-for="template in ticketTemplates"
                    :key="template.name"
                    type="button"
                    class="quick-chip"
                    @click="addTicket(template)"
                  >
                    <span class="color-dot" :style="{ background: template.color }"></span>
                    {{ template.name }}
                  </button>
                  <button type="button" class="quick-chip custom" @click="addTicket()">
                    <PlusIcon aria-hidden="true" /> Add ticket type
                  </button>
                </div>
                <p v-if="errors.tickets" class="error-text">{{ errors.tickets }}</p>

                <div v-if="!form.tickets.length" class="empty-state">
                  <TicketIcon aria-hidden="true" />
                  <strong>No ticket types yet</strong>
                  <span>Choose a template or add a ticket type.</span>
                </div>

                <div class="ticket-list">
                  <article v-for="ticket in form.tickets" :key="ticket.id" class="ticket-card">
                    <p v-for="([key, message]) in Object.entries(errors).filter(([key]) => key.startsWith(`ticket-${ticket.id}-`) && !key.endsWith('-name') && !key.endsWith('-salesEnd'))" :key="key" :data-error-key="key" class="error-text">{{ message }}</p>
                    <div class="ticket-card-head">
                      <span class="color-dot" :style="{ background: ticket.color }"></span>
                      <strong>{{ ticket.name || 'Unnamed ticket' }}</strong>
                      <span v-if="ticket.inventory">Total: {{ ticket.inventory.configured_capacity_units }} &middot; Sold: {{ ticket.inventory.sold_units }} &middot; Reserved: {{ ticket.inventory.reserved_units }} &middot; Available: {{ ticket.inventory.available_units }} &middot; Admissions: {{ ticket.inventory.admission_capacity }}</span>
                      <button type="button" class="icon-btn danger" @click="removeTicket(ticket.id)">
                        <TrashIcon aria-hidden="true" />
                      </button>
                    </div>
                    <div class="two-col">
                      <div class="field" :data-error-key="`ticket-${ticket.id}-name`">
                        <label>Ticket name</label>
                        <input
                          v-model="ticket.name"
                          maxlength="50"
                          class="field-input"
                          :class="{ error: errors[`ticket-${ticket.id}-name`] }"
                          placeholder="e.g. General Admission"
                          @input="clearError(`ticket-${ticket.id}-name`)"
                        />
                        <p v-if="errors[`ticket-${ticket.id}-name`]" class="error-text">
                          {{ errors[`ticket-${ticket.id}-name`] }}
                        </p>
                      </div>
                      <div class="field">
                        <label>Seat type</label>
                        <select v-model="ticket.unitType" class="field-input" :disabled="hasCommitments(ticket)" @change="ticket.unitType === 'individual' && (ticket.peoplePerUnit = 1)">
                          <option value="individual">Individual seat</option>
                          <option value="table">Group / Table</option>
                        </select>
                      </div>
                    </div>
                    <div class="two-col">
                      <div class="field">
                        <label>{{ ticket.unitType === 'table' ? 'Number of tables' : 'How many spots?' }}</label>
                        <input v-model.number="ticket.units" type="number" min="0" class="field-input" max="1000000" step="1" placeholder="0 means none available" />
                      </div>
                      <div v-if="ticket.unitType === 'table'" class="field">
                        <label>People per table</label>
                        <input v-model.number="ticket.peoplePerUnit" type="number" min="1" max="10000" step="1" :disabled="hasCommitments(ticket)" class="field-input" />
                      </div>
                    </div>
                    <div class="two-col">
                      <div class="field">
                        <label>Price (NGN)</label>
                        <input v-model="ticket.price" type="number" min="0" max="999999.99" step="0.01" class="field-input" placeholder="Enter a paid ticket price" />
                        <p v-if="Number(ticket.price) <= 0" class="help">Set a price above zero to publish. Draft tickets can have a zero price.</p>
                      </div>
                      <div class="field">
                        <label>Each person can buy <span>Optional</span></label>
                        <input v-model.number="ticket.maxPerPerson" type="number" min="1" max="1000000" step="1" class="field-input" placeholder="e.g. 2 tickets per person" />
                      </div>
                    </div>
                    <div v-if="ticket.unitType === 'table' && ticket.units" class="calc-card">
                      <SparklesIcon aria-hidden="true" />
                      <span>{{ ticketSeatCount(ticket).toLocaleString() }} total seats</span>
                    </div>
                    <div class="two-col">
                      <div class="field">
                        <label>Sales open <span>Optional</span></label>
                        <DateTimePickerInput
                          v-model="ticket.salesStart"
                          placeholder="Choose sales start"
                          :min-date="isEditMode ? null : venueToday"
                          :max-date="form.startsAt"
                          :max-date-time="form.startsAt"
                        />
                      </div>
                      <div class="field" :data-error-key="`ticket-${ticket.id}-salesEnd`">
                        <label>Sales close <span>Optional</span></label>
                        <DateTimePickerInput
                          v-model="ticket.salesEnd"
                          placeholder="Choose sales end"
                          :min-date="isEditMode ? null : venueToday"
                          :max-date="form.startsAt"
                          :max-date-time="form.startsAt"
                          :error="errors[`ticket-${ticket.id}-salesEnd`]"
                        />
                      </div>
                    </div>
                    <label class="toggle-row">
                      <span>
                        <strong>Show on event page</strong>
                        <small>Attendees will see this ticket type.</small>
                      </span>
                      <input v-model="ticket.visible" type="checkbox" />
                    </label>
                  </article>
                </div>

                <div v-if="form.tickets.length" class="summary-row">
                  <span>Total guest places</span>
                  <strong>{{ totalCapacity.toLocaleString() }} seats</strong>
                </div>
              </div>
            </div>
          </div>

          <div v-if="embedded ? editorSection === 'checkout' : currentStep === 4" class="screen">
            <div v-if="!embedded" class="screen-head">
              <h1>Who's<br /><em>registering?</em></h1>
              <p>Ask only for the details you need.</p>
            </div>

            <div v-if="!embedded" class="info-card pink">
              <DocumentTextIcon aria-hidden="true" />
              <div>
                <strong>Your registration form</strong>
                <p>Attendees fill this in when they register. Name and email are required.</p>
              </div>
            </div>

            <div class="ce-card compact">
              <label
                v-for="field in form.attendeeFields"
                :key="field.id"
                class="toggle-row attendee-row"
              >
                <span>
                  <strong>{{ field.label }}</strong>
                  <small>{{ field.help }}</small>
                </span>
                <span v-if="field.required" class="required-tag">Required</span>
                <input v-else v-model="field.enabled" type="checkbox" />
              </label>
            </div>

            <div class="ce-card compact">
              <div class="email-preview">
                <div class="email-head">
                  <span>From: {{ form.organiser || form.title || 'Your Event' }} via Kaka</span>
                  <strong>You're in! {{ form.title || 'Your Event' }}</strong>
                </div>
                <div class="email-body">
                  <p>Hi [Attendee name],</p>
                  <p>Your registration is confirmed. See you there!</p>
                  <div class="email-ticket">
                    <strong>Ticket details</strong>
                    <span>{{ form.title || 'Event name' }}</span>
                    <span>{{ emailDate }}</span>
                    <span>{{ previewEvent.location }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="embedded" class="nav-actions">
            <span v-if="lastSavedAt" role="status">{{ lastSavedLabel }}</span>
            <button type="button" class="primary-btn" :disabled="isSaving || isPublishing || conflict || editorLoading || Boolean(editorLoadError)" @click="saveEventChanges" :aria-busy="isSaving">{{ isSaving ? 'Saving...' : 'Save changes' }}</button>
          </div>
          <div v-else class="nav-actions">
            <button v-if="currentStep > 1" type="button" class="back-btn" @click="goBack">
              <ArrowLeftIcon aria-hidden="true" />
            </button>
            <button
              v-if="currentStep < steps.length"
              type="button"
              class="primary-btn"
              :class="{ disabled: !canContinue }"
              :disabled="!canContinue"
              @click="goNext"
            >
              Continue <ArrowRightIcon aria-hidden="true" />
            </button>
            <button
              v-else
              type="button"
              class="primary-btn publish"
              :class="{ disabled: !canContinue || isSaving || isPublishing }"
              :disabled="!canContinue || isSaving || isPublishing || conflict"
              @click="publishEvent"
             :aria-busy="isSaving">
              {{ isPublishing ? 'Publishing...' : editorStatus === 'active' ? 'Save changes' : 'Publish event' }} <ArrowRightIcon aria-hidden="true" />
            </button>
          </div>
        </section>

        <aside v-if="!embedded && previewOn && !isStepLoading" class="preview-col">
          <span class="side-label">Live preview</span>
          <EventCard :event="previewEvent" :show-details="false" />
          <div class="tip-card">
            <strong>Tip</strong>
            <p>{{ currentTip }}</p>
          </div>
        </aside>
      </div>
    </main>

    <section v-else class="success-screen">
      <div class="success-ring"><CheckIcon aria-hidden="true" /></div>
      <h1>Your event<br />is live!</h1>
      <p>{{ publishedMessage }}</p>
      <p v-if="publishedEvent.id || publishedEvent.status" class="published-meta">
        <span v-if="publishedEvent.id">Event #{{ publishedEvent.id }}</span>
        <span v-if="publishedEvent.status">{{ publishedEvent.status }}</span>
      </p>
      <div class="share-box">
        <span>{{ publishedUrl }}</span>
        <button type="button" @click="copyPublishedLink">Copy link</button>
      </div>
      <button type="button" class="primary-btn" @click="router.push(publicEventRoute)">View event</button>
      <button type="button" class="primary-btn" @click="router.push({ name: 'dashboard' })">Go to dashboard</button>
      <button type="button" class="primary-btn" @click="router.push({ name: 'home' })">Back to home</button>
    </section>

  </div>
</template>

<style scoped>
.create-event-page {
  --ce-ink: var(--ds-color-text);
  --ce-ink2: var(--ds-color-text);
  --ce-ink3: var(--ds-color-text-secondary);
  --ce-ink4: var(--ds-color-text-muted);
  --ce-ink5: var(--ds-color-border-control);
  --ce-paper: var(--ds-color-surface);
  --ce-p2: var(--ds-color-surface);
  --ce-p3: var(--ds-color-surface-subtle);
  --ce-p4: var(--ds-color-border);
  --ce-acc: var(--ds-color-brand);
  --ce-acc-soft: var(--ds-color-selection-soft);
  --ce-acc-border: var(--ds-color-selection-border);
  --ce-green: var(--ds-color-success);
  --ce-greenbg: var(--ds-color-success-soft);
  --ce-pinkbg: var(--ds-color-brand-soft);
  --ce-pinkbdr: var(--ds-color-brand);
  --ce-red: var(--ds-color-danger);
  background: var(--ce-p2);
  color: var(--ce-ink);
  min-height: 100vh;
  font-family: var(--ds-font-body);
}

.create-event-page.is-dark {
  --ce-ink: var(--color-text);
  --ce-ink2: var(--color-text);
  --ce-ink3: var(--color-muted);
  --ce-ink4: var(--color-muted);
  --ce-ink5: var(--color-border);
  --ce-paper: var(--color-surface);
  --ce-p2: var(--color-bg);
  --ce-p3: var(--color-tab-bg);
  --ce-p4: var(--color-border);
  --ce-greenbg: rgba(26, 122, 74, 0.18);
  --ce-acc-soft: rgba(236, 72, 153, 0.14);
  --ce-acc-border: rgba(236,72,153,0.209);
  --ce-pinkbg: rgba(236, 72, 153, 0.12);
  --ce-pinkbdr: rgba(236, 72, 153, 0.34);
}

.ce-header {
  position: sticky;
  top: 0;
  z-index: 200;
  background: color-mix(in srgb, var(--ce-paper) 94%, transparent);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--ce-p4);
  display: grid;
  grid-template-columns: auto minmax(44px, auto) minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(14px, 2vw, 28px);
  height: var(--app-header-height, 96px);
  padding: 0 1.5rem;
}

.ce-logo {
  display: inline-flex;
  align-items: center;
  padding: 0;
}

.ce-logo img {
  height: var(--app-logo-height, 72px);
  width: auto;
  display: block;
}

.ce-header-back,
.theme-btn {
  width: 38px;
  height: 38px;
  border: 1px solid var(--ce-p4);
  border-radius: 999px;
  background: var(--ce-paper);
  color: var(--ce-ink3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-height: 0;
  text-decoration: none;
  cursor: pointer;
}

.ce-header-back svg,
.theme-btn svg {
  width: 17px;
  height: 17px;
}

.ce-progress {
  display: flex;
  align-items: center;
  background: var(--ce-p3);
  border: 1px solid var(--ce-p4);
  border-radius: 100px;
  padding: 4px 5px;
  gap: 2px;
  justify-self: center;
  max-width: 100%;
  overflow-x: auto;
}

.ce-step {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 100px;
  background: transparent;
  color: var(--ce-ink4);
  border: 0;
  font-size: var(--ds-size-small);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
  min-width: 0;
}

.ce-step:not(:disabled) {
  cursor: pointer;
}

.ce-step.future {
  opacity: 0.45;
  cursor: not-allowed;
}

.ce-step-number {
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: var(--ce-p4);
  color: var(--ce-ink3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--ds-size-small);
  font-weight: 600;
}

.ce-step.active {
  background: var(--ce-acc-soft);
  color: var(--ce-ink);
  box-shadow: var(--shadow-subtle);
}

.ce-step.active .ce-step-number {
  background: var(--ce-acc);
  color: var(--color-on-action);
}

.ce-step.done {
  background: transparent;
  color: var(--ce-ink2);
  border: 1px dashed var(--ce-acc-border);
}

.ce-step.done .ce-step-number {
  background: transparent;
  border: 1px dashed var(--ce-acc-border);
  color: var(--ce-acc);
}

.ce-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.draft-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ce-green);
  background: var(--ce-greenbg);
  border: 1px solid rgba(26,122,74,0.110);
  padding: 4px 10px;
  border-radius: 100px;
  font-size: var(--ds-size-small);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.draft-badge svg {
  width: 12px;
}

.draft-badge.show {
  opacity: 1;
}

.ghost-btn {
  border: 1px solid var(--ce-p4);
  background: transparent;
  color: var(--ce-ink3);
  border-radius: var(--ds-radius-control);
  padding: 6px 14px;
  font-size: var(--ds-size-body);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
}

.ghost-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.ce-wrap {
  width: 85%;
  max-width: var(--ds-rhythm-page-max);
  margin: 0 auto;
  padding: var(--ds-space-40) 0 var(--ds-space-64);
}

.api-error-summary {
  margin-bottom: 1rem;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--ce-red) 45%, transparent);
  border-radius: var(--ds-radius-control);
  background: color-mix(in srgb, var(--ce-red) 8%, var(--ce-paper));
  color: var(--ce-red);
  font-size: var(--ds-size-body);
}

.api-error-summary ul {
  margin: 6px 0 0;
  padding-left: 1.2rem;
}

.preview-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 14px;
  font-size: var(--ds-size-small);
  color: var(--ce-ink4);
}

.preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 100px;
  border: 1px solid var(--ce-p4);
  background: var(--ce-paper);
  color: var(--ce-ink3);
  font-size: var(--ds-size-body);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
}

.upload-tabs button svg,
.quick-chip svg,
.detail-chip svg,
.preview-btn svg,
.text-btn svg,
.pill svg,
.inline-btn svg,
.primary-btn svg,
.back-btn svg,
.icon-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.ce-header-back svg,
.theme-btn svg,
.pill svg,
.detail-chip svg,
.quick-chip svg,
.preview-btn svg,
.inline-btn svg,
.text-btn svg,
.back-btn svg,
.icon-btn svg,
.upload-ring svg,
.empty-state svg,
.calc-card svg {
  color: var(--ce-ink);
}

.create-event-page.is-dark svg {
  color: var(--ce-ink);
}

.create-event-page.is-dark .field-input,
.create-event-page.is-dark :deep(.datetime-input) {
  color-scheme: dark;
}

.create-event-page.is-light .field-input,
.create-event-page.is-light :deep(.datetime-input) {
  color-scheme: light;
}

:deep(.datetime-picker) {
  box-shadow: var(--shadow-subtle);
}

.preview-btn.on {
  border-color: var(--ce-acc-border);
  color: var(--ce-ink);
  background: var(--ce-acc-soft);
}

.ce-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 2rem;
  align-items: start;
}

.ce-columns.preview-off {
  grid-template-columns: 1fr;
}

.screen {
  display: flex;
  flex-direction: column;
  gap: var(--ds-rhythm-group-gap);
}

.screen-head h1 {
  font-family: var(--ds-font-heading);
  font-size: 1.9rem;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.15;
  color: var(--ce-ink);
}

.screen-head h1 em {
  color: var(--ce-acc);
  font-style: italic;
}

.headline-icon {
  width: 28px;
  height: 28px;
  color: var(--ce-ink);
  vertical-align: -0.22em;
}

.screen-head p {
  font-size: var(--ds-size-body);
  color: var(--ce-ink3);
  margin-top: 6px;
  line-height: 1.65;
}

.ce-card,
.info-card,
.tip-card {
  background: var(--ce-paper);
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-card);
  padding: var(--ds-rhythm-card-padding);
  box-shadow: var(--shadow-subtle);
}

.ce-card.compact {
  padding: 1.1rem 1.3rem;
  border-radius: var(--ds-radius-card);
}

.field,
.paid-block {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: var(--ds-rhythm-group-gap);
}

.field:last-child,
.paid-block:last-child {
  margin-bottom: 0;
}

label,
.field-top label {
  font-size: var(--ds-size-small);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0;
  text-transform: none;
  color: var(--ce-ink3);
}

label span {
  font-size: var(--ds-size-small);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ce-ink4);
}

.field-input,
:deep(.datetime-input) {
  width: 100%;
  background: var(--ce-p2);
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-control);
  padding: 12px 14px;
  font-family: var(--ds-font-body);
  font-size: var(--ds-size-body);
  line-height: 1.3;
  color: var(--ce-ink);
  outline: none;
}

.field-input-xl {
  font-family: var(--ds-font-heading);
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 0;
  padding: 14px 18px;
  border-radius: var(--ds-radius-card);
  background: var(--ce-paper);
}

.field-input:focus,
:deep(.datetime-input:focus) {
  border-color: var(--ce-acc);
  background: var(--ce-paper);
  box-shadow: var(--focus-ring);
}

.field-input.error,
.upload-zone.error,
:deep(.input-wrapper.has-error .datetime-input) {
  border-color: var(--ce-red);
  background: color-mix(in srgb, var(--ce-red) 8%, var(--ce-paper));
}

.help,
:deep(.error-message),
.error-text {
  font-size: var(--ds-size-small);
  line-height: 1.55;
}

.help {
  color: var(--ce-ink4);
}

.error-text,
:deep(.error-message) {
  color: var(--ce-red);
  margin: 2px 0 0;
}

:deep(.input-label) {
  font-size: var(--ds-size-small);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0;
  text-transform: none;
  color: var(--ce-ink3);
}

:deep(.datetime-picker-input) {
  margin-bottom: 0;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0 1.2rem;
}

.divider span {
  font-size: var(--ds-size-small);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0;
  text-transform: none;
  color: var(--ce-ink4);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ce-p3);
}

.pill-row,
.detail-chip-row,
.quick-chip-row,
.day-row {
  display: flex;
  gap: 9px;
  row-gap: 10px;
  flex-wrap: wrap;
}

.pill,
.detail-chip,
.quick-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-control);
  background: var(--ce-paper);
  color: var(--ce-ink3);
  font-size: var(--ds-size-body);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.pill:hover,
.detail-chip:hover,
.quick-chip:hover {
  border-color: color-mix(in srgb, var(--ce-ink5) 45%, var(--ce-p4));
  color: var(--ce-ink2);
  transform: none;
  box-shadow: none;
}

.pill.selected {
  border-color: var(--ce-acc-border);
  background: var(--ce-acc-soft);
  color: var(--ce-ink);
}

.multi-day-hint {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: -2px 0 1rem;
  padding: 9px 11px;
  border: 1px solid color-mix(in srgb, var(--ce-green) 24%, var(--ce-p4));
  border-radius: var(--ds-radius-control);
  background: color-mix(in srgb, var(--ce-green) 7%, var(--ce-paper));
}

.multi-day-hint svg {
  width: 16px;
  height: 16px;
  margin-top: 1px;
  color: var(--ce-green);
  flex-shrink: 0;
}

.multi-day-hint div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.multi-day-hint strong {
  color: var(--ce-ink);
  font-size: var(--ds-size-body);
  font-weight: var(--ds-weight-semibold);
}

.multi-day-hint span {
  color: var(--ce-ink3);
  font-size: var(--ds-size-small);
}
.sub-panel {
  background: var(--ce-p2);
  border: 1px solid var(--ce-p3);
  border-radius: var(--ds-radius-card);
  padding: 1.1rem;
  margin: 0.35rem 0 1.25rem;
}

.recurrence-steps {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: var(--font-family-base, var(--ds-font-body));
}

.recurrence-step {
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
  box-shadow: none;
  transition:
    opacity 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.recurrence-choice-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.recurrence-choice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-control);
  background: var(--ce-paper);
  color: var(--ce-ink3);
  cursor: pointer;
}

.recurrence-choice.selected {
  border-color: var(--ce-acc-border);
  background: var(--ce-acc-soft);
  color: var(--ce-ink);
}

.create-event-page .recurrence-choice input[type='radio'] {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  min-height: 0;
  padding: 0;
  margin: 3px 0 0;
  accent-color: var(--ce-acc);
}

.recurrence-choice > span {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.recurrence-choice strong {
  color: var(--ce-ink);
  font-size: var(--ds-size-body);
  font-weight: 600;
}

.recurrence-choice small {
  color: var(--ce-ink3);
  font-size: var(--ds-size-small);
  line-height: 1.4;
}

.recurrence-schedule-preview {
  padding: 12px 14px;
  border: 1px solid var(--ce-pinkbdr);
  border-radius: 11px;
  background: var(--ce-pinkbg);
}

.recurrence-schedule-preview > strong {
  display: block;
  color: var(--ce-ink);
  font-size: var(--ds-size-body);
  font-weight: var(--ds-weight-semibold);
}

.recurrence-schedule-preview > p {
  margin: 4px 0 0;
  color: var(--ce-ink3);
  font-size: var(--ds-size-body);
  line-height: 1.45;
}

.next-occurrences {
  margin-top: 10px;
}

.next-occurrences > span {
  color: var(--ce-ink4);
  font-size: var(--ds-size-small);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: none;
}

.next-occurrences ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 7px 0 0;
  padding: 0;
  list-style: none;
}

.next-occurrences li {
  padding: 5px 8px;
  border: 1px solid var(--ce-pinkbdr);
  border-radius: 999px;
  background: var(--ce-paper);
  color: var(--ce-ink2);
  font-size: var(--ds-size-small);
}
.recurrence-step.complete {
  border-color: transparent;
}

.recurrence-step.locked {
  opacity: 0.45;
  pointer-events: none;
}

.recurrence-label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-secondary, var(--ce-ink4));
  font-size: var(--ds-size-small);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0;
  text-transform: none;
}

.reveal-step {
  animation: recurrenceReveal 180ms ease both;
}

@keyframes recurrenceReveal {
  from {
    opacity: 0;
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.repeat-frequency-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  row-gap: 10px;
}

.repeat-frequency-pill {
  min-height: 36px;
  border: 0.5px solid color-mix(in srgb, var(--ce-p4) 60%, transparent);
  border-radius: 999px;
  background: var(--ce-p2);
  color: var(--color-text-secondary, var(--ce-ink4));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 13px;
  font-size: var(--ds-size-body);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  box-shadow: none;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.repeat-frequency-pill.selected {
  background: color-mix(in srgb, var(--ce-green) 12%, var(--ce-paper));
  border-color: color-mix(in srgb, var(--ce-green) 70%, var(--ce-p4));
  border-width: 1.5px;
  color: var(--ce-green);
}

.repeat-frequency-pill:hover {
  background: color-mix(in srgb, var(--ce-green) 4%, var(--ce-p2));
  border-color: color-mix(in srgb, var(--ce-green) 22%, var(--ce-p4));
  color: var(--ce-green);
  transform: none;
  box-shadow: none;
}

.recurrence-steps .day-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
}

.recurrence-steps .day-row.monthly {
  flex-wrap: wrap;
}

.repeat-current-schedule {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-text-secondary, var(--ce-ink4));
  font-size: var(--ds-size-body);
  line-height: 1.5;
}

.repeat-current-schedule p {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  margin: 0;
}

.repeat-current-schedule span {
  color: var(--color-text-secondary, var(--ce-ink4));
}

.repeat-current-schedule strong {
  color: var(--ce-ink);
  font-size: var(--ds-size-body);
  font-weight: 500;
}

.repeat-change-link {
  border: 0;
  background: transparent;
  color: var(--ce-green);
  font-size: var(--ds-size-body);
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 3px;
  min-height: 0;
  padding: 0;
  margin-top: 4px;
  text-align: left;
  text-transform: none;
  letter-spacing: 0;
  width: fit-content;
}

.repeat-change-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.repeat-change-actions button {
  border: 0.5px solid color-mix(in srgb, var(--ce-p4) 55%, transparent);
  border-radius: var(--border-radius-md, 10px);
  background: transparent;
  padding: 9px 10px;
  color: var(--ce-ink2);
  box-shadow: none;
}

.repeat-change-option {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.repeat-change-option strong {
  font-size: var(--ds-size-body);
  font-weight: 500;
  color: var(--ce-ink);
}

.repeat-change-option span {
  font-size: var(--ds-size-small);
  line-height: 1.35;
  color: var(--ce-ink4);
}

.repeat-change-link:hover,
.repeat-change-actions button:hover {
  background: transparent;
  border-color: color-mix(in srgb, var(--ce-green) 20%, var(--ce-p4));
  color: var(--ce-green);
  transform: none;
  box-shadow: none;
}

.recurrence-inline-field {
  margin-top: 10px;
  margin-bottom: 0;
}

.repeat-day-overrides {
  display: flex;
  flex-direction: column;
  margin-top: 14px;
}

.recurrence-picker-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.recurrence-picker-button {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 9px;
  text-align: left;
  color: var(--ce-ink);
  cursor: pointer;
}

.recurrence-picker-button svg {
  width: 16px;
  height: 16px;
  color: var(--ce-ink4);
  flex-shrink: 0;
}

.recurrence-picker-button span {
  min-width: 0;
}

.create-event-page.is-dark .recurrence-picker-button svg {
  color: var(--ce-ink);
}

.repeat-day-row {
  border-bottom: 0.5px solid color-mix(in srgb, var(--ce-p4) 58%, transparent);
  background: transparent;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: none;
  padding: 10px 0;
}

.repeat-day-row:last-child {
  border-bottom: 0;
}

.repeat-day-name {
  width: 36px;
  flex-shrink: 0;
  font-size: var(--ds-size-body);
  font-weight: 500;
  color: var(--ce-ink);
}

.repeat-day-row.monthly .repeat-day-name {
  width: 86px;
}

.repeat-day-arrow {
  color: var(--color-text-secondary, var(--ce-ink4));
  font-size: var(--ds-size-body);
  flex-shrink: 0;
}

.repeat-day-time-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.repeat-day-time-controls .recurrence-picker-button {
  flex: 1;
  min-width: 0;
}

.repeat-day-remove {
  width: 30px;
  height: 30px;
  min-width: 30px;
  min-height: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-secondary, var(--ce-ink4));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: none;
}

.repeat-day-remove:hover {
  background: color-mix(in srgb, var(--ce-red) 7%, transparent);
  color: var(--ce-red);
  transform: none;
  box-shadow: none;
}

.repeat-day-remove svg {
  width: 15px;
  height: 15px;
}

.repeat-number-card,
.repeat-interval-card,
.frequency-number-card {
  border-color: color-mix(in srgb, var(--ce-p4) 18%, transparent);
}

.info-card {
  border-radius: var(--ds-radius-card);
  padding: 0.9rem 1.1rem;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.info-card svg {
  width: 18px;
  color: var(--ce-acc);
  flex-shrink: 0;
}

.info-card strong {
  font-size: var(--ds-size-body);
  color: var(--ce-ink2);
}

.info-card p {
  font-size: var(--ds-size-body);
  color: var(--ce-ink3);
  line-height: 1.6;
  margin: 3px 0 0;
}

.info-card.pink {
  background: var(--ce-pinkbg);
  border-color: var(--ce-pinkbdr);
}

.info-card.green {
  background: var(--ce-greenbg);
  border-color: rgba(26,122,74,0.110);
}

.day-chip {
  width: 42px;
  height: 36px;
  border-radius: var(--border-radius-md, 9px);
  border: 0.5px solid color-mix(in srgb, var(--ce-p4) 55%, transparent);
  background: var(--ce-paper);
  color: var(--color-text-secondary, var(--ce-ink4));
  font-size: var(--ds-size-small);
  font-weight: 500;
  padding: 0;
  min-width: 0;
  min-height: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.day-chip small {
  color: inherit;
  font-size: var(--ds-size-small);
  font-weight: 500;
  line-height: 1;
}

.day-chip.disabled,
.day-chip:disabled {
  cursor: not-allowed;
  opacity: 0.34;
  background: var(--ce-p2);
  color: var(--color-text-secondary, var(--ce-ink4));
  border-color: color-mix(in srgb, var(--ce-p4) 35%, transparent);
}

.day-chip:hover {
  border-color: color-mix(in srgb, var(--ce-green) 22%, var(--ce-p4));
  background: color-mix(in srgb, var(--ce-green) 4%, var(--ce-paper));
  color: var(--ce-ink2);
  transform: none;
  box-shadow: none;
}

.day-chip.selected {
  background: color-mix(in srgb, var(--ce-green) 12%, var(--ce-paper));
  border-color: color-mix(in srgb, var(--ce-green) 70%, var(--ce-p4));
  border-width: 1.5px;
  color: var(--ce-green);
}

.recurrence-preview,
.detail-hint,
.calc-card {
  background: var(--ce-pinkbg);
  border: 1px solid var(--ce-pinkbdr);
  border-radius: var(--ds-radius-control);
  padding: 9px 12px;
  font-size: var(--ds-size-body);
  color: var(--ce-ink2);
  line-height: 1.5;
}

.input-with-icon {
  position: relative;
}

.input-with-icon svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  color: var(--ce-ink4);
}

.input-with-icon .field-input {
  padding-left: 36px;
}

.recurrence-time-input svg {
  color: var(--ce-ink4);
}

.create-event-page.is-dark .recurrence-time-input svg {
  color: var(--ce-ink);
}

.recurrence-time-field {
  min-height: 42px;
}

.category-trigger {
  width: 100%;
  background: var(--ce-p2);
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-control);
  padding: 11px 14px;
  color: var(--ce-ink);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: var(--ds-size-body);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
}

.category-trigger.open,
.category-trigger:focus {
  border-color: var(--ce-acc);
  background: var(--ce-paper);
  box-shadow: var(--focus-ring);
}

.category-trigger:hover {
  background: color-mix(in srgb, var(--ce-acc) 3%, var(--ce-p2));
  border-color: color-mix(in srgb, var(--ce-ink5) 34%, var(--ce-p4));
  transform: none;
  box-shadow: none;
}

.category-trigger.error {
  border-color: var(--ce-red);
}

.category-trigger > svg {
  width: 15px;
  height: 15px;
  transform: rotate(90deg);
  color: var(--ce-ink4);
  flex-shrink: 0;
}

.category-trigger-copy {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.category-trigger-copy svg {
  width: 17px;
  height: 17px;
  color: var(--ce-acc);
  flex-shrink: 0;
}

.category-menu {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 9px;
  padding: 10px;
  background: var(--ce-paper);
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-card);
}

.category-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-control);
  background: var(--ce-p2);
  color: var(--ce-ink3);
  padding: 8px 10px;
  font-size: var(--ds-size-body);
  font-weight: 600;
  text-align: left;
  text-transform: none;
  letter-spacing: 0;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.category-option:hover {
  border-color: color-mix(in srgb, var(--ce-ink5) 38%, var(--ce-p4));
  color: var(--ce-ink2);
  transform: none;
  box-shadow: none;
}

.category-option svg {
  width: 16px;
  height: 16px;
  color: var(--ce-acc);
  flex-shrink: 0;
}

.category-option.selected {
  border-color: var(--ce-acc-border);
  background: var(--ce-acc-soft);
  color: var(--ce-ink);
}

.venue-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--ce-paper);
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-control);
  box-shadow: var(--shadow-subtle);
  z-index: 10;
  overflow: hidden;
}

.venue-results button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  color: var(--ce-ink2);
  border-radius: 0;
  text-transform: none;
  letter-spacing: 0;
  font-size: var(--ds-size-body);
  min-height: 0;
}

.venue-results span {
  color: var(--ce-ink4);
  font-size: var(--ds-size-small);
}

.field-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.text-btn,
.inline-btn,
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: transparent;
  color: var(--ce-ink3);
  border: 1px solid var(--ce-p4);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: var(--ds-size-body);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
}

.text-btn {
  border: 0;
  padding: 0;
}

.upload-tabs {
  display: flex;
  background: var(--ce-p3);
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-control);
  overflow: hidden;
  margin-bottom: 12px;
}

.upload-tabs button {
  flex: 1;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ce-ink3);
  font-size: var(--ds-size-body);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
}

.upload-tabs button.active {
  background: var(--ce-paper);
  color: var(--ce-ink);
}

.upload-tabs button:hover {
  background: color-mix(in srgb, var(--ce-acc) 3%, transparent);
  color: var(--ce-ink2);
  transform: none;
  box-shadow: none;
}

.upload-zone {
  border: 2px dashed var(--ce-p4);
  border-radius: var(--ds-radius-card);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  background: var(--ce-paper);
  text-align: center;
  color: var(--ce-ink3);
}

.upload-zone.dragging {
  border-color: color-mix(in srgb, var(--ce-acc) 55%, var(--ce-p4));
  background: color-mix(in srgb, var(--ce-acc) 7%, var(--ce-paper));
}

.upload-ring {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--ce-p3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-ring svg {
  width: 20px;
}

.upload-zone strong {
  font-size: var(--ds-size-body);
  color: var(--ce-ink2);
}

.upload-zone span {
  font-size: var(--ds-size-small);
}

.upload-zone small {
  font-size: var(--ds-size-small);
  color: var(--ce-ink4);
}

.url-panel {
  display: flex;
  gap: 8px;
  align-items: center;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
  margin-top: 10px;
}

.template-grid button {
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  border: 2px solid transparent;
  padding: 0;
  min-height: 0;
}

.image-manager {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) 1fr;
  gap: 12px;
  margin-top: 12px;
}

.cover-preview,
.gallery-preview {
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-control);
  background: var(--ce-p2);
  padding: 10px;
}

.image-label {
  display: block;
  font-size: var(--ds-size-small);
  font-weight: var(--ds-weight-semibold);
  text-transform: none;
  letter-spacing: 0.06em;
  color: var(--ce-ink4);
  margin-bottom: 8px;
}

.cover-frame {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: var(--ds-radius-control);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ce-acc) 42%, var(--ce-p4));
}

.cover-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.cover-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 0;
  background: rgba(0, 0, 0, 0.62);
  color:var(--color-on-image);
  padding: 0;
  min-height: 0;
}

.cover-remove svg {
  width: 15px;
  height: 15px;
}

.cover-empty {
  min-height: 120px;
  border: 1.5px dashed var(--ce-p4);
  border-radius: var(--ds-radius-control);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ce-ink4);
  font-size: var(--ds-size-body);
}

.image-strip {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.image-thumb {
  position: relative;
  width: 80px;
  height: 58px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--ce-p4);
  flex-shrink: 0;
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-thumb > button,
.thumb-actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0;
  background: var(--color-surface-soft);
  transition: opacity 0.15s ease;
}

.image-thumb:hover > button,
.image-thumb:hover .thumb-actions {
  opacity: 1;
}

.image-thumb button {
  min-height: 0;
  padding: 5px 7px;
  border-radius: 999px;
  font-size: var(--ds-size-small);
  text-transform: none;
  letter-spacing: 0;
}

.detail-chip.selected {
  border-color: var(--ce-acc-border);
  background: var(--ce-acc-soft);
  color: var(--ce-ink);
}

.detail-fields,
.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.detail-field-card,
.ticket-card {
  position: relative;
  background: var(--ce-p2);
  border: 1px solid var(--ce-p3);
  border-radius: var(--ds-radius-control);
  padding: 12px 14px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  padding: 0;
}

.icon-btn.danger {
  color: var(--ce-red);
}

.detail-field-card .icon-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.ticket-mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ticket-mode-card {
  position: relative;
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-card);
  padding: 1rem;
  background: var(--ce-paper);
  color: var(--ce-ink3);
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.ticket-mode-card:hover {
  border-color: color-mix(in srgb, var(--ce-ink5) 38%, var(--ce-p4));
  color: var(--ce-ink2);
  transform: none;
  box-shadow: none;
}

.ticket-mode-card > svg {
  width: 20px;
}

.ticket-mode-card strong {
  color: var(--ce-ink);
  font-size: var(--ds-size-body);
  font-weight: 600;
}

.ticket-mode-card span {
  font-size: var(--ds-size-small);
  line-height: 1.5;
}

.ticket-mode-card.selected {
  border-color: var(--ce-acc-border);
  background: var(--ce-acc-soft);
  box-shadow: none;
}

.count-badge {
  font-size: var(--ds-size-small);
  font-weight: 600;
  background: var(--ce-p3);
  color: var(--ce-ink3);
  padding: 2px 9px;
  border-radius: 100px;
  border: 1px solid var(--ce-p4);
}

.quick-chip.custom {
  border-style: dashed;
  border-color: var(--ce-ink5);
}

.color-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: var(--ce-ink4);
  font-size: var(--ds-size-body);
  border: 1.5px dashed var(--ce-p4);
  border-radius: var(--ds-radius-card);
  background: var(--ce-p2);
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
}

.empty-state svg {
  width: 26px;
}

.ticket-card-head,
.summary-row,
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ticket-card-head {
  margin-bottom: 12px;
}

.ticket-card-head strong {
  flex: 1;
  font-family: var(--ds-font-heading);
  font-weight: 400;
}

.calc-card {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.calc-card svg {
  width: 16px;
}

.toggle-row {
  padding: 10px 0;
  border-top: 1px solid var(--ce-p3);
}

.toggle-row:first-child {
  border-top: 0;
}

.toggle-row strong {
  display: block;
  font-size: var(--ds-size-body);
  color: var(--ce-ink2);
}

.toggle-row small {
  display: block;
  font-size: var(--ds-size-small);
  color: var(--ce-ink4);
  line-height: 1.5;
}

.toggle-row input[type='checkbox'] {
  width: 38px;
  height: 22px;
  accent-color: var(--ce-acc);
  flex-shrink: 0;
}

.summary-row {
  background: var(--ce-p2);
  border: 1px solid var(--ce-p3);
  border-radius: var(--ds-radius-control);
  padding: 10px 14px;
  margin-top: 10px;
  font-size: var(--ds-size-body);
}

.summary-row strong {
  font-family: var(--ds-font-heading);
  font-size: 18px;
  font-weight: var(--ds-weight-semibold);
}

.required-tag {
  font-size: var(--ds-size-small);
  font-weight: var(--ds-weight-semibold);
  color: var(--ce-acc);
}

.email-preview {
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-card);
  overflow: hidden;
}

.email-head {
  background: var(--ce-p2);
  padding: 10px 14px;
  border-bottom: 1px solid var(--ce-p3);
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: var(--ds-size-small);
  color: var(--ce-ink3);
}

.email-head strong {
  font-size: var(--ds-size-body);
  color: var(--ce-ink);
}

.email-body {
  padding: 14px;
  font-size: var(--ds-size-body);
  color: var(--ce-ink2);
  line-height: 1.7;
}

.email-ticket {
  background: var(--ce-p2);
  border: 1px solid var(--ce-p3);
  border-radius: var(--ds-radius-control);
  padding: 12px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-actions {
  display: flex;
  gap: 9px;
  align-items: stretch;
  margin-top: 1.2rem;
}

.back-btn {
  width: 46px;
  height: 50px;
  background: var(--ce-paper);
  border: 1px solid var(--ce-p4);
  color: var(--ce-ink3);
  border-radius: var(--ds-radius-card);
  padding: 0;
  min-height: 0;
}

.primary-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: var(--ce-ink);
  color: var(--ce-paper);
  border: 0;
  border-radius: var(--ds-radius-card);
  padding: 14px 22px;
  font-size: var(--ds-size-body);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  transition:
    background 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.primary-btn:hover {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015)),
    var(--ce-ink);
  transform: translateY(-1px);
  box-shadow: var(--shadow-subtle);
}

.primary-btn:disabled,
.primary-btn.disabled,
.primary-btn.publish:disabled,
.primary-btn.publish.disabled {
  background: var(--ce-p3);
  color: var(--ce-ink4);
  cursor: not-allowed;
  opacity: 1;
  box-shadow: none;
}

.primary-btn:disabled:hover,
.primary-btn.disabled:hover,
.primary-btn.publish:disabled:hover,
.primary-btn.publish.disabled:hover {
  background: var(--ce-p3);
  color: var(--ce-ink4);
  transform: none;
  box-shadow: none;
}

.primary-btn.publish {
  background: var(--ce-acc);
  color: var(--color-on-action);
}

.primary-btn.publish:hover {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    var(--ce-acc);
}

.preview-col {
  position: sticky;
  top: 72px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-label {
  font-size: var(--ds-size-small);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0.09em;
  text-transform: none;
  color: var(--ce-ink4);
  padding: 0 4px;
}

.tip-card {
  border-radius: var(--ds-radius-control);
  padding: 11px 13px;
}

.tip-card strong {
  font-size: var(--ds-size-small);
  color: var(--ce-ink2);
}

.tip-card p {
  font-size: var(--ds-size-small);
  color: var(--ce-ink4);
  line-height: 1.6;
  margin: 4px 0 0;
}

.ce-toast {
  position: fixed;
  bottom: 1.75rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--ce-ink);
  color: var(--ce-paper);
  padding: 11px 18px;
  border-radius: var(--ds-radius-card);
  font-size: var(--ds-size-body);
  font-weight: 500;
  z-index: 500;
}

.success-screen {
  min-height: 100vh;
  max-width: 540px;
  margin: 0 auto;
  padding: 4rem 2rem 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
}

.success-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--ce-greenbg);
  color: var(--ce-green);
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-ring svg {
  width: 34px;
}

.success-screen h1 {
  font-family: var(--ds-font-heading);
  font-size: 2.2rem;
  font-weight: 400;
  line-height: 1.1;
}

.success-screen p {
  color: var(--ce-ink3);
  font-size: var(--ds-size-body);
  line-height: 1.65;
}

.success-screen .published-meta {
  display: flex;
  gap: 8px;
  margin: -0.75rem 0 0;
  text-transform: capitalize;
}

.success-screen .published-meta span + span::before {
  content: 'Â·';
  margin-right: 8px;
}

.share-box {
  width: 100%;
  background: var(--ce-p3);
  border: 1px solid var(--ce-p4);
  border-radius: var(--ds-radius-control);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.share-box span {
  flex: 1;
  font-size: var(--ds-size-body);
  color: var(--ce-ink3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-box button {
  background: var(--ce-ink);
  color: var(--ce-paper);
  border: 0;
  border-radius: 6px;
  padding: 7px 14px;
  font-size: var(--ds-size-small);
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
}

.datetime-picker-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  z-index: 1000;
}

.datetime-picker-modal {
  max-width: calc(100vw - 24px);
}

@media (max-width: 900px) {
  .ce-columns,
  .ce-columns.preview-off {
    grid-template-columns: 1fr;
  }

  .preview-col {
    display: none;
  }

  .ce-header {
    overflow-x: auto;
    padding: 0 1rem;
    grid-template-columns: auto auto minmax(220px, 1fr) auto;
  }

  .ce-header-actions {
    gap: 6px;
  }

  .draft-badge {
    display: none;
  }
}

@media (max-width: 640px) {
  .ce-wrap {
    width: 80%;
    padding: var(--ds-space-32) 0 var(--ds-space-64);
  }

  .ce-progress {
    flex-shrink: 0;
  }

  .ce-step span:last-child {
    display: none;
  }

  .repeat-day-row {
    display: grid;
    grid-template-columns: 36px auto;
    align-items: start;
  }

  .repeat-day-time-controls {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  }

  .repeat-change-actions {
    grid-template-columns: 1fr;
  }

  .two-col,
  .ticket-mode-grid,
  .category-menu,
  .image-manager {
    grid-template-columns: 1fr;
  }

  .ce-card {
    border-radius: var(--ds-radius-card);
    padding: var(--ds-rhythm-card-padding-mobile);
  }

  .field,
  .paid-block {
    margin-bottom: var(--ds-space-24);
  }

  .two-col {
    gap: 12px;
  }

  .url-panel,
  .field-top {
    flex-direction: column;
    align-items: stretch;
  }
}

/* Keep every onboarding control inside its responsive column. */
@media (max-width: 720px) {
  .create-event-page button,
  .create-event-page input,
  .create-event-page select,
  .create-event-page textarea {
    max-width: 100%;
    box-sizing: border-box;
  }

  .pill-row,
  .quick-chip-row,
  .detail-chip-row,
  .repeat-frequency-row,
  .day-row,
  .nav-actions {
    width: 100%;
    min-width: 0;
  }

  .pill-row > button,
  .quick-chip-row > button,
  .detail-chip-row > button {
    min-width: 0;
    white-space: normal;
  }

  .nav-actions .primary-btn { min-width: 0; width: 100%; }
}
/* Shared product roles across Basics, Details, Tickets and Attendees. */
.create-event-page { font-size: var(--ds-size-body); line-height: 1.6; }
.create-event-page :deep(svg) { stroke-width: 1.5; flex-shrink: 0; }
.create-event-page :is(button, input, select, textarea) { font-family: var(--ds-font-body); }
.create-event-page :is(button, input, select, textarea):focus-visible {
  outline: 1px solid var(--ce-acc);
  outline-offset: 2px;
}
.field-input, :deep(.datetime-input) { border-color: var(--ce-ink5); border-radius: var(--ds-radius-control); }
.field-input-xl { font: 400 var(--ds-size-body)/1.6 var(--ds-font-body); }
label, .field-top label, :deep(.input-label) { font-size: var(--ds-size-label); font-weight: 600; }
.screen-head h1 em { font-style: normal; }
.ce-columns > *, .two-col > * { min-width: 0; }
.ce-header { height: auto; min-height: 76px; padding-inline: 7.5%; }
.ce-logo img { height: 48px; }
.ce-step { min-height: 36px; }
.ce-step-number { width: 20px; height: 20px; }
.ce-step.future { opacity: 1; }
.primary-btn { background: var(--ce-acc); color: var(--ds-color-on-brand); border-radius: var(--ds-radius-control); }
.primary-btn:hover:not(:disabled) { background: var(--ds-color-brand-hover); }
@media (max-width: 1024px) {
  .ce-wrap { width: 80%; }
  .ce-header { padding: var(--ds-space-12) 10%; grid-template-columns: auto auto 1fr; gap: var(--ds-space-12); overflow: visible; }
  .ce-progress { grid-row: 2; grid-column: 1 / -1; width: 100%; justify-content: space-between; }
  .ce-header-actions { grid-column: 3; grid-row: 1; }
}
@media (max-width: 640px) {
  .ce-card, .info-card, .tip-card { padding: var(--ds-rhythm-card-padding-mobile); }
  .ce-card.compact { padding: var(--ds-space-20); }
  .ce-header { column-gap: var(--ds-space-8); }
  .ce-logo img { width: 80px; height: auto; }
  .ce-header-back, .theme-btn { width: 32px; height: 32px; }
  .ce-header-actions { flex-wrap: wrap; }
  .ghost-btn { padding-inline: var(--ds-space-8); }
}
</style>



<style scoped>
.create-event-page.ce-embedded { min-height: 0; background: transparent; }
.create-event-page.ce-embedded .ce-wrap { width: 100%; max-width: none; margin: 0; padding: 0; }
.ce-embedded .ce-columns { display: block; }
.ce-embedded .ce-form { width: 100%; min-width: 0; }
.ce-embedded .screen + .screen { margin-top: 24px; }
.ce-embedded .nav-actions { justify-content: flex-end; gap: 16px; }
.ce-embedded .ce-card { max-width: 100%; }
.ce-embedded .ticket-card { display: flex; flex-direction: column; gap: 20px; }
.ce-embedded .ticket-card .two-col > .field { margin-bottom: 0; }
.ce-embedded .ticket-card-head { flex-wrap: wrap; row-gap: 8px; margin-bottom: 0; }
.ce-embedded .ticket-card-head > span:not(.color-dot) { flex: 1 1 100%; order: 1; color: var(--ce-ink3); font-size: var(--ds-size-small); }
.ce-embedded .ticket-card-head .icon-btn { margin-left: auto; }
.ce-embedded .quick-chip.custom { white-space: nowrap; }
.ce-embedded .ticket-mode-card > svg { height: 20px; }
.ce-embedded label > span { margin-left: 4px; }

</style>

<style scoped>
.recurrence-frequency { margin-bottom: 20px; }
.recurrence-timing-help { margin-bottom: 16px; }
.recurrence-options .recurrence-choice-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.recurrence-options .recurrence-end-fields > .field { margin-bottom: 0; }
.recurrence-options .recurrence-choice { align-items: flex-start; justify-content: flex-start; }
.recurrence-options .day-chip:disabled { cursor: default; }
@media (max-width: 600px) {
  .recurrence-options .recurrence-choice-list { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .recurrence-options .reveal-step { animation: none; }
}
</style>

<style scoped>
.recurring-range-fields { display: grid; gap: var(--ds-space-16); }
.recurring-range-fields .field { margin-bottom: 0; }
.recurring-range .repeat-frequency-pill { border: 1px solid var(--ds-color-border-control); border-radius: var(--ds-radius-control); background: var(--ds-color-surface); color: var(--ds-color-text); }
.recurring-range .repeat-frequency-pill.selected { border-color: var(--ds-color-selection-border); background: var(--ds-color-selection-soft); color: var(--ds-color-text); }
.recurring-range .repeat-frequency-pill:hover { border-color: var(--ds-color-selection-border); background: var(--ds-color-surface-subtle); color: var(--ds-color-text); }
.recurring-range.recurrence-options { border: 0; padding: 0; box-shadow: none; }
.recurring-range .recurrence-schedule-preview { border: 1px solid var(--ds-color-border-card); border-radius: var(--ds-radius-card); background: var(--ds-color-surface-subtle); padding: var(--ds-space-16); }
.recurring-range .next-occurrences li { border-color: var(--ds-color-border-control); border-radius: var(--ds-radius-control); background: var(--ds-color-surface); }
</style>

<style scoped>
.recurring-range .day-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(52px, 1fr)); gap: var(--ds-space-8); width: 100%; }
.recurring-range .day-chip { min-width: 0; min-height: 44px; border: 1px solid var(--ds-color-border-control); border-radius: var(--ds-radius-control); background: var(--ds-color-surface); color: var(--ds-color-text); padding: 8px; font: inherit; }
.recurring-range .day-chip.selected { border-color: var(--ds-color-selection-border); background: var(--ds-color-selection-soft); color: var(--ds-color-text); box-shadow: none; }
.recurring-range .day-chip:disabled { opacity: 1; color: var(--ds-color-text); cursor: default; }
.recurring-range .day-chip:hover { border-color: var(--ds-color-selection-border); background: var(--ds-color-surface-subtle); color: var(--ds-color-text); transform: none; box-shadow: none; }
</style>

<style scoped>
.event-type-options { margin-bottom: var(--ds-space-32); }
</style>

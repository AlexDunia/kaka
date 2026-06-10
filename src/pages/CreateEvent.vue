<script setup>
import { computed, inject, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
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
} from '@heroicons/vue/24/outline'
import DateTimePicker from '@/components/DateTimePicker.vue'
import DateTimePickerInput from '@/components/DateTimePickerInput.vue'
import EventCard from '@/components/EventCard.vue'
import {
  DEFAULT_CREATE_EVENT_TIPS,
  buildCreateEventPayload,
  saveCreateEventDraft,
} from '@/services/createEventService'

const router = useRouter()
const themeController = inject('themeController', null)

const steps = ['Basics', 'Details', 'Tickets', 'Attendees']
const repeatRhythmOptions = [
  { value: 'days', label: 'Every day' },
  { value: 'weeks', label: 'Every week' },
  { value: 'months', label: 'Every month' },
  { value: 'years', label: 'Every year' },
]
const repeatDayOptions = [
  { id: 'Mon', short: 'Mo', name: 'Monday' },
  { id: 'Tue', short: 'Tu', name: 'Tuesday' },
  { id: 'Wed', short: 'We', name: 'Wednesday' },
  { id: 'Thu', short: 'Th', name: 'Thursday' },
  { id: 'Fri', short: 'Fr', name: 'Friday' },
  { id: 'Sat', short: 'Sa', name: 'Saturday' },
  { id: 'Sun', short: 'Su', name: 'Sunday' },
]
const today = new Date()
today.setHours(0, 0, 0, 0)

const categoryOptions = [
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

const venues = [
  ['Eko Hotel & Suites', 'Plot 1415 Adetokunbo Ademola St, Victoria Island, Lagos'],
  ['The Civic Centre', 'Ozumba Mbadiwe Ave, Victoria Island, Lagos'],
  ['Landmark Event Centre', 'Water Corporation Dr, Oniru, Lagos'],
  ['Terra Kulture', '1376 Tiamiyu Savage St, Victoria Island, Lagos'],
  ['Transcorp Hilton Abuja', '1 Aguiyi-Ironsi St, Maitama, Abuja'],
]

const detailOptions = [
  { type: 'parking', label: 'Parking', icon: MapPinIcon, placeholder: 'Free parking on-site from 5pm.' },
  { type: 'dress', label: 'Dress code', icon: SparklesIcon, placeholder: 'Smart casual, formal, or themed attire.' },
  { type: 'bring', label: 'What to bring', icon: DocumentTextIcon, placeholder: 'Valid ID, ticket, business cards, or supplies.' },
  { type: 'agenda', label: 'Agenda', icon: ClockIcon, placeholder: '9:00 AM registration, 10:00 AM keynote...' },
  { type: 'speakers', label: 'Speakers', icon: UserIcon, placeholder: 'Speaker names, roles, and session topics.' },
  { type: 'food', label: 'Food & drinks', icon: InformationCircleIcon, placeholder: 'Cocktails, light bites, vegetarian or halal options.' },
  { type: 'transport', label: 'Getting there', icon: MapPinIcon, placeholder: 'Ride-share, public transport, or parking notes.' },
  { type: 'faq', label: 'FAQs', icon: QuestionMarkCircleIcon, placeholder: 'Answer common attendee questions.' },
]

const ticketTemplates = [
  { name: 'Early Bird', unitType: 'individual', color: '#1a7a4a', price: 5000 },
  { name: 'General Admission', unitType: 'individual', color: '#1a5fa6', price: 10000 },
  { name: 'VIP', unitType: 'individual', color: '#ec4899', price: 30000 },
  { name: 'Gold Table', unitType: 'table', color: '#ec4899', price: 250000 },
  { name: 'Silver Table', unitType: 'table', color: '#7a8fa6', price: 150000 },
  { name: 'Student', unitType: 'individual', color: '#302b63', price: 3000 },
]

const attendeeFieldDefaults = [
  { id: 'name', label: 'Full name', help: 'First and last name', enabled: true, required: true },
  { id: 'email', label: 'Email address', help: 'For ticket delivery and updates', enabled: true, required: true },
  { id: 'phone', label: 'Phone number', help: 'For WhatsApp updates and emergency contact', enabled: true, required: false },
  { id: 'company', label: 'Organisation / Company', help: 'Where they work or study', enabled: false, required: false },
  { id: 'job', label: 'Job title', help: 'Their role or position', enabled: false, required: false },
  { id: 'dietary', label: 'Dietary requirements', help: 'Useful for catered events', enabled: false, required: false },
  { id: 'shirt', label: 'T-shirt size', help: 'If giving out merchandise', enabled: false, required: false },
  { id: 'source', label: 'How did you hear about us?', help: 'Useful for marketing insight', enabled: false, required: false },
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
  recurrenceType: 'once',
  repeatFrequency: '',
  repeatInterval: 1,
  repeatUnit: '',
  repeatDays: [],
  repeatStartDate: '',
  repeatStartTime: '',
  repeatEndTime: '',
  repeatDayOverrides: {},
  repeatStopMode: '',
  repeatEndDate: '',
  format: 'in-person',
  venue: '',
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

const themePreferenceKey = 'kaka-theme-preference'
const fallbackTheme = ref('dark')
const theme = computed(() => themeController?.theme?.value || fallbackTheme.value)
let themeInstantToken = 0
const currentStep = ref(1)
const maxStepReached = ref(1)
const previewOn = ref(window.localStorage?.getItem('kaka-create-preview') !== 'false')
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
const errors = reactive({})
const ticketId = ref(0)
const activeRepeatDatePicker = ref('')
const activeRepeatTimePicker = ref(null)
let toastTimer
let draftTimer

const activeTips = computed(() =>
  DEFAULT_CREATE_EVENT_TIPS.filter((tip) => tip.status === 'active').sort(
    (a, b) => a.sortOrder - b.sortOrder,
  ),
)

const currentTip = computed(() => activeTips.value[tipIndex.value]?.body || activeTips.value[0]?.body)

const venueResults = computed(() => {
  const query = form.venue.toLowerCase().trim()
  if (!query) return []
  return venues
    .filter(([name, address]) => `${name} ${address}`.toLowerCase().includes(query))
    .slice(0, 5)
})

const selectedDetailTypes = computed(() => new Set(form.extraDetails.map((detail) => detail.type)))

const visibleTickets = computed(() => form.tickets.filter((ticket) => ticket.visible))

const totalCapacity = computed(() =>
  form.tickets.reduce((sum, ticket) => {
    if (ticket.unitType === 'table') return sum + ticket.units * ticket.peoplePerUnit
    return sum + ticket.units
  }, 0),
)

const previewEvent = computed(() => ({
  id: 'preview',
  title: form.title || 'Your event name appears here',
  main_image: form.coverImage,
  date: form.startsAt?.toISOString?.() || form.startsAt,
  location:
    form.format === 'online'
      ? 'Online event'
      : form.venue || (form.format === 'hybrid' ? 'In-person & online' : 'Location TBC'),
  category: { name: form.category || 'Event' },
  price:
    form.ticketMode === 'free'
      ? 0
      : Math.min(...visibleTickets.value.map((ticket) => Number(ticket.price) || 0), 0),
  rating: '4.5',
}))

const recurrenceSummary = computed(() => {
  if (form.recurrenceType === 'once') return 'This event happens once.'
  if (!recurrenceReady.value) return ''
  return `${repeatRhythmLabel.value}. ${repeatSummaryRows.value.join(' ')} ${repeatStopSummary.value}.`
})

const emailDate = computed(() => formatDateTime(form.startsAt))
const selectedRepeatDays = computed(() =>
  repeatDayOptions.filter((day) => form.repeatDays.includes(day.id)),
)
const repeatStepOneComplete = computed(
  () => Boolean(form.repeatUnit) && (form.repeatUnit !== 'weeks' || form.repeatDays.length > 0),
)
const repeatDateRangeValid = computed(() => {
  if (!form.repeatStartDate || !form.repeatEndDate) return true
  return new Date(form.repeatEndDate) >= new Date(form.repeatStartDate)
})
const repeatStepTwoComplete = computed(() => Boolean(form.repeatStartDate) && repeatDateRangeValid.value)
const repeatStepThreeComplete = computed(() => Boolean(form.repeatStartTime && form.repeatEndTime))
const recurrenceReady = computed(
  () => repeatStepOneComplete.value && repeatStepTwoComplete.value && repeatStepThreeComplete.value,
)
const repeatRhythmLabel = computed(
  () => repeatRhythmOptions.find((option) => option.value === form.repeatUnit)?.label || 'Repeats',
)
const repeatSummaryRows = computed(() => {
  if (form.repeatUnit === 'weeks') {
    return selectedRepeatDays.value.map((day) => {
      const { start, end } = repeatDayTimes(day.id)
      return `${day.name}: ${formatTimeLabel(start)} to ${formatTimeLabel(end)}.`
    })
  }
  return [`Time: ${formatTimeLabel(form.repeatStartTime)} to ${formatTimeLabel(form.repeatEndTime)}.`]
})
const repeatStopSummary = computed(() =>
  form.repeatEndDate
    ? `It runs from ${formatDateOnly(form.repeatStartDate)} until ${formatDateOnly(form.repeatEndDate)}`
    : `It starts on ${formatDateOnly(form.repeatStartDate)} and has no end date`,
)
const canContinue = computed(() => isStepComplete(currentStep.value))
const repeatDatePickerInitialDate = computed(() => {
  const value = activeRepeatDatePicker.value === 'end' ? form.repeatEndDate : form.repeatStartDate
  return dateOnlyToDate(value) || dateOnlyToDate(form.repeatStartDate) || new Date(form.startsAt || today)
})
const repeatDatePickerMinDate = computed(() => {
  if (activeRepeatDatePicker.value === 'end') {
    return dateOnlyToDate(form.repeatStartDate) || today
  }
  return today
})
const repeatDatePickerMaxDate = computed(() => {
  if (activeRepeatDatePicker.value === 'start' && form.repeatEndDate) {
    return dateOnlyToDate(form.repeatEndDate)
  }
  return null
})
const repeatTimePickerInitialDate = computed(() => {
  const time = getRepeatTimePickerValue() || '09:00'
  return combineDateAndTime(form.repeatStartDate || toDateInputValue(form.startsAt || today), time)
})

function tomorrowAt(hour) {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(hour, 0, 0, 0)
  return date
}

function formatDateTime(value) {
  if (!value) return 'Date and time'
  return new Date(value).toLocaleString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateOnly(value) {
  if (!value) return 'the selected end date'
  return new Date(value).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
  const date = value ? new Date(value) : new Date()
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function combineDateAndTime(dateValue, timeValue) {
  const date = dateOnlyToDate(dateValue) || new Date()
  const [hour = '9', minute = '00'] = String(timeValue || '09:00').split(':')
  date.setHours(Number(hour) || 0, Number(minute) || 0, 0, 0)
  return date
}

function getRepeatTimePickerValue() {
  const target = activeRepeatTimePicker.value
  if (!target) return ''
  if (target.scope === 'default') {
    return target.field === 'start' ? form.repeatStartTime : form.repeatEndTime
  }
  const override = form.repeatDayOverrides[target.day]
  return target.field === 'start' ? override?.startTime : override?.endTime
}

function setRepeatTimePickerValue(value) {
  const target = activeRepeatTimePicker.value
  if (!target) return
  if (target.scope === 'default') {
    if (target.field === 'start') form.repeatStartTime = value
    else form.repeatEndTime = value
    syncRecurringPrimaryDates()
    clearError('repeatSchedule')
    return
  }
  const override = ensureRepeatDayOverride(target.day)
  if (target.field === 'start') override.startTime = value
  else override.endTime = value
  clearError('repeatSchedule')
}

function syncRecurringPrimaryDates() {
  if (form.recurrenceType !== 'recur' || !form.repeatStartDate) return
  if (form.repeatStartTime) {
    form.startsAt = combineDateAndTime(form.repeatStartDate, form.repeatStartTime)
  }
  if (form.repeatStartTime && form.repeatEndTime) {
    const start = combineDateAndTime(form.repeatStartDate, form.repeatStartTime)
    const end = combineDateAndTime(form.repeatStartDate, form.repeatEndTime)
    if (end <= start) end.setDate(end.getDate() + 1)
    form.endsAt = end
  }
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

function saveDraft() {
  saveCreateEventDraft(form)
  markDraftSaved()
}

function togglePreview() {
  previewOn.value = !previewOn.value
  window.localStorage?.setItem('kaka-create-preview', previewOn.value ? 'true' : 'false')
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
    window.requestAnimationFrame(() => window.requestAnimationFrame(releaseInstantTheme))
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
    window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
  applyTheme(prefersLight ? 'light' : 'dark')
}

function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}

function setStep(step) {
  if (step > maxStepReached.value) return
  currentStep.value = step
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
    if (!form.startsAt || !form.endsAt) return false
    if (form.startsAt && new Date(form.startsAt) < today) return false
    if (form.endsAt && form.startsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
      return false
    }
    if (form.format !== 'online' && !form.venue.trim()) return false
    if ((form.format === 'online' || form.format === 'hybrid') && !form.meetingLink.trim()) {
      return false
    }
    if (!form.category) return false
    if (form.recurrenceType === 'recur') {
      return recurrenceReady.value
    }
    return true
  }

  if (step === 2) return Boolean(form.coverImage)

  if (step === 3 && form.ticketMode === 'paid') {
    return (
      form.tickets.length > 0 &&
      form.tickets.every((ticket) => ticket.name.trim() && Number(ticket.price) >= 0)
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
    if (!form.title.trim()) setError('title', 'Please enter an event name.')
    if (!form.startsAt) setError('startsAt', 'Please choose a start date and time.')
    if (!form.endsAt) setError('endsAt', 'Please choose an end date and time.')
    if (form.startsAt && new Date(form.startsAt) < today) {
      setError('startsAt', 'Start date cannot be in the past.')
    }
    if (form.endsAt && form.startsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
      setError('endsAt', 'End time must be after the start time.')
    }
    if (form.format !== 'online' && !form.venue.trim()) {
      setError('venue', 'Please enter the venue or address.')
    }
    if ((form.format === 'online' || form.format === 'hybrid') && !form.meetingLink.trim()) {
      setError('meetingLink', 'Please add the meeting link for online attendees.')
    }
    if (!form.category) setError('category', 'Please choose a category.')
    if (form.recurrenceType === 'recur') {
      if (!repeatStepOneComplete.value) setError('repeatSchedule', 'Choose how often this repeats.')
      if (repeatStepOneComplete.value && !repeatStepTwoComplete.value) {
        setError('repeatSchedule', repeatDateRangeValid.value ? 'Choose when the recurrence starts.' : 'End date cannot be before the start date.')
      }
      if (repeatStepTwoComplete.value && !repeatStepThreeComplete.value) {
        setError('repeatSchedule', 'Add the default start and end time.')
      }
    }
  }

  if (step === 2 && !form.coverImage) {
    setError('coverImage', 'Please add a cover image so attendees can recognise your event.')
  }

  if (step === 3 && form.ticketMode === 'paid') {
    if (!form.tickets.length) setError('tickets', 'Add at least one paid ticket category.')
    form.tickets.forEach((ticket) => {
      if (!ticket.name.trim()) setError(`ticket-${ticket.id}-name`, 'Ticket name is required.')
      if (ticket.price < 0) setError(`ticket-${ticket.id}-price`, 'Ticket price cannot be negative.')
    })
  }

  const firstError = Object.keys(errors)[0]
  if (firstError) {
    requestAnimationFrame(() => {
      document.querySelector(`[data-error-key="${firstError}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
    return false
  }
  return true
}

function pickVenue(name) {
  form.venue = name
  showVenueResults.value = false
}

function selectCategory(category) {
  form.category = category.name
  showCategoryMenu.value = false
  clearError('category')
}

function selectRepeatRhythm(unit) {
  form.repeatUnit = unit
  form.repeatFrequency = unit
  form.repeatInterval = 1
  if (unit !== 'weeks') {
    form.repeatDays = []
    form.repeatDayOverrides = {}
  }
  clearError('repeatSchedule')
}

function toggleRepeatDay(day) {
  if (form.repeatDays.includes(day)) {
    form.repeatDays = form.repeatDays.filter((item) => item !== day)
    delete form.repeatDayOverrides[day]
  } else {
    form.repeatDays.push(day)
  }
  clearError('repeatSchedule')
}

function ensureRepeatDayOverride(day) {
  if (!form.repeatDayOverrides[day]) {
    form.repeatDayOverrides[day] = {
      expanded: false,
      startTime: '',
      endTime: '',
    }
  }
  return form.repeatDayOverrides[day]
}

function toggleRepeatDayOverride(day) {
  const override = ensureRepeatDayOverride(day)
  Object.entries(form.repeatDayOverrides).forEach(([key, item]) => {
    if (key !== day) item.expanded = false
  })
  override.expanded = !override.expanded
}

function isRepeatDayCustom(day) {
  const override = form.repeatDayOverrides[day]
  return Boolean(override?.startTime && override?.endTime)
}

function repeatDayTimes(day) {
  const override = form.repeatDayOverrides[day]
  if (override?.startTime && override?.endTime) {
    return {
      start: override.startTime,
      end: override.endTime,
      custom: true,
    }
  }
  return {
    start: form.repeatStartTime,
    end: form.repeatEndTime,
    custom: false,
  }
}

function repeatDayTimePreview(day) {
  const { start, end } = repeatDayTimes(day)
  return `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`
}

function resetRepeatDayOverride(day) {
  form.repeatDayOverrides[day] = {
    expanded: false,
    startTime: '',
    endTime: '',
  }
}

function openRepeatDatePicker(target) {
  activeRepeatDatePicker.value = target
}

function closeRepeatDatePicker() {
  activeRepeatDatePicker.value = ''
}

function applyRepeatDate(date) {
  const value = toDateInputValue(date)
  if (activeRepeatDatePicker.value === 'end') {
    form.repeatEndDate = value
    form.repeatStopMode = 'date'
  } else {
    form.repeatStartDate = value
    if (form.repeatEndDate && new Date(form.repeatEndDate) < new Date(value)) {
      form.repeatEndDate = ''
      form.repeatStopMode = 'forever'
    }
  }
  if (!form.repeatEndDate && !form.repeatStopMode) form.repeatStopMode = 'forever'
  syncRecurringPrimaryDates()
  clearError('repeatSchedule')
}

function clearRepeatEndDate() {
  form.repeatEndDate = ''
  form.repeatStopMode = 'forever'
  clearError('repeatSchedule')
}

function openRepeatTimePicker(target) {
  activeRepeatTimePicker.value = target
}

function closeRepeatTimePicker() {
  activeRepeatTimePicker.value = null
}

function applyRepeatTime(dateTime) {
  setRepeatTimePickerValue(toTimeInputValue(dateTime))
  closeRepeatTimePicker()
}

function handleFiles(files) {
  dragActive.value = false
  Array.from(files)
    .filter((file) => file.type.startsWith('image/'))
    .slice(0, 6 - form.secondaryImages.length - (form.coverImage ? 1 : 0))
    .forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const src = event.target?.result
        if (!src) return
        if (!form.coverImage) form.coverImage = src
        else form.secondaryImages.push(src)
        clearError('coverImage')
      }
      reader.readAsDataURL(file)
    })
}

function addUrlImage() {
  const url = urlImageValue.value.trim()
  if (!url || !/\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(url)) {
    showToast('Use a direct image URL ending in jpg, png, webp, or gif.')
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
  form.extraDetails.push({ type: option.type, label: option.label, icon: option.icon, value: '' })
}

function removeDetail(type) {
  form.extraDetails = form.extraDetails.filter((detail) => detail.type !== type)
}

function selectTicketMode(mode) {
  form.ticketMode = mode
  clearError('tickets')
}

function addTicket(template = { name: '', unitType: 'individual', color: '#3d3935', price: 0 }) {
  form.tickets.push({
    id: ++ticketId.value,
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
  return ticket.unitType === 'table' ? ticket.units * ticket.peoplePerUnit : ticket.units
}

function publishEvent() {
  if (!validateStep(4)) return
  buildCreateEventPayload(form)
  saveDraft()
  published.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  initializeTheme()
  setInterval(() => {
    tipIndex.value = (tipIndex.value + 1) % activeTips.value.length
  }, 7000)
})

</script>

<template>
  <div class="create-event-page" :class="theme === 'dark' ? 'is-dark' : 'is-light'">
    <div v-if="toast" class="ce-toast">{{ toast }}</div>

    <header v-if="!published" class="ce-header">
      <RouterLink to="/" class="ce-logo" aria-label="Go home">
        <img
          src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1775755308/rushhourticketbg_fyfbiu.png"
          alt="Kaka"
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
        <span class="draft-badge" :class="{ show: draftSaved }">
          <CheckIcon aria-hidden="true" /> Draft saved
        </span>
        <button type="button" class="ghost-btn" @click="saveDraft">Save draft</button>
      </div>
    </header>

    <main v-if="!published" class="ce-wrap">
      <div class="preview-toggle">
        <span>See your event as attendees will</span>
        <button type="button" class="preview-btn" :class="{ on: previewOn }" @click="togglePreview">
          <EyeIcon v-if="previewOn" aria-hidden="true" />
          <EyeSlashIcon v-else aria-hidden="true" />
          Preview: {{ previewOn ? 'On' : 'Off' }}
        </button>
      </div>

      <div class="ce-columns" :class="{ 'preview-off': !previewOn }">
        <section class="ce-form">
          <div v-if="currentStep === 1" class="screen">
            <div class="screen-head">
              <h1>
                Let's build your<br /><em>event.</em>
                <SparklesIcon class="headline-icon" aria-hidden="true" />
              </h1>
              <p>Start with the basics. Everything can be updated after publishing.</p>
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

              <div class="divider"><span>When</span></div>
              <div class="two-col">
                <div data-error-key="startsAt">
                  <DateTimePickerInput
                    v-model="form.startsAt"
                    label="Starts"
                    placeholder="Select start date and time"
                    modal-title="Select start date and time"
                    :min-date="today"
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
                    :min-date="today"
                    :error="errors.endsAt"
                    date-format="YYYY-MM-DD"
                    time-format="hh:mm A"
                  />
                </div>
              </div>

              <div class="field">
                <label>One-time or recurring?</label>
                <p class="help">Choose whether this event happens once or repeats.</p>
                <div class="pill-row">
                  <button
                    type="button"
                    class="pill"
                    :class="{ selected: form.recurrenceType === 'once' }"
                    @click="form.recurrenceType = 'once'"
                  >
                    <CalendarDaysIcon aria-hidden="true" /> One-time
                  </button>
                  <button
                    type="button"
                    class="pill"
                    :class="{ selected: form.recurrenceType === 'recur' }"
                    @click="form.recurrenceType = 'recur'"
                  >
                    <ClockIcon aria-hidden="true" /> Recurring
                  </button>
                </div>
              </div>

              <div v-if="form.recurrenceType === 'recur'" class="sub-panel">
                <div class="info-card">
                  <InformationCircleIcon aria-hidden="true" />
                  <div>
                    <strong>Recurring events</strong>
                    <p>Set the rhythm, default time, and stop condition for every occurrence.</p>
                  </div>
                </div>

                <div class="recurrence-steps" data-error-key="repeatSchedule">
                  <section class="recurrence-step" :class="{ complete: repeatStepOneComplete }">
                    <div class="recurrence-step-head">
                      <span>1</span>
                      <div>
                        <strong>How often does it repeat?</strong>
                        <p>Choose one rhythm. You can adjust times for each selected day later.</p>
                      </div>
                    </div>
                    <div class="pill-row">
                      <button
                        v-for="option in repeatRhythmOptions"
                        :key="option.value"
                        type="button"
                        class="pill"
                        :class="{ selected: form.repeatUnit === option.value }"
                        @click="selectRepeatRhythm(option.value)"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                    <div v-if="form.repeatUnit === 'weeks'" class="field recurrence-inline-field">
                      <label>Repeat on</label>
                      <div class="day-row">
                        <button
                          v-for="day in repeatDayOptions"
                          :key="day.id"
                          type="button"
                          class="day-chip"
                          :class="{ selected: form.repeatDays.includes(day.id) }"
                          @click="toggleRepeatDay(day.id)"
                        >
                          {{ day.short }}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section
                    class="recurrence-step"
                    :class="{ locked: !repeatStepOneComplete, complete: repeatStepTwoComplete }"
                    :aria-disabled="!repeatStepOneComplete"
                  >
                    <div class="recurrence-step-head">
                      <span>2</span>
                      <div>
                        <strong>When should it start?</strong>
                        <p>Set the first date this schedule can run. End date is optional.</p>
                      </div>
                    </div>
                    <div class="two-col">
                      <div class="field recurrence-picker-control">
                        <label>Start date</label>
                        <button
                          type="button"
                          class="field-input recurrence-picker-button"
                          @click="openRepeatDatePicker('start')"
                        >
                          <CalendarDaysIcon aria-hidden="true" />
                          <span>{{ form.repeatStartDate ? formatDateOnly(form.repeatStartDate) : 'Select start date' }}</span>
                        </button>
                      </div>
                      <div class="field recurrence-picker-control">
                        <label>End date <span>Optional</span></label>
                        <div class="recurrence-picker-stack">
                          <button
                            type="button"
                            class="field-input recurrence-picker-button"
                            @click="openRepeatDatePicker('end')"
                          >
                            <CalendarDaysIcon aria-hidden="true" />
                            <span>{{ form.repeatEndDate ? formatDateOnly(form.repeatEndDate) : 'No end date' }}</span>
                          </button>
                          <button
                            v-if="form.repeatEndDate"
                            type="button"
                            class="repeat-reset-btn"
                            @click="clearRepeatEndDate"
                          >
                            Clear end date
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section
                    class="recurrence-step"
                    :class="{
                      locked: !(repeatStepOneComplete && repeatStepTwoComplete),
                      complete: repeatStepThreeComplete,
                    }"
                    :aria-disabled="!(repeatStepOneComplete && repeatStepTwoComplete)"
                  >
                    <div class="recurrence-step-head">
                      <span>3</span>
                      <div>
                        <strong>What time?</strong>
                        <p>The default time applies to every occurrence. You can adjust each selected day later.</p>
                      </div>
                    </div>
                    <div class="two-col">
                      <div class="field recurrence-picker-control">
                        <label>Start time</label>
                        <button
                          type="button"
                          class="field-input recurrence-picker-button"
                          @click="openRepeatTimePicker({ scope: 'default', field: 'start' })"
                        >
                          <ClockIcon aria-hidden="true" />
                          <span>{{ form.repeatStartTime ? formatTimeLabel(form.repeatStartTime) : 'Select start time' }}</span>
                        </button>
                      </div>
                      <div class="field recurrence-picker-control">
                        <label>End time</label>
                        <button
                          type="button"
                          class="field-input recurrence-picker-button"
                          @click="openRepeatTimePicker({ scope: 'default', field: 'end' })"
                        >
                          <ClockIcon aria-hidden="true" />
                          <span>{{ form.repeatEndTime ? formatTimeLabel(form.repeatEndTime) : 'Select end time' }}</span>
                        </button>
                      </div>
                    </div>
                    <div
                      v-if="
                        form.repeatUnit === 'weeks' &&
                        selectedRepeatDays.length > 0 &&
                        form.repeatStartTime
                      "
                      class="repeat-day-overrides"
                    >
                      <p class="repeat-day-tip">
                        Default times apply to every selected day. Open a day when that day needs its own time.
                      </p>
                      <div
                        v-for="day in selectedRepeatDays"
                        :key="day.id"
                        class="repeat-day-row"
                        :class="{
                          expanded: form.repeatDayOverrides[day.id]?.expanded,
                          custom: isRepeatDayCustom(day.id),
                        }"
                      >
                        <button type="button" @click="toggleRepeatDayOverride(day.id)">
                          <span class="repeat-day-name">{{ day.name }}</span>
                          <span
                            class="repeat-day-time"
                            :class="{ inherited: !isRepeatDayCustom(day.id) }"
                          >
                            {{ repeatDayTimePreview(day.id) }}
                          </span>
                          <span class="repeat-day-toggle" aria-hidden="true">
                            <ArrowRightIcon />
                          </span>
                        </button>
                        <div v-if="form.repeatDayOverrides[day.id]?.expanded" class="repeat-day-custom">
                          <p>Set a different time for {{ day.name }} only.</p>
                          <div class="two-col">
                            <div class="field recurrence-picker-control">
                              <label>Start time</label>
                              <button
                                type="button"
                                class="field-input recurrence-picker-button"
                                @click="openRepeatTimePicker({ scope: 'day', day: day.id, field: 'start' })"
                              >
                                <ClockIcon aria-hidden="true" />
                                <span>
                                  {{
                                    form.repeatDayOverrides[day.id].startTime
                                      ? formatTimeLabel(form.repeatDayOverrides[day.id].startTime)
                                      : 'Select start time'
                                  }}
                                </span>
                              </button>
                            </div>
                            <div class="field recurrence-picker-control">
                              <label>End time</label>
                              <button
                                type="button"
                                class="field-input recurrence-picker-button"
                                @click="openRepeatTimePicker({ scope: 'day', day: day.id, field: 'end' })"
                              >
                                <ClockIcon aria-hidden="true" />
                                <span>
                                  {{
                                    form.repeatDayOverrides[day.id].endTime
                                      ? formatTimeLabel(form.repeatDayOverrides[day.id].endTime)
                                      : 'Select end time'
                                  }}
                                </span>
                              </button>
                            </div>
                          </div>
                          <button type="button" class="repeat-reset-btn" @click="resetRepeatDayOverride(day.id)">
                            Reset to default
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <p v-if="errors.repeatSchedule" class="error-text">{{ errors.repeatSchedule }}</p>
                  <div v-if="recurrenceReady" class="recurrence-preview recurrence-summary">
                    <strong>{{ repeatRhythmLabel }}</strong>
                    <span v-for="row in repeatSummaryRows" :key="row">{{ row }}</span>
                    <span>{{ repeatStopSummary }}.</span>
                  </div>
                </div>
              </div>

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
                <label for="venue">Venue / Location</label>
                <div class="input-with-icon">
                  <MapPinIcon aria-hidden="true" />
                  <input
                    id="venue"
                    v-model="form.venue"
                    class="field-input"
                    :class="{ error: errors.venue }"
                    placeholder="Type a venue name or address"
                    @focus="showVenueResults = true"
                    @input="clearError('venue')"
                  />
                </div>
                <div v-if="showVenueResults && venueResults.length" class="venue-results">
                  <button
                    v-for="[name, address] in venueResults"
                    :key="name"
                    type="button"
                    @click="pickVenue(name)"
                  >
                    <strong>{{ name }}</strong>
                    <span>{{ address }}</span>
                  </button>
                </div>
                <p v-if="errors.venue" class="error-text">{{ errors.venue }}</p>
              </div>

              <div v-if="form.format !== 'in-person'" class="field" data-error-key="meetingLink">
                <label for="meeting-link">Meeting link</label>
                <input
                  id="meeting-link"
                  v-model="form.meetingLink"
                  type="url"
                  class="field-input"
                  :class="{ error: errors.meetingLink }"
                  placeholder="https://meet.google.com/... or Zoom link"
                  @input="clearError('meetingLink')"
                />
                <p v-if="errors.meetingLink" class="error-text">{{ errors.meetingLink }}</p>
                <p v-else class="help">Only shown to confirmed attendees in their email.</p>
              </div>

              <div class="divider"><span>Category</span></div>
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

          <div v-if="currentStep === 2" class="screen">
            <div class="screen-head">
              <h1>Make it<br /><em>unforgettable.</em></h1>
              <p>Events with great photos and descriptions get more sign-ups.</p>
            </div>

            <div class="ce-card">
              <div class="field" data-error-key="coverImage">
                <div class="field-top">
                  <div>
                    <label>Event images <span>Required cover · max 6</span></label>
                    <p class="help">Upload a cover photo first, then add optional gallery images for the event page.</p>
                  </div>
                  <button type="button" class="text-btn" @click="showTemplates = !showTemplates">
                    <SparklesIcon aria-hidden="true" /> Templates
                  </button>
                </div>

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
                  <span>JPG, PNG, or WebP · best 1600x900px · up to 6 images</span>
                  <input ref="fileInput" type="file" hidden multiple accept="image/*" @change="handleFiles($event.target.files)" />
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
              <div class="field">
                <label for="description">Tell people what to expect <span>Optional</span></label>
                <textarea
                  id="description"
                  v-model="form.description"
                  class="field-input"
                  rows="4"
                  placeholder="What will people experience? What's the agenda? Who should come?"
                />
              </div>

              <div class="divider"><span>Organiser</span></div>
              <div class="two-col">
                <div class="field">
                  <label for="organiser">Name or org <span>Optional</span></label>
                  <input id="organiser" v-model="form.organiser" class="field-input" placeholder="e.g. TechHub Lagos" />
                </div>
                <div class="field">
                  <label for="website">Website <span>Optional</span></label>
                  <input id="website" v-model="form.organiserWebsite" type="url" class="field-input" placeholder="https://..." />
                </div>
              </div>

              <div class="divider"><span>Extra details</span></div>
              <div class="detail-hint">💡 <strong>The more you share, the fewer questions you get.</strong></div>
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

          <div v-if="currentStep === 3" class="screen">
            <div class="screen-head">
              <h1>Set up your<br /><em>tickets.</em></h1>
              <p>Tell us how people will attend and what they will pay.</p>
            </div>

            <div class="info-card pink">
              <TicketIcon aria-hidden="true" />
              <div>
                <strong>What are ticket categories?</strong>
                <p>They let you offer different access levels at different prices, like Early Bird, General, VIP, or tables.</p>
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
                    <span>Set prices, create tiers, and get paid.</span>
                  </button>
                </div>
              </div>

              <div v-if="form.ticketMode === 'free'" class="sub-panel">
                <div class="info-card green">
                  <CheckIcon aria-hidden="true" />
                  <div>
                    <strong>Free event</strong>
                    <p>Set a max number of spots to create urgency, or leave blank for unlimited.</p>
                  </div>
                </div>
                <div class="field">
                  <label for="free-capacity">Max spots <span>Optional</span></label>
                  <input id="free-capacity" v-model="form.freeCapacity" type="number" min="1" class="field-input" placeholder="e.g. 200" />
                </div>
              </div>

              <div v-else class="paid-block" data-error-key="tickets">
                <div class="field-top">
                  <div>
                    <label>Ticket categories</label>
                    <p class="help">Tap a template, then customise price, quantity, and perks.</p>
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
                    <PlusIcon aria-hidden="true" /> Add custom category
                  </button>
                </div>
                <p v-if="errors.tickets" class="error-text">{{ errors.tickets }}</p>

                <div v-if="!form.tickets.length" class="empty-state">
                  <TicketIcon aria-hidden="true" />
                  <strong>No ticket categories yet</strong>
                  <span>Choose a template above or add a custom category.</span>
                </div>

                <div class="ticket-list">
                  <article v-for="ticket in form.tickets" :key="ticket.id" class="ticket-card">
                    <div class="ticket-card-head">
                      <span class="color-dot" :style="{ background: ticket.color }"></span>
                      <strong>{{ ticket.name || 'Unnamed ticket' }}</strong>
                      <button type="button" class="icon-btn danger" @click="removeTicket(ticket.id)">
                        <TrashIcon aria-hidden="true" />
                      </button>
                    </div>
                    <div class="two-col">
                      <div class="field" :data-error-key="`ticket-${ticket.id}-name`">
                        <label>Ticket name</label>
                        <input
                          v-model="ticket.name"
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
                        <label>Unit type</label>
                        <select v-model="ticket.unitType" class="field-input">
                          <option value="individual">Individual seat</option>
                          <option value="table">Group / Table</option>
                        </select>
                      </div>
                    </div>
                    <div class="two-col">
                      <div class="field">
                        <label>{{ ticket.unitType === 'table' ? 'Number of tables' : 'Available spots' }}</label>
                        <input v-model.number="ticket.units" type="number" min="0" class="field-input" placeholder="Leave blank for unlimited" />
                      </div>
                      <div v-if="ticket.unitType === 'table'" class="field">
                        <label>People per table</label>
                        <input v-model.number="ticket.peoplePerUnit" type="number" min="1" class="field-input" />
                      </div>
                    </div>
                    <div class="two-col">
                      <div class="field">
                        <label>Price</label>
                        <input v-model.number="ticket.price" type="number" min="0" class="field-input" placeholder="0 = free" />
                      </div>
                      <div class="field">
                        <label>Max per person <span>Optional</span></label>
                        <input v-model.number="ticket.maxPerPerson" type="number" min="1" class="field-input" />
                      </div>
                    </div>
                    <div v-if="ticket.unitType === 'table' && ticket.units" class="calc-card">
                      <SparklesIcon aria-hidden="true" />
                      <span>{{ ticketSeatCount(ticket).toLocaleString() }} total seats</span>
                    </div>
                    <div class="two-col">
                      <div class="field">
                        <label>Sales open <span>Optional</span></label>
                        <DateTimePickerInput v-model="ticket.salesStart" placeholder="Select sales open" :min-date="today" />
                      </div>
                      <div class="field">
                        <label>Sales close <span>Optional</span></label>
                        <DateTimePickerInput v-model="ticket.salesEnd" placeholder="Select sales close" :min-date="today" />
                      </div>
                    </div>
                    <div class="field">
                      <label>Perk description <span>Optional</span></label>
                      <textarea v-model="ticket.perks" class="field-input" rows="2" placeholder="Includes dinner, front-row seating, premium access..." />
                    </div>
                    <label class="toggle-row">
                      <span>
                        <strong>Visible to attendees</strong>
                        <small>Turn off to hide from your public event page.</small>
                      </span>
                      <input v-model="ticket.visible" type="checkbox" />
                    </label>
                  </article>
                </div>

                <div v-if="form.tickets.length" class="summary-row">
                  <span>Total capacity</span>
                  <strong>{{ totalCapacity.toLocaleString() }} seats</strong>
                </div>
              </div>
            </div>
          </div>

          <div v-if="currentStep === 4" class="screen">
            <div class="screen-head">
              <h1>Who's<br /><em>registering?</em></h1>
              <p>Choose what information to collect. Fewer fields usually means more sign-ups.</p>
            </div>

            <div class="info-card pink">
              <DocumentTextIcon aria-hidden="true" />
              <div>
                <strong>Your registration form</strong>
                <p>Every attendee fills this when they sign up. Name and email stay required.</p>
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
                  <p>Your registration is confirmed. We cannot wait to see you.</p>
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

          <div class="nav-actions">
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
              :class="{ disabled: !canContinue }"
              :disabled="!canContinue"
              @click="publishEvent"
            >
              Publish Event <ArrowRightIcon aria-hidden="true" />
            </button>
          </div>
        </section>

        <aside v-if="previewOn" class="preview-col">
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
      <p>Share it and start collecting attendees. Your dashboard can track everything live.</p>
      <div class="share-box">
        <span>kaka.events/e/{{ (form.title || 'your-event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }}</span>
        <button type="button" @click="showToast('Link copied')">Copy link</button>
      </div>
      <button type="button" class="primary-btn" @click="router.push('/')">Back to events</button>
    </section>

    <Teleport to="body">
      <div v-if="activeRepeatDatePicker" class="datetime-picker-modal-overlay" @click.self="closeRepeatDatePicker">
        <div class="datetime-picker-modal">
          <DateTimePicker
            mode="date"
            :title="activeRepeatDatePicker === 'end' ? 'Select recurrence end date' : 'Select recurrence start date'"
            :initial-date-time="repeatDatePickerInitialDate"
            :min-date="repeatDatePickerMinDate"
            :max-date="repeatDatePickerMaxDate"
            @update:date-time="applyRepeatDate"
            @close="closeRepeatDatePicker"
          />
        </div>
      </div>
      <div v-if="activeRepeatTimePicker" class="datetime-picker-modal-overlay" @click.self="closeRepeatTimePicker">
        <div class="datetime-picker-modal">
          <DateTimePicker
            mode="time"
            title="Select recurrence time"
            :initial-date-time="repeatTimePickerInitialDate"
            @update:date-time="applyRepeatTime"
            @close="closeRepeatTimePicker"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.create-event-page {
  --ce-ink: var(--color-text);
  --ce-ink2: #3d3935;
  --ce-ink3: var(--color-muted);
  --ce-ink4: #b0aaa4;
  --ce-ink5: #d8d3ce;
  --ce-paper: var(--color-surface);
  --ce-p2: var(--color-bg);
  --ce-p3: var(--color-tab-bg);
  --ce-p4: var(--color-border);
  --ce-acc: var(--color-accent);
  --ce-acc-soft: rgba(236, 72, 153, 0.1);
  --ce-acc-border: rgba(236, 72, 153, 0.34);
  --ce-green: var(--success);
  --ce-greenbg: #e8f7ef;
  --ce-pinkbg: rgba(236, 72, 153, 0.08);
  --ce-pinkbdr: rgba(236, 72, 153, 0.24);
  --ce-red: var(--error);
  background: var(--ce-p2);
  color: var(--ce-ink);
  min-height: 100vh;
  font-family: 'Figtree', sans-serif;
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
  --ce-acc-border: rgba(236, 72, 153, 0.38);
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

.ce-logo:hover {
  background: transparent;
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

.ce-header-back:hover,
.theme-btn:hover {
  background: var(--ce-p3);
  color: var(--ce-ink);
  transform: none;
  box-shadow: none;
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
  font-size: 11px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
  min-width: 0;
}

.ce-step:hover {
  transform: none;
  box-shadow: none;
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
  font-size: 10px;
  font-weight: 600;
}

.ce-step.active {
  background: var(--ce-acc-soft);
  color: var(--ce-ink);
  box-shadow: inset 0 0 0 1px var(--ce-acc-border);
}

.ce-step.active .ce-step-number {
  background: var(--ce-acc);
  color: #ffffff;
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
  border: 1px solid rgba(26, 122, 74, 0.2);
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 11px;
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
  border-radius: 10px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
}

.ghost-btn:hover {
  background: var(--ce-p3);
  color: var(--ce-ink);
  transform: none;
  box-shadow: none;
}

.ce-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 5rem;
}

.preview-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 11.5px;
  color: var(--ce-ink4);
}

.preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 100px;
  border: 1.5px solid var(--ce-p4);
  background: var(--ce-paper);
  color: var(--ce-ink3);
  font-size: 12px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
}

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
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.preview-btn.on {
  border-color: var(--ce-acc-border);
  color: var(--ce-ink);
  background: var(--ce-acc-soft);
}

.ce-columns {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.75rem;
  align-items: start;
}

.ce-columns.preview-off {
  grid-template-columns: 1fr;
}

.screen {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.screen-head h1 {
  font-family: 'Fraunces', serif;
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
  font-size: 13.5px;
  color: var(--ce-ink3);
  margin-top: 6px;
  line-height: 1.65;
}

.ce-card,
.info-card,
.tip-card {
  background: var(--ce-paper);
  border: 1px solid var(--ce-p4);
  border-radius: 24px;
  padding: 1.6rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.035);
}

.ce-card.compact {
  padding: 1.1rem 1.3rem;
  border-radius: 16px;
}

.field,
.paid-block {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 1rem;
}

.field:last-child,
.paid-block:last-child {
  margin-bottom: 0;
}

label,
.field-top label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ce-ink3);
}

label span {
  font-size: 10px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ce-ink4);
}

.field-input,
:deep(.datetime-input) {
  width: 100%;
  background: var(--ce-p2);
  border: 1.5px solid var(--ce-p4);
  border-radius: 12px;
  padding: 11px 14px;
  font-family: 'Figtree', sans-serif;
  font-size: 14px;
  line-height: 1.3;
  color: var(--ce-ink);
  outline: none;
}

.field-input-xl {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 0;
  padding: 14px 18px;
  border-radius: 16px;
  background: var(--ce-paper);
}

.field-input:focus,
:deep(.datetime-input:focus) {
  border-color: var(--ce-acc);
  background: var(--ce-paper);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ce-acc) 12%, transparent);
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
  font-size: 11.5px;
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
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ce-ink3);
}

:deep(.datetime-picker-input) {
  margin-bottom: 0;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 1rem;
}

.divider span {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
  gap: 7px;
  flex-wrap: wrap;
}

.pill,
.detail-chip,
.quick-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: 1.5px solid var(--ce-p4);
  border-radius: 10px;
  background: var(--ce-paper);
  color: var(--ce-ink3);
  font-size: 12.5px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.pill:hover,
.detail-chip:hover,
.quick-chip:hover {
  border-color: var(--ce-ink5);
  color: var(--ce-ink);
  transform: translateY(-0.5px);
  box-shadow: none;
}

.pill.selected {
  border-color: var(--ce-acc-border);
  background: var(--ce-acc-soft);
  color: var(--ce-ink);
}

.sub-panel {
  background: var(--ce-p2);
  border: 1px solid var(--ce-p3);
  border-radius: 14px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.recurrence-steps {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recurrence-step {
  border: 1px solid var(--ce-p4);
  border-radius: 12px;
  background: var(--ce-paper);
  padding: 12px;
  transition:
    opacity 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.recurrence-step.complete {
  border-color: var(--ce-acc-border);
}

.recurrence-step.locked {
  opacity: 0.45;
  pointer-events: none;
}

.recurrence-step-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.recurrence-step-head > span {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--ce-p3);
  color: var(--ce-ink2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.recurrence-step-head strong {
  display: block;
  font-size: 13px;
  color: var(--ce-ink);
}

.recurrence-step-head p {
  margin: 2px 0 0;
  font-size: 11.5px;
  color: var(--ce-ink4);
  line-height: 1.5;
}

.recurrence-inline-field {
  margin-top: 10px;
  margin-bottom: 0;
}

.repeat-day-overrides {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.repeat-day-tip {
  border: 1px solid var(--ce-pinkbdr);
  border-radius: 10px;
  background: var(--ce-pinkbg);
  color: var(--ce-ink2);
  font-size: 12px;
  line-height: 1.55;
  padding: 9px 11px;
  margin: 0;
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
  border: 1px solid var(--ce-p4);
  border-radius: 10px;
  background: var(--ce-p2);
  overflow: hidden;
}

.repeat-day-row.custom {
  border-color: color-mix(in srgb, var(--ce-green) 38%, var(--ce-p4));
}

.repeat-day-row > button {
  width: 100%;
  min-height: 0;
  padding: 11px 12px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ce-ink);
  display: grid;
  grid-template-columns: minmax(92px, 0.8fr) minmax(150px, 1fr) 28px;
  align-items: center;
  gap: 10px;
  text-align: left;
  text-transform: none;
  letter-spacing: 0;
}

.repeat-day-name {
  font-size: 13px;
  font-weight: 650;
  color: var(--ce-ink);
}

.repeat-day-time {
  font-size: 12.5px;
  color: var(--ce-ink2);
}

.repeat-day-time.inherited {
  color: var(--ce-ink4);
}

.repeat-day-toggle {
  justify-self: end;
  width: 26px;
  height: 26px;
  border: 1px solid var(--ce-p4);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ce-ink4);
}

.repeat-day-toggle svg {
  width: 13px;
  height: 13px;
  transform: rotate(90deg);
  transition: transform 0.18s ease;
}

.repeat-day-row.expanded .repeat-day-toggle svg {
  transform: rotate(-90deg);
}

.repeat-day-custom {
  padding: 0 12px 12px;
}

.repeat-day-custom > p {
  color: var(--ce-ink4);
  font-size: 11.5px;
  line-height: 1.5;
  margin: 0 0 9px;
}

.repeat-reset-btn {
  border: 0;
  background: transparent;
  color: var(--ce-acc);
  font-size: 12px;
  font-weight: 650;
  min-height: 0;
  padding: 0;
  text-transform: none;
  letter-spacing: 0;
}

.recurrence-summary {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.recurrence-summary strong {
  color: var(--ce-ink);
}

.info-card {
  border-radius: 14px;
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
  font-size: 12.5px;
  color: var(--ce-ink2);
}

.info-card p {
  font-size: 12px;
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
  border-color: rgba(26, 122, 74, 0.2);
}

.day-chip {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1.5px solid var(--ce-p4);
  background: var(--ce-paper);
  color: var(--ce-ink3);
  font-size: 11px;
  font-weight: 600;
  padding: 0;
  min-width: 0;
  min-height: 0;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.day-chip.selected {
  background: var(--ce-acc-soft);
  border-color: var(--ce-acc-border);
  color: var(--ce-ink);
}

.recurrence-preview,
.detail-hint,
.calc-card {
  background: var(--ce-pinkbg);
  border: 1px solid var(--ce-pinkbdr);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 12px;
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
  border: 1.5px solid var(--ce-p4);
  border-radius: 12px;
  padding: 11px 14px;
  color: var(--ce-ink);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
}

.category-trigger.open,
.category-trigger:focus {
  border-color: var(--ce-acc);
  background: var(--ce-paper);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ce-acc) 12%, transparent);
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
  border-radius: 14px;
}

.category-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  border: 1px solid var(--ce-p4);
  border-radius: 10px;
  background: var(--ce-p2);
  color: var(--ce-ink3);
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  text-transform: none;
  letter-spacing: 0;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
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
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.055);
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
  font-size: 13px;
  min-height: 0;
}

.venue-results span {
  color: var(--ce-ink4);
  font-size: 11px;
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
  font-size: 12px;
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
  border-radius: 10px;
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
  font-size: 12px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  min-height: 0;
}

.upload-tabs button.active {
  background: var(--ce-paper);
  color: var(--ce-ink);
}

.upload-zone {
  border: 2px dashed var(--ce-p4);
  border-radius: 16px;
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
  font-size: 13px;
  color: var(--ce-ink2);
}

.upload-zone span {
  font-size: 10.5px;
}

.upload-zone small {
  font-size: 10px;
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
  border-radius: 12px;
  background: var(--ce-p2);
  padding: 10px;
}

.image-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ce-ink4);
  margin-bottom: 8px;
}

.cover-frame {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ce-acc) 42%, var(--ce-p4));
}

.cover-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  color: #ffffff;
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
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ce-ink4);
  font-size: 12px;
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
  border: 1.5px solid var(--ce-p4);
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
  background: rgba(0, 0, 0, 0.62);
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
  font-size: 10px;
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
  border-radius: 12px;
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
  border: 1.5px solid var(--ce-p4);
  border-radius: 14px;
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
    color 0.18s ease,
    transform 0.18s ease;
}

.ticket-mode-card > svg {
  width: 20px;
}

.ticket-mode-card strong {
  color: var(--ce-ink);
  font-size: 13px;
  font-weight: 600;
}

.ticket-mode-card span {
  font-size: 11px;
  line-height: 1.5;
}

.ticket-mode-card.selected {
  border-color: var(--ce-acc-border);
  background: var(--ce-acc-soft);
  box-shadow: none;
}

.count-badge {
  font-size: 10px;
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
  font-size: 12.5px;
  border: 1.5px dashed var(--ce-p4);
  border-radius: 14px;
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
  font-family: 'Fraunces', serif;
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
  font-size: 13px;
  color: var(--ce-ink2);
}

.toggle-row small {
  display: block;
  font-size: 11px;
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
  border-radius: 10px;
  padding: 10px 14px;
  margin-top: 10px;
  font-size: 12px;
}

.summary-row strong {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
}

.required-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--ce-acc);
}

.email-preview {
  border: 1px solid var(--ce-p4);
  border-radius: 16px;
  overflow: hidden;
}

.email-head {
  background: var(--ce-p2);
  padding: 10px 14px;
  border-bottom: 1px solid var(--ce-p3);
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11.5px;
  color: var(--ce-ink3);
}

.email-head strong {
  font-size: 13px;
  color: var(--ce-ink);
}

.email-body {
  padding: 14px;
  font-size: 13px;
  color: var(--ce-ink2);
  line-height: 1.7;
}

.email-ticket {
  background: var(--ce-p2);
  border: 1px solid var(--ce-p3);
  border-radius: 10px;
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
  border-radius: 14px;
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
  border-radius: 14px;
  padding: 14px 22px;
  font-size: 14px;
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.075);
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
  color: #ffffff;
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
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ce-ink4);
  padding: 0 4px;
}

.tip-card {
  border-radius: 12px;
  padding: 11px 13px;
}

.tip-card strong {
  font-size: 11px;
  color: var(--ce-ink2);
}

.tip-card p {
  font-size: 11px;
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
  border-radius: 14px;
  font-size: 12.5px;
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
  font-family: 'Fraunces', serif;
  font-size: 2.2rem;
  font-weight: 400;
  line-height: 1.1;
}

.success-screen p {
  color: var(--ce-ink3);
  font-size: 14px;
  line-height: 1.65;
}

.share-box {
  width: 100%;
  background: var(--ce-p3);
  border: 1px solid var(--ce-p4);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.share-box span {
  flex: 1;
  font-size: 12px;
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
  font-size: 11.5px;
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
    padding: 1rem 1rem 4rem;
  }

  .ce-progress {
    flex-shrink: 0;
  }

  .ce-step span:last-child {
    display: none;
  }

  .repeat-day-row > button {
    grid-template-columns: 1fr auto;
  }

  .repeat-day-time {
    grid-column: 1 / -1;
  }

  .two-col,
  .ticket-mode-grid,
  .category-menu,
  .image-manager {
    grid-template-columns: 1fr;
  }

  .ce-card {
    border-radius: 18px;
    padding: 1.2rem;
  }

  .url-panel,
  .field-top {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

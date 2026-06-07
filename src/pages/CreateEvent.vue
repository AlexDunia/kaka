<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  LinkIcon,
  MapPinIcon,
  MinusIcon,
  PencilIcon,
  PhotoIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  TagIcon,
  TicketIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import DateTimePickerInput from '@/components/DateTimePickerInput.vue'
import EventCard from '@/components/EventCard.vue'
import {
  DEFAULT_CREATE_EVENT_TIPS,
  buildCreateEventPayload,
  saveCreateEventDraft,
} from '@/services/createEventService'

const router = useRouter()

const steps = ['Basics', 'Details', 'Tickets', 'Attendees']
const today = new Date()
today.setHours(0, 0, 0, 0)

const categories = [
  'Conference & Summit',
  'Music & Concert',
  'Food & Dining',
  'Art & Culture',
  'Business & Networking',
  'Sports & Fitness',
  'Workshop & Training',
  'Party & Social',
  'Startup & Tech',
  'Faith & Community',
  'Theatre & Performing Arts',
  'Education & Learning',
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
  { name: 'VIP', unitType: 'individual', color: '#c8960a', price: 30000 },
  { name: 'Gold Table', unitType: 'table', color: '#c8960a', price: 250000 },
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
  'linear-gradient(135deg,#ff416c,#ff4b2b)',
  'linear-gradient(135deg,#134e5e,#71b280)',
  'linear-gradient(135deg,#f7971e,#ffd200)',
  'linear-gradient(135deg,#c850c0,#ffcc70)',
  'linear-gradient(135deg,#1a1a1a,#434343)',
]

const form = reactive({
  title: '',
  startsAt: tomorrowAt(18),
  endsAt: tomorrowAt(22),
  recurrenceType: 'once',
  repeatFrequency: 'weekly',
  repeatDays: ['Sat'],
  repeatSessions: 8,
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

const currentStep = ref(1)
const previewOn = ref(window.localStorage?.getItem('kaka-create-preview') !== 'false')
const draftSaved = ref(false)
const activeUploadTab = ref('files')
const showTemplates = ref(false)
const showVenueResults = ref(false)
const urlImageValue = ref('')
const tipIndex = ref(0)
const toast = ref('')
const published = ref(false)
const errors = reactive({})
const ticketId = ref(0)
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
  const days = form.repeatDays.length ? ` on ${form.repeatDays.join(', ')}` : ''
  const frequency = {
    weekly: 'every week',
    biweekly: 'every 2 weeks',
    monthly: 'every month',
  }[form.repeatFrequency]
  return `This event repeats ${frequency}${form.repeatFrequency === 'monthly' ? '' : days} for ${form.repeatSessions || 1} sessions.`
})

const emailDate = computed(() => formatDateTime(form.startsAt))

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

function setStep(step) {
  currentStep.value = step
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goNext() {
  if (!validateStep(currentStep.value)) return
  if (currentStep.value < steps.length) setStep(currentStep.value + 1)
}

function goBack() {
  if (currentStep.value > 1) setStep(currentStep.value - 1)
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

function toggleRepeatDay(day) {
  if (form.repeatDays.includes(day)) {
    form.repeatDays = form.repeatDays.filter((item) => item !== day)
  } else {
    form.repeatDays.push(day)
  }
}

function handleFiles(files) {
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
  setInterval(() => {
    tipIndex.value = (tipIndex.value + 1) % activeTips.value.length
  }, 7000)
})
</script>

<template>
  <div class="create-event-page">
    <div v-if="toast" class="ce-toast">{{ toast }}</div>

    <header v-if="!published" class="ce-header">
      <RouterLink to="/" class="ce-logo" aria-label="Go home">
        <img
          src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1775755308/rushhourticketbg_fyfbiu.png"
          alt="Kaka"
        />
      </RouterLink>
      <ChevronRightIcon class="ce-header-chevron" aria-hidden="true" />
      <nav class="ce-progress" aria-label="Create event progress">
        <button
          v-for="(step, index) in steps"
          :key="step"
          type="button"
          class="ce-step"
          :class="{ active: currentStep === index + 1, done: currentStep > index + 1 }"
          @click="currentStep > index + 1 && setStep(index + 1)"
        >
          <span class="ce-step-number">{{ index + 1 }}</span>
          <span>{{ step }}</span>
        </button>
      </nav>
      <div class="ce-header-actions">
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
              <h1>Let's build your<br /><em>event.</em> 🎉</h1>
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
                    <p>Each session can be shown clearly so attendees know what they are choosing.</p>
                  </div>
                </div>
                <div class="two-col">
                  <div class="field">
                    <label for="repeat-frequency">Repeats</label>
                    <select id="repeat-frequency" v-model="form.repeatFrequency" class="field-input">
                      <option value="weekly">Every week</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Every month</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="repeat-sessions">Sessions</label>
                    <input
                      id="repeat-sessions"
                      v-model.number="form.repeatSessions"
                      min="1"
                      type="number"
                      class="field-input"
                    />
                  </div>
                </div>
                <div v-if="form.repeatFrequency !== 'monthly'" class="field">
                  <label>Repeat on</label>
                  <div class="day-row">
                    <button
                      v-for="day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
                      :key="day"
                      type="button"
                      class="day-chip"
                      :class="{ selected: form.repeatDays.includes(day) }"
                      @click="toggleRepeatDay(day)"
                    >
                      {{ day.slice(0, 1) }}
                    </button>
                  </div>
                </div>
                <p class="recurrence-preview">{{ recurrenceSummary }}</p>
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
                <label for="category">What type of event?</label>
                <select
                  id="category"
                  v-model="form.category"
                  class="field-input"
                  :class="{ error: errors.category }"
                  @change="clearError('category')"
                >
                  <option value="">Choose a category...</option>
                  <option v-for="category in categories" :key="category">{{ category }}</option>
                </select>
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
                    <p class="help">First image is the cover. Secondary images stay in the gallery.</p>
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
                  :class="{ error: errors.coverImage }"
                  @click="$refs.fileInput.click()"
                  @dragover.prevent
                  @drop.prevent="handleFiles($event.dataTransfer.files)"
                >
                  <div class="upload-ring"><PhotoIcon aria-hidden="true" /></div>
                  <strong>Drop images here or browse</strong>
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
                    <PlusIcon aria-hidden="true" /> Add image link
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

                <div v-if="form.coverImage || form.secondaryImages.length" class="image-strip">
                  <div v-if="form.coverImage" class="image-thumb primary">
                    <img :src="form.coverImage" alt="Cover preview" />
                    <span>Cover</span>
                    <button type="button" @click="removeCover" aria-label="Remove cover">
                      <XMarkIcon aria-hidden="true" />
                    </button>
                  </div>
                  <div
                    v-for="(image, index) in form.secondaryImages"
                    :key="image + index"
                    class="image-thumb"
                  >
                    <img :src="image" alt="Secondary preview" />
                    <div class="thumb-actions">
                      <button type="button" @click="setCover(image, index)">Set cover</button>
                      <button type="button" @click="removeSecondaryImage(index)" aria-label="Remove image">
                        <TrashIcon aria-hidden="true" />
                      </button>
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
                  <span v-if="selectedDetailTypes.has(option.type)" class="green-check"><CheckIcon aria-hidden="true" /></span>
                  <component v-else :is="option.icon" aria-hidden="true" />
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

            <div class="info-card amber">
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
                    <span class="select-check"><CheckIcon aria-hidden="true" /></span>
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
                    <span class="select-check"><CheckIcon aria-hidden="true" /></span>
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

            <div class="info-card amber">
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
              @click="goNext"
            >
              Continue <ArrowRightIcon aria-hidden="true" />
            </button>
            <button v-else type="button" class="primary-btn publish" @click="publishEvent">
              Publish Event <ArrowRightIcon aria-hidden="true" />
            </button>
          </div>
        </section>

        <aside v-if="previewOn" class="preview-col">
          <span class="side-label">Live preview</span>
          <EventCard :event="previewEvent" :show-details="false" />
          <div class="tip-card">
            <strong>💡 Tip</strong>
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
  </div>
</template>

<style scoped>
.create-event-page {
  --ce-ink: #0d0d0d;
  --ce-ink2: #3d3935;
  --ce-ink3: #7a746e;
  --ce-ink4: #b0aaa4;
  --ce-ink5: #d8d3ce;
  --ce-paper: #fdfcfa;
  --ce-p2: #f5f2ee;
  --ce-p3: #ede9e3;
  --ce-p4: #e4ded7;
  --ce-acc: #e8470a;
  --ce-green: #1a7a4a;
  --ce-greenbg: #e8f7ef;
  --ce-goldbg: #fdf8e8;
  --ce-goldbdr: #edd98a;
  --ce-red: #c0392b;
  background: var(--ce-p2);
  color: var(--ce-ink);
  min-height: 100vh;
  font-family: 'Figtree', sans-serif;
}

:global(:root:not(.light)) .create-event-page {
  --ce-ink: #ffffff;
  --ce-ink2: rgba(255, 255, 255, 0.86);
  --ce-ink3: rgba(255, 255, 255, 0.68);
  --ce-ink4: rgba(255, 255, 255, 0.48);
  --ce-ink5: rgba(255, 255, 255, 0.18);
  --ce-paper: #131319;
  --ce-p2: #0b0f19;
  --ce-p3: #1b1b24;
  --ce-p4: rgba(255, 255, 255, 0.1);
  --ce-greenbg: rgba(26, 122, 74, 0.18);
  --ce-goldbg: rgba(200, 150, 10, 0.12);
  --ce-goldbdr: rgba(200, 150, 10, 0.35);
}

.ce-header {
  position: sticky;
  top: 0;
  z-index: 200;
  height: 58px;
  background: color-mix(in srgb, var(--ce-paper) 94%, transparent);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--ce-p4);
  display: flex;
  align-items: center;
  gap: 12px;
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
  height: 40px;
  width: auto;
  display: block;
}

.ce-header-chevron {
  width: 18px;
  color: var(--ce-ink4);
  flex-shrink: 0;
}

.ce-progress {
  display: flex;
  align-items: center;
  background: var(--ce-p3);
  border: 1px solid var(--ce-p4);
  border-radius: 100px;
  padding: 4px 5px;
  gap: 2px;
  margin: 0 auto;
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
  background: var(--ce-ink);
  color: var(--ce-paper);
}

.ce-step.active .ce-step-number {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.ce-step.done {
  background: var(--ce-greenbg);
  color: var(--ce-green);
}

.ce-step.done .ce-step-number {
  background: var(--ce-green);
  color: #ffffff;
}

.ce-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

.preview-btn.on {
  border-color: var(--ce-green);
  color: var(--ce-green);
  background: var(--ce-greenbg);
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  border-color: var(--ce-ink);
  background: var(--ce-paper);
  box-shadow: 0 0 0 3px rgba(13, 13, 13, 0.06);
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
}

.pill:hover,
.detail-chip:hover,
.quick-chip:hover {
  border-color: var(--ce-ink5);
  color: var(--ce-ink);
  transform: translateY(-1px);
  box-shadow: none;
}

.pill.selected {
  border-color: var(--ce-ink);
  background: var(--ce-ink);
  color: var(--ce-paper);
}

.sub-panel {
  background: var(--ce-p2);
  border: 1px solid var(--ce-p3);
  border-radius: 14px;
  padding: 1rem;
  margin-bottom: 1rem;
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

.info-card.amber {
  background: var(--ce-goldbg);
  border-color: var(--ce-goldbdr);
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
}

.day-chip.selected {
  background: var(--ce-ink);
  border-color: var(--ce-ink);
  color: var(--ce-paper);
}

.recurrence-preview,
.detail-hint,
.calc-card {
  background: var(--ce-goldbg);
  border: 1px solid var(--ce-goldbdr);
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

.venue-results {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--ce-paper);
  border: 1px solid var(--ce-p4);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
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
  padding: 1.8rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  background: var(--ce-paper);
  text-align: center;
  color: var(--ce-ink3);
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

.image-strip {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
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

.image-thumb.primary {
  border-color: #c8960a;
  box-shadow: 0 0 0 2px #c8960a;
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-thumb > span {
  position: absolute;
  top: 3px;
  left: 3px;
  background: #c8960a;
  color: #ffffff;
  font-size: 7px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 3px;
  text-transform: uppercase;
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

.green-check,
.select-check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ce-green);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.green-check svg,
.select-check svg {
  width: 12px;
}

.detail-chip.selected {
  border-color: var(--ce-green);
  background: var(--ce-greenbg);
  color: var(--ce-green);
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
}

.ticket-mode-card > svg {
  width: 20px;
}

.ticket-mode-card strong {
  color: var(--ce-ink);
  font-size: 13px;
  font-weight: 600;
}

.ticket-mode-card span:not(.select-check) {
  font-size: 11px;
  line-height: 1.5;
}

.ticket-mode-card .select-check {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
}

.ticket-mode-card.selected {
  border-color: var(--ce-green);
  box-shadow: 0 0 0 3px rgba(26, 122, 74, 0.1);
}

.ticket-mode-card.selected .select-check {
  opacity: 1;
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
  accent-color: var(--ce-green);
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
}

.primary-btn.publish {
  background: var(--ce-acc);
  color: #ffffff;
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
  }

  .ce-header-actions {
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

  .two-col,
  .ticket-mode-grid {
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

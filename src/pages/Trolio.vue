<script setup>
import { computed, inject, nextTick, onMounted, onUnmounted, ref } from 'vue'

const themeController = inject('themeController', null)
const theme = computed(() => themeController?.theme?.value || 'dark')
const isLightMode = computed(() => theme.value === 'light')

const storageKey = 'tj2_notes'

const notes = ref([])
const currentId = ref(null)
const emotions = ref([])
const rating = ref(0)
const tags = ref([])
const chartImg = ref(null)
const searchInput = ref('')
const saveState = ref('dirty')
const toast = ref({
  visible: false,
  message: 'Saved',
  type: 'ok',
})
const hoverRating = ref(0)

const chartFile = ref(null)
const thesisEditor = ref(null)
const reflectionEditor = ref(null)
const contentScroll = ref(null)

let toastTimer

const today = () => new Date().toISOString().slice(0, 10)
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)
const getNote = () => notes.value.find((note) => note.id === currentId.value)

const persist = () => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(notes.value))
  } catch {
    // localStorage can fail in private windows or when image payloads are too large.
  }
}

const filteredNotes = computed(() => {
  const query = searchInput.value.toLowerCase()
  return notes.value.filter(
    (note) =>
      note.title.toLowerCase().includes(query) ||
      (note.symbol || '').toLowerCase().includes(query) ||
      (note.tags || []).some((tag) => tag.toLowerCase().includes(query)),
  )
})

const notesWithPnl = computed(() =>
  notes.value.filter((note) => note.pnl !== null && note.pnl !== undefined),
)

const statWin = computed(() => {
  if (!notesWithPnl.value.length) return '-'
  const wins = notesWithPnl.value.filter((note) => note.pnl > 0).length
  return `${Math.round((wins / notesWithPnl.value.length) * 100)}%`
})

const statPnl = computed(() => {
  if (!notesWithPnl.value.length) return '-'
  const total = notesWithPnl.value.reduce((sum, note) => sum + note.pnl, 0)
  return `${total >= 0 ? '+' : ''}${total.toFixed(1)}`
})

const statPnlClass = computed(() => {
  if (!notesWithPnl.value.length) return ''
  const total = notesWithPnl.value.reduce((sum, note) => sum + note.pnl, 0)
  if (total > 0) return 's-pos'
  if (total < 0) return 's-neg'
  return ''
})

const pnlDisplay = computed(() => {
  const note = getNote()
  const value = note?.pnl
  if (value === null || value === undefined) return '-'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`
})

const pnlClass = computed(() => {
  const note = getNote()
  const value = note?.pnl
  if (value === null || value === undefined) return 'pnl-zero'
  if (value > 0) return 'pnl-pos'
  if (value < 0) return 'pnl-neg'
  return 'pnl-zero'
})

const visibleStarRating = computed(() => hoverRating.value || rating.value)

const showToast = (message, type = 'ok') => {
  clearTimeout(toastTimer)
  toast.value = {
    visible: false,
    message,
    type,
  }
  requestAnimationFrame(() => {
    toast.value.visible = true
    toastTimer = setTimeout(() => {
      toast.value.visible = false
    }, 2800)
  })
}

const markUnsaved = () => {
  saveState.value = 'dirty'
}

const setEditors = async (note) => {
  await nextTick()
  if (thesisEditor.value) thesisEditor.value.innerHTML = note.thesis || ''
  if (reflectionEditor.value) reflectionEditor.value.innerHTML = note.reflection || ''
}

const newNote = async () => {
  const note = {
    id: genId(),
    title: 'Untitled trade',
    symbol: '',
    direction: '',
    asset: '',
    outcome: '',
    date: today(),
    entry: '',
    exit: '',
    size: '',
    pnl: null,
    thesis: '',
    reflection: '',
    emotions: [],
    rating: 0,
    tags: [],
    chartImg: null,
    created: Date.now(),
  }

  notes.value.unshift(note)
  persist()
  await loadNote(note.id)
  nextTick(() => document.getElementById('docTitle')?.focus())
}

const loadNote = async (id) => {
  currentId.value = id
  const note = getNote()
  if (!note) return

  emotions.value = [...(note.emotions || [])]
  rating.value = note.rating || 0
  tags.value = [...(note.tags || [])]
  chartImg.value = note.chartImg || null
  saveState.value = 'dirty'

  await setEditors(note)
  if (contentScroll.value) contentScroll.value.scrollTop = 0
}

const syncTitle = () => {
  const note = getNote()
  if (!note) return
  note.title = note.title.trim() || 'Untitled trade'
  markUnsaved()
}

const updateTitle = (event) => {
  const note = getNote()
  if (!note) return
  note.title = event.target.value || 'Untitled trade'
  syncTitle()
}

const updateMeta = () => {
  markUnsaved()
}

const calcPnL = () => {
  const note = getNote()
  if (!note) return

  const entry = parseFloat(note.entry)
  const exit = parseFloat(note.exit)
  const size = parseFloat(note.size) || 1

  if (!Number.isNaN(entry) && !Number.isNaN(exit)) {
    const raw = note.direction === 'Short' ? (entry - exit) * size : (exit - entry) * size
    note.pnl = parseFloat(raw.toFixed(4))
    note.entry = entry
    note.exit = exit
    note.size = size
  } else {
    note.pnl = null
  }

  markUnsaved()
}

const openChartPicker = () => {
  chartFile.value?.click()
}

const handleChart = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (loadEvent) => {
    chartImg.value = loadEvent.target?.result || null
    markUnsaved()
  }
  reader.readAsDataURL(file)
}

const removeChart = () => {
  chartImg.value = null
  if (chartFile.value) chartFile.value.value = ''
  markUnsaved()
}

const toggleEmo = (emotion) => {
  const index = emotions.value.indexOf(emotion)
  if (index > -1) {
    emotions.value.splice(index, 1)
  } else {
    emotions.value.push(emotion)
  }
  markUnsaved()
}

const setRating = (value) => {
  rating.value = rating.value === value ? 0 : value
  markUnsaved()
}

const handleTag = (event) => {
  if (event.key !== 'Enter') return
  const value = event.target.value.trim()
  if (value && !tags.value.includes(value)) {
    tags.value.push(value)
    markUnsaved()
  }
  event.target.value = ''
}

const removeTag = (tag) => {
  tags.value = tags.value.filter((item) => item !== tag)
  markUnsaved()
}

const fmt = (command, value = null) => {
  document.execCommand(command, false, value)
}

const applyFontSize = (event) => {
  fmt('fontSize', event.target.value)
  event.target.value = '3'
}

const insertLink = () => {
  const url = window.prompt('Enter URL:')
  if (url) document.execCommand('createLink', false, url)
}

const saveNote = () => {
  const note = getNote()
  if (!note) {
    showToast('No entry to save', 'err')
    return
  }

  note.title = note.title.trim() || 'Untitled trade'
  note.thesis = thesisEditor.value?.innerHTML || ''
  note.reflection = reflectionEditor.value?.innerHTML || ''
  note.emotions = [...emotions.value]
  note.rating = rating.value
  note.tags = [...tags.value]
  note.chartImg = chartImg.value

  persist()
  saveState.value = 'saved'
  showToast('Entry saved')
  setTimeout(markUnsaved, 6000)
}

const onEditorInput = () => {
  markUnsaved()
}

const onKeydown = (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    saveNote()
  }
}

const emotionOptions = [
  { key: 'Calm', label: 'Calm', icon: '😌', className: 'e-calm' },
  { key: 'Confident', label: 'Confident', icon: '💪', className: 'e-confident' },
  { key: 'Patient', label: 'Patient', icon: '⏳', className: 'e-patient' },
  { key: 'Disciplined', label: 'Disciplined', icon: '🎯', className: 'e-disciplined' },
  { key: 'Fear', label: 'Fear', icon: '😨', className: 'e-fear' },
  { key: 'FOMO', label: 'FOMO', icon: '🔥', className: 'e-fomo' },
  { key: 'Revenge', label: 'Revenge', icon: '😤', className: 'e-revenge' },
  { key: 'Greedy', label: 'Greedy', icon: '💰', className: 'e-greedy' },
]

onMounted(() => {
  try {
    notes.value = JSON.parse(localStorage.getItem(storageKey) || '[]')
  } catch {
    notes.value = []
  }

  if (notes.value.length) loadNote(notes.value[0].id)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="tradelog-dashboard" :class="{ 'light-mode': isLightMode }">
    <div id="sidebar">
      <div class="sb-top">
        <div class="logo">
          <div class="logo-mark"></div>
          <div class="logo-text">Trade<span>Log</span></div>
        </div>
        <button id="newBtn" title="New entry" @click="newNote">+</button>
      </div>

      <div class="sb-search">
        <input v-model="searchInput" type="text" id="searchInput" placeholder="Search entries..." />
      </div>

      <div class="sb-section">Entries</div>
      <div id="noteList">
        <div
          v-if="!filteredNotes.length"
          style="padding: 14px 14px; font-size: 11px; color: rgba(255, 255, 255, 0.25)"
        >
          No entries found
        </div>
        <div
          v-for="note in filteredNotes"
          v-else
          :key="note.id"
          class="note-card"
          :class="{ active: note.id === currentId }"
          @click="loadNote(note.id)"
        >
          <div class="nc-title">{{ note.title || 'Untitled trade' }}</div>
          <div class="nc-meta">
            <span v-if="note.symbol" class="badge b-sym">{{ note.symbol }}</span>
            <span v-if="note.direction" class="badge" :class="note.direction === 'Long' ? 'b-long' : 'b-short'">
              {{ note.direction }}
            </span>
            <span
              v-if="note.pnl !== null && note.pnl !== undefined"
              class="badge"
              :class="note.pnl >= 0 ? 'b-pos' : 'b-neg'"
            >
              {{ note.pnl >= 0 ? '+' : '' }}{{ note.pnl.toFixed(1) }}
            </span>
          </div>
          <div v-if="note.date" class="nc-date">{{ note.date }}</div>
        </div>
      </div>

      <div class="sb-stats">
        <div class="stat-block">
          <div class="stat-val" id="statWin">{{ statWin }}</div>
          <div class="stat-lbl">Win %</div>
        </div>
        <div class="stat-block">
          <div class="stat-val" id="statTotal">{{ notes.length }}</div>
          <div class="stat-lbl">Trades</div>
        </div>
        <div class="stat-block">
          <div class="stat-val" id="statPnl" :class="statPnlClass">{{ statPnl }}</div>
          <div class="stat-lbl">P&amp;L</div>
        </div>
      </div>
    </div>

    <div id="main">
      <div id="toolbar">
        <select class="tb-select" @change="applyFontSize">
          <option value="3">Normal</option>
          <option value="1">Small</option>
          <option value="4">Large</option>
          <option value="5">Huge</option>
        </select>
        <div class="tb-sep"></div>
        <button class="tb-btn" title="Bold" @click="fmt('bold')"><b>B</b></button>
        <button class="tb-btn" title="Italic" @click="fmt('italic')"><i style="font-style: italic">I</i></button>
        <button class="tb-btn" title="Underline" @click="fmt('underline')"><u>U</u></button>
        <div class="tb-sep"></div>
        <button class="tb-btn" title="Bullets" @click="fmt('insertUnorderedList')">
          <svg viewBox="0 0 24 24">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button class="tb-btn" title="Numbered list" @click="fmt('insertOrderedList')">
          <svg viewBox="0 0 24 24">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </button>
        <div class="tb-sep"></div>
        <button class="tb-btn" title="Link" @click="insertLink">
          <svg viewBox="0 0 24 24">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
        <button class="tb-btn" title="Highlight" @click="fmt('hiliteColor', '#FEF9C3')">
          <svg viewBox="0 0 24 24">
            <path d="m9 11-6 6v3h3l6-6" />
            <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
          </svg>
        </button>
        <button class="tb-btn" title="Clear format" @click="fmt('removeFormat')">
          <svg viewBox="0 0 24 24">
            <path d="M4 7V4h16v3" />
            <path d="M5 20h6" />
            <path d="M13 4 8 20" />
            <line x1="17" y1="12" x2="22" y2="17" />
            <line x1="22" y1="12" x2="17" y2="17" />
          </svg>
        </button>
      </div>

      <div id="contentScroll" ref="contentScroll">
        <div id="contentInner">
          <div v-if="!currentId" class="empty-state" id="emptyState">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div class="empty-title">No entry open</div>
            <div class="empty-sub">Start logging a trade to build your edge.</div>
            <button class="empty-action" @click="newNote">New entry</button>
          </div>

          <div v-else id="editorBody">
            <input
              id="docTitle"
              :value="getNote()?.title === 'Untitled trade' ? '' : getNote()?.title"
              placeholder="Name this trade..."
              @input="updateTitle"
            />
            <div class="doc-dateline">
              <input v-model="getNote().date" type="date" id="mDate" @change="updateMeta" />
            </div>

            <div class="trade-grid" id="tradeGrid">
              <div class="info-cell">
                <div class="info-lbl">Symbol</div>
                <input
                  v-model="getNote().symbol"
                  class="info-input"
                  id="mSymbol"
                  placeholder="EURUSD, BTC..."
                  @input="updateMeta"
                />
              </div>
              <div class="info-cell">
                <div class="info-lbl">Direction</div>
                <select v-model="getNote().direction" class="info-select" id="mDirection" @change="calcPnL">
                  <option value="">-</option>
                  <option>Long</option>
                  <option>Short</option>
                </select>
              </div>
              <div class="info-cell">
                <div class="info-lbl">Asset class</div>
                <select v-model="getNote().asset" class="info-select" id="mAsset" @change="updateMeta">
                  <option value="">-</option>
                  <option>Forex</option>
                  <option>Crypto</option>
                  <option>Stocks</option>
                  <option>Futures</option>
                </select>
              </div>
              <div class="info-cell">
                <div class="info-lbl">Outcome</div>
                <select v-model="getNote().outcome" class="info-select" id="mOutcome" @change="updateMeta">
                  <option value="">-</option>
                  <option>Win</option>
                  <option>Loss</option>
                  <option>Breakeven</option>
                  <option>Partial</option>
                </select>
              </div>
              <div class="info-cell">
                <div class="info-lbl">Entry price</div>
                <input
                  v-model="getNote().entry"
                  class="info-input"
                  id="mEntry"
                  placeholder="0.00"
                  type="number"
                  @input="calcPnL"
                />
              </div>
              <div class="info-cell">
                <div class="info-lbl">Exit price</div>
                <input
                  v-model="getNote().exit"
                  class="info-input"
                  id="mExit"
                  placeholder="0.00"
                  type="number"
                  @input="calcPnL"
                />
              </div>
              <div class="info-cell">
                <div class="info-lbl">Position size</div>
                <input
                  v-model="getNote().size"
                  class="info-input"
                  id="mSize"
                  placeholder="1.00"
                  type="number"
                  @input="calcPnL"
                />
              </div>
              <div class="info-cell">
                <div class="info-lbl">P&amp;L</div>
                <div class="pnl-val" id="pnlDisplay" :class="pnlClass">{{ pnlDisplay }}</div>
              </div>
            </div>

            <div class="section-hd">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <polyline points="3,15 8,9 13,14 17,10 21,13" />
              </svg>
              <span class="section-hd-label">Chart screenshot</span>
              <div class="section-hd-line"></div>
            </div>
            <div id="chartZone">
              <div v-if="chartImg" class="chart-preview">
                <img :src="chartImg" alt="Chart" />
                <button class="chart-remove" @click="removeChart">x Remove</button>
              </div>
              <div v-else class="chart-drop" @click="openChartPicker">
                <div class="cd-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div class="cd-label">Click to upload your chart screenshot</div>
                <div class="cd-sub">PNG · JPG · WEBP</div>
              </div>
            </div>
            <input
              ref="chartFile"
              type="file"
              id="chartFile"
              accept="image/*"
              style="display: none"
              @change="handleChart"
            />

            <div class="section-hd">
              <svg viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span class="section-hd-label">Trade thesis</span>
              <div class="section-hd-line"></div>
            </div>
            <div
              ref="thesisEditor"
              class="editor"
              id="thesisEditor"
              contenteditable="true"
              data-placeholder="Why did you take this trade? What did the chart tell you? What was the setup?"
              @input="onEditorInput"
            ></div>

            <hr class="divider" />

            <div class="section-hd">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <span class="section-hd-label">Emotional state</span>
              <div class="section-hd-line"></div>
            </div>
            <div class="emo-wrap">
              <button
                v-for="emotion in emotionOptions"
                :key="emotion.key"
                class="emo-chip"
                :class="[emotion.className, { on: emotions.includes(emotion.key) }]"
                :data-e="emotion.key"
                @click="toggleEmo(emotion.key)"
              >
                {{ emotion.icon }} {{ emotion.label }}
              </button>
            </div>

            <hr class="divider" />

            <div class="section-hd">
              <svg viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span class="section-hd-label">Post-trade reflection</span>
              <div class="section-hd-line"></div>
            </div>
            <div
              ref="reflectionEditor"
              class="editor"
              id="reflectionEditor"
              contenteditable="true"
              data-placeholder="What went well? What would you do differently? Did you stick to your rules?"
              @input="onEditorInput"
            ></div>

            <hr class="divider" />

            <div class="section-hd">
              <svg viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span class="section-hd-label">Trade quality</span>
              <div class="section-hd-line"></div>
            </div>
            <div class="star-row" id="starRow">
              <button
                v-for="value in 5"
                :key="value"
                class="star"
                :class="{ lit: value <= visibleStarRating }"
                :data-v="value"
                @mouseenter="hoverRating = value"
                @mouseleave="hoverRating = 0"
                @click="setRating(value)"
              >
                ★
              </button>
            </div>

            <hr class="divider" />

            <div class="section-hd">
              <svg viewBox="0 0 24 24">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span class="section-hd-label">Tags</span>
              <div class="section-hd-line"></div>
            </div>
            <div class="tag-wrap" id="tagWrap">
              <span v-for="tag in tags" :key="tag" class="tag-pill">
                {{ tag }}<button @click="removeTag(tag)">x</button>
              </span>
            </div>
            <input
              class="tag-input"
              id="tagInput"
              placeholder="Type a tag and press Enter - e.g. breakout, scalp"
              @keydown="handleTag"
            />
          </div>
        </div>
      </div>

      <div id="savebar">
        <div class="save-status" id="saveStatus" :class="{ ok: saveState === 'saved' }">
          <svg v-if="saveState === 'saved'" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ saveState === 'saved' ? 'All saved' : 'Unsaved changes' }}
        </div>
        <button id="saveBtn" @click="saveNote">Save entry</button>
      </div>
    </div>

    <div id="toast" :class="[{ show: toast.visible }, `t-${toast.type}`]">
      <svg id="toastIcon" viewBox="0 0 24 24">
        <template v-if="toast.type === 'ok'">
          <polyline points="20 6 9 17 4 12" />
        </template>
        <template v-else>
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </template>
      </svg>
      <span id="toastMsg">{{ toast.message }}</span>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

.tradelog-dashboard,
.tradelog-dashboard *::before,
.tradelog-dashboard *::after {
  box-sizing: border-box;
}

.tradelog-dashboard,
.tradelog-dashboard * {
  margin: 0;
  padding: 0;
}

.tradelog-dashboard {
  --blue: #1d6ff2;
  --blue-dim: #1558c9;
  --blue-glow: rgba(29, 111, 242, 0.15);
  --blue-soft: rgba(29, 111, 242, 0.08);
  --blue-badge: #e8f0fe;
  --blue-badge-text: #1558c9;
  --ink: #0e0e10;
  --ink-2: #3a3a3f;
  --ink-3: #7a7a85;
  --ink-4: #b0b0bb;
  --surface: #ffffff;
  --surface-2: #f7f7f9;
  --surface-3: #f0f0f4;
  --border: #e8e8ee;
  --border-strong: #d0d0dc;
  --green: #16a34a;
  --green-soft: #dcfce7;
  --red: #dc2626;
  --red-soft: #fee2e2;
  --amber: #d97706;
  --amber-soft: #fef3c7;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--surface-2);
  color: var(--ink);
  height: 100vh;
  overflow: hidden;
  display: flex;
  -webkit-font-smoothing: antialiased;
}

.tradelog-dashboard ::-webkit-scrollbar {
  width: 3px;
}

.tradelog-dashboard ::-webkit-scrollbar-track {
  background: transparent;
}

.tradelog-dashboard ::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 2px;
}

#sidebar {
  width: 252px;
  min-width: 252px;
  background: var(--ink);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

#sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--blue);
  opacity: 1;
}

.sb-top {
  padding: 20px 16px 16px;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-mark {
  width: 26px;
  height: 26px;
  background: var(--blue);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.logo-mark::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 2px;
  transform: rotate(45deg);
  top: 6px;
  left: 6px;
}

.logo-text {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
}

.logo-text span {
  color: var(--blue);
  font-weight: 400;
}

#newBtn {
  width: 28px;
  height: 28px;
  border: 0.5px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

#newBtn:hover {
  background: var(--blue);
  border-color: var(--blue);
  color: #fff;
  transform: scale(1.08);
}

.sb-search {
  padding: 10px 12px;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.07);
}

.sb-search input {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  outline: none;
  font-family: 'Inter', sans-serif;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.sb-search input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.sb-search input:focus {
  border-color: var(--blue);
  background: rgba(29, 111, 242, 0.08);
}

.sb-section {
  padding: 12px 16px 5px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
}

#noteList {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 8px;
}

.note-card {
  padding: 10px 10px 9px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-bottom: 2px;
  border: 0.5px solid transparent;
  transition:
    background 0.12s,
    border-color 0.12s;
  position: relative;
}

.note-card:hover {
  background: rgba(255, 255, 255, 0.06);
}

.note-card.active {
  background: rgba(29, 111, 242, 0.12);
  border-color: rgba(29, 111, 242, 0.3);
}

.note-card.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 60%;
  background: var(--blue);
  border-radius: 0 2px 2px 0;
}

.nc-title {
  font-size: 12.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;
}

.note-card.active .nc-title {
  color: #fff;
}

.nc-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  letter-spacing: 0.01em;
  font-family: 'JetBrains Mono', monospace;
}

.b-sym {
  background: rgba(29, 111, 242, 0.2);
  color: rgba(148, 180, 255, 1);
}

.b-long {
  background: rgba(22, 163, 74, 0.2);
  color: #4ade80;
}

.b-short {
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
}

.b-pos {
  background: rgba(22, 163, 74, 0.15);
  color: #4ade80;
}

.b-neg {
  background: rgba(220, 38, 38, 0.15);
  color: #f87171;
}

.nc-date {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  margin-top: 3px;
}

.sb-stats {
  padding: 14px 16px;
  border-top: 0.5px solid rgba(255, 255, 255, 0.07);
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
}

.stat-block {
  text-align: center;
  padding: 4px 0;
}

.stat-block + .stat-block {
  border-left: 0.5px solid rgba(255, 255, 255, 0.07);
}

.stat-val {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: -0.02em;
}

.stat-val.s-pos {
  color: #4ade80;
}

.stat-val.s-neg {
  color: #f87171;
}

.stat-lbl {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-top: 2px;
}

#main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--surface);
}

#toolbar {
  padding: 0 28px;
  height: 46px;
  border-bottom: 0.5px solid var(--border);
  display: flex;
  align-items: center;
  gap: 1px;
  background: var(--surface);
  flex-shrink: 0;
}

.tb-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-3);
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  transition:
    background 0.12s,
    color 0.12s,
    transform 0.1s;
}

.tb-btn:hover {
  background: var(--surface-3);
  color: var(--ink);
  transform: scale(1.05);
}

.tb-btn:active {
  transform: scale(0.95);
}

.tb-btn svg {
  width: 15px;
  height: 15px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tb-sep {
  width: 0.5px;
  height: 18px;
  background: var(--border);
  margin: 0 5px;
}

.tb-select {
  height: 28px;
  border: 0.5px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0 8px;
  font-size: 12px;
  background: none;
  color: var(--ink-2);
  cursor: pointer;
  outline: none;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.15s;
}

.tb-select:focus {
  border-color: var(--blue);
}

#contentScroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}

#contentInner {
  max-width: 720px;
  margin: 0 auto;
  padding: 36px 32px 48px;
}

#docTitle {
  font-size: 32px;
  font-weight: 700;
  color: var(--ink);
  border: none;
  outline: none;
  background: none;
  width: 100%;
  margin-bottom: 6px;
  letter-spacing: -0.03em;
  line-height: 1.2;
  font-family: 'Inter', sans-serif;
  transition: color 0.2s;
}

#docTitle::placeholder {
  color: var(--border-strong);
}

.doc-dateline {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  font-size: 12px;
  color: var(--ink-4);
}

.doc-dateline input[type='date'] {
  border: none;
  outline: none;
  background: none;
  font-size: 12px;
  color: var(--ink-4);
  font-family: 'Inter', sans-serif;
  cursor: pointer;
}

.trade-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 0.5px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 32px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.trade-grid:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-glow);
}

.info-cell {
  padding: 13px 15px;
  border-right: 0.5px solid var(--border);
  border-bottom: 0.5px solid var(--border);
  transition: background 0.15s;
}

.info-cell:hover {
  background: var(--blue-soft);
}

.info-cell:nth-child(4n) {
  border-right: none;
}

.info-cell:nth-last-child(-n + 4) {
  border-bottom: none;
}

.info-lbl {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--ink-4);
  margin-bottom: 5px;
}

.info-input,
.info-select {
  font-size: 13px;
  font-weight: 500;
  border: none;
  outline: none;
  background: none;
  color: var(--ink);
  width: 100%;
  font-family: 'Inter', sans-serif;
  transition: color 0.15s;
}

.info-input::placeholder {
  color: var(--border-strong);
  font-weight: 400;
}

.info-select {
  cursor: pointer;
  -webkit-appearance: none;
}

.info-select option {
  color: var(--ink);
}

.pnl-val {
  font-size: 20px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: -0.02em;
  transition:
    color 0.3s,
    transform 0.3s;
}

.pnl-pos {
  color: var(--green);
}

.pnl-neg {
  color: var(--red);
}

.pnl-zero {
  color: var(--ink-4);
}

.section-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 32px 0 12px;
}

.section-hd svg {
  width: 16px;
  height: 16px;
  stroke: var(--blue);
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.section-hd-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
}

.section-hd-line {
  flex: 1;
  height: 0.5px;
  background: var(--border);
}

.chart-drop {
  border: 0.5px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.chart-drop::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--blue-soft);
  opacity: 0;
  transition: opacity 0.2s;
}

.chart-drop:hover {
  border-color: var(--blue);
  border-style: solid;
}

.chart-drop:hover::before {
  opacity: 1;
}

.chart-drop:hover .cd-icon {
  color: var(--blue);
  transform: translateY(-3px);
}

.chart-drop:hover .cd-label {
  color: var(--blue);
}

.cd-icon {
  font-size: 0;
  color: var(--ink-4);
  margin-bottom: 8px;
  transition:
    color 0.2s,
    transform 0.2s;
}

.cd-icon svg {
  width: 28px;
  height: 28px;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.cd-label {
  font-size: 13px;
  color: var(--ink-3);
  transition: color 0.2s;
  position: relative;
}

.cd-sub {
  font-size: 11px;
  color: var(--ink-4);
  margin-top: 3px;
  position: relative;
}

.chart-preview {
  position: relative;
  margin-bottom: 4px;
}

.chart-preview img {
  width: 100%;
  border-radius: var(--radius-lg);
  border: 0.5px solid var(--border);
  display: block;
  animation: fadeIn 0.3s var(--ease-out-expo);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.chart-remove {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.92);
  border: 0.5px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: 11px;
  color: var(--ink-3);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
  backdrop-filter: blur(4px);
}

.chart-remove:hover {
  color: var(--red);
  border-color: #fca5a5;
  background: #fff5f5;
}

.editor {
  min-height: 100px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--ink);
  outline: none;
  padding: 4px 0;
  transition: color 0.15s;
}

.editor:empty::before {
  content: attr(data-placeholder);
  color: var(--border-strong);
  pointer-events: none;
}

.editor a {
  color: var(--blue);
  text-decoration: underline;
}

.editor ul,
.editor ol {
  padding-left: 22px;
}

.editor:focus {
  caret-color: var(--blue);
}

.emo-wrap {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.emo-chip {
  padding: 7px 14px;
  border-radius: 20px;
  border: 0.5px solid var(--border);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: none;
  color: var(--ink-3);
  transition: all 0.18s var(--ease-spring);
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: center;
  gap: 5px;
  user-select: none;
}

.emo-chip:hover {
  border-color: var(--blue);
  color: var(--blue);
  transform: translateY(-1px);
}

.emo-chip:active {
  transform: scale(0.95) translateY(0);
}

.emo-chip.on {
  transform: translateY(-1px);
}

.e-calm.on {
  background: #dcfce7;
  color: #15803d;
  border-color: #86efac;
}

.e-confident.on {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #93c5fd;
}

.e-patient.on {
  background: #e0e7ff;
  color: #4338ca;
  border-color: #a5b4fc;
}

.e-disciplined.on {
  background: #f0fdf4;
  color: #166534;
  border-color: #86efac;
}

.e-fear.on {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}

.e-fomo.on {
  background: #fff7ed;
  color: #9a3412;
  border-color: #fdba74;
}

.e-revenge.on {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}

.e-greedy.on {
  background: #fef9c3;
  color: #854d0e;
  border-color: #fde047;
}

.star-row {
  display: flex;
  gap: 3px;
}

.star {
  font-size: 24px;
  color: var(--border);
  cursor: pointer;
  background: none;
  border: none;
  padding: 0 2px;
  line-height: 1;
  transition:
    color 0.12s,
    transform 0.15s var(--ease-spring);
}

.star:hover {
  transform: scale(1.2);
}

.star.lit {
  color: #f59e0b;
}

.tag-wrap {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 9px;
}

.tag-pill {
  font-size: 11px;
  padding: 3px 8px;
  background: var(--blue-badge);
  color: var(--blue-badge-text);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  animation: tagIn 0.2s var(--ease-spring);
}

@keyframes tagIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tag-pill button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--blue-badge-text);
  opacity: 0.5;
  font-size: 13px;
  line-height: 1;
  padding: 0;
  transition: opacity 0.12s;
}

.tag-pill button:hover {
  opacity: 1;
}

.tag-input {
  border: 0.5px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-size: 12px;
  background: none;
  color: var(--ink);
  outline: none;
  font-family: 'Inter', sans-serif;
  width: 220px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.tag-input::placeholder {
  color: var(--ink-4);
}

.tag-input:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-glow);
}

.divider {
  border: none;
  border-top: 0.5px solid var(--border);
  margin: 28px 0;
}

#savebar {
  position: fixed;
  bottom: 0;
  left: 252px;
  right: 0;
  height: 50px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-top: 0.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 20;
}

.save-status {
  font-size: 12px;
  color: var(--ink-4);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s;
}

.save-status svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.save-status.ok {
  color: var(--green);
}

#saveBtn {
  background: var(--blue);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 22px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition:
    background 0.15s,
    transform 0.12s,
    box-shadow 0.15s;
  box-shadow:
    0 1px 3px rgba(29, 111, 242, 0.3),
    0 4px 12px rgba(29, 111, 242, 0.2);
}

#saveBtn:hover {
  background: var(--blue-dim);
  box-shadow:
    0 2px 8px rgba(29, 111, 242, 0.4),
    0 8px 20px rgba(29, 111, 242, 0.2);
  transform: translateY(-1px);
}

#saveBtn:active {
  transform: scale(0.97) translateY(0);
}

#toast {
  position: fixed;
  bottom: 72px;
  right: 28px;
  background: var(--ink);
  color: #fff;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transform: translateY(8px) scale(0.96);
  transition: all 0.25s var(--ease-out-expo);
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

#toast.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

#toast svg {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

#toast.t-ok svg {
  stroke: #4ade80;
}

#toast.t-err svg {
  stroke: #f87171;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 55vh;
  color: var(--ink-4);
  gap: 12px;
  text-align: center;
  animation: fadeIn 0.4s var(--ease-out-expo);
}

.empty-icon {
  width: 52px;
  height: 52px;
  border: 0.5px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--blue);
  margin-bottom: 4px;
}

.empty-icon svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-2);
}

.empty-sub {
  font-size: 13px;
  color: var(--ink-4);
}

.empty-action {
  margin-top: 4px;
  padding: 9px 20px;
  background: var(--blue);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s;
  box-shadow: 0 2px 8px rgba(29, 111, 242, 0.3);
}

.empty-action:hover {
  background: var(--blue-dim);
  transform: translateY(-1px);
}

#editorBody {
  animation: slideIn 0.3s var(--ease-out-expo);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hidden {
  display: none !important;
}

.tradelog-dashboard.light-mode {
  --blue: var(--color-primary, #22c55e);
  --blue-dim: color-mix(in srgb, var(--color-primary, #22c55e) 82%, #000);
  --blue-glow: color-mix(in srgb, var(--color-primary, #22c55e) 16%, transparent);
  --blue-soft: color-mix(in srgb, var(--color-primary, #22c55e) 8%, transparent);
  --blue-badge: color-mix(in srgb, var(--color-primary, #22c55e) 12%, #fff);
  --blue-badge-text: color-mix(in srgb, var(--color-primary, #22c55e) 70%, #0d0d0d);
  --ink: var(--color-text, #0d0d0d);
  --ink-2: color-mix(in srgb, var(--color-text, #0d0d0d) 82%, transparent);
  --ink-3: var(--color-muted, #7a746e);
  --ink-4: color-mix(in srgb, var(--color-muted, #7a746e) 62%, #fff);
  --surface: var(--color-surface, #fdfcfa);
  --surface-2: var(--color-bg, #f5f2ee);
  --surface-3: var(--color-tab-bg, #ede9e3);
  --border: var(--color-border, #e4ded7);
  --border-strong: var(--color-border-hover, #d8d0c8);
}

.tradelog-dashboard.light-mode #sidebar {
  background: var(--color-surface, #fdfcfa);
  border-right: 0.5px solid var(--color-border, #e4ded7);
}

.tradelog-dashboard.light-mode .sb-top,
.tradelog-dashboard.light-mode .sb-search,
.tradelog-dashboard.light-mode .sb-stats {
  border-color: var(--color-border, #e4ded7);
}

.tradelog-dashboard.light-mode .logo-text,
.tradelog-dashboard.light-mode .stat-val {
  color: var(--color-text, #0d0d0d);
}

.tradelog-dashboard.light-mode .sb-section,
.tradelog-dashboard.light-mode .stat-lbl,
.tradelog-dashboard.light-mode .nc-date {
  color: var(--color-muted, #7a746e);
}

.tradelog-dashboard.light-mode .sb-search input,
.tradelog-dashboard.light-mode #newBtn {
  background: var(--color-tab-bg, #ede9e3);
  border-color: var(--color-border, #e4ded7);
  color: var(--color-text, #0d0d0d);
}

.tradelog-dashboard.light-mode .sb-search input::placeholder {
  color: var(--color-muted, #7a746e);
}

.tradelog-dashboard.light-mode .note-card:hover {
  background: color-mix(in srgb, var(--color-primary, #22c55e) 8%, transparent);
}

.tradelog-dashboard.light-mode .note-card.active {
  background: color-mix(in srgb, var(--color-primary, #22c55e) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-primary, #22c55e) 30%, transparent);
}

.tradelog-dashboard.light-mode .nc-title,
.tradelog-dashboard.light-mode .note-card.active .nc-title {
  color: var(--color-text, #0d0d0d);
}

.tradelog-dashboard.light-mode .stat-block + .stat-block {
  border-left-color: var(--color-border, #e4ded7);
}

.tradelog-dashboard.light-mode #savebar {
  background: color-mix(in srgb, var(--color-surface, #fdfcfa) 90%, transparent);
}

@media (max-width: 760px) {
  .tradelog-dashboard {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }

  #sidebar {
    width: 100%;
    min-width: 0;
    height: auto;
    max-height: 42vh;
  }

  #main {
    height: auto;
    min-height: 58vh;
  }

  #savebar {
    left: 0;
    padding: 0 16px;
  }

  #contentInner {
    padding: 28px 18px 48px;
  }

  .trade-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-cell:nth-child(4n) {
    border-right: 0.5px solid var(--border);
  }

  .info-cell:nth-child(2n) {
    border-right: none;
  }
}
</style>

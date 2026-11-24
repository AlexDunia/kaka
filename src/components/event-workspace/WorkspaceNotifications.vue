<script setup>
import { computed, ref } from 'vue'
import { overviewStage } from './overviewModel'
const props = defineProps({ event: Object, overview: Object, page: String, eventType: String })
const emit = defineEmits(['navigate', 'open-change'])
const panel = ref(null),
  dismissed = ref(false),
  read = ref([])
const storageKey = () => `rushhour:notifications:${props.event?.id || 'workspace'}`
const reminderKey = () => `${storageKey()}:payout-dismissed`
try {
  if (typeof window !== 'undefined') {
    const saved = JSON.parse(window.sessionStorage.getItem(storageKey()) || '[]')
    read.value = Array.isArray(saved) ? saved : []
    dismissed.value = window.sessionStorage.getItem(reminderKey()) === 'yes'
  }
} catch {
  /* Reading is optional. */
}
const stage = computed(() => overviewStage(props.event))
const setup = computed(() => props.overview?.setup || {})
const order = ['draft', 'on-sale', 'approaching', 'event-day', 'completed']
const stageIndex = computed(() => order.indexOf(stage.value))
const tasks = computed(() =>
  [
    {
      id: 'payout',
      title: 'Add a payout account',
      text: 'Add a payout account so you can get paid when your tickets sell.',
      action: 'Add payout account',
      view: 'settings',
      tab: 'payments',
      icon: 'wallet',
      required: true,
      from: 0,
      until: 3,
      done: setup.value.payout_account_added,
      known: setup.value.payout_account_added != null,
    },
    {
      id: 'cover',
      title: 'Add a cover photo',
      text: 'Add a cover photo so your event page stands out to buyers.',
      action: 'Add cover photo',
      view: 'settings',
      tab: 'details',
      icon: 'eye',
      from: 0,
      until: 2,
      done: Boolean(props.event?.cover_image),
      known: true,
    },
    {
      id: 'security',
      title: 'Turn on two-factor authentication',
      text: 'Turn on two-factor authentication to help protect your account.',
      action: 'Review account settings',
      view: 'settings',
      tab: 'access',
      icon: 'grid',
      from: 0,
      until: 3,
      done: setup.value.two_factor_enabled,
      known: setup.value.two_factor_enabled != null,
    },
    {
      id: 'share',
      title: 'Share your event link',
      text: 'Your tickets are on sale. Share your event link so people can start buying.',
      action: 'Share event link',
      view: 'share',
      icon: 'megaphone',
      from: 1,
      until: 2,
      done: setup.value.event_shared,
      known: setup.value.event_shared != null,
    },
    {
      id: 'reminder',
      title: 'Write a guest reminder',
      text: 'Your event is close. Prepare a reminder with the time and place.',
      action: 'Write a reminder',
      view: 'email',
      icon: 'ticket',
      from: 2,
      until: 3,
      done: setup.value.reminder_saved,
      known: setup.value.reminder_saved != null,
    },
    {
      id: 'checkin',
      title: 'Practise door check-in',
      text: 'Try door check-in with a ticket before the big day.',
      action: 'Open check-in',
      view: 'checkin',
      icon: 'ticket',
      from: 2,
      until: 3,
      done: setup.value.checkin_ready,
      known: setup.value.checkin_ready != null,
    },
    {
      id: 'earnings',
      title: 'Review your earnings',
      text: 'Your event is over. See how much you earned.',
      action: 'View earnings',
      view: 'payout',
      icon: 'wallet',
      from: 4,
      until: 4,
      done: setup.value.earnings_reviewed,
      known: setup.value.earnings_reviewed != null,
    },
  ].filter((t) => t.known),
)
const pending = computed(() =>
  tasks.value.filter((t) => !t.done && t.from <= stageIndex.value && t.until >= stageIndex.value),
)
const locked = computed(() => tasks.value.filter((t) => !t.done && t.from > stageIndex.value))
const completed = computed(() => tasks.value.filter((t) => t.done))
const updates = computed(() => props.overview?.notifications || [])
const unread = computed(() => updates.value.filter((u) => !read.value.includes(u.id)).length)
const showReminder = computed(
  () =>
    !['events', 'event-page', 'checkin', 'earnings'].includes(props.page) &&
    props.eventType !== 'free' &&
    !dismissed.value &&
    setup.value.payout_account_added === false &&
    stage.value !== 'completed',
)
function close() {
  panel.value?.close()
  emit('open-change', false)
}
function toggle() {
  if (panel.value.open) close()
  else {
    panel.value.showModal()
    emit('open-change', true)
  }
}
function go(task) {
  close()
  emit('navigate', { view: task.view, ...(task.tab ? { tab: task.tab } : {}) })
}
function markAllRead() {
  read.value = updates.value.map((u) => u.id)
  try {
    window.sessionStorage.setItem(storageKey(), JSON.stringify(read.value))
  } catch {
    /* Keep the current state. */
  }
}
function dismissReminder() {
  dismissed.value = true
  try {
    window.sessionStorage.setItem(reminderKey(), 'yes')
  } catch {
    /* Keep the current state. */
  }
}
function closeFromBackdrop(e) {
  if (e.target !== panel.value) return
  const r = panel.value.getBoundingClientRect()
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
    close()
}
defineExpose({ toggle, pending })
</script>
<template>
  <div
    v-if="showReminder"
    id="nx-bar"
    class="nx-bar"
    role="region"
    aria-label="Payout account reminder"
  >
    <div class="rh30-banner-inner">
      <p>Add a payout account to receive ticket earnings.</p>
      <button class="rh30-banner-action" @click="go({ view: 'settings', tab: 'payments' })">
        Add payout account</button
      ><button
        class="rh30-banner-close"
        aria-label="Dismiss payout reminder"
        @click="dismissReminder"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </div>
  </div>
  <dialog
    ref="panel"
    id="nx-panel"
    class="nx-panel"
    aria-labelledby="nx-panel-title"
    @close="$emit('open-change', false)"
    @click="closeFromBackdrop"
  >
    <div class="np-head">
      <h2 id="nx-panel-title">Notifications</h2>
      <button class="np-close" aria-label="Close notifications" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </div>
    <div class="np-body">
      <section class="np-sec">
        <div class="np-sec-top">
          <h3>
            To do <span v-if="pending.length" class="np-count">{{ pending.length }}</span>
          </h3>
        </div>
        <p class="np-sub">A few things you can do for your event.</p>
        <ul class="np-list">
          <li v-if="!pending.length" class="np-empty">You’re all caught up for now.</li>
          <li
            v-for="(task, index) in pending"
            :key="task.id"
            class="np-item"
            :class="{ first: index === 0 }"
          >
            <span class="np-ic"
              ><svg aria-hidden="true"><use :href="`#ico-${task.icon}`" /></svg
            ></span>
            <div>
              <div class="np-top">
                <strong>{{ task.title }}</strong
                ><span class="np-tag" :class="{ req: task.required }">{{
                  task.required ? 'Required' : 'Recommended'
                }}</span>
              </div>
              <p>{{ task.text }}</p>
              <button class="np-link" @click="go(task)">{{ task.action }} →</button>
            </div>
          </li>
          <li v-for="task in locked" :key="task.id" class="np-item locked">
            <span class="np-ic"
              ><svg aria-hidden="true"><use :href="`#ico-${task.icon}`" /></svg
            ></span>
            <div>
              <div class="np-top">
                <strong>{{ task.title }}</strong
                ><span class="np-tag">Coming up</span>
              </div>
              <p>
                {{
                  task.from === 4
                    ? 'Available after the event.'
                    : 'Available when your event is two weeks away.'
                }}
              </p>
            </div>
          </li>
          <li v-for="task in completed" :key="task.id" class="np-item done">
            <span class="np-ic"
              ><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10" /></svg
            ></span>
            <div class="np-top">
              <strong>{{ task.title }}</strong
              ><span class="np-tag">Done</span>
            </div>
          </li>
        </ul>
      </section>
      <section class="np-sec">
        <div class="np-sec-top">
          <h3>
            Updates <span v-if="unread" class="np-count">{{ unread }}</span>
          </h3>
          <button v-if="unread" class="np-markall" @click="markAllRead">Mark all as read</button>
        </div>
        <p class="np-sub">News and sales activity.</p>
        <ul class="np-list">
          <li v-if="!updates.length" class="np-empty">Your event updates will appear here.</li>
          <li
            v-for="update in updates"
            :key="update.id"
            class="np-item upd"
            :class="{ unread: !read.includes(update.id) }"
          >
            <span class="np-ic"
              ><svg aria-hidden="true"><use :href="`#ico-${update.icon || 'bell'}`" /></svg
            ></span>
            <div>
              <div class="np-top">
                <strong>{{ update.title }}</strong>
              </div>
              <p>{{ update.text }}</p>
              <span v-if="update.time" class="np-time">{{ update.time }}</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </dialog>
</template>
<style>
.event-workspace .nx-panel:not([open]) {
  display: none;
}
.event-workspace > #nx-bar .rh30-banner-action {
  border: 0;
  border-bottom: 1px solid currentColor;
  border-radius: 0;
}
.event-workspace dialog.nx-panel[open] {
  display: flex;
  left: auto;
  margin: 0;
  border: 0;
  padding: 0;
  height: 100dvh;
  max-height: 100dvh;
  max-width: 100%;
  color: var(--rh-color-text);
  font: 400 14px/1.6 var(--rh-font-body);
}
.event-workspace dialog.nx-panel::backdrop {
  background: #10111861;
}
.event-workspace .nx-panel .np-list {
  margin-inline: -22px;
  padding-left: 0;
  list-style: none;
}
.event-workspace .nx-panel .np-body {
  min-height: 0;
  overflow-y: auto;
}
.event-workspace .nx-panel .np-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  border: 0;
  background: none;
  padding: 0;
  color: var(--rh-color-brand);
  font: 600 12px/1.5 var(--rh-font-body);
  text-align: left;
}
.event-workspace .nx-panel :is(.np-close, .np-markall) {
  text-transform: none;
  letter-spacing: normal;
}
.event-workspace .nx-panel .np-close {
  display: grid;
  place-items: center;
  min-width: 44px;
  min-height: 44px;
  padding: 10px;
}
.event-workspace .nx-panel .np-ic svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
}
.event-workspace:has(> #nx-bar) .rh-app-side {
  top: var(--rh30-banner-height) !important;
  height: calc(100dvh - var(--rh30-banner-height)) !important;
}
.event-workspace:has(> #nx-bar) .topbar {
  top: var(--rh30-banner-height) !important;
}
body:has(.event-workspace .nx-panel[open]) {
  overflow: hidden;
}
</style>

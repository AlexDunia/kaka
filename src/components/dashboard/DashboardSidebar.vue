<script setup>
import { RUSH_HOUR_DARK_LOGO } from '@/constants/brand'

defineProps({
  dropdownOpen: {
    type: Boolean,
    required: true,
  },
  isEditMode: {
    type: Boolean,
    required: true,
  },
  currentManageView: {
    type: String,
    required: true,
  },
  currentStep: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['toggle-dropdown', 'go-back', 'select-view', 'select-step'])

const toggleDropdown = () => emit('toggle-dropdown')
const goBack = () => emit('go-back')
const showManage = (view) => emit('select-view', view)
const goToStep = (step) => emit('select-step', step)
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <img :src="RUSH_HOUR_DARK_LOGO" alt="Rush Hour" class="sidebar-brand-logo" />
    </div>

    <div class="back-link" @click="goBack">
      <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
      My Events
    </div>

    <div class="event-switcher">
      <div class="switcher-current" @click="toggleDropdown">
        <div class="switcher-thumb">
          <img
            src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Comedy-Meets-dance_s2egap.jpg"
            alt=""
          />
        </div>
        <div class="switcher-info">
          <div class="switcher-name">Comedy Meets Dance</div>
          <div class="switcher-action">Change event</div>
        </div>
        <div class="switcher-arrow" :class="{ open: dropdownOpen }" id="arrow">
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>
      <div class="events-dropdown" :class="{ open: dropdownOpen }" id="events-dropdown">
        <div class="dropdown-label">Your other live events</div>
        <button class="dropdown-event" type="button">
          <div class="dropdown-thumb">
            <img
              src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/6th-Service-with-mudiaga_1_hjvlab.jpg"
              alt=""
            />
          </div>
          <div class="dropdown-event-copy">
            <div class="dropdown-event-name">6th Service w/ Mudiaga</div>
            <div class="dropdown-event-meta">Live now</div>
          </div>
          <div class="dropdown-live-dot"></div>
        </button>
      </div>
    </div>

    <nav class="sidebar-nav" id="sidebar-nav">
      <div id="nav-manage" class="dashboard-nav-sections" :style="{ display: isEditMode ? 'none' : 'block' }">
        <div class="nav-section-label">Main</div>
        <div class="nav-item" :class="{ active: currentManageView === 'overview' }" @click="showManage('overview')" id="ni-overview">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          <span class="nav-label">Overview</span>
        </div>
        <div class="nav-item" :class="{ active: currentManageView === 'attendees' }" @click="showManage('attendees')" id="ni-attendees">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
          <span class="nav-label">Attendees</span>
        </div>

        <div class="nav-section-label">Grow sales</div>
        <div class="nav-item" :class="{ active: currentManageView === 'share' }" @click="showManage('share')" id="ni-share">
          <svg viewBox="0 0 24 24"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
          <span class="nav-label">Promote</span>
        </div>
        <div class="nav-item" :class="{ active: currentManageView === 'promo' }" @click="showManage('promo')" id="ni-promo">
          <svg viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19" /><circle cx="7" cy="7" r="2" /><circle cx="17" cy="17" r="2" /></svg>
          <span class="nav-label">Discount codes</span>
        </div>
        <div class="nav-item" :class="{ active: currentManageView === 'email' }" @click="showManage('email')" id="ni-email">
          <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
          <span class="nav-label">Message attendees</span>
        </div>

        <div class="nav-section-label">Event day</div>
        <div class="nav-item" :class="{ active: currentManageView === 'checkin' }" @click="showManage('checkin')" id="ni-checkin">
          <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
          <span class="nav-label">Door check-in</span>
        </div>

        <div class="nav-section-label">Money</div>
        <div class="nav-item" :class="{ active: currentManageView === 'payout' }" @click="showManage('payout')" id="ni-payout">
          <svg viewBox="0 0 24 24"><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6" /></svg>
          <span class="nav-label">Earnings</span>
        </div>

        <div class="nav-section-label">Manage</div>
        <div class="nav-item" :class="{ active: currentManageView === 'settings' }" @click="showManage('settings')" id="ni-settings">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
          <span class="nav-label">Settings</span>
        </div>
      </div>

      <div id="nav-edit" :style="{ display: isEditMode ? 'block' : 'none' }">
        <div class="nav-section-label">Edit event</div>
        <div class="nav-item" :class="{ active: currentStep === 1 }" @click="goToStep(1)" id="ne-1">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          <span class="nav-label">Basics</span>
          <span class="nav-step-num" id="ne-num-1">1</span>
        </div>
        <div class="nav-item" :class="{ active: currentStep === 2 }" @click="goToStep(2)" id="ne-2">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
          <span class="nav-label">Details</span>
          <span class="nav-step-num" id="ne-num-2">2</span>
        </div>
        <div class="nav-item" :class="{ active: currentStep === 3 }" @click="goToStep(3)" id="ne-3">
          <svg viewBox="0 0 24 24"><path d="M2 9a3 3 0 010-6h20a3 3 0 010 6M2 15a3 3 0 000 6h20a3 3 0 000-6" /><path d="M12 3v18M7 9v6M17 9v6" /></svg>
          <span class="nav-label">Tickets</span>
          <span class="nav-step-num" id="ne-num-3">3</span>
        </div>
        <div class="nav-item" :class="{ active: currentStep === 4 }" @click="goToStep(4)" id="ne-4">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
          <span class="nav-label">Attendees</span>
          <span class="nav-step-num" id="ne-num-4">4</span>
        </div>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-avatar">AJ</div>
        <div>
          <div class="sidebar-user-name">Alex Johnson</div>
          <div class="sidebar-user-role">Event organiser</div>
        </div>
      </div>
    </div>
  </aside>
</template>

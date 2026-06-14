<script setup>
import { computed, inject, ref } from 'vue'

const themeController = inject('themeController', null)
const theme = computed(() => themeController?.theme?.value || 'dark')
const dropdownOpen = ref(false)
const isEditMode = ref(false)
const currentStep = ref(1)
const currentManageView = ref('overview')

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const enterEditMode = () => {
  isEditMode.value = true
  goToStep(1)
  document.getElementById('page-body')?.scrollTo({ top: 0 })
}

const exitEditMode = () => {
  isEditMode.value = false
  document.getElementById('page-body')?.scrollTo({ top: 0 })
}

const goToStep = (step) => {
  currentStep.value = step
  document.getElementById('page-body')?.scrollTo({ top: 0 })
}

const showManage = (key) => {
  currentManageView.value = key
  document.getElementById('page-body')?.scrollTo({ top: 0 })
}

const goBack = () => {
  alert('Going back to My Events...')
}
</script>

<template>
  <div class="event-dashboard" :class="{ 'light-mode': theme === 'light' }">
    <!-- ══════════════════════════════════════
         SIDEBAR
    ═══════════════════════════════════════ -->
    <aside class="sidebar">

      <div class="back-link" @click="goBack">
        <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        My Events
      </div>

      <div class="event-switcher">
        <div class="switcher-current" @click="toggleDropdown">
          <div class="switcher-thumb">
            <img src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Comedy-Meets-dance_s2egap.jpg" alt="">
          </div>
          <div class="switcher-info">
            <div class="switcher-name">Comedy Meets Dance</div>
            <div class="switcher-status live">
              <span class="status-dot"></span>
              Live
            </div>
          </div>
          <div class="switcher-arrow" :class="{ open: dropdownOpen }" id="arrow">
            <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="events-dropdown" :class="{ open: dropdownOpen }" id="events-dropdown">
          <div class="dropdown-label">Your other live events</div>
          <div class="dropdown-event">
            <div class="dropdown-thumb">
              <img src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/6th-Service-with-mudiaga_1_hjvlab.jpg" alt="">
            </div>
            <div class="dropdown-event-name">6th Service w/ Mudiaga</div>
            <div class="dropdown-live-dot"></div>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav" id="sidebar-nav">
        <div id="nav-manage" :style="{ display: isEditMode ? 'none' : 'block' }">
          <div class="nav-item" :class="{ active: currentManageView === 'overview' }" @click="showManage('overview')" id="ni-overview">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            <span class="nav-label">Overview</span>
          </div>
          <div class="nav-item" :class="{ active: currentManageView === 'insights' }" @click="showManage('insights')" id="ni-insights">
            <svg viewBox="0 0 24 24"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
            <span class="nav-label">Insights</span>
          </div>
          <div class="nav-item" :class="{ active: currentManageView === 'checkin' }" @click="showManage('checkin')" id="ni-checkin">
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span class="nav-label">Check-in &amp; QR</span>
          </div>
          <div class="nav-item" :class="{ active: currentManageView === 'email' }" @click="showManage('email')" id="ni-email">
            <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span class="nav-label">Email Attendees</span>
          </div>
          <div class="nav-item" :class="{ active: currentManageView === 'promo' }" @click="showManage('promo')" id="ni-promo">
            <svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <span class="nav-label">Promo Codes</span>
          </div>
          <div class="nav-item" :class="{ active: currentManageView === 'share' }" @click="showManage('share')" id="ni-share">
            <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span class="nav-label">Share Event</span>
          </div>
          <div class="nav-item" :class="{ active: currentManageView === 'payout' }" @click="showManage('payout')" id="ni-payout">
            <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <span class="nav-label">Payouts</span>
          </div>
          <div class="nav-item" :class="{ active: currentManageView === 'settings' }" @click="showManage('settings')" id="ni-settings">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span class="nav-label">Event Settings</span>
          </div>
        </div>

        <div id="nav-edit" :style="{ display: isEditMode ? 'block' : 'none' }">
          <div class="nav-item" :class="{ active: currentStep === 1 }" @click="goToStep(1)" id="ne-1">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span class="nav-label">Basics</span>
            <span style="width:20px;height:20px;border-radius:50%;background:var(--bg-3);border:1px solid var(--line-mid);font-size:.64rem;font-weight:700;color:var(--t-lo);display:flex;align-items:center;justify-content:center;flex-shrink:0;" id="ne-num-1">1</span>
          </div>
          <div class="nav-item" :class="{ active: currentStep === 2 }" @click="goToStep(2)" id="ne-2">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            <span class="nav-label">Details</span>
            <span style="width:20px;height:20px;border-radius:50%;background:var(--bg-3);border:1px solid var(--line-mid);font-size:.64rem;font-weight:700;color:var(--t-lo);display:flex;align-items:center;justify-content:center;flex-shrink:0;" id="ne-num-2">2</span>
          </div>
          <div class="nav-item" :class="{ active: currentStep === 3 }" @click="goToStep(3)" id="ne-3">
            <svg viewBox="0 0 24 24"><path d="M2 9a3 3 0 010-6h20a3 3 0 010 6M2 15a3 3 0 000 6h20a3 3 0 000-6"/><path d="M12 3v18M7 9v6M17 9v6"/></svg>
            <span class="nav-label">Tickets</span>
            <span style="width:20px;height:20px;border-radius:50%;background:var(--bg-3);border:1px solid var(--line-mid);font-size:.64rem;font-weight:700;color:var(--t-lo);display:flex;align-items:center;justify-content:center;flex-shrink:0;" id="ne-num-3">3</span>
          </div>
          <div class="nav-item" :class="{ active: currentStep === 4 }" @click="goToStep(4)" id="ne-4">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <span class="nav-label">Attendees</span>
            <span style="width:20px;height:20px;border-radius:50%;background:var(--bg-3);border:1px solid var(--line-mid);font-size:.64rem;font-weight:700;color:var(--t-lo);display:flex;align-items:center;justify-content:center;flex-shrink:0;" id="ne-num-4">4</span>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">AJ</div>
          <div>
            <div class="sidebar-user-name">Alex Johnson</div>
            <div class="sidebar-user-role">Event Organiser</div>
          </div>
        </div>
      </div>

    </aside>


    <!-- ══════════════════════════════════════
         MAIN
    ═══════════════════════════════════════ -->
    <main class="main">

      <header class="topbar">
        <div class="topbar-manage" id="topbar-manage" :style="{ display: isEditMode ? 'none' : 'flex' }">
          <div class="topbar-left">
            <span class="topbar-event-name">Comedy Meets Dance</span>
            <span class="topbar-status live">
              <span class="status-dot"></span>
              Live
            </span>
          </div>
          <div class="topbar-right">
            <div class="btn btn-ghost">
              <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View public page
            </div>
            <div class="btn btn-edit" @click="enterEditMode">
              <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit event
            </div>
          </div>
        </div>
        <div class="topbar-edit" id="topbar-edit" :style="{ display: isEditMode ? 'flex' : 'none' }">
          <div style="font-size:.75rem;font-weight:600;color:var(--t-lo);white-space:nowrap;flex-shrink:0;">Editing event</div>
          <div class="step-prog">
            <div class="step-item" :class="{ active: currentStep === 1, done: currentStep > 1 }" id="tp1" @click="goToStep(1)">
              <div class="step-num"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>
              <span class="step-label">Basics</span>
            </div>
            <div class="step-connector" :class="{ done: currentStep > 1 }" id="sc1"></div>
            <div class="step-item" :class="{ active: currentStep === 2, done: currentStep > 2 }" id="tp2" @click="goToStep(2)">
              <div class="step-num">2</div>
              <span class="step-label">Details</span>
            </div>
            <div class="step-connector" :class="{ done: currentStep > 2 }" id="sc2"></div>
            <div class="step-item" :class="{ active: currentStep === 3, done: currentStep > 3 }" id="tp3" @click="goToStep(3)">
              <div class="step-num">3</div>
              <span class="step-label">Tickets</span>
            </div>
            <div class="step-connector" :class="{ done: currentStep > 3 }" id="sc3"></div>
            <div class="step-item" :class="{ active: currentStep === 4, done: currentStep > 4 }" id="tp4" @click="goToStep(4)">
              <div class="step-num">4</div>
              <span class="step-label">Attendees</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:var(--s3);flex-shrink:0;">
            <div class="saved-badge"><svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg>Saved</div>
            <div class="btn btn-ghost" @click="exitEditMode">Cancel</div>
            <div class="btn btn-primary">Save changes</div>
          </div>
        </div>
      </header>

      <div class="page-body" id="page-body">

        <!-- ════════════════════════════
             MANAGE CONTENT
        ═════════════════════════════ -->
        <div class="manage-content" id="manage-content" :style="{ display: isEditMode ? 'none' : 'block' }">

          <!-- HERO -->
          <div class="event-hero">
            <img src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Comedy-Meets-dance_s2egap.jpg" alt="Comedy Meets Dance">
            <div class="event-hero-overlay"></div>
            <div class="event-hero-content">
              <div class="hero-status"><span class="status-dot"></span>Live now</div>
              <div class="hero-title">Comedy Meets Dance</div>
              <div class="hero-meta">
                <div class="hero-meta-item">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  May 12, 2026 · 6:00 PM
                </div>
                <div class="hero-meta-item">
                  <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Eko Hotel &amp; Suites, Lagos
                </div>
              </div>
            </div>
          </div>

          <!-- STAT STRIP -->
          <div class="stat-strip">
            <div class="stat-cell">
              <div class="stat-cell-label">Tickets sold</div>
              <div class="stat-cell-value">612</div>
              <div class="stat-cell-sub up">
                <svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
                +18% this week
              </div>
              <div class="stat-prog">
                <div style="display:flex;justify-content:space-between;font-size:.68rem;font-weight:600;color:var(--t-lo);margin-bottom:5px;"><span>612 of 850</span><span>72%</span></div>
                <div class="stat-prog-track"><div class="stat-prog-fill fill-teal" style="width:72%"></div></div>
              </div>
            </div>
            <div class="stat-cell">
              <div class="stat-cell-label">Revenue</div>
              <div class="stat-cell-value" style="font-size:1.55rem;">₦7.4M</div>
              <div class="stat-cell-sub up">
                <svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
                ₦1.2M this week
              </div>
            </div>
            <div class="stat-cell">
              <div class="stat-cell-label">Spots left</div>
              <div class="stat-cell-value">238</div>
              <div class="stat-cell-sub neutral">out of 850 total</div>
            </div>
            <div class="stat-cell">
              <div class="stat-cell-label">Page views</div>
              <div class="stat-cell-value">4,821</div>
              <div class="stat-cell-sub neutral">3.2% buy a ticket</div>
            </div>
          </div>

          <!-- MANAGE VIEWS -->

          <!-- OVERVIEW -->
          <div class="manage-view" :class="{ active: currentManageView === 'overview' }" :style="{ display: currentManageView === 'overview' ? 'block' : 'none' }" id="mv-overview">
            <div class="sections-wrap">

              <!-- Quick actions -->
              <div>
                <div class="section-title">Quick actions</div>
                <div class="quick-actions">
                  <div class="qa-btn" @click="showManage('checkin')">
                    <div class="qa-icon" style="background:var(--teal-bg);border:1px solid var(--teal-border);">
                      <svg viewBox="0 0 24 24" style="stroke:var(--teal)"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div class="qa-label">Check-in</div>
                    <div class="qa-desc">Scan tickets at the door</div>
                  </div>
                  <div class="qa-btn" @click="showManage('email')">
                    <div class="qa-icon" style="background:var(--red-bg);border:1px solid var(--red-border);">
                      <svg viewBox="0 0 24 24" style="stroke:var(--red)"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <div class="qa-label">Email attendees</div>
                    <div class="qa-desc">Send a message to everyone</div>
                  </div>
                  <div class="qa-btn" @click="showManage('share')">
                    <div class="qa-icon" style="background:var(--blue-bg);border:1px solid var(--blue-border);">
                      <svg viewBox="0 0 24 24" style="stroke:var(--blue)"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    </div>
                    <div class="qa-label">Share event</div>
                    <div class="qa-desc">Get your link out there</div>
                  </div>
                  <div class="qa-btn" @click="showManage('payout')">
                    <div class="qa-icon" style="background:var(--amber-bg);border:1px solid var(--amber-border);">
                      <svg viewBox="0 0 24 24" style="stroke:var(--amber)"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    </div>
                    <div class="qa-label">Payouts</div>
                    <div class="qa-desc">₦7.4M ready to withdraw</div>
                  </div>
                </div>
              </div>

              <!-- Sales chart -->
              <div>
                <div class="section-title">Ticket sales over time</div>
                <div class="card">
                  <div class="chart-wrap">
                    <div class="chart-head">
                      <div>
                        <div class="chart-head-title">Tickets bought per day</div>
                        <div class="chart-head-sub">Last 30 days</div>
                      </div>
                      <div class="chart-pills">
                        <div class="cpill">7d</div>
                        <div class="cpill on">30d</div>
                        <div class="cpill">All</div>
                      </div>
                    </div>
                    <svg class="chart-svg" viewBox="0 0 580 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="0" y1="110" x2="580" y2="110" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
                      <line x1="0" y1="80" x2="580" y2="80" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
                      <line x1="0" y1="50" x2="580" y2="50" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
                      <line x1="0" y1="20" x2="580" y2="20" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
                      <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stop-color="#29B89A" stop-opacity=".22"/>
                          <stop offset="100%" stop-color="#29B89A" stop-opacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12 L555,110 L15,110 Z" fill="url(#cg)"/>
                      <path d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12" stroke="#29B89A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                      <circle cx="535" cy="16" r="4" fill="#29B89A"/>
                      <circle cx="535" cy="16" r="8" fill="rgba(41,184,154,.18)"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- ─────────────────────────────────
                   TICKET BREAKDOWN — REDESIGNED
                   No table. Card rows. Clear hierarchy.
                   Icon per tier, plain labels, no dimmed text tricks.
              ──────────────────────────────────── -->
              <div>
                <div class="section-title">Tickets by category</div>
                <div class="card">
                  <div class="tkt-rows">

                    <!-- Early Bird -->
                    <div class="tkt-row">
                      <div class="tkt-icon" style="background:var(--teal-bg);border:1px solid var(--teal-border);">
                        <svg viewBox="0 0 24 24" style="stroke:var(--teal)">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke-width="1.5"/>
                          <path d="M8 12l3 3 5-5" stroke-width="2"/>
                        </svg>
                      </div>
                      <div class="tkt-mid">
                        <div class="tkt-name-row">
                          <div class="tkt-name">Early Bird</div>
                          <div class="tkt-sold-tag" style="background:var(--teal-bg);border:1px solid var(--teal-border);color:var(--teal);">61 sold</div>
                        </div>
                        <div class="tkt-progress-row">
                          <div class="tkt-prog-track">
                            <div class="tkt-prog-fill fill-teal" style="width:41%"></div>
                          </div>
                          <div class="tkt-prog-label">89 spots left of 150</div>
                        </div>
                      </div>
                      <div class="tkt-right">
                        <div class="tkt-price">₦5,000</div>
                        <div class="tkt-revenue">₦305,000 earned</div>
                      </div>
                    </div>

                    <!-- General Admission -->
                    <div class="tkt-row">
                      <div class="tkt-icon" style="background:var(--blue-bg);border:1px solid var(--blue-border);">
                        <svg viewBox="0 0 24 24" style="stroke:var(--blue)">
                          <rect x="2" y="7" width="20" height="14" rx="2" stroke-width="1.8"/>
                          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke-width="1.8"/>
                          <line x1="12" y1="12" x2="12" y2="16" stroke-width="2"/>
                          <line x1="10" y1="14" x2="14" y2="14" stroke-width="2"/>
                        </svg>
                      </div>
                      <div class="tkt-mid">
                        <div class="tkt-name-row">
                          <div class="tkt-name">General Admission</div>
                          <div class="tkt-sold-tag" style="background:var(--blue-bg);border:1px solid var(--blue-border);color:var(--blue);">177 sold</div>
                        </div>
                        <div class="tkt-progress-row">
                          <div class="tkt-prog-track">
                            <div class="tkt-prog-fill fill-blue" style="width:35%"></div>
                          </div>
                          <div class="tkt-prog-label">323 spots left of 500</div>
                        </div>
                      </div>
                      <div class="tkt-right">
                        <div class="tkt-price">₦10,000</div>
                        <div class="tkt-revenue">₦1,770,000 earned</div>
                      </div>
                    </div>

                    <!-- VIP -->
                    <div class="tkt-row">
                      <div class="tkt-icon" style="background:var(--amber-bg);border:1px solid var(--amber-border);">
                        <svg viewBox="0 0 24 24" style="stroke:var(--amber)">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke-width="1.8"/>
                        </svg>
                      </div>
                      <div class="tkt-mid">
                        <div class="tkt-name-row">
                          <div class="tkt-name">VIP</div>
                          <div class="tkt-sold-tag" style="background:var(--amber-bg);border:1px solid var(--amber-border);color:var(--amber);">38 sold</div>
                        </div>
                        <div class="tkt-progress-row">
                          <div class="tkt-prog-track">
                            <div class="tkt-prog-fill fill-amber" style="width:76%"></div>
                          </div>
                          <div class="tkt-prog-label">12 spots left of 50</div>
                        </div>
                      </div>
                      <div class="tkt-right">
                        <div class="tkt-price">₦30,000</div>
                        <div class="tkt-revenue">₦1,140,000 earned</div>
                      </div>
                    </div>

                    <!-- Gold Table -->
                    <div class="tkt-row">
                      <div class="tkt-icon" style="background:var(--red-bg);border:1px solid var(--red-border);">
                        <svg viewBox="0 0 24 24" style="stroke:var(--red)">
                          <path d="M3 7h18M5 7l1 12h12l1-12M10 11v5M14 11v5M9 7V4h6v3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <div class="tkt-mid">
                        <div class="tkt-name-row">
                          <div class="tkt-name">Gold Table</div>
                          <div class="tkt-sold-tag" style="background:var(--red-bg);border:1px solid var(--red-border);color:var(--red);">336 sold · almost full</div>
                        </div>
                        <div class="tkt-progress-row">
                          <div class="tkt-prog-track">
                            <div class="tkt-prog-fill fill-red" style="width:93%"></div>
                          </div>
                          <div class="tkt-prog-label" style="color:var(--red);font-weight:800;">Only 5 spots left</div>
                        </div>
                      </div>
                      <div class="tkt-right">
                        <div class="tkt-price">₦250,000</div>
                        <div class="tkt-revenue">₦4,200,000 earned</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <!-- ─────────────────────────────────
                   TRAFFIC SOURCES — REDESIGNED
                   Proper SVG icons. No emojis.
              ──────────────────────────────────── -->
              <div>
                <div class="section-title">Where buyers came from</div>
                <div class="card">
                  <div class="traffic-rows">

                    <!-- WhatsApp -->
                    <div class="traffic-row">
                      <div class="traffic-icon" style="background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.22);">
                        <svg viewBox="0 0 24 24" style="stroke:none;fill:#25d366;">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.301A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="none" stroke="#25d366" stroke-width="1.8"/>
                        </svg>
                      </div>
                      <div class="traffic-info">
                        <div class="traffic-name">WhatsApp</div>
                        <div class="traffic-count">271 buyers</div>
                      </div>
                      <div class="traffic-bar-wrap">
                        <div class="traffic-bar-track">
                          <div class="traffic-bar-fill fill-teal" style="width:44%"></div>
                        </div>
                      </div>
                      <div class="traffic-pct">44%</div>
                    </div>

                    <!-- Direct link -->
                    <div class="traffic-row">
                      <div class="traffic-icon" style="background:var(--blue-bg);border:1px solid var(--blue-border);">
                        <svg viewBox="0 0 24 24" style="stroke:var(--blue)">
                          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke-width="1.8" stroke-linecap="round"/>
                          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <div class="traffic-info">
                        <div class="traffic-name">Direct link</div>
                        <div class="traffic-count">148 buyers</div>
                      </div>
                      <div class="traffic-bar-wrap">
                        <div class="traffic-bar-track">
                          <div class="traffic-bar-fill fill-blue" style="width:24%"></div>
                        </div>
                      </div>
                      <div class="traffic-pct">24%</div>
                    </div>

                    <!-- Instagram -->
                    <div class="traffic-row">
                      <div class="traffic-icon" style="background:rgba(228,64,95,.12);border:1px solid rgba(228,64,95,.22);">
                        <svg viewBox="0 0 24 24" style="stroke:var(--red)">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke-width="1.8"/>
                          <circle cx="12" cy="12" r="4" stroke-width="1.8"/>
                          <circle cx="17.5" cy="6.5" r="1" fill="var(--red)" stroke="none"/>
                        </svg>
                      </div>
                      <div class="traffic-info">
                        <div class="traffic-name">Instagram</div>
                        <div class="traffic-count">110 buyers</div>
                      </div>
                      <div class="traffic-bar-wrap">
                        <div class="traffic-bar-track">
                          <div class="traffic-bar-fill fill-red" style="width:18%"></div>
                        </div>
                      </div>
                      <div class="traffic-pct">18%</div>
                    </div>

                    <!-- X / Twitter -->
                    <div class="traffic-row">
                      <div class="traffic-icon" style="background:rgba(255,255,255,.06);border:1px solid var(--line-mid);">
                        <svg viewBox="0 0 24 24" style="fill:var(--t-mid);stroke:none;">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                      <div class="traffic-info">
                        <div class="traffic-name">X / Twitter</div>
                        <div class="traffic-count">55 buyers</div>
                      </div>
                      <div class="traffic-bar-wrap">
                        <div class="traffic-bar-track">
                          <div class="traffic-bar-fill" style="width:9%;background:var(--t-lo)"></div>
                        </div>
                      </div>
                      <div class="traffic-pct">9%</div>
                    </div>

                    <!-- Other -->
                    <div class="traffic-row">
                      <div class="traffic-icon" style="background:rgba(255,255,255,.04);border:1px solid var(--line);">
                        <svg viewBox="0 0 24 24" style="stroke:var(--t-lo)">
                          <circle cx="12" cy="12" r="10" stroke-width="1.8"/>
                          <line x1="2" y1="12" x2="22" y2="12" stroke-width="1.8"/>
                          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke-width="1.8"/>
                        </svg>
                      </div>
                      <div class="traffic-info">
                        <div class="traffic-name">Other</div>
                        <div class="traffic-count">28 buyers</div>
                      </div>
                      <div class="traffic-bar-wrap">
                        <div class="traffic-bar-track">
                          <div class="traffic-bar-fill" style="width:5%;background:var(--t-xlo)"></div>
                        </div>
                      </div>
                      <div class="traffic-pct" style="color:var(--t-lo);">5%</div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div><!-- /mv-overview -->

          <!-- INSIGHTS -->
          <div class="manage-view" :class="{ active: currentManageView === 'insights' }" :style="{ display: currentManageView === 'insights' ? 'block' : 'none' }" id="mv-insights">
            <div class="mv-wrap">
              <div class="mv-header">
                <div class="mv-eyebrow" style="color:var(--blue)"><svg viewBox="0 0 24 24" style="stroke:var(--blue)"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>Insights</div>
                <div class="mv-h1">How it's <em style="color:var(--blue)">going.</em></div>
                <div class="mv-p">Live data for Comedy Meets Dance. Updates every few minutes.</div>
              </div>
              <div class="stat-grid-4">
                <div class="scard"><div class="scard-label">Tickets sold</div><div class="scard-val">612</div><div class="scard-sub up"><svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>+18% this week</div></div>
                <div class="scard"><div class="scard-label">Revenue</div><div class="scard-val" style="font-size:1.45rem">₦7.4M</div><div class="scard-sub up"><svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>₦1.2M this week</div></div>
                <div class="scard"><div class="scard-label">Spots left</div><div class="scard-val">238</div><div class="scard-sub neutral">out of 850</div></div>
                <div class="scard"><div class="scard-label">Page views</div><div class="scard-val">4,821</div><div class="scard-sub neutral">3.2% convert</div></div>
              </div>
              <div class="card">
                <div class="chart-wrap">
                  <div class="chart-head"><div><div class="chart-head-title">Tickets bought per day</div><div class="chart-head-sub">Last 30 days</div></div><div class="chart-pills"><div class="cpill">7d</div><div class="cpill on">30d</div><div class="cpill">All</div></div></div>
                  <svg class="chart-svg" viewBox="0 0 580 130" fill="none"><line x1="0" y1="110" x2="580" y2="110" stroke="rgba(255,255,255,.05)"/><line x1="0" y1="80" x2="580" y2="80" stroke="rgba(255,255,255,.05)"/><line x1="0" y1="50" x2="580" y2="50" stroke="rgba(255,255,255,.05)"/><defs><linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#29B89A" stop-opacity=".22"/><stop offset="100%" stop-color="#29B89A" stop-opacity="0"/></linearGradient></defs><path d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12 L555,110 L15,110 Z" fill="url(#cg2)"/><path d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12" stroke="#29B89A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="535" cy="16" r="4" fill="#29B89A"/></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- CHECK-IN -->
          <div class="manage-view" :class="{ active: currentManageView === 'checkin' }" :style="{ display: currentManageView === 'checkin' ? 'block' : 'none' }" id="mv-checkin">
            <div class="mv-wrap">
              <div class="mv-header">
                <div class="mv-eyebrow" style="color:var(--teal)"><svg viewBox="0 0 24 24" style="stroke:var(--teal)"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Check-in &amp; QR</div>
                <div class="mv-h1">Who's <em style="color:var(--teal)">here?</em></div>
                <div class="mv-p">Scan tickets at the door or search by name. 612 tickets sold.</div>
              </div>
              <div class="stat-grid-3">
                <div class="scard" style="text-align:center"><div class="scard-label">Checked in</div><div class="scard-val" style="color:var(--teal)">312</div></div>
                <div class="scard" style="text-align:center"><div class="scard-label">Not yet arrived</div><div class="scard-val">300</div></div>
                <div class="scard" style="text-align:center"><div class="scard-label">Check-in rate</div><div class="scard-val">51%</div></div>
              </div>
              <div class="card">
                <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="sdiv">Event QR code</div>
                  <div class="qr-zone">
                    <div class="qr-frame"><div class="qr-inner"></div></div>
                    <div class="qr-cap">Print or display at the entrance. Guests scan to check in.</div>
                    <div class="qr-btns">
                      <div class="qr-btn blue"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download QR</div>
                      <div class="qr-btn pink"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Print page</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="card">
                <div style="padding:var(--s4) var(--s5);border-bottom:1px solid var(--line-soft)"><div class="search-bar"><svg viewBox="0 0 24 24" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Search by name or ticket number…</span></div></div>
                <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--pink),var(--blue))">AO</div><div class="att-name">Adaeze Okonkwo</div><div class="att-tkt">VIP · #8821</div><div class="ci-badge in">In</div></div>
                <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--amber),var(--red))">BM</div><div class="att-name">Biodun Martins</div><div class="att-tkt">General · #8822</div><div class="ci-badge in">In</div></div>
                <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--teal),var(--blue))">CA</div><div class="att-name">Chioma Adekunle</div><div class="att-tkt">Early Bird · #8823</div><div class="ci-badge out">Waiting</div></div>
                <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,#A78BFA,var(--pink))">DO</div><div class="att-name">Dami Olawale</div><div class="att-tkt">General · #8824</div><div class="ci-badge in">In</div></div>
                <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--red),var(--amber))">EI</div><div class="att-name">Emeka Ifeanyi</div><div class="att-tkt">VIP · #8825</div><div class="ci-badge out">Waiting</div></div>
              </div>
            </div>
          </div>

          <!-- EMAIL -->
          <div class="manage-view" :class="{ active: currentManageView === 'email' }" :style="{ display: currentManageView === 'email' ? 'block' : 'none' }" id="mv-email">
            <div class="mv-wrap">
              <div class="mv-header">
                <div class="mv-eyebrow" style="color:var(--red)"><svg viewBox="0 0 24 24" style="stroke:var(--red)"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Email Attendees</div>
                <div class="mv-h1">Send a <em style="color:var(--red)">message.</em></div>
                <div class="mv-p">Reach all 612 people who bought a ticket.</div>
              </div>
              <div class="banner amber"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Emails go to all 612 people. Double-check before you send.</div>
              <div class="compose">
                <div class="compose-row"><span class="compose-lbl">To</span><span class="email-tag"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>All attendees (612)</span></div>
                <div class="compose-row"><span class="compose-lbl">Subject</span><input class="compose-input" type="text" placeholder="Write a subject line…" value="Quick update about Comedy Meets Dance 🎤"></div>
                <div class="compose-body">Hey everyone!<br><br>Just a quick note ahead of next week. Doors open at 5:30 PM — 30 minutes before the show starts. Come early to grab your spot.<br><br>Free parking is available through the main gate on Adetokunbo Ademola Street.<br><br>Can't wait to see you all there!<br><br>— Rush Hour Entertainment</div>
                <div class="compose-toolbar">
                  <div class="tb-actions"><div class="tb-btn"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></div><div class="tb-btn"><svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/></svg></div></div>
                  <div style="display:flex;gap:var(--s2)"><div style="display:flex;align-items:center;padding:0 12px;font-size:.74rem;font-weight:700;color:var(--t-lo);cursor:pointer">Save draft</div><div class="send-btn"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send to 612 people</div></div>
                </div>
              </div>
              <div class="card">
                <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="chart-head-title">Past emails</div></div>
                <div class="camp-row"><div class="camp-ico"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><div class="camp-info"><div class="camp-subj">You're in! 🎉 Comedy Meets Dance</div><div class="camp-meta">Confirmation · 612 sent · Apr 14</div></div><div class="camp-stats"><div class="camp-stat"><div class="camp-num" style="color:var(--teal)">84%</div><div class="camp-lbl">Opened</div></div><div class="camp-stat"><div class="camp-num">22%</div><div class="camp-lbl">Clicked</div></div></div></div>
                <div class="camp-row"><div class="camp-ico"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><div class="camp-info"><div class="camp-subj">VIP spots almost gone</div><div class="camp-meta">Manual · 540 sent · Apr 22</div></div><div class="camp-stats"><div class="camp-stat"><div class="camp-num" style="color:var(--teal)">71%</div><div class="camp-lbl">Opened</div></div><div class="camp-stat"><div class="camp-num">31%</div><div class="camp-lbl">Clicked</div></div></div></div>
              </div>
            </div>
          </div>

          <!-- PROMO -->
          <div class="manage-view" :class="{ active: currentManageView === 'promo' }" :style="{ display: currentManageView === 'promo' ? 'block' : 'none' }" id="mv-promo">
            <div class="mv-wrap">
              <div class="mv-header">
                <div class="mv-eyebrow" style="color:var(--amber)"><svg viewBox="0 0 24 24" style="stroke:var(--amber)"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>Promo Codes</div>
                <div class="mv-h1">Your <em style="color:var(--amber)">discounts.</em></div>
                <div class="mv-p">Create codes to give people a discount when they buy a ticket.</div>
              </div>
              <div class="stat-grid-3">
                <div class="scard"><div class="scard-label">Active codes</div><div class="scard-val">3</div></div>
                <div class="scard"><div class="scard-label">Total uses</div><div class="scard-val">87</div></div>
                <div class="scard"><div class="scard-label">Revenue from codes</div><div class="scard-val" style="font-size:1.4rem">₦620K</div></div>
              </div>
              <div class="card">
                <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="sdiv">Active codes</div>
                  <div class="promo-row"><div class="promo-dot active"></div><div class="promo-code">LASVIP30</div><div class="promo-info"><div class="promo-disc">30% off VIP tickets</div><div class="promo-meta">Expires May 10 · No use limit</div></div><div class="promo-use"><div class="promo-use-n">42</div><div class="promo-use-l">times used</div></div></div>
                  <div class="promo-row"><div class="promo-dot active"></div><div class="promo-code">FRIENDS</div><div class="promo-info"><div class="promo-disc">₦2,000 off any ticket</div><div class="promo-meta">No expiry · Max 50 uses</div></div><div class="promo-use"><div class="promo-use-n">29</div><div class="promo-use-l">times used</div></div></div>
                  <div class="promo-row"><div class="promo-dot active"></div><div class="promo-code">MEDIA50</div><div class="promo-info"><div class="promo-disc">Free ticket (100% off)</div><div class="promo-meta">Expires Apr 30 · Max 20 uses</div></div><div class="promo-use"><div class="promo-use-n">16</div><div class="promo-use-l">times used</div></div></div>
                </div>
                <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="sdiv">Expired</div>
                  <div class="promo-row" style="opacity:.45"><div class="promo-dot dead"></div><div class="promo-code" style="border-color:var(--line)">EARLYBIRD</div><div class="promo-info"><div class="promo-disc">20% off Early Bird</div><div class="promo-meta">Expired Apr 1</div></div><div class="promo-use"><div class="promo-use-n">—</div></div></div>
                </div>
                <div style="padding:var(--s5) var(--s6);">
                  <div class="add-promo"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Create a new promo code</div>
                </div>
              </div>
            </div>
          </div>

          <!-- SHARE -->
          <div class="manage-view" :class="{ active: currentManageView === 'share' }" :style="{ display: currentManageView === 'share' ? 'block' : 'none' }" id="mv-share">
            <div class="mv-wrap">
              <div class="mv-header">
                <div class="mv-eyebrow" style="color:var(--teal)"><svg viewBox="0 0 24 24" style="stroke:var(--teal)"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share Event</div>
                <div class="mv-h1">Spread the <em style="color:var(--teal)">word.</em></div>
                <div class="mv-p">Share your event link. More reach, more tickets sold.</div>
              </div>
              <div class="banner teal"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>WhatsApp gets 3× more conversions for Nigerian events. Share there first.</div>
              <div class="card">
                <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="sdiv">Your event link</div>
                  <div class="share-link-box"><div class="share-url">rushhourtickets.com/e/comedy-meets-dance-2026</div><div class="copy-btn"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy link</div></div>
                </div>
                <div style="padding:var(--s5) var(--s6)"><div class="sdiv">Share on</div>
                  <div class="share-grid">
                    <div class="share-ch"><div class="share-ch-ico" style="background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.2)">📱</div><div class="share-ch-name">WhatsApp</div><div class="share-ch-desc">Share to contacts and groups</div></div>
                    <div class="share-ch"><div class="share-ch-ico" style="background:rgba(228,64,95,.12);border:1px solid rgba(228,64,95,.2)">📸</div><div class="share-ch-name">Instagram</div><div class="share-ch-desc">Story or post with your link</div></div>
                    <div class="share-ch"><div class="share-ch-ico" style="background:rgba(29,155,240,.12);border:1px solid rgba(29,155,240,.2)">🐦</div><div class="share-ch-name">X / Twitter</div><div class="share-ch-desc">Tweet your event</div></div>
                    <div class="share-ch"><div class="share-ch-ico" style="background:rgba(66,103,178,.12);border:1px solid rgba(66,103,178,.2)">👤</div><div class="share-ch-name">Facebook</div><div class="share-ch-desc">Share to page or groups</div></div>
                    <div class="share-ch"><div class="share-ch-ico" style="background:rgba(10,102,194,.12);border:1px solid rgba(10,102,194,.2)">💼</div><div class="share-ch-name">LinkedIn</div><div class="share-ch-desc">Great for professional events</div></div>
                    <div class="share-ch"><div class="share-ch-ico" style="background:rgba(242,242,244,.06);border:1px solid var(--line)">✉️</div><div class="share-ch-name">Email</div><div class="share-ch-desc">Copy a ready-to-send message</div></div>
                  </div>
                </div>
              </div>
              <div class="card">
                <div style="padding:var(--s5) var(--s6)"><div class="sdiv">QR code</div>
                  <div class="qr-share"><div class="qr-sf"><div class="qr-sf-i"></div></div><div><div style="font-size:.84rem;font-weight:700;color:var(--t-hi);margin-bottom:var(--s2)">Share with a QR code</div><div style="font-size:.76rem;font-weight:500;color:var(--t-lo);line-height:1.55;margin-bottom:var(--s3)">Put this on flyers and posters. People scan it and land straight on your ticket page.</div><div class="qr-btn blue" style="display:inline-flex"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download QR</div></div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- PAYOUT -->
          <div class="manage-view" :class="{ active: currentManageView === 'payout' }" :style="{ display: currentManageView === 'payout' ? 'block' : 'none' }" id="mv-payout">
            <div class="mv-wrap">
              <div class="mv-header">
                <div class="mv-eyebrow" style="color:var(--teal)"><svg viewBox="0 0 24 24" style="stroke:var(--teal)"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Payouts</div>
                <div class="mv-h1">Your <em style="color:var(--teal)">earnings.</em></div>
                <div class="mv-p">Revenue from this event. Payouts go to GTBank ••••7823.</div>
              </div>
              <div class="payout-hero-card">
                <div><div class="payout-lbl">Available to withdraw</div><div class="payout-amt">₦7,415,000</div><div class="payout-sub">After 5% platform fee · ₦390,263 deducted</div></div>
                <div class="withdraw-btn"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>Withdraw now</div>
              </div>
              <div class="card">
                <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="sdiv">Payout account</div>
                  <div style="display:flex;flex-direction:column;gap:var(--s5)">
                    <div class="field-row"><div class="field"><div class="field-label">Bank</div><div class="field-val">GTBank</div></div><div class="field"><div class="field-label">Account number</div><div class="field-val">••••••7823</div></div></div>
                    <div class="field"><div class="field-label">Account name</div><div class="field-val">Rush Hour Entertainment Ltd</div></div>
                  </div>
                </div>
              </div>
              <div class="card">
                <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="chart-head-title">Transactions</div></div>
                <div class="tx-row"><div class="tx-ico in"><svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg></div><div class="tx-info"><div class="tx-name">4 tickets sold — General, VIP</div><div class="tx-date">Apr 27 · 11:34 PM</div></div><div class="tx-amt in">+₦50,000</div></div>
                <div class="tx-row"><div class="tx-ico in"><svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg></div><div class="tx-info"><div class="tx-name">2 tickets sold — Early Bird</div><div class="tx-date">Apr 27 · 9:10 AM</div></div><div class="tx-amt in">+₦10,000</div></div>
                <div class="tx-row"><div class="tx-ico out"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div><div class="tx-info"><div class="tx-name">Platform fee</div><div class="tx-date">Apr 27 · 9:10 AM</div></div><div class="tx-amt out">−₦500</div></div>
                <div class="tx-row"><div class="tx-ico in"><svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg></div><div class="tx-info"><div class="tx-name">1 Gold Table sold</div><div class="tx-date">Apr 26 · 3:55 PM</div></div><div class="tx-amt in">+₦250,000</div></div>
              </div>
            </div>
          </div>

          <!-- SETTINGS -->
          <div class="manage-view" :class="{ active: currentManageView === 'settings' }" :style="{ display: currentManageView === 'settings' ? 'block' : 'none' }" id="mv-settings">
            <div class="mv-wrap">
              <div class="mv-header">
                <div class="mv-eyebrow" style="color:var(--t-lo)"><svg viewBox="0 0 24 24" style="stroke:var(--t-lo)"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>Event Settings</div>
                <div class="mv-h1">Event <em style="color:var(--t-mid)">settings.</em></div>
                <div class="mv-p">Control visibility, notifications, and what happens with this event.</div>
              </div>
              <div class="card">
                <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="sdiv">Visibility</div>
                  <div class="toggle-row"><div><div class="toggle-label">Event is public</div><div class="toggle-help">Anyone with the link can find and buy tickets</div></div><div class="toggle on"></div></div>
                  <div class="toggle-row"><div><div class="toggle-label">Show on Rush Hour discovery</div><div class="toggle-help">Your event appears in search and browse</div></div><div class="toggle on"></div></div>
                  <div class="toggle-row"><div><div class="toggle-label">Show exact attendee count</div><div class="toggle-help">Public can see "612 people going"</div></div><div class="toggle off"></div></div>
                </div>
                <div style="padding:var(--s5) var(--s6)"><div class="sdiv">Notifications</div>
                  <div class="toggle-row"><div><div class="toggle-label">Email me every new ticket sale</div><div class="toggle-help">Get an email each time someone buys</div></div><div class="toggle off"></div></div>
                  <div class="toggle-row"><div><div class="toggle-label">Daily summary email</div><div class="toggle-help">One email a day with sales numbers</div></div><div class="toggle on"></div></div>
                  <div class="toggle-row"><div><div class="toggle-label">Notify when 90% sold out</div><div class="toggle-help">We'll tell you when you're nearly full</div></div><div class="toggle on"></div></div>
                </div>
              </div>
              <div class="danger-zone">
                <div class="danger-head"><div class="danger-head-title">Danger zone</div><div class="danger-head-desc">These actions can't be undone. Be careful.</div></div>
                <div class="danger-row"><div><div class="danger-rname">Pause ticket sales</div><div class="danger-rdesc">Stop new purchases. Current tickets stay valid.</div></div><div class="dbtn outline">Pause sales</div></div>
                <div class="danger-row"><div><div class="danger-rname">Cancel this event</div><div class="danger-rdesc">All buyers get a full refund. This cannot be undone.</div></div><div class="dbtn outline">Cancel event</div></div>
                <div class="danger-row"><div><div class="danger-rname">Delete this event</div><div class="danger-rdesc">Permanently removes the event and all data.</div></div><div class="dbtn fill">Delete event</div></div>
              </div>
            </div>
          </div>

        </div><!-- /manage-content -->


        <!-- ════════════════════════════
             EDIT CONTENT
        ═════════════════════════════ -->
        <div class="edit-content" id="edit-content" :style="{ display: isEditMode ? 'block' : 'none' }">
          <div class="edit-wrap">
            <div class="edit-form">

              <!-- STEP 1 -->
              <div class="step-screen" :class="{ active: currentStep === 1 }" id="s1">
                <div class="step-header">
                  <div class="step-eyebrow"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Step 1 of 4</div>
                  <div class="step-h1">The <em>basics.</em></div>
                  <div class="step-p">The core details of your event. These are what people see first.</div>
                </div>
                <div class="form-card">
                  <div class="form-section"><div class="field"><div class="field-label">Event name</div><div class="field-val">Comedy Meets Dance</div></div></div>
                  <div class="form-section"><div class="sdiv">When</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field-row"><div class="field"><div class="field-label">Starts</div><div class="field-val">May 12, 2026 · 6:00 PM</div></div><div class="field"><div class="field-label">Ends</div><div class="field-val">May 12, 2026 · 10:00 PM</div></div></div><div class="field"><div class="field-label">Recurring?</div><div class="field-val"><span class="fpill teal"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>One-time event</span></div></div></div></div>
                  <div class="form-section"><div class="sdiv">Format</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field"><div class="field-label">Event type</div><div class="field-val"><span class="fpill pink"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>In-Person</span></div></div><div class="field"><div class="field-label">Venue</div><div class="field-val">Eko Hotel &amp; Suites, Victoria Island, Lagos</div></div><div class="map-ph"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>Eko Hotel &amp; Suites · Victoria Island, Lagos</div></div></div>
                  <div class="form-section"><div class="sdiv">Category</div><div class="field"><div class="field-label">Event category</div><div class="field-val">🎉 Party &amp; Social</div></div></div>
                </div>
                <div class="step-nav"><div class="snav-next" @click="goToStep(2)">Next: Details <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div></div>
              </div>

              <!-- STEP 2 -->
              <div class="step-screen" :class="{ active: currentStep === 2 }" id="s2">
                <div class="step-header">
                  <div class="step-eyebrow"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Step 2 of 4</div>
                  <div class="step-h1">Make it <em>unforgettable.</em></div>
                  <div class="step-p">Images, description, and extra details.</div>
                </div>
                <div class="form-card">
                  <div class="form-section"><div class="sdiv">Cover image</div><div style="display:flex;flex-direction:column;gap:var(--s4)"><div class="cover-display"><img src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Comedy-Meets-dance_s2egap.jpg" alt=""><div class="cover-display-ov"></div><div class="cover-badge-pill">Cover photo</div></div><div class="field"><div class="field-label">Images added</div><div class="field-val">1 image uploaded · first image is the cover</div></div></div></div>
                  <div class="form-section"><div class="sdiv">Description</div><div class="field"><div class="field-label">What people will experience</div><div class="field-val ta">A night where comedy and dance collide. Lagos's funniest stand-up comics share the stage with the city's best dance crews. Expect laughter, energy, and non-stop entertainment from start to finish.</div></div></div>
                  <div class="form-section"><div class="sdiv">Organiser</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field-row"><div class="field"><div class="field-label">Name or organisation</div><div class="field-val">Rush Hour Entertainment</div></div><div class="field"><div class="field-label">Website</div><div class="field-val" style="color:var(--t-lo);font-style:italic">Not added</div></div></div></div></div>
                  <div class="form-section"><div class="sdiv">Extra details</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field"><div class="field-label">Dress code</div><div class="field-val ta">Smart casual. No slippers or flip-flops. Bring a light jacket — the hall is air-conditioned.</div></div><div class="field"><div class="field-label">Parking</div><div class="field-val">Free parking on site. Enter via the main gate on Adetokunbo Ademola Street.</div></div></div></div>
                </div>
                <div class="step-nav"><div class="snav-back" @click="goToStep(1)"><svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div><div class="snav-next" @click="goToStep(3)">Next: Tickets <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div></div>
              </div>

              <!-- STEP 3 -->
              <div class="step-screen" :class="{ active: currentStep === 3 }" id="s3">
                <div class="step-header">
                  <div class="step-eyebrow"><svg viewBox="0 0 24 24"><path d="M2 9a3 3 0 010-6h20a3 3 0 010 6M2 15a3 3 0 000 6h20a3 3 0 000-6"/><path d="M12 3v18M7 9v6M17 9v6"/></svg>Step 3 of 4</div>
                  <div class="step-h1">Your <em>tickets.</em></div>
                  <div class="step-p">How people attend and what they pay.</div>
                </div>
                <div class="form-card">
                  <div class="form-section"><div class="field"><div class="field-label">Attendance type</div><div class="field-val"><span class="fpill pink"><svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Paid tickets</span></div></div></div>
                  <div class="form-section"><div class="sdiv">Ticket categories</div><div style="display:flex;flex-direction:column;gap:var(--s3)">
                    <div class="tkt-item"><div class="tkt-ico" style="background:rgba(26,122,74,.15)"><svg viewBox="0 0 24 24" style="stroke:var(--teal);fill:none;width:16px;height:16px;stroke-width:2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="tkt-inf"><div class="tkt-item-name">Early Bird</div><div class="tkt-item-meta">Individual · 150 spots · 89 remaining</div></div><div class="tkt-item-price">₦5,000</div></div>
                    <div class="tkt-item"><div class="tkt-ico" style="background:rgba(26,95,166,.15)"><svg viewBox="0 0 24 24" style="stroke:var(--blue);fill:none;width:16px;height:16px;stroke-width:2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2"/></svg></div><div class="tkt-inf"><div class="tkt-item-name">General Admission</div><div class="tkt-item-meta">Individual · 500 spots · 323 remaining</div></div><div class="tkt-item-price">₦10,000</div></div>
                    <div class="tkt-item"><div class="tkt-ico" style="background:rgba(200,150,10,.15)"><svg viewBox="0 0 24 24" style="stroke:var(--amber);fill:none;width:16px;height:16px;stroke-width:1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><div class="tkt-inf"><div class="tkt-item-name">VIP</div><div class="tkt-item-meta">Individual · 50 spots · 12 remaining</div></div><div class="tkt-item-price">₦30,000</div></div>
                    <div class="tkt-item"><div class="tkt-ico" style="background:rgba(232,54,93,.1)"><svg viewBox="0 0 24 24" style="stroke:var(--red);fill:none;width:16px;height:16px;stroke-width:1.8;stroke-linecap:round"><path d="M3 7h18M5 7l1 12h12l1-12"/></svg></div><div class="tkt-inf"><div class="tkt-item-name">Gold Table</div><div class="tkt-item-meta">Table · seats 10 · 5 remaining</div></div><div class="tkt-item-price">₦250,000</div></div>
                  </div></div>
                  <div class="form-section"><div class="sdiv">Payout</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field-row"><div class="field"><div class="field-label">Bank</div><div class="field-val">GTBank</div></div><div class="field"><div class="field-label">Account number</div><div class="field-val">••••••7823</div></div></div><div class="field"><div class="field-label">Account name</div><div class="field-val">Rush Hour Entertainment Ltd</div></div></div></div>
                </div>
                <div class="step-nav"><div class="snav-back" @click="goToStep(2)"><svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div><div class="snav-next" @click="goToStep(4)">Next: Attendees <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div></div>
              </div>

              <!-- STEP 4 -->
              <div class="step-screen" :class="{ active: currentStep === 4 }" id="s4">
                <div class="step-header">
                  <div class="step-eyebrow"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Step 4 of 4</div>
                  <div class="step-h1">Who's <em>registering?</em></div>
                  <div class="step-p">The information you collect from every person who buys a ticket.</div>
                </div>
                <div class="form-card">
                  <div class="form-section"><div class="sdiv">Registration form fields</div>
                    <div class="reg-row"><div class="reg-ico">👤</div><div class="reg-inf"><div class="reg-name">Full name</div><div class="reg-desc">First and last name</div></div><div class="reg-st"><span class="reg-badge on">On</span><span class="reg-badge req">Required</span></div></div>
                    <div class="reg-row"><div class="reg-ico">✉️</div><div class="reg-inf"><div class="reg-name">Email address</div><div class="reg-desc">For ticket delivery and updates</div></div><div class="reg-st"><span class="reg-badge on">On</span><span class="reg-badge req">Required</span></div></div>
                    <div class="reg-row"><div class="reg-ico">📞</div><div class="reg-inf"><div class="reg-name">Phone number</div><div class="reg-desc">For WhatsApp updates</div></div><div class="reg-st"><span class="reg-badge on">On</span><span class="reg-badge off">Optional</span></div></div>
                    <div class="reg-row"><div class="reg-ico">🏢</div><div class="reg-inf"><div class="reg-name">Organisation</div><div class="reg-desc">Where they work or study</div></div><div class="reg-st"><span class="reg-badge off">Off</span></div></div>
                    <div class="reg-row"><div class="reg-ico">📣</div><div class="reg-inf"><div class="reg-name">How did you hear about us?</div><div class="reg-desc">Useful for marketing insights</div></div><div class="reg-st"><span class="reg-badge on">On</span><span class="reg-badge off">Optional</span></div></div>
                  </div>
                  <div class="form-section"><div class="sdiv">Confirmation email</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field"><div class="field-label">Subject</div><div class="field-val">You're in! 🎉 Comedy Meets Dance</div></div><div class="field"><div class="field-label">Personal message</div><div class="field-val ta">Can't wait to have you with us! Come ready to laugh, dance, and have a great time. See you on May 12!</div></div></div></div>
                </div>
                <div class="step-nav">
                  <div class="snav-back" @click="goToStep(3)"><svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
                  <div class="snav-next" style="background:var(--teal)" @click="exitEditMode"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>All done — save changes</div>
                </div>
              </div>

            </div>
          </div>
        </div><!-- /edit-content -->

      </div><!-- /page-body -->
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Figtree:wght@300;400;500;600;700&display=swap');

/* ─────────────────────────────────────────
   TOKENS
───────────────────────────────────────── */
.event-dashboard {
  --bg:            #0C0C0E;
  --bg-1:          #111113;
  --bg-2:          #161618;
  --bg-3:          #1C1C1F;
  --bg-hover:      #202023;
  --bg-input:      #1A1A1D;

  --line:          rgba(255,255,255,.07);
  --line-soft:     rgba(255,255,255,.04);
  --line-mid:      rgba(255,255,255,.11);

  --red:           #E8365D;
  --red-bg:        rgba(232,54,93,.1);
  --red-border:    rgba(232,54,93,.2);
  --teal:          #29B89A;
  --teal-bg:       rgba(41,184,154,.1);
  --teal-border:   rgba(41,184,154,.2);
  --amber:         #E09050;
  --amber-bg:      rgba(224,144,80,.1);
  --amber-border:  rgba(224,144,80,.2);
  --blue:          #4A7BF7;
  --blue-bg:       rgba(74,123,247,.1);
  --blue-border:   rgba(74,123,247,.22);
  --pink:          #EC4899;
  --pink-bg:       rgba(236,72,153,.1);
  --pink-border:   rgba(236,72,153,.22);

  --t-hi:          #F2F2F4;
  --t-mid:         rgba(242,242,244,.55);
  --t-lo:          rgba(242,242,244,.30);
  --t-xlo:         rgba(242,242,244,.13);

  --s1:4px;--s2:8px;--s3:12px;--s4:16px;--s5:20px;
  --s6:24px;--s7:32px;--s8:40px;--s9:56px;

  --r-sm:6px;--r-md:10px;--r-lg:14px;--r-xl:18px;--r-pill:100px;

  --sidebar-w: 252px;
  --topbar-h:  64px;

  --ff-d: 'Fraunces', Georgia, serif;
  --ff-u: 'Figtree', system-ui, sans-serif;
}

.event-dashboard,.event-dashboard *,.event-dashboard *::before,.event-dashboard *::after{box-sizing:border-box;margin:0;padding:0;}
.event-dashboard{font-size:15px;-webkit-font-smoothing:antialiased;}
.event-dashboard{font-family:var(--ff-u);background:var(--bg);color:var(--t-hi);min-height:100vh;display:flex;overflow-x:hidden;line-height:1.5;}
.event-dashboard a{text-decoration:none;color:inherit;}
.event-dashboard ul{list-style:none;}

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-w);
  height: 100vh;
  background: var(--bg-1);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  position: fixed;
  top:0;left:0;
  z-index: 100;
  overflow: hidden;
}

.event-switcher {
  flex-shrink: 0;
  border-bottom: 1px solid var(--line);
}

.switcher-current {
  display: flex;
  align-items: center;
  gap: var(--s3);
  padding: var(--s4) var(--s4);
  cursor: pointer;
  transition: background .12s;
  user-select: none;
}
.switcher-current:hover { background: var(--bg-hover); }

.switcher-thumb {
  width: 36px; height: 36px;
  border-radius: var(--r-sm);
  overflow: hidden;
  flex-shrink: 0;
}
.switcher-thumb img { width:100%;height:100%;object-fit:cover; }

.switcher-info { flex:1; min-width:0; }
.switcher-name {
  font-size: .82rem;
  font-weight: 700;
  color: var(--t-hi);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  margin-bottom: 3px;
}
.switcher-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: .6rem;
  font-weight: 800;
  letter-spacing: .07em;
  text-transform: uppercase;
}
.switcher-status.live { color: var(--teal); }
.status-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
}
.live .status-dot { background:var(--teal); box-shadow:0 0 5px var(--teal); animation: pulse 2s infinite; }
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

.switcher-arrow {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: transform .2s;
}
.switcher-arrow svg { width:13px;height:13px;stroke:var(--t-lo);stroke-width:2;fill:none; }
.switcher-arrow.open { transform: rotate(180deg); }

.events-dropdown {
  max-height: 0;
  overflow: hidden;
  transition: max-height .25s ease;
  background: var(--bg);
}
.events-dropdown.open {
  max-height: 240px;
  border-bottom: 1px solid var(--line);
}

.dropdown-label {
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--t-xlo);
  padding: var(--s3) var(--s4) var(--s2);
}
.dropdown-event {
  display: flex;
  align-items: center;
  gap: var(--s3);
  padding: 9px var(--s4);
  cursor: pointer;
  transition: background .1s;
}
.dropdown-event:hover { background: var(--bg-hover); }
.dropdown-thumb {
  width: 28px; height: 28px;
  border-radius: 5px;
  overflow: hidden;
  flex-shrink: 0;
}
.dropdown-thumb img { width:100%;height:100%;object-fit:cover; }
.dropdown-event-name {
  font-size: .78rem;
  font-weight: 600;
  color: var(--t-mid);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dropdown-live-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 5px var(--teal);
  flex-shrink: 0;
}

.back-link {
  display: flex;
  align-items: center;
  gap: var(--s2);
  padding: var(--s3) var(--s4);
  font-size: .72rem;
  font-weight: 600;
  color: var(--t-xlo);
  cursor: pointer;
  transition: color .12s;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.back-link:hover { color: var(--t-lo); }
.back-link svg { width:12px;height:12px;stroke:currentColor;fill:none; }

.sidebar-nav {
  flex: 1;
  padding: var(--s3) var(--s3);
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--s3);
  padding: 10px var(--s3);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: background .12s;
}
.nav-item:hover { background: var(--bg-hover); }
.nav-item.active { background: rgba(255,255,255,.06); }
.nav-item svg {
  width: 15px; height: 15px;
  stroke: rgba(255,255,255,.28);
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
  transition: stroke .12s;
}
.nav-item:hover svg { stroke: var(--t-mid); }
.nav-item.active svg { stroke: var(--t-hi); }
.nav-label {
  font-size: .83rem;
  font-weight: 600;
  color: var(--t-mid);
  transition: color .12s;
  flex: 1;
}
.nav-item:hover .nav-label { color: var(--t-hi); }
.nav-item.active .nav-label { color: var(--t-hi); font-weight: 700; }

.sidebar-footer {
  flex-shrink: 0;
  padding: var(--s3) var(--s4) var(--s4);
  border-top: 1px solid var(--line);
}
.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--s3);
  padding: var(--s3) 0 var(--s4);
}
.sidebar-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--red), var(--amber));
  display: flex; align-items: center; justify-content: center;
  font-size: .68rem;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}
.sidebar-user-name { font-size: .78rem; font-weight: 700; color: var(--t-hi); }
.sidebar-user-role { font-size: .66rem; font-weight: 500; color: var(--t-lo); }

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
.main {
  flex: 1;
  min-width: 0;
  margin-left: var(--sidebar-w);
  display: flex;
  flex-direction: column;
}

/* ─────────────────────────────────────────
   TOPBAR
───────────────────────────────────────── */
.topbar {
  height: var(--topbar-h);
  padding: 0 var(--s7);
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(12,12,14,.95);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 50;
  gap: var(--s5);
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--s3);
  min-width: 0;
}
.topbar-event-name {
  font-family: var(--ff-d);
  font-size: .92rem;
  font-weight: 500;
  color: var(--t-hi);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -.01em;
}
.topbar-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: .6rem;
  font-weight: 800;
  letter-spacing: .07em;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: var(--r-pill);
  flex-shrink: 0;
}
.topbar-status.live { background:var(--teal-bg);border:1px solid var(--teal-border);color:var(--teal); }

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--s3);
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--s2);
  font-size: .76rem;
  font-weight: 700;
  padding: 8px var(--s4);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: opacity .12s;
  white-space: nowrap;
}
.btn:hover { opacity: .85; }
.btn-primary { background: var(--red); color: white; }
.btn-ghost { background: var(--bg-2); color: var(--t-mid); border: 1px solid var(--line-mid); }
.btn-edit { background: var(--bg-2); color: var(--t-hi); border: 1px solid var(--line-mid); }
.btn svg { width:13px;height:13px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round; }

.topbar-manage { display: flex; align-items: center; width: 100%; gap: var(--s5); }
.topbar-edit { display: none; align-items: center; width: 100%; gap: var(--s5); }

.step-prog {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
}
.step-item {
  display: flex; align-items: center; gap: var(--s2);
  padding: 6px var(--s3);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: background .12s;
}
.step-item:hover { background: var(--bg-hover); }
.step-num {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 1.5px solid var(--line-mid);
  display: flex; align-items: center; justify-content: center;
  font-size: .7rem; font-weight: 800; color: var(--t-lo);
  flex-shrink: 0; transition: all .2s;
}
.step-label { font-size: .76rem; font-weight: 600; color: var(--t-lo); transition: color .2s; white-space: nowrap; }
.step-item.active .step-num { background: var(--pink); border-color: var(--pink); color: white; box-shadow: 0 0 10px rgba(236,72,153,.3); }
.step-item.active .step-label { color: var(--t-hi); font-weight: 700; }
.step-item.done .step-num { background: rgba(41,184,154,.15); border-color: var(--teal); color: var(--teal); }
.step-item.done .step-label { color: var(--t-mid); }
.step-connector { width: 28px; height: 1px; background: var(--line-mid); flex-shrink: 0; }
.step-connector.done { background: var(--teal); opacity: .4; }

.saved-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: .7rem; font-weight: 600;
  color: var(--teal);
  background: var(--teal-bg);
  border: 1px solid var(--teal-border);
  padding: 4px 10px;
  border-radius: var(--r-pill);
}
.saved-badge svg { width:10px;height:10px;stroke:var(--teal);fill:none; }

/* ─────────────────────────────────────────
   PAGE BODY
───────────────────────────────────────── */
.page-body {
  flex: 1;
  overflow-y: auto;
}

.manage-content { display: block; }
.edit-content   { display: none; }

/* ── HERO ── */
.event-hero {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  flex-shrink: 0;
}
.event-hero img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.event-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(12,12,14,.15) 0%, rgba(12,12,14,.75) 60%, rgba(12,12,14,1) 100%);
}
.event-hero-content {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: var(--s7) var(--s8) var(--s7);
}
.hero-status {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: .6rem; font-weight: 800;
  letter-spacing: .08em; text-transform: uppercase;
  padding: 3px 10px; border-radius: var(--r-pill);
  background: var(--teal-bg); border: 1px solid var(--teal-border); color: var(--teal);
  margin-bottom: var(--s3);
}
.hero-title {
  font-family: var(--ff-d);
  font-size: 2.2rem;
  font-weight: 500;
  color: var(--t-hi);
  letter-spacing: -.04em;
  line-height: 1.1;
  margin-bottom: var(--s3);
}
.hero-meta {
  display: flex;
  align-items: center;
  gap: var(--s5);
  flex-wrap: wrap;
}
.hero-meta-item {
  display: flex; align-items: center; gap: 6px;
  font-size: .78rem; font-weight: 600; color: var(--t-mid);
}
.hero-meta-item svg { width:13px;height:13px;stroke:var(--t-lo);fill:none;stroke-width:1.8;stroke-linecap:round; }

/* ── STAT STRIP ── */
.stat-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid var(--line);
}
.stat-cell {
  padding: var(--s6) var(--s7);
  border-right: 1px solid var(--line);
}
.stat-cell:last-child { border-right: none; }
.stat-cell-label {
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--t-lo);
  margin-bottom: var(--s2);
}
.stat-cell-value {
  font-family: var(--ff-d);
  font-size: 1.9rem;
  font-weight: 400;
  color: var(--t-hi);
  letter-spacing: -.05em;
  line-height: 1;
  margin-bottom: 6px;
}
.stat-cell-sub {
  font-size: .72rem;
  font-weight: 600;
  display: flex; align-items: center; gap: 4px;
}
.stat-cell-sub.up { color: var(--teal); }
.stat-cell-sub.neutral { color: var(--t-lo); }
.stat-cell-sub svg { width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round; }

.stat-prog { margin-top: var(--s3); }
.stat-prog-track {
  height: 4px;
  background: rgba(255,255,255,.07);
  border-radius: 2px;
  overflow: hidden;
}
.stat-prog-fill { height: 100%; border-radius: 2px; }
.fill-teal { background: var(--teal); }
.fill-blue { background: var(--blue); }
.fill-amber { background: var(--amber); }
.fill-red { background: var(--red); }

/* ── MANAGE SECTIONS ── */
.sections-wrap {
  padding: var(--s8) var(--s8) var(--s9);
  display: flex;
  flex-direction: column;
  gap: 45px;
  max-width: 920px;
}

.section-title {
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--t-lo);
  margin-bottom: var(--s5);
  display: flex;
  align-items: center;
  gap: var(--s3);
}
.section-title::after { content:''; flex:1; height:1px; background:var(--line); }

.card {
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  overflow: hidden;
}

/* Quick actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--s3);
}
.qa-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s3);
  padding: var(--s5) var(--s4);
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: all .12s;
  text-align: center;
}
.qa-btn:hover { background: var(--bg-hover); border-color: var(--line-mid); }
.qa-icon {
  width: 40px; height: 40px;
  border-radius: var(--r-md);
  display: flex; align-items: center; justify-content: center;
}
.qa-icon svg { width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round; }
.qa-label { font-size: .76rem; font-weight: 700; color: var(--t-hi); }
.qa-desc { font-size: .67rem; font-weight: 500; color: var(--t-lo); line-height: 1.4; }

/* Sales chart */
.chart-wrap { padding: var(--s5) var(--s6) var(--s4); }
.chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--s5);
}
.chart-head-title { font-size: .84rem; font-weight: 700; color: var(--t-hi); }
.chart-head-sub { font-size: .72rem; font-weight: 500; color: var(--t-lo); margin-top: 2px; }
.chart-pills { display:flex; gap: var(--s2); }
.cpill {
  font-size: .68rem; font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  cursor: pointer;
  border: 1px solid var(--line);
  color: var(--t-lo);
  background: transparent;
  transition: all .12s;
}
.cpill.on { background:var(--bg-3); border-color:var(--line-mid); color:var(--t-hi); }
.chart-svg { width:100%; overflow:visible; }

/* ─────────────────────────────────────────
   TICKET BREAKDOWN — REDESIGNED
   Card rows. Each ticket type = one row.
   No table headers, no dimmed columns.
   Plain English. Everything same weight.
───────────────────────────────────────── */
.tkt-rows { display: flex; flex-direction: column; }

.tkt-row {
  display: grid;
  grid-template-columns: 40px 1fr auto auto;
  align-items: center;
  gap: var(--s4);
  padding: var(--s5) var(--s6);
  border-bottom: 1px solid var(--line-soft);
  transition: background .12s;
}
.tkt-row:last-child { border-bottom: none; }
.tkt-row:hover { background: var(--bg-hover); }

/* Left icon circle */
.tkt-icon {
  width: 40px; height: 40px;
  border-radius: var(--r-md);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tkt-icon svg { width: 16px; height: 16px; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

/* Middle: name + progress bar */
.tkt-mid { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.tkt-name-row { display: flex; align-items: center; gap: var(--s3); }
.tkt-name { font-size: .86rem; font-weight: 700; color: var(--t-hi); }
.tkt-sold-tag {
  font-size: .65rem; font-weight: 800;
  letter-spacing: .05em;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  white-space: nowrap;
}

.tkt-progress-row {
  display: flex;
  align-items: center;
  gap: var(--s3);
}
.tkt-prog-track {
  flex: 1;
  height: 5px;
  background: rgba(255,255,255,.07);
  border-radius: 3px;
  overflow: hidden;
}
.tkt-prog-fill { height: 100%; border-radius: 3px; }
.tkt-prog-label {
  font-size: .72rem;
  font-weight: 700;
  color: var(--t-mid);
  min-width: 72px;
  white-space: nowrap;
}

/* Right side: price + revenue */
.tkt-right { text-align: right; flex-shrink: 0; }
.tkt-price { font-family: var(--ff-d); font-size: .96rem; font-weight: 400; color: var(--t-hi); letter-spacing: -.02em; line-height: 1.2; }
.tkt-revenue { font-size: .72rem; font-weight: 600; color: var(--t-lo); margin-top: 3px; }

/* ─────────────────────────────────────────
   TRAFFIC SOURCES — REDESIGNED
   No emojis. Proper SVG icons.
───────────────────────────────────────── */
.traffic-rows { display: flex; flex-direction: column; }

.traffic-row {
  display: grid;
  grid-template-columns: 36px 1fr 80px 44px;
  align-items: center;
  gap: var(--s4);
  padding: var(--s4) var(--s6);
  border-bottom: 1px solid var(--line-soft);
  transition: background .12s;
}
.traffic-row:last-child { border-bottom: none; }
.traffic-row:hover { background: var(--bg-hover); }

.traffic-icon {
  width: 36px; height: 36px;
  border-radius: var(--r-sm);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.traffic-icon svg { width: 15px; height: 15px; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

.traffic-info { min-width: 0; }
.traffic-name { font-size: .84rem; font-weight: 700; color: var(--t-hi); }
.traffic-count { font-size: .72rem; font-weight: 500; color: var(--t-lo); margin-top: 2px; }

.traffic-bar-wrap { display: flex; flex-direction: column; gap: 5px; }
.traffic-bar-track { height: 4px; background: rgba(255,255,255,.07); border-radius: 2px; overflow: hidden; }
.traffic-bar-fill { height: 100%; border-radius: 2px; }

.traffic-pct { font-size: .84rem; font-weight: 700; color: var(--t-hi); text-align: right; }

/* Manage views */
.manage-view { display: none; }
.manage-view.active { display: block; }
#mv-overview { display: block; }

/* ─────────────────────────────────────────
   OTHER MANAGE VIEWS (unchanged internals)
───────────────────────────────────────── */
.mv-wrap {
  padding: var(--s8) var(--s8) var(--s9);
  max-width: 860px;
  display: flex;
  flex-direction: column;
  gap: 45px;
}
.mv-header { padding-bottom: var(--s6); border-bottom: 1px solid var(--line); }
.mv-eyebrow {
  font-size:.64rem; font-weight:800;
  letter-spacing:.12em; text-transform:uppercase;
  margin-bottom:var(--s2);
  display:flex; align-items:center; gap:var(--s2);
}
.mv-eyebrow svg { width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round; }
.mv-h1 {
  font-family:var(--ff-d); font-size:1.7rem;
  font-weight:400; letter-spacing:-.04em;
  line-height:1.1; color:var(--t-hi);
  margin-bottom:var(--s3);
}
.mv-h1 em { font-style:italic; }
.mv-p { font-size:.82rem;font-weight:500;color:var(--t-lo);line-height:1.65; }

.banner {
  display:flex; align-items:flex-start; gap:var(--s3);
  border-radius:var(--r-lg); padding:var(--s4) var(--s5);
  font-size:.78rem; font-weight:500; color:var(--t-mid); line-height:1.6;
}
.banner svg { width:15px;height:15px;flex-shrink:0;margin-top:1px;fill:none;stroke-width:2;stroke-linecap:round; }
.banner.blue { background:var(--blue-bg);border:1px solid var(--blue-border); }
.banner.blue svg { stroke:var(--blue); }
.banner.amber { background:var(--amber-bg);border:1px solid var(--amber-border); }
.banner.amber svg { stroke:var(--amber); }
.banner.teal { background:var(--teal-bg);border:1px solid var(--teal-border); }
.banner.teal svg { stroke:var(--teal); }

.stat-grid-2 { display:grid;grid-template-columns:repeat(2,1fr);gap:var(--s4); }
.stat-grid-3 { display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s4); }
.stat-grid-4 { display:grid;grid-template-columns:repeat(4,1fr);gap:var(--s4); }
.scard { background:var(--bg-2);border:1px solid var(--line);border-radius:var(--r-lg);padding:var(--s5); }
.scard-label { font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--t-lo);margin-bottom:var(--s2); }
.scard-val { font-family:var(--ff-d);font-size:1.8rem;font-weight:400;letter-spacing:-.05em;color:var(--t-hi);line-height:1;margin-bottom:5px; }
.scard-sub { font-size:.71rem;font-weight:600;display:flex;align-items:center;gap:4px; }
.scard-sub.up { color:var(--teal); }
.scard-sub.neutral { color:var(--t-lo); }
.scard-sub svg { width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round; }

.toggle-row { display:flex;align-items:center;justify-content:space-between;gap:var(--s4);padding:var(--s3) 0;border-bottom:1px solid var(--line-soft); }
.toggle-row:last-child { border-bottom:none; }
.toggle-label { font-size:.82rem;font-weight:600;color:var(--t-hi);margin-bottom:2px; }
.toggle-help { font-size:.71rem;font-weight:500;color:var(--t-lo); }
.toggle { width:36px;height:20px;border-radius:10px;flex-shrink:0;position:relative;transition:background .2s;cursor:pointer; }
.toggle.on { background:var(--teal); }
.toggle.off { background:rgba(255,255,255,.12); }
.toggle::after { content:'';position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:white;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3); }
.toggle.on::after { left:18px; }
.toggle.off::after { left:2px; }

.field { display:flex;flex-direction:column;gap:var(--s2); }
.field-label { font-size:.74rem;font-weight:700;color:var(--t-mid);letter-spacing:.01em; }
.field-val { font-size:.86rem;font-weight:500;color:var(--t-hi);background:var(--bg-input);border:1px solid var(--line);border-radius:var(--r-md);padding:11px var(--s4);min-height:42px;display:flex;align-items:center; }
.field-val.ta { align-items:flex-start;min-height:96px;padding:var(--s3) var(--s4);line-height:1.65; }
.field-row { display:grid;grid-template-columns:1fr 1fr;gap:var(--s4); }
.sdiv { font-size:.64rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--t-lo);margin-bottom:var(--s5);display:flex;align-items:center;gap:var(--s3); }
.sdiv::after { content:'';flex:1;height:1px;background:var(--line); }

.att-row { display:flex;align-items:center;gap:var(--s3);padding:var(--s3) var(--s5);border-bottom:1px solid var(--line-soft);cursor:pointer;transition:background .1s; }
.att-row:last-child { border-bottom:none; }
.att-row:hover { background:var(--bg-hover); }
.att-av { width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;color:white;flex-shrink:0; }
.att-name { font-size:.82rem;font-weight:600;color:var(--t-hi);flex:1; }
.att-tkt { font-size:.72rem;font-weight:600;color:var(--t-lo);margin-right:var(--s3); }
.ci-badge { font-size:.6rem;font-weight:800;padding:3px 8px;border-radius:var(--r-pill);letter-spacing:.05em;text-transform:uppercase;flex-shrink:0; }
.ci-badge.in { background:var(--teal-bg);border:1px solid var(--teal-border);color:var(--teal); }
.ci-badge.out { background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--t-lo); }

.qr-zone { display:flex;flex-direction:column;align-items:center;padding:var(--s8) var(--s6);gap:var(--s5); }
.qr-frame { width:180px;height:180px;background:white;border-radius:var(--r-lg);padding:14px; }
.qr-inner { width:100%;height:100%;background:repeating-conic-gradient(#000 0%,#000 25%,#fff 0%,#fff 50%) 0 0/8px 8px;border-radius:4px;opacity:.92; }
.qr-cap { font-size:.78rem;font-weight:600;color:var(--t-lo);text-align:center; }
.qr-btns { display:flex;gap:var(--s3); }
.qr-btn { display:flex;align-items:center;gap:6px;font-size:.76rem;font-weight:700;padding:8px 14px;border-radius:var(--r-md);cursor:pointer;transition:opacity .12s; }
.qr-btn:hover { opacity:.85; }
.qr-btn.blue { background:var(--blue-bg);border:1px solid var(--blue-border);color:var(--blue); }
.qr-btn.pink { background:var(--pink-bg);border:1px solid var(--pink-border);color:var(--pink); }
.qr-btn svg { width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round; }

.search-bar { display:flex;align-items:center;gap:var(--s3);background:var(--bg-input);border:1px solid var(--line);border-radius:var(--r-md);padding:10px var(--s4); }
.search-bar svg { width:14px;height:14px;stroke:var(--t-lo);fill:none;stroke-linecap:round; }
.search-bar span { font-size:.82rem;font-weight:500;color:var(--t-lo); }

.compose { background:var(--bg-2);border:1px solid var(--line);border-radius:var(--r-xl);overflow:hidden; }
.compose-row { display:flex;align-items:center;gap:var(--s3);padding:var(--s4) var(--s5);border-bottom:1px solid var(--line-soft); }
.compose-lbl { font-size:.74rem;font-weight:700;color:var(--t-lo);width:44px;flex-shrink:0; }
.email-tag { display:inline-flex;align-items:center;gap:5px;font-size:.72rem;font-weight:700;padding:4px 10px;border-radius:var(--r-pill);background:var(--teal-bg);border:1px solid var(--teal-border);color:var(--teal); }
.compose-input { flex:1;background:transparent;border:none;outline:none;font-family:var(--ff-u);font-size:.86rem;font-weight:600;color:var(--t-hi); }
.compose-input::placeholder { color:var(--t-lo);font-weight:500; }
.compose-body { padding:var(--s5);min-height:180px;font-size:.86rem;font-weight:500;color:var(--t-mid);line-height:1.8; }
.compose-toolbar { padding:var(--s3) var(--s5);border-top:1px solid var(--line-soft);display:flex;align-items:center;justify-content:space-between;gap:var(--s3); }
.tb-actions { display:flex;gap:var(--s2); }
.tb-btn { width:32px;height:32px;border-radius:var(--r-sm);background:var(--bg-3);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .12s; }
.tb-btn:hover { background:var(--bg-hover); }
.tb-btn svg { width:13px;height:13px;stroke:var(--t-lo);fill:none;stroke-width:2;stroke-linecap:round; }
.send-btn { display:flex;align-items:center;gap:var(--s2);background:var(--red);color:white;font-size:.76rem;font-weight:700;padding:8px var(--s4);border-radius:var(--r-md);cursor:pointer;transition:opacity .12s; }
.send-btn:hover { opacity:.88; }
.send-btn svg { width:12px;height:12px;stroke:white;fill:none;stroke-width:2.2;stroke-linecap:round; }

.camp-row { display:flex;align-items:center;gap:var(--s4);padding:var(--s4) var(--s5);border-bottom:1px solid var(--line-soft); }
.camp-row:last-child { border-bottom:none; }
.camp-ico { width:34px;height:34px;border-radius:var(--r-sm);background:var(--bg-3);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.camp-ico svg { width:14px;height:14px;stroke:var(--t-lo);fill:none;stroke-width:2;stroke-linecap:round; }
.camp-info { flex:1;min-width:0; }
.camp-subj { font-size:.82rem;font-weight:600;color:var(--t-hi);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.camp-meta { font-size:.71rem;font-weight:500;color:var(--t-lo);margin-top:2px; }
.camp-stats { display:flex;gap:var(--s4);flex-shrink:0; }
.camp-stat { text-align:right; }
.camp-num { font-size:.82rem;font-weight:700;color:var(--t-hi); }
.camp-lbl { font-size:.65rem;font-weight:600;color:var(--t-lo); }

.promo-row { display:flex;align-items:center;gap:var(--s4);padding:var(--s4) var(--s5);border-bottom:1px solid var(--line-soft); }
.promo-row:last-child { border-bottom:none; }
.promo-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0; }
.promo-dot.active { background:var(--teal);box-shadow:0 0 6px var(--teal); }
.promo-dot.dead { background:rgba(255,255,255,.18); }
.promo-code { font-family:'Courier New',monospace;font-size:.82rem;font-weight:700;color:var(--t-hi);background:var(--bg-3);border:1px solid var(--line-mid);border-radius:var(--r-sm);padding:4px 10px;letter-spacing:.08em;flex-shrink:0;min-width:110px;text-align:center; }
.promo-info { flex:1; }
.promo-disc { font-size:.82rem;font-weight:700;color:var(--t-hi); }
.promo-meta { font-size:.71rem;font-weight:500;color:var(--t-lo);margin-top:2px; }
.promo-use { text-align:right;flex-shrink:0; }
.promo-use-n { font-size:.84rem;font-weight:700;color:var(--t-hi); }
.promo-use-l { font-size:.65rem;font-weight:600;color:var(--t-lo); }
.add-promo { display:flex;align-items:center;justify-content:center;gap:var(--s2);padding:var(--s4);border:1px dashed rgba(255,255,255,.14);border-radius:var(--r-lg);font-size:.82rem;font-weight:700;color:var(--t-lo);cursor:pointer;transition:all .12s; }
.add-promo:hover { border-color:rgba(255,255,255,.25);color:var(--t-mid);background:var(--bg-hover); }
.add-promo svg { width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round; }

.share-link-box { display:flex;align-items:center;gap:var(--s3);background:var(--bg-input);border:1px solid var(--line-mid);border-radius:var(--r-md);padding:11px var(--s4); }
.share-url { flex:1;font-size:.82rem;font-weight:500;color:var(--blue);overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.copy-btn { display:flex;align-items:center;gap:5px;font-size:.72rem;font-weight:700;padding:6px 12px;border-radius:var(--r-sm);background:var(--bg-3);border:1px solid var(--line-mid);color:var(--t-mid);cursor:pointer;transition:all .12s;white-space:nowrap;flex-shrink:0; }
.copy-btn:hover { background:var(--bg-hover);color:var(--t-hi); }
.copy-btn svg { width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round; }
.share-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:var(--s3); }
.share-ch { display:flex;flex-direction:column;align-items:center;gap:var(--s3);padding:var(--s5) var(--s4);background:var(--bg-3);border:1px solid var(--line);border-radius:var(--r-lg);cursor:pointer;transition:all .12s;text-align:center; }
.share-ch:hover { background:var(--bg-hover);border-color:var(--line-mid); }
.share-ch-ico { width:44px;height:44px;border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;font-size:20px; }
.share-ch-name { font-size:.78rem;font-weight:700;color:var(--t-hi); }
.share-ch-desc { font-size:.68rem;font-weight:500;color:var(--t-lo);line-height:1.4; }
.qr-share { display:flex;align-items:center;gap:var(--s6);padding:var(--s5);background:var(--bg-3);border:1px solid var(--line);border-radius:var(--r-lg); }
.qr-sf { width:84px;height:84px;background:white;border-radius:var(--r-md);padding:10px;flex-shrink:0; }
.qr-sf-i { width:100%;height:100%;background:repeating-conic-gradient(#000 0%,#000 25%,#fff 0%,#fff 50%) 0 0/6px 6px; }

.payout-hero-card { background:var(--bg-2);border:1px solid var(--line);border-radius:var(--r-xl);padding:var(--s7) var(--s6);display:flex;align-items:center;justify-content:space-between;gap:var(--s6); }
.payout-lbl { font-size:.68rem;font-weight:800;color:var(--t-lo);text-transform:uppercase;letter-spacing:.08em;margin-bottom:var(--s2); }
.payout-amt { font-family:var(--ff-d);font-size:2.5rem;font-weight:400;letter-spacing:-.06em;color:var(--t-hi);line-height:1;margin-bottom:var(--s3); }
.payout-sub { font-size:.76rem;font-weight:500;color:var(--t-lo); }
.withdraw-btn { display:flex;align-items:center;gap:var(--s2);background:var(--teal);color:white;font-size:.82rem;font-weight:700;padding:12px var(--s6);border-radius:var(--r-md);cursor:pointer;transition:opacity .12s;white-space:nowrap;flex-shrink:0; }
.withdraw-btn:hover { opacity:.88; }
.withdraw-btn svg { width:14px;height:14px;stroke:white;fill:none;stroke-width:2.2;stroke-linecap:round; }
.tx-row { display:flex;align-items:center;gap:var(--s4);padding:var(--s4) var(--s5);border-bottom:1px solid var(--line-soft); }
.tx-row:last-child { border-bottom:none; }
.tx-ico { width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.tx-ico.in { background:var(--teal-bg);border:1px solid var(--teal-border); }
.tx-ico.out { background:var(--red-bg);border:1px solid var(--red-border); }
.tx-ico svg { width:13px;height:13px;fill:none;stroke-width:2.5;stroke-linecap:round; }
.tx-ico.in svg { stroke:var(--teal); }
.tx-ico.out svg { stroke:var(--red); }
.tx-info { flex:1; }
.tx-name { font-size:.82rem;font-weight:600;color:var(--t-hi); }
.tx-date { font-size:.71rem;font-weight:500;color:var(--t-lo);margin-top:2px; }
.tx-amt { font-family:var(--ff-d);font-size:.96rem;letter-spacing:-.02em;font-weight:400;flex-shrink:0; }
.tx-amt.in { color:var(--teal); }
.tx-amt.out { color:var(--red); }

.danger-zone { background:var(--red-bg);border:1px solid var(--red-border);border-radius:var(--r-xl);overflow:hidden; }
.danger-head { padding:var(--s5) var(--s6);border-bottom:1px solid var(--red-border); }
.danger-head-title { font-size:.78rem;font-weight:800;color:var(--red);text-transform:uppercase;letter-spacing:.06em; }
.danger-head-desc { font-size:.76rem;font-weight:500;color:var(--t-lo);margin-top:4px;line-height:1.5; }
.danger-row { display:flex;align-items:center;justify-content:space-between;gap:var(--s4);padding:var(--s5) var(--s6);border-bottom:1px solid rgba(232,54,93,.12); }
.danger-row:last-child { border-bottom:none; }
.danger-rname { font-size:.84rem;font-weight:700;color:var(--t-hi); }
.danger-rdesc { font-size:.74rem;font-weight:500;color:var(--t-lo);margin-top:3px; }
.dbtn { font-size:.74rem;font-weight:700;padding:7px 14px;border-radius:var(--r-md);cursor:pointer;transition:opacity .12s;white-space:nowrap;flex-shrink:0; }
.dbtn:hover { opacity:.8; }
.dbtn.outline { background:transparent;border:1px solid var(--red-border);color:var(--red); }
.dbtn.fill { background:var(--red);color:white;border:1px solid transparent; }

/* ─────────────────────────────────────────
   EDIT MODE
───────────────────────────────────────── */
.edit-wrap { padding: var(--s8) 0 var(--s9); display: flex; justify-content: center; }
.edit-form { width: 100%; max-width: 680px; padding: 0 var(--s7); display: flex; flex-direction: column; gap: 0; }
.step-screen { display:none;flex-direction:column;gap:var(--s6); }
.step-screen.active { display:flex; }
.step-header { padding-bottom:var(--s6);border-bottom:1px solid var(--line);margin-bottom:var(--s6); }
.step-eyebrow { font-size:.64rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--pink);margin-bottom:var(--s2);display:flex;align-items:center;gap:var(--s2); }
.step-eyebrow svg { width:12px;height:12px;stroke:var(--pink);fill:none; }
.step-h1 { font-family:var(--ff-d);font-size:1.7rem;font-weight:400;color:var(--t-hi);letter-spacing:-.04em;line-height:1.15;margin-bottom:var(--s3); }
.step-h1 em { font-style:italic;color:var(--pink); }
.step-p { font-size:.82rem;color:var(--t-lo);font-weight:500;line-height:1.65; }
.form-card { background:var(--bg-2);border:1px solid var(--line);border-radius:var(--r-xl);overflow:hidden; }
.form-section { padding:var(--s6);border-bottom:1px solid var(--line-soft); }
.form-section:last-child { border-bottom:none; }
.fpill { display:inline-flex;align-items:center;gap:5px;font-size:.71rem;font-weight:700;padding:4px 10px;border-radius:var(--r-pill); }
.fpill.teal { background:var(--teal-bg);border:1px solid var(--teal-border);color:var(--teal); }
.fpill.pink { background:var(--pink-bg);border:1px solid var(--pink-border);color:var(--pink); }
.fpill svg { width:10px;height:10px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round; }
.map-ph { height:110px;background:var(--bg-3);border:1px solid var(--line);border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;gap:var(--s2);font-size:.78rem;font-weight:500;color:var(--t-lo); }
.map-ph svg { width:14px;height:14px;stroke:var(--t-lo);fill:none;stroke-width:1.8;stroke-linecap:round; }
.tkt-item { display:flex;align-items:center;gap:var(--s4);background:var(--bg-3);border:1px solid var(--line);border-radius:var(--r-lg);padding:var(--s4) var(--s5); }
.tkt-ico { width:36px;height:36px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0; }
.tkt-inf { flex:1;min-width:0; }
.tkt-item-name { font-size:.84rem;font-weight:700;color:var(--t-hi);margin-bottom:2px; }
.tkt-item-meta { font-size:.71rem;color:var(--t-lo);font-weight:500; }
.tkt-item-price { font-family:var(--ff-d);font-size:1rem;font-weight:400;color:var(--t-hi);letter-spacing:-.02em;flex-shrink:0; }
.reg-row { display:flex;align-items:center;gap:var(--s3);padding:var(--s3) 0;border-bottom:1px solid var(--line-soft); }
.reg-row:last-child { border-bottom:none; }
.reg-ico { width:30px;height:30px;border-radius:var(--r-sm);background:var(--bg-3);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0; }
.reg-inf { flex:1; }
.reg-name { font-size:.82rem;font-weight:600;color:var(--t-hi); }
.reg-desc { font-size:.7rem;color:var(--t-lo);margin-top:2px;font-weight:500; }
.reg-st { display:flex;align-items:center;gap:var(--s2);flex-shrink:0; }
.reg-badge { font-size:.62rem;font-weight:800;padding:3px 8px;border-radius:var(--r-pill);letter-spacing:.05em;text-transform:uppercase; }
.reg-badge.on { background:var(--teal-bg);border:1px solid var(--teal-border);color:var(--teal); }
.reg-badge.off { background:rgba(255,255,255,.04);border:1px solid var(--line);color:var(--t-lo); }
.reg-badge.req { background:var(--red-bg);border:1px solid var(--red-border);color:var(--red); }
.cover-display { width:100%;height:200px;border-radius:var(--r-lg);overflow:hidden;position:relative;margin-bottom:var(--s4); }
.cover-display img { width:100%;height:100%;object-fit:cover; }
.cover-display-ov { position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.6)); }
.cover-badge-pill { position:absolute;top:var(--s3);left:var(--s3);background:rgba(0,0,0,.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);border-radius:var(--r-pill);font-size:.62rem;font-weight:700;color:var(--t-mid);padding:3px 9px;z-index:2; }
.step-nav { display:flex;align-items:center;gap:var(--s3);padding-top:var(--s4); }
.snav-back { width:40px;height:40px;border-radius:var(--r-md);background:var(--bg-2);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .12s;flex-shrink:0; }
.snav-back:hover { background:var(--bg-hover); }
.snav-back svg { width:14px;height:14px;stroke:var(--t-mid);fill:none;stroke-width:1.8;stroke-linecap:round; }
.snav-next { flex:1;display:flex;align-items:center;justify-content:center;gap:var(--s2);background:var(--pink);color:white;font-size:.82rem;font-weight:700;padding:11px var(--s5);border-radius:var(--r-md);cursor:pointer;transition:opacity .12s; }
.snav-next:hover { opacity:.88; }
.snav-next svg { width:14px;height:14px;stroke:white;fill:none;stroke-width:2.5;stroke-linecap:round; }

.event-dashboard ::-webkit-scrollbar{width:4px;}
.event-dashboard ::-webkit-scrollbar-track{background:transparent;}
.event-dashboard ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:4px;}


.event-dashboard.light-mode {
  --bg: var(--color-bg, #f5f2ee);
  --bg-1: var(--color-surface, #fdfcfa);
  --bg-2: var(--color-surface, #fdfcfa);
  --bg-3: var(--color-tab-bg, #ede9e3);
  --bg-hover: color-mix(in srgb, var(--color-tab-bg, #ede9e3) 75%, var(--color-text, #0d0d0d));
  --bg-input: var(--color-surface, #fdfcfa);
  --line: var(--color-border, #e4ded7);
  --line-soft: color-mix(in srgb, var(--color-border, #e4ded7) 55%, transparent);
  --line-mid: color-mix(in srgb, var(--color-border, #e4ded7) 80%, var(--color-text, #0d0d0d));
  --t-hi: var(--color-text, #0d0d0d);
  --t-mid: var(--color-muted, #7a746e);
  --t-lo: color-mix(in srgb, var(--color-muted, #7a746e) 78%, transparent);
  --t-xlo: color-mix(in srgb, var(--color-muted, #7a746e) 42%, transparent);
}

.event-dashboard.light-mode .topbar {
  background: color-mix(in srgb, var(--color-surface, #fdfcfa) 95%, transparent);
}

.event-dashboard.light-mode .event-hero-overlay {
  background: linear-gradient(to bottom, rgba(245,242,238,.05) 0%, rgba(245,242,238,.54) 60%, var(--color-bg, #f5f2ee) 100%);
}

.event-dashboard.light-mode .stat-prog-track,
.event-dashboard.light-mode .tkt-prog-track,
.event-dashboard.light-mode .traffic-bar-track {
  background: color-mix(in srgb, var(--color-border, #e4ded7) 65%, transparent);
}

.event-dashboard.light-mode .sidebar-avatar {
  color: #ffffff;
}

.event-dashboard.light-mode .qr-frame,
.event-dashboard.light-mode .qr-sf {
  border: 1px solid var(--color-border, #e4ded7);
}

</style>

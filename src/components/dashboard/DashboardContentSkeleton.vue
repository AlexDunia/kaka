<script setup>
import { computed } from 'vue'

const props = defineProps({ view: { type: String, default: 'overview' } })
const page = computed(() => props.view === 'edit' ? 'edit-1' : props.view)
</script>

<template>
  <div class="dashboard-view-skeleton" :data-skeleton-view="page" aria-live="polite" aria-busy="true">
    <span class="sr-only">Loading dashboard content</span>

    <template v-if="page === 'overview'">
      <div class="sk sk-hero"><div class="sk hero-kicker"></div><div class="sk hero-title"></div><div class="sk hero-copy"></div><div class="sk hero-button"></div></div>
      <div class="sk-grid sk-grid-4 sk-stats">
        <div v-for="i in 4" :key="i" class="sk-card sk-stat"><div class="sk sk-label"></div><div class="sk sk-value"></div><div class="sk sk-line short"></div><div class="sk sk-mini-chart"></div></div>
      </div>
      <div class="sk-stack overview-detail-stack">
        <div class="sk-card sk-prompt"><div><div class="sk sk-card-title"></div><div class="sk sk-line medium"></div></div><div class="sk sk-button"></div></div>
        <div class="sk-card sk-ticket-card"><div class="sk-card-head"><div><div class="sk sk-card-title"></div><div class="sk sk-line medium"></div></div></div><div v-for="i in 3" :key="i" class="sk-row"><div class="sk sk-icon"></div><div class="sk-row-copy"><div class="sk sk-line medium"></div><div class="sk sk-line short"></div><div class="sk sk-track"></div></div><div class="sk sk-percent"></div></div></div>
        <div class="sk-grid sk-grid-2"><div v-for="i in 2" :key="i" class="sk-card sk-feature"><div class="sk sk-label"></div><div class="sk sk-card-title"></div><div v-for="j in 3" :key="j" class="sk-detail-row"><div class="sk sk-dot"></div><div><div class="sk sk-line long"></div><div class="sk sk-line medium"></div></div></div></div></div>
        <div class="sk-card sk-chart"><div class="sk-chart-head"><div><div class="sk sk-card-title"></div><div class="sk sk-line short"></div></div><div class="sk sk-pills"></div></div><div class="sk sk-chart-area"></div><div class="sk sk-line long"></div></div>
        <div class="sk-grid sk-grid-3"><div v-for="i in 3" :key="i" class="sk-card sk-mini-metric"><div class="sk sk-label"></div><div class="sk sk-value small"></div></div></div>
      </div>
    </template>

    <template v-else>
      <header class="sk-page-header"><div class="sk sk-eyebrow"></div><div class="sk sk-page-title"></div><div class="sk sk-page-copy"></div></header>

      <template v-if="page === 'attendees'">
        <div class="sk-grid sk-grid-3"><div v-for="i in 3" :key="i" class="sk-card sk-center-stat"><div class="sk sk-label"></div><div class="sk sk-value"></div></div></div>
        <div class="sk-card sk-table"><div class="sk-card-head"><div><div class="sk sk-card-title"></div><div class="sk sk-line medium"></div></div></div><div v-for="i in 4" :key="i" class="sk-person-row"><div class="sk sk-avatar"></div><div class="sk sk-person-name"></div><div class="sk sk-person-ticket"></div><div class="sk sk-badge"></div></div></div>
      </template>

      <template v-else-if="page === 'checkin'">
        <div class="sk-grid sk-grid-3"><div v-for="i in 3" :key="i" class="sk-card sk-center-stat"><div class="sk sk-label"></div><div class="sk sk-value"></div></div></div>
        <div class="sk-card sk-qr-card"><div class="sk sk-section-label"></div><div class="sk sk-qr"></div><div class="sk sk-line medium"></div><div class="sk-button-pair"><div class="sk sk-button"></div><div class="sk sk-button"></div></div></div>
        <div class="sk-card sk-table"><div class="sk sk-search"></div><div v-for="i in 5" :key="i" class="sk-person-row"><div class="sk sk-avatar"></div><div class="sk sk-person-name"></div><div class="sk sk-person-ticket"></div><div class="sk sk-badge"></div></div></div>
      </template>

      <template v-else-if="page === 'email'">
        <div class="sk sk-banner"></div>
        <div class="sk-card sk-compose"><div class="sk-field-row"><div class="sk sk-field-label"></div><div class="sk sk-recipient"></div></div><div class="sk-field-row"><div class="sk sk-field-label"></div><div class="sk sk-subject"></div></div><div class="sk-editor"><div v-for="i in 6" :key="i" class="sk sk-line" :class="i === 3 || i === 6 ? 'medium' : 'long'"></div></div><div class="sk-toolbar"><div class="sk sk-tool-group"></div><div class="sk sk-button"></div></div></div>
        <div class="sk-card sk-table"><div class="sk-card-head"><div class="sk sk-card-title"></div></div><div v-for="i in 2" :key="i" class="sk-campaign-row"><div class="sk sk-icon"></div><div class="sk-row-copy"><div class="sk sk-line medium"></div><div class="sk sk-line short"></div></div><div class="sk sk-campaign-stats"></div></div></div>
      </template>

      <template v-else-if="page === 'promo'">
        <div class="sk-grid sk-grid-3"><div v-for="i in 3" :key="i" class="sk-card sk-center-stat"><div class="sk sk-label"></div><div class="sk sk-value"></div></div></div>
        <div class="sk-card sk-promo-list"><div class="sk-card-head"><div class="sk sk-section-label"></div></div><div v-for="i in 3" :key="i" class="sk-promo-row"><div class="sk sk-dot"></div><div class="sk sk-code"></div><div class="sk-row-copy"><div class="sk sk-line medium"></div><div class="sk sk-line short"></div></div><div class="sk sk-usage"></div></div><div class="sk-card-head"><div class="sk sk-section-label"></div></div><div class="sk-promo-row faded"><div class="sk sk-dot"></div><div class="sk sk-code"></div><div class="sk-row-copy"><div class="sk sk-line medium"></div><div class="sk sk-line short"></div></div></div><div class="sk sk-add-action"></div></div>
      </template>

      <template v-else-if="page === 'share'">
        <div class="sk sk-banner"></div>
        <div class="sk-card sk-link-workspace"><div class="sk-workspace-head"><div><div class="sk sk-card-title wide"></div><div class="sk sk-line long"></div><div class="sk sk-line medium"></div></div><div class="sk sk-button"></div></div><div class="sk-grid sk-grid-3"><div v-for="i in 3" :key="i" class="sk sk-link-stat"></div></div><div v-for="i in 3" :key="i" class="sk-link-row"><div><div class="sk sk-line short"></div><div class="sk sk-line tiny"></div></div><div class="sk sk-url"></div><div class="sk sk-action-pair"></div></div><div class="sk sk-add-action"></div></div>
        <div class="sk-grid sk-grid-2"><div v-for="i in 2" :key="i" class="sk-card sk-feature"><div class="sk sk-card-title"></div><div class="sk sk-line medium"></div><div v-for="j in 3" :key="j" class="sk-row"><div class="sk sk-icon"></div><div class="sk-row-copy"><div class="sk sk-line medium"></div><div class="sk sk-track"></div></div></div></div></div>
        <div class="sk-card sk-share-grid-card"><div class="sk sk-section-label"></div><div class="sk sk-url-box"></div><div class="sk sk-section-label"></div><div class="sk-grid sk-grid-3"><div v-for="i in 6" :key="i" class="sk-channel"><div class="sk sk-icon"></div><div class="sk sk-line short"></div><div class="sk sk-line medium"></div></div></div></div>
        <div class="sk-card sk-qr-share"><div class="sk sk-qr small"></div><div><div class="sk sk-card-title"></div><div class="sk sk-line long"></div><div class="sk sk-line medium"></div><div class="sk sk-button"></div></div></div>
      </template>

      <template v-else-if="page === 'payout'">
        <div class="sk-card sk-payout-hero"><div><div class="sk sk-label"></div><div class="sk sk-money"></div><div class="sk sk-line medium"></div></div><div class="sk sk-button"></div></div>
        <div class="sk-card sk-bank-card"><div class="sk sk-section-label"></div><div class="sk-grid sk-grid-2"><div v-for="i in 2" :key="i" class="sk-field"><div class="sk sk-field-label"></div><div class="sk sk-input"></div></div></div><div class="sk-field"><div class="sk sk-field-label"></div><div class="sk sk-input"></div></div></div>
        <div class="sk-card sk-table"><div class="sk-card-head"><div class="sk sk-card-title"></div></div><div v-for="i in 4" :key="i" class="sk-transaction-row"><div class="sk sk-icon"></div><div class="sk-row-copy"><div class="sk sk-line medium"></div><div class="sk sk-line short"></div></div><div class="sk sk-amount"></div></div></div>
      </template>

      <template v-else-if="page === 'settings'">
        <div class="sk-card sk-settings-card"><div v-for="group in 2" :key="group" class="sk-settings-group"><div class="sk sk-section-label"></div><div v-for="i in 3" :key="i" class="sk-toggle-row"><div><div class="sk sk-line medium"></div><div class="sk sk-line long"></div></div><div class="sk sk-toggle"></div></div></div></div>
        <div class="sk-card sk-danger"><div class="sk-card-head"><div><div class="sk sk-card-title"></div><div class="sk sk-line medium"></div></div></div><div v-for="i in 3" :key="i" class="sk-danger-row"><div><div class="sk sk-line medium"></div><div class="sk sk-line long"></div></div><div class="sk sk-button small"></div></div></div>
      </template>

      <template v-else-if="page === 'insights'">
        <div class="sk-grid sk-grid-4"><div v-for="i in 4" :key="i" class="sk-card sk-stat"><div class="sk sk-label"></div><div class="sk sk-value"></div><div class="sk sk-line short"></div></div></div><div class="sk-card sk-chart"><div class="sk-chart-head"><div><div class="sk sk-card-title"></div><div class="sk sk-line short"></div></div><div class="sk sk-pills"></div></div><div class="sk sk-chart-area"></div></div>
      </template>

      <template v-else-if="page.startsWith('edit-')">
        <div class="sk-card sk-form-card">
          <template v-if="page === 'edit-1'"><div class="sk-form-section"><div class="sk-field"><div class="sk sk-field-label"></div><div class="sk sk-input"></div></div></div><div v-for="group in 3" :key="group" class="sk-form-section"><div class="sk sk-section-label"></div><div class="sk-grid sk-grid-2"><div v-for="i in 2" :key="i" class="sk-field"><div class="sk sk-field-label"></div><div class="sk sk-input"></div></div></div><div v-if="group === 2" class="sk sk-map"></div></div></template>
          <template v-else-if="page === 'edit-2'"><div class="sk-form-section"><div class="sk sk-section-label"></div><div class="sk sk-cover"></div><div class="sk sk-input"></div></div><div v-for="group in 3" :key="group" class="sk-form-section"><div class="sk sk-section-label"></div><div class="sk-field"><div class="sk sk-field-label"></div><div class="sk sk-textarea"></div></div></div></template>
          <template v-else-if="page === 'edit-3'"><div class="sk-form-section"><div class="sk-field"><div class="sk sk-field-label"></div><div class="sk sk-input"></div></div></div><div class="sk-form-section"><div class="sk sk-section-label"></div><div v-for="i in 4" :key="i" class="sk-ticket-row"><div class="sk sk-icon"></div><div class="sk-row-copy"><div class="sk sk-line medium"></div><div class="sk sk-line short"></div></div><div class="sk sk-amount"></div></div></div><div class="sk-form-section"><div class="sk sk-section-label"></div><div class="sk-grid sk-grid-2"><div v-for="i in 2" :key="i" class="sk-field"><div class="sk sk-field-label"></div><div class="sk sk-input"></div></div></div></div></template>
          <template v-else><div class="sk-form-section"><div class="sk sk-section-label"></div><div v-for="i in 5" :key="i" class="sk-registration-row"><div class="sk sk-icon"></div><div class="sk-row-copy"><div class="sk sk-line medium"></div><div class="sk sk-line short"></div></div><div class="sk sk-badge-pair"></div></div></div><div class="sk-form-section"><div class="sk sk-section-label"></div><div class="sk-field"><div class="sk sk-field-label"></div><div class="sk sk-input"></div></div><div class="sk-field"><div class="sk sk-field-label"></div><div class="sk sk-textarea"></div></div></div></template>
        </div>
        <div class="sk-form-nav"><div class="sk sk-nav-back"></div><div class="sk sk-button"></div></div>
      </template>
    </template>
  </div>
</template>

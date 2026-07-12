<script setup>
import DashboardAttendeesView from './DashboardAttendeesView.vue'
import DashboardCheckinView from './DashboardCheckinView.vue'
import DashboardEmailView from './DashboardEmailView.vue'
import DashboardEventHero from './DashboardEventHero.vue'
import DashboardInsightsView from './DashboardInsightsView.vue'
import DashboardOverviewView from './DashboardOverviewView.vue'
import DashboardPayoutView from './DashboardPayoutView.vue'
import DashboardPromoView from './DashboardPromoView.vue'
import DashboardSettingsView from './DashboardSettingsView.vue'
import DashboardShareView from './DashboardShareView.vue'
import DashboardStatStrip from './DashboardStatStrip.vue'

defineProps({
  currentManageView: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['select-view'])

const showManage = (view) => emit('select-view', view)
</script>

<template>
  <div class="manage-content" id="manage-content">
    <template v-if="currentManageView === 'overview'">
      <DashboardEventHero />
      <DashboardStatStrip />
      <DashboardOverviewView @select-view="showManage" />
    </template>

    <DashboardAttendeesView v-else-if="currentManageView === 'attendees'" />
    <DashboardInsightsView v-else-if="currentManageView === 'insights'" />
    <DashboardCheckinView v-else-if="currentManageView === 'checkin'" />
    <DashboardEmailView v-else-if="currentManageView === 'email'" />
    <DashboardPromoView v-else-if="currentManageView === 'promo'" />
    <DashboardShareView v-else-if="currentManageView === 'share'" @select-view="showManage" />
    <DashboardPayoutView v-else-if="currentManageView === 'payout'" />
    <DashboardSettingsView v-else-if="currentManageView === 'settings'" />
  </div>
</template>

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
  event: {
    type: Object,
    default: null,
  },
  overview: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  'select-view',
  'link-created',
  'refresh-overview',
])
</script>

<template>
  <div
    v-if="overview"
    class="manage-content"
    id="manage-content"
  >
    <template v-if="currentManageView === 'overview'">
      <DashboardEventHero :overview="overview" />
      <DashboardStatStrip :overview="overview" />
      <DashboardOverviewView
        :overview="overview"
        @select-view="$emit('select-view', $event)"
      />
    </template>

    <DashboardAttendeesView
      v-else-if="currentManageView === 'attendees'"
    />

    <DashboardInsightsView
      v-else-if="currentManageView === 'insights'"
      :overview="overview"
    />

    <DashboardCheckinView
      v-else-if="currentManageView === 'checkin'"
    />

    <DashboardEmailView
      v-else-if="currentManageView === 'email'"
    />

    <DashboardPromoView
      v-else-if="currentManageView === 'promo'"
    />

    <DashboardShareView
      v-else-if="currentManageView === 'share'"
      :event="event"
      :overview="overview"
      @select-view="$emit('select-view', $event)"
      @link-created="$emit('link-created', $event)"
      @refresh-overview="$emit('refresh-overview')"
    />

    <DashboardPayoutView
      v-else-if="currentManageView === 'payout'"
    />

    <DashboardSettingsView
      v-else-if="currentManageView === 'settings'"
    />
  </div>
</template>

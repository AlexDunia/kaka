<script setup>
import { computed, inject, ref } from 'vue'
import DashboardEditContent from '@/components/dashboard/DashboardEditContent.vue'
import DashboardManageContent from '@/components/dashboard/DashboardManageContent.vue'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar.vue'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar.vue'

const themeController = inject('themeController', null)
const theme = computed(() => themeController?.theme?.value || 'dark')
const dropdownOpen = ref(false)
const isEditMode = ref(false)
const currentStep = ref(1)
const currentManageView = ref('overview')
const pageBody = ref(null)

const scrollPageToTop = () => {
  pageBody.value?.scrollTo({ top: 0 })
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const enterEditMode = () => {
  isEditMode.value = true
  goToStep(1)
}

const exitEditMode = () => {
  isEditMode.value = false
  scrollPageToTop()
}

const goToStep = (step) => {
  currentStep.value = step
  scrollPageToTop()
}

const showManage = (key) => {
  currentManageView.value = key
  scrollPageToTop()
}

const goBack = () => {
  alert('Going back to My Events...')
}
</script>

<template>
  <div class="event-dashboard" :class="{ 'light-mode': theme === 'light' }">
    <DashboardSidebar
      :dropdown-open="dropdownOpen"
      :is-edit-mode="isEditMode"
      :current-manage-view="currentManageView"
      :current-step="currentStep"
      @toggle-dropdown="toggleDropdown"
      @go-back="goBack"
      @select-view="showManage"
      @select-step="goToStep"
    />

    <main class="main">
      <DashboardTopbar
        :is-edit-mode="isEditMode"
        :current-step="currentStep"
        @enter-edit-mode="enterEditMode"
        @exit-edit-mode="exitEditMode"
        @select-step="goToStep"
      />

      <div id="page-body" ref="pageBody" class="page-body">
        <DashboardManageContent
          v-show="!isEditMode"
          :current-manage-view="currentManageView"
          @select-view="showManage"
        />
        <DashboardEditContent
          v-show="isEditMode"
          :current-step="currentStep"
          @select-step="goToStep"
          @exit-edit-mode="exitEditMode"
        />
      </div>
    </main>
  </div>
</template>

<style>
@import '@/components/dashboard/eventDashboard.css';
</style>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import DashboardContentSkeleton from '@/components/dashboard/DashboardContentSkeleton.vue'
import DashboardEditContent from '@/components/dashboard/DashboardEditContent.vue'
import DashboardManageContent from '@/components/dashboard/DashboardManageContent.vue'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar.vue'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar.vue'

const dropdownOpen = ref(false)
const isEditMode = ref(false)
const currentStep = ref(1)
const currentManageView = ref('overview')
const pageBody = ref(null)
const isDashboardLoading = ref(true)
const loadingView = ref('overview')
const toast = ref(null)
let loadingToken = 0
let toastTimer = null

const scrollPageToTop = () => pageBody.value?.scrollTo({ top: 0 })
const toggleDropdown = () => { dropdownOpen.value = !dropdownOpen.value }
const getMinimumLoadingTime = () => {
  const rtt = Number(navigator.connection?.rtt) || 120
  return Math.min(1450, Math.max(1050, 900 + rtt))
}
const loadDashboardView = async (applyView) => {
  const token = ++loadingToken
  const startedAt = performance.now()
  isDashboardLoading.value = true
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  applyView()
  const remaining = Math.max(0, getMinimumLoadingTime() - (performance.now() - startedAt))
  window.setTimeout(() => { if (token === loadingToken) isDashboardLoading.value = false }, remaining)
}
const showSuccessToast = (message) => {
  window.clearTimeout(toastTimer)
  toast.value = { message, key: Date.now() }
  toastTimer = window.setTimeout(() => { toast.value = null }, 4200)
}
const enterEditMode = () => {
  loadingView.value = 'edit'
  loadDashboardView(() => { isEditMode.value = true; currentStep.value = 1; scrollPageToTop() })
}
const exitEditMode = () => { isEditMode.value = false; scrollPageToTop() }
const goToStep = (step) => {
  if (isEditMode.value && currentStep.value === step) return
  loadingView.value = `edit-${step}`
  loadDashboardView(() => { currentStep.value = step; scrollPageToTop() })
}
const showManage = (key) => {
  if (!isEditMode.value && currentManageView.value === key) return
  loadingView.value = key
  loadDashboardView(() => { isEditMode.value = false; currentManageView.value = key; scrollPageToTop() })
}
const goBack = () => alert('Going back to My Events...')

onMounted(() => loadDashboardView(() => {}))
onBeforeUnmount(() => { loadingToken += 1; window.clearTimeout(toastTimer) })
</script>

<template>
  <div class="event-dashboard">
    <DashboardSidebar :dropdown-open="dropdownOpen" :is-edit-mode="isEditMode" :current-manage-view="currentManageView" :current-step="currentStep" @toggle-dropdown="toggleDropdown" @go-back="goBack" @select-view="showManage" @select-step="goToStep" />
    <main class="main">
      <DashboardTopbar :is-edit-mode="isEditMode" :current-step="currentStep" @enter-edit-mode="enterEditMode" @exit-edit-mode="exitEditMode" @select-step="goToStep" />
      <div id="page-body" ref="pageBody" class="page-body">
        <DashboardContentSkeleton v-if="isDashboardLoading" :view="loadingView" />
        <DashboardManageContent v-else-if="!isEditMode" :current-manage-view="currentManageView" @select-view="showManage" @link-created="showSuccessToast" />
        <DashboardEditContent v-else :current-step="currentStep" @select-step="goToStep" @exit-edit-mode="exitEditMode" />
      </div>
    </main>
    <Transition name="dashboard-toast">
      <div v-if="toast" :key="toast.key" class="dashboard-success-toast" role="status" aria-live="polite">
        <span class="dashboard-success-toast__icon" aria-hidden="true">&#10003;</span>
        <div><strong>Link created successfully</strong><p>{{ toast.message }}</p></div>
        <span class="dashboard-success-toast__progress" aria-hidden="true"></span>
      </div>
    </Transition>
  </div>
</template>

<style>
@import '@/components/dashboard/eventDashboard.css';
@import '@/components/dashboard/dashboardLoading.css';
</style>

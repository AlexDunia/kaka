import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import reportService from '@/services/reportService'
import { useAuthStore } from './auth'

export const useReportStore = defineStore('reports', () => {
  // State
  const weeklyReport = ref(null)
  const categorySalesChart = ref(null)
  const revenueChartData = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Actions
  const fetchWeeklyReport = async () => {
    const authStore = useAuthStore()
    // Only admins can access reports
    if (!authStore.isAdmin) {
      error.value = 'Unauthorized'
      throw new Error('Admin privileges required')
    }

    loading.value = true
    error.value = null

    try {
      const report = await reportService.getWeeklyReport()
      weeklyReport.value = report
      return report
    } catch (err) {
      error.value = err.message || 'Failed to fetch weekly report'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCategorySalesChart = async () => {
    const authStore = useAuthStore()
    // Only admins can access reports
    if (!authStore.isAdmin) {
      error.value = 'Unauthorized'
      throw new Error('Admin privileges required')
    }

    loading.value = true
    error.value = null

    try {
      const chartData = await reportService.getCategorySalesChart()
      categorySalesChart.value = chartData
      return chartData
    } catch (err) {
      error.value = err.message || 'Failed to fetch category sales chart'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchRevenueChartData = async () => {
    const authStore = useAuthStore()
    // Only admins can access reports
    if (!authStore.isAdmin) {
      error.value = 'Unauthorized'
      throw new Error('Admin privileges required')
    }

    loading.value = true
    error.value = null

    try {
      const chartData = await reportService.getRevenueChartData()
      revenueChartData.value = chartData
      return chartData
    } catch (err) {
      error.value = err.message || 'Failed to fetch revenue chart data'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed properties
  const hasReports = computed(() => !!weeklyReport.value)

  const formattedTotalRevenue = computed(() => {
    if (!weeklyReport.value) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(weeklyReport.value.totalRevenue)
  })

  const lowStockEvents = computed(() => {
    if (!weeklyReport.value) return []
    return weeklyReport.value.lowStockEvents
  })

  const upcomingEvents = computed(() => {
    if (!weeklyReport.value) return []
    return weeklyReport.value.upcomingEvents
  })

  return {
    weeklyReport,
    categorySalesChart,
    revenueChartData,
    loading,
    error,
    hasReports,
    formattedTotalRevenue,
    lowStockEvents,
    upcomingEvents,
    fetchWeeklyReport,
    fetchCategorySalesChart,
    fetchRevenueChartData,
  }
})
 
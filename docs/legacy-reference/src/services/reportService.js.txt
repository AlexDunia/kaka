import eventService from './eventService'
import purchaseService from './purchaseService'

// Generate weekly report data
const getWeeklyReport = () => {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Get all purchases
  const purchases = purchaseService.getAllPurchases()

  // Filter by last week
  const weeklyPurchases = purchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.purchaseDate)
    return purchaseDate >= oneWeekAgo && purchaseDate <= now && purchase.status === 'confirmed'
  })

  // Calculate daily sales for the week
  const dailySales = {}
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateString = date.toISOString().split('T')[0]
    dailySales[dateString] = {
      date: dateString,
      revenue: 0,
      tickets: 0,
    }
  }

  weeklyPurchases.forEach((purchase) => {
    const dateString = new Date(purchase.purchaseDate).toISOString().split('T')[0]
    if (dailySales[dateString]) {
      dailySales[dateString].revenue += purchase.totalPrice
      dailySales[dateString].tickets += purchase.quantity
    }
  })

  // Sort by date
  const dailySalesArray = Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date))

  // Get top selling events for the week
  const weeklyEventSales = {}
  weeklyPurchases.forEach((purchase) => {
    if (!weeklyEventSales[purchase.eventId]) {
      weeklyEventSales[purchase.eventId] = {
        eventId: purchase.eventId,
        eventTitle: purchase.eventTitle,
        quantity: 0,
        revenue: 0,
      }
    }
    weeklyEventSales[purchase.eventId].quantity += purchase.quantity
    weeklyEventSales[purchase.eventId].revenue += purchase.totalPrice
  })

  const topSellingEvents = Object.values(weeklyEventSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  // Calculate total weekly stats
  const totalRevenue = weeklyPurchases.reduce((sum, p) => sum + p.totalPrice, 0)
  const totalTickets = weeklyPurchases.reduce((sum, p) => sum + p.quantity, 0)

  // Get upcoming events
  const events = eventService.getAllEvents()
  const upcomingEvents = events
    .filter((event) => new Date(event.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)

  // Get low stock events (less than 10% available)
  const lowStockEvents = events
    .filter((event) => {
      return (
        event.availableTickets > 0 &&
        event.availableTickets < event.totalTickets * 0.1 &&
        new Date(event.date) > now
      )
    })
    .sort((a, b) => a.availableTickets / a.totalTickets - b.availableTickets / b.totalTickets)
    .slice(0, 5)

  return {
    periodStart: oneWeekAgo.toISOString(),
    periodEnd: now.toISOString(),
    dailySales: dailySalesArray,
    topSellingEvents,
    totalRevenue,
    totalTickets,
    totalPurchases: weeklyPurchases.length,
    upcomingEvents,
    lowStockEvents,
  }
}

// Generate chart data for sales by category
const getCategorySalesChart = () => {
  const stats = purchaseService.getPurchaseStats()

  return {
    labels: Object.keys(stats.salesByCategory),
    datasets: [
      {
        label: 'Tickets Sold',
        data: Object.values(stats.salesByCategory),
        backgroundColor: [
          '#e84393', // Primary pink from our theme
          '#a29bfe',
          '#74b9ff',
          '#55efc4',
          '#ffeaa7',
          '#fab1a0',
        ],
      },
    ],
  }
}

// Generate revenue chart data (last 30 days)
const getRevenueChartData = () => {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Get all purchases
  const purchases = purchaseService.getAllPurchases()

  // Filter by last 30 days
  const recentPurchases = purchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.purchaseDate)
    return purchaseDate >= thirtyDaysAgo && purchase.status === 'confirmed'
  })

  // Prepare data for last 30 days
  const dailyRevenue = {}
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateString = date.toISOString().split('T')[0]
    dailyRevenue[dateString] = 0
  }

  // Calculate revenue for each day
  recentPurchases.forEach((purchase) => {
    const dateString = new Date(purchase.purchaseDate).toISOString().split('T')[0]
    if (dailyRevenue[dateString] !== undefined) {
      dailyRevenue[dateString] += purchase.totalPrice
    }
  })

  // Convert to arrays for chart
  const dates = Object.keys(dailyRevenue).sort()
  const revenues = dates.map((date) => dailyRevenue[date])

  return {
    labels: dates,
    datasets: [
      {
        label: 'Daily Revenue',
        data: revenues,
        borderColor: '#e84393',
        backgroundColor: 'rgba(232, 67, 147, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  }
}

export default {
  getWeeklyReport,
  getCategorySalesChart,
  getRevenueChartData,
}
 
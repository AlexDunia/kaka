import { v4 as uuidv4 } from 'uuid'
import eventService from './eventService'

const PURCHASES_KEY = 'purchases'

// Initialize purchases storage
const initializeStorage = () => {
  const purchases = localStorage.getItem(PURCHASES_KEY)
  if (!purchases) {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify([]))
  }
}

// Get all purchases
const getAllPurchases = () => {
  initializeStorage()
  return JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]')
}

// Get purchases by user ID
const getPurchasesByUser = (userId) => {
  const purchases = getAllPurchases()
  return purchases.filter((purchase) => purchase.userId === userId)
}

// Create a new purchase
const createPurchase = async (purchaseData) => {
  const { eventId, userId, quantity } = purchaseData

  // Get the event
  const event = eventService.getEventById(eventId)
  if (!event) {
    throw new Error('Event not found')
  }

  // Check if tickets are available
  if (event.availableTickets < quantity) {
    throw new Error('Not enough tickets available')
  }

  // Create the purchase
  const purchase = {
    id: uuidv4(),
    eventId,
    userId,
    eventTitle: event.title,
    eventDate: event.date,
    eventLocation: event.location,
    quantity,
    pricePerTicket: event.price,
    totalPrice: event.price * quantity,
    purchaseDate: new Date().toISOString(),
    status: 'confirmed',
  }

  // Update available tickets
  eventService.updateEvent(eventId, {
    availableTickets: event.availableTickets - quantity,
  })

  // Save the purchase
  const purchases = getAllPurchases()
  purchases.push(purchase)
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases))

  return purchase
}

// Cancel a purchase
const cancelPurchase = async (purchaseId, userId) => {
  const purchases = getAllPurchases()
  const purchaseIndex = purchases.findIndex((p) => p.id === purchaseId && p.userId === userId)

  if (purchaseIndex === -1) {
    throw new Error('Purchase not found')
  }

  const purchase = purchases[purchaseIndex]

  // Can only cancel if status is confirmed
  if (purchase.status !== 'confirmed') {
    throw new Error('Cannot cancel this purchase')
  }

  // Update purchase status
  purchase.status = 'cancelled'
  purchase.cancelDate = new Date().toISOString()
  purchases[purchaseIndex] = purchase

  // Return tickets to available pool
  const event = eventService.getEventById(purchase.eventId)
  if (event) {
    eventService.updateEvent(purchase.eventId, {
      availableTickets: event.availableTickets + purchase.quantity,
    })
  }

  // Save updated purchases
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases))

  return purchase
}

// Get purchase statistics (for admin)
const getPurchaseStats = () => {
  const purchases = getAllPurchases()
  const events = eventService.getAllEvents()

  // Calculate total revenue
  const totalRevenue = purchases.reduce((sum, purchase) => {
    return purchase.status === 'confirmed' ? sum + purchase.totalPrice : sum
  }, 0)

  // Calculate ticket sales by category
  const salesByCategory = {}
  events.forEach((event) => {
    salesByCategory[event.category] = 0
  })

  purchases.forEach((purchase) => {
    if (purchase.status === 'confirmed') {
      const event = events.find((e) => e.id === purchase.eventId)
      if (event) {
        salesByCategory[event.category] += purchase.quantity
      }
    }
  })

  // Calculate top selling events
  const salesByEvent = {}
  purchases.forEach((purchase) => {
    if (purchase.status === 'confirmed') {
      if (!salesByEvent[purchase.eventId]) {
        salesByEvent[purchase.eventId] = {
          eventId: purchase.eventId,
          eventTitle: purchase.eventTitle,
          quantity: 0,
          revenue: 0,
        }
      }
      salesByEvent[purchase.eventId].quantity += purchase.quantity
      salesByEvent[purchase.eventId].revenue += purchase.totalPrice
    }
  })

  const topSellingEvents = Object.values(salesByEvent)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return {
    totalRevenue,
    totalTicketsSold: purchases.reduce(
      (sum, p) => (p.status === 'confirmed' ? sum + p.quantity : sum),
      0,
    ),
    totalPurchases: purchases.filter((p) => p.status === 'confirmed').length,
    salesByCategory,
    topSellingEvents,
  }
}

export default {
  getAllPurchases,
  getPurchasesByUser,
  createPurchase,
  cancelPurchase,
  getPurchaseStats,
}
 
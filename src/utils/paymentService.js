/**
 * Payment service utility functions for interacting with the backend
 */

import axios from 'axios'

/**
 * Verify a Paystack payment with the backend
 * @param {string} reference - The payment reference from Paystack
 * @returns {Promise<Object>} The verification result
 */
export async function verifyPayment(reference) {
  try {
    const response = await axios.post('/api/verify-payment', { reference })
    return response.data
  } catch {
    throw new Error('Payment verification failed')
  }
}

/**
 * Save tickets to local storage
 * @param {Array} tickets - Array of ticket objects to save
 */
export function saveTicketsToLocalStorage(tickets) {
  try {
    localStorage.setItem('savedTickets', JSON.stringify(tickets))
  } catch {
    throw new Error('Failed to save tickets')
  }
}

/**
 * Get saved tickets from local storage
 * @returns {Array} Array of saved ticket objects
 */
export function getTicketsFromLocalStorage() {
  try {
    const tickets = localStorage.getItem('savedTickets')
    return tickets ? JSON.parse(tickets) : []
  } catch {
    return []
  }
}

/**
 * Parse and validate a payment amount
 * @param {string|number} amount - The amount to parse
 * @returns {number} The parsed amount in the smallest currency unit
 * @throws {Error} If the amount is invalid
 */
export function parseAmount(amount) {
  const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    throw new Error('Invalid payment amount')
  }
  return Math.round(parsedAmount * 100)
}

/**
 * Process successful payment verification and return ticket data
 * @param {Object} verificationData - Data returned from payment verification
 * @returns {Object} Processed payment data with tickets
 */
export const processPaymentSuccess = (verificationData) => {
  if (!verificationData || verificationData.status !== 'success') {
    throw new Error('Payment verification failed')
  }

  return {
    reference: verificationData.data.reference,
    amount: verificationData.data.amount,
    currency: verificationData.data.currency,
    email: verificationData.data.email,
    date: verificationData.data.date,
    tickets: verificationData.data.tickets || [],
  }
}

/**
 * Save ticket data locally for offline access
 * @param {Object} ticketData - The ticket data to save
 */
export const saveTicketsLocally = (ticketData) => {
  if (!ticketData || !ticketData.tickets || !ticketData.tickets.length) {
    return
  }

  localStorage.setItem('userTickets', JSON.stringify(ticketData))
}

/**
 * Get saved tickets from local storage
 * @returns {Array} Array of saved tickets or empty array if none
 */
export const getSavedTickets = () => {
  const savedData = localStorage.getItem('userTickets')
  if (!savedData) {
    return []
  }

  try {
    const parsed = JSON.parse(savedData)
    return parsed.tickets || []
  } catch (error) {
    return []
  }
}

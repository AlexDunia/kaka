/**
 * Payment service utility functions for interacting with the backend
 */

/**
 * Verify a Paystack payment with the backend
 * @param {string} reference - The Paystack payment reference
 * @returns {Promise} Promise that resolves with the verification result
 */
export const verifyPaystackPayment = async (reference) => {
  try {
    // Replace with your actual backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost/your-backend-path'

    const response = await fetch(`${backendUrl}/verify-payment.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference }),
    })

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw error
  }
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
  const savedTickets = localStorage.getItem('savedTickets')
  if (!savedTickets) return []

  try {
    return JSON.parse(savedTickets)
  } catch {
    return []
  }
}

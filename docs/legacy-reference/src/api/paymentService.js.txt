/**
 * Payment service for handling Paystack payments
 */
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.yourdomain.com'

/**
 * Verify a Paystack transaction server-side
 * @param {string} reference - The payment reference
 * @returns {Promise} - Payment verification result
 */
export async function verifyPaystackPayment(reference) {
  try {
    // In a real implementation, this should call your backend API
    // which uses the Paystack private key to verify the transaction
    const response = await axios.post(`${API_URL}/api/verify-payment`, { reference })

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Payment verification failed')
    }

    return response.data
  } catch (error) {
    console.error('Payment verification error:', error)
    throw new Error(error.response?.data?.message || 'Failed to verify payment. Please try again.')
  }
}

/**
 * Process order after payment is verified
 * @param {Object} orderData - Order data including customer information and cart items
 * @param {string} reference - The payment reference
 * @returns {Promise} - Order processing result
 */
export async function processOrder(orderData, reference) {
  try {
    // In a real implementation, this should call your backend API
    // to create the order after payment verification
    const response = await axios.post(`${API_URL}/api/orders`, {
      ...orderData,
      paymentReference: reference,
    })

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || 'Order processing failed')
    }

    return response.data
  } catch (error) {
    console.error('Order processing error:', error)
    throw new Error(
      error.response?.data?.message || 'Failed to process order. Please contact support.',
    )
  }
}

import axios from 'axios'

const API_URL = 'http://localhost:8080/api/payment'

const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {}
}

const PaymentService = {
  async getRazorpayKey() {
    const response = await axios.get(`${API_URL}/key`, { headers: getHeaders() })
    return response.data
  },

  async createRazorpayOrder(userId, customerName, shippingAddress) {
    const response = await axios.post(
      `${API_URL}/create-order`,
      { userId, customerName, shippingAddress },
      { headers: getHeaders() }
    )
    return response.data
  },

  async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId) {
    const response = await axios.post(
      `${API_URL}/verify`,
      { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId },
      { headers: getHeaders() }
    )
    return response.data
  }
}

export default PaymentService

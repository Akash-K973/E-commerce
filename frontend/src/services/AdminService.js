import axios from 'axios'

const API_URL = 'http://localhost:8080/api/admin'

const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {}
}

const AdminService = {
  async getAllUsers() {
    const response = await axios.get(`${API_URL}/users`, { headers: getHeaders() })
    return response.data
  },

  async updateUserRole(userId, role) {
    const response = await axios.put(`${API_URL}/users/${userId}/role`, { role }, { headers: getHeaders() })
    return response.data
  },

  async deleteUser(userId) {
    const response = await axios.delete(`${API_URL}/users/${userId}`, { headers: getHeaders() })
    return response.data
  },

  async getAllVendors() {
    const response = await axios.get(`${API_URL}/vendors`, { headers: getHeaders() })
    return response.data
  },

  async updateVendorStatus(vendorId, status) {
    const response = await axios.put(`${API_URL}/vendors/${vendorId}/status`, { status }, { headers: getHeaders() })
    return response.data
  },

  async getPlatformStats() {
    const response = await axios.get(`${API_URL}/stats`, { headers: getHeaders() })
    return response.data
  }
}

export default AdminService

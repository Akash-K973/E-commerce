import axios from 'axios'

const API_URL = 'http://localhost:8080/api/products'

const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {}
}

const ProductService = {
  async getAllProducts(search = '', category = '') {
    const params = {}
    if (search) params.search = search
    if (category && category !== 'ALL') params.category = category
    const response = await axios.get(API_URL, { params, headers: getHeaders() })
    return response.data
  },

  async getProductById(id) {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getHeaders() })
    return response.data
  },

  async getVendorProducts(vendorId) {
    const response = await axios.get(`${API_URL}/vendor/${vendorId}`, { headers: getHeaders() })
    return response.data
  },

  async createProduct(productData) {
    const response = await axios.post(API_URL, productData, { headers: getHeaders() })
    return response.data
  },

  async updateProduct(id, productData) {
    const response = await axios.put(`${API_URL}/${id}`, productData, { headers: getHeaders() })
    return response.data
  },

  async deleteProduct(id) {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getHeaders() })
    return response.data
  }
}

export default ProductService

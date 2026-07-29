import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

const AuthService = {
  async register(username, email, password) {
    const response = await api.post('/auth/register', { username, email, password })
    return response.data
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data))
    }
    return response.data
  },

  logout() {
    localStorage.removeItem('user')
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null')
  },

  isLoggedIn() {
    const user = this.getCurrentUser()
    return !!user?.token
  },
}

export default AuthService

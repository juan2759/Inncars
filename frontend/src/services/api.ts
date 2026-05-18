import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authApi = {
  login: (username: string, password: string) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    return api.post('/auth/login', form)
  },
  me: () => api.get('/auth/me'),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),
  listUsers: () => api.get('/auth/users'),
  createUser: (data: object) => api.post('/auth/users', data),
  deleteUser: (id: number) => api.delete(`/auth/users/${id}`),
}

// Vehicles
export const vehiclesApi = {
  list: (params?: object) => api.get('/vehicles', { params }),
  get: (id: number) => api.get(`/vehicles/${id}`),
  create: (data: object) => api.post('/vehicles', data),
  update: (id: number, data: object) => api.put(`/vehicles/${id}`, data),
  delete: (id: number) => api.delete(`/vehicles/${id}`),
  priceHistory: (id: number) => api.get(`/vehicles/${id}/price-history`),
  uploadPhoto: (id: number, file: File, isMain = false) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('is_main', String(isMain))
    return api.post(`/vehicles/${id}/photos`, fd)
  },
  deletePhoto: (vehicleId: number, photoId: number) =>
    api.delete(`/vehicles/${vehicleId}/photos/${photoId}`),
  setMainPhoto: (vehicleId: number, photoId: number) =>
    api.put(`/vehicles/${vehicleId}/photos/${photoId}/main`),
}

// Customers
export const customersApi = {
  list: (params?: object) => api.get('/customers', { params }),
  get: (id: number) => api.get(`/customers/${id}`),
  create: (data: object) => api.post('/customers', data),
  update: (id: number, data: object) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
  addInteraction: (id: number, data: object) => api.post(`/customers/${id}/interactions`, data),
  deleteInteraction: (customerId: number, interactionId: number) =>
    api.delete(`/customers/${customerId}/interactions/${interactionId}`),
  addReminder: (id: number, data: object) => api.post(`/customers/${id}/reminders`, data),
  completeReminder: (customerId: number, reminderId: number) =>
    api.put(`/customers/${customerId}/reminders/${reminderId}/complete`),
}

// Sales
export const salesApi = {
  list: (params?: object) => api.get('/sales', { params }),
  get: (id: number) => api.get(`/sales/${id}`),
  create: (data: object) => api.post('/sales', data),
  update: (id: number, data: object) => api.put(`/sales/${id}`, data),
  delete: (id: number) => api.delete(`/sales/${id}`),
  dailyStats: (fecha?: string) => api.get('/sales/stats/daily', { params: fecha ? { fecha } : {} }),
  pdf: (id: number) => `/api/pdf/sale/${id}`,
}

// Workshop
export const workshopApi = {
  list: (params?: object) => api.get('/workshop', { params }),
  get: (id: number) => api.get(`/workshop/${id}`),
  create: (data: object) => api.post('/workshop', data),
  update: (id: number, data: object) => api.put(`/workshop/${id}`, data),
  delete: (id: number) => api.delete(`/workshop/${id}`),
  addItem: (id: number, data: object) => api.post(`/workshop/${id}/items`, data),
  deleteItem: (woId: number, itemId: number) => api.delete(`/workshop/${woId}/items/${itemId}`),
  pdf: (id: number) => `/api/pdf/workorder/${id}`,
}

// Reports
export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  salesByPeriod: (params?: object) => api.get('/reports/sales-by-period', { params }),
  exportSales: (params?: object) => {
    const token = localStorage.getItem('token')
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    window.open(`/api/reports/export/sales${qs}`)
  },
  exportStock: () => window.open('/api/reports/export/stock'),
}

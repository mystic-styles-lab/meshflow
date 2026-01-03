import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth API
export const auth = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  checkAuth: () => api.get('/auth/check'),
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword })
};

// Proxies API
export const proxies = {
  getAll: () => api.get('/proxies'),
  create: (data) => api.post('/proxies', data),
  update: (id, data) => api.put(`/proxies/${id}`, data),
  delete: (id) => api.delete(`/proxies/${id}`),
  toggle: (id, enabled) => api.post(`/proxies/${id}/toggle`, { enabled }),
  test: (id) => api.post(`/proxies/${id}/test`)
};

// Stats API
export const stats = {
  get: () => api.get('/stats')
};

export default api;

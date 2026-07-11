import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ──────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/admin/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

// ─── Dashboard ─────────────────────────────────────────────────────────
export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getRevenue: (from: string, to: string, groupBy = 'day') =>
    api.get('/reports/revenue', { params: { from, to, groupBy } }),
  getBookings: (from: string, to: string) =>
    api.get('/reports/bookings', { params: { from, to } }),
  getWorkers: (from: string, to: string) =>
    api.get('/reports/workers', { params: { from, to } }),
  getCustomers: (from: string, to: string) =>
    api.get('/reports/customers', { params: { from, to } }),
};

// ─── Customers ─────────────────────────────────────────────────────────
export const customersApi = {
  list: (search?: string, page = 1, limit = 20) =>
    api.get('/admin/customers', { params: { search, page, limit } }),
  get: (id: string) => api.get(`/admin/customers/${id}`),
  block: (id: string, isBlocked: boolean) =>
    api.put(`/admin/customers/${id}/block`, { isBlocked }),
};

// ─── Workers ───────────────────────────────────────────────────────────
export const workersApi = {
  list: (status?: string, search?: string, page = 1, limit = 20) =>
    api.get('/admin/workers', { params: { status, search, page, limit } }),
  get: (id: string) => api.get(`/admin/workers/${id}`),
  updateStatus: (id: string, status: string) =>
    api.put(`/admin/workers/${id}/status`, { status }),
  verifyDoc: (docId: string, isVerified: boolean) =>
    api.put(`/admin/workers/documents/${docId}/verify`, { isVerified }),
};

// ─── Bookings ──────────────────────────────────────────────────────────
export const bookingsApi = {
  list: (status?: string, page = 1, limit = 20) =>
    api.get('/admin/bookings', { params: { status, page, limit } }),
  assignWorker: (id: string, workerId: string) =>
    api.put(`/admin/bookings/${id}/assign`, { workerId }),
  cancel: (id: string, reason: string) =>
    api.put(`/admin/bookings/${id}/cancel`, { reason }),
};

// ─── Payments ──────────────────────────────────────────────────────────
export const paymentsApi = {
  list: (status?: string, page = 1, limit = 20) =>
    api.get('/admin/payments', { params: { status, page, limit } }),
  workerWallets: (page = 1, limit = 20) =>
    api.get('/admin/payments/worker-wallets', { params: { page, limit } }),
};

// ─── Upload ────────────────────────────────────────────────────────────
export const uploadApi = {
  single: (file: File, folder: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/single?folder=${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Categories ────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get('/categories?all=true'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  remove: (id: string) => api.delete(`/categories/${id}`),
};

// ─── Services ──────────────────────────────────────────────────────────
export const servicesApi = {
  list: (categoryId?: string, search?: string) =>
    api.get('/services', { params: { categoryId, search } }),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.put(`/services/${id}`, data),
  remove: (id: string) => api.delete(`/services/${id}`),
};

// ─── Coupons ───────────────────────────────────────────────────────────
export const couponsApi = {
  list: (page = 1, limit = 20) => api.get('/coupons', { params: { page, limit } }),
  create: (data: any) => api.post('/coupons', data),
  update: (id: string, data: any) => api.put(`/coupons/${id}`, data),
  remove: (id: string) => api.delete(`/coupons/${id}`),
};

// ─── Notifications ─────────────────────────────────────────────────────
export const notificationsApi = {
  sendBulk: (data: { title: string; body: string; type: string; targetRole?: string }) =>
    api.post('/notifications/send-bulk', data),
};

// ─── Support ───────────────────────────────────────────────────────────
export const supportApi = {
  list: (status?: string, page = 1, limit = 20) =>
    api.get('/support/admin/tickets', { params: { status, page, limit } }),
  get: (id: string) => api.get(`/support/tickets/${id}`),
  reply: (id: string, message: string) => api.post(`/support/tickets/${id}/reply`, { message }),
  resolve: (id: string) => api.put(`/support/admin/tickets/${id}/resolve`),
  close: (id: string) => api.put(`/support/admin/tickets/${id}/close`),
};

// ─── Settings ──────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => api.get('/admin/settings'),
  update: (settings: Record<string, string>) => api.put('/admin/settings', settings),
};

// ─── Banners ───────────────────────────────────────────────────────────
export const bannersApi = {
  list: () => api.get('/admin/banners?all=true'),
  create: (data: any) => api.post('/admin/banners', data),
  update: (id: string, data: any) => api.put(`/admin/banners/${id}`, data),
  remove: (id: string) => api.delete(`/admin/banners/${id}`),
};

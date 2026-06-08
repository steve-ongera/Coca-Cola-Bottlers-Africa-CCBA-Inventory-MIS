import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ─── Axios Instance ──────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  refresh: (refresh) => api.post('/auth/refresh/', { refresh }),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
};

// ─── Profile ─────────────────────────────────────────────────────────────────

export const profileAPI = {
  get: () => api.get('/profile/'),
  update: (data) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => v !== undefined && form.append(k, v));
    return api.patch('/profile/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (data) => api.post('/profile/change-password/', data),
};

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoryAPI = {
  list: (params) => api.get('/categories/', { params }),
  get: (id) => api.get(`/categories/${id}/`),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.patch(`/categories/${id}/`, data),
  delete: (id) => api.delete(`/categories/${id}/`),
};

// ─── Products ────────────────────────────────────────────────────────────────

export const productAPI = {
  list: (params) => api.get('/products/', { params }),
  get: (id) => api.get(`/products/${id}/`),
  create: (data) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => v !== undefined && v !== null && form.append(k, v));
    return api.post('/products/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: (id, data) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => v !== undefined && v !== null && form.append(k, v));
    return api.patch(`/products/${id}/`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  delete: (id) => api.delete(`/products/${id}/`),
  lowStock: () => api.get('/products/low_stock/'),
  outOfStock: () => api.get('/products/out_of_stock/'),
};

// ─── Suppliers ───────────────────────────────────────────────────────────────

export const supplierAPI = {
  list: (params) => api.get('/suppliers/', { params }),
  get: (id) => api.get(`/suppliers/${id}/`),
  create: (data) => api.post('/suppliers/', data),
  update: (id, data) => api.patch(`/suppliers/${id}/`, data),
  delete: (id) => api.delete(`/suppliers/${id}/`),
};

// ─── Customers ───────────────────────────────────────────────────────────────

export const customerAPI = {
  list: (params) => api.get('/customers/', { params }),
  get: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.patch(`/customers/${id}/`, data),
  delete: (id) => api.delete(`/customers/${id}/`),
};

// ─── Purchases ───────────────────────────────────────────────────────────────

export const purchaseAPI = {
  list: (params) => api.get('/purchases/', { params }),
  get: (id) => api.get(`/purchases/${id}/`),
  create: (data) => api.post('/purchases/', data),
  update: (id, data) => api.patch(`/purchases/${id}/`, data),
};

// ─── Sales ───────────────────────────────────────────────────────────────────

export const saleAPI = {
  list: (params) => api.get('/sales/', { params }),
  get: (id) => api.get(`/sales/${id}/`),
  create: (data) => api.post('/sales/', data),
  update: (id, data) => api.patch(`/sales/${id}/`, data),
};

// ─── Stock Adjustments ───────────────────────────────────────────────────────

export const adjustmentAPI = {
  list: (params) => api.get('/adjustments/', { params }),
  create: (data) => api.post('/adjustments/', data),
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export const reportAPI = {
  dashboard: () => api.get('/reports/dashboard/'),
  salesTrend: (params) => api.get('/reports/sales-trend/', { params }),
  topProducts: (params) => api.get('/reports/top-products/', { params }),
  lowStock: () => api.get('/reports/low-stock/'),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const userAPI = {
  list: (params) => api.get('/users/', { params }),
  get: (id) => api.get(`/users/${id}/`),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
};

export default api;
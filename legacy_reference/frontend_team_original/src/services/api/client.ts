import axios from 'axios';
import { getTenantId, getToken } from '../auth/session';

export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: any) => {
  const token = getToken();
  const tenantId = getTenantId();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId;
  }
  return config;
});

export default api;

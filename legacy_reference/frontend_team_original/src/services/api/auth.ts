import { AuthResponse, CurrentUser } from '../../types/api';
import {
  clearCurrentChecklistKey,
  clearCurrentUserId,
  clearTenantId,
  getTenantId,
  setCurrentChecklistKey,
  setCurrentUserId,
  setHasCompletedChecklist,
  setTenantId,
  setToken,
  setUserRole,
} from '../auth/session';
import { getItem, setItem } from '../storage';
import api, { API_BASE } from './client';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password });
  const data = response.data;
  setToken(data.token);
  const tenantId = data.user?.tenantId;
  if (tenantId) {
    setTenantId(tenantId);
  } else {
    clearTenantId();
  }
  const role = data.user?.role || 'user';
  setUserRole(role);
  if (data.user?.id) {
    const checklistKey = `checklist:${data.user.id}`;
    setCurrentChecklistKey(checklistKey);
    setCurrentUserId(data.user.id);
    const savedStatus = getItem(checklistKey);
    setHasCompletedChecklist(savedStatus === 'true');
  } else {
    clearCurrentChecklistKey();
    clearCurrentUserId();
    setHasCompletedChecklist(false);
  }
  return data;
};

export const register = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  tenantId: string,
  role?: string
): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', { email, password, firstName, lastName, tenantId, role });
  const data = response.data;
  setToken(data.token);
  setTenantId(tenantId);
  const roleToStore = data.user?.role || role || 'user';
  setUserRole(roleToStore);
  if (data.user?.id) {
    const checklistKey = `checklist:${data.user.id}`;
    setCurrentChecklistKey(checklistKey);
    setCurrentUserId(data.user.id);
    setItem(checklistKey, 'false');
  }
  setHasCompletedChecklist(false);
  return data;
};

export const forgotPassword = async (email: string): Promise<any> => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string): Promise<any> => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

export const getCurrentUser = async (): Promise<CurrentUser> => {
  const response = await api.get('/auth/me');
  return response.data.user;
};

export const initiateGoogleAuth = (tenantIdParam?: string, returnUrl: string = '/dashboard'): string => {
  const resolvedTenantId = tenantIdParam || getTenantId() || '';
  return `${API_BASE}/auth/google?tenantId=${encodeURIComponent(resolvedTenantId)}&returnUrl=${encodeURIComponent(returnUrl)}`;
};

export const exchangeGoogleToken = async (code: string, tenantId: string): Promise<any> => {
  const response = await api.post('/auth/google/token', { code, tenantId });
  return response.data;
};

export const refreshGoogleToken = async (refreshToken: string): Promise<any> => {
  const response = await api.post('/auth/google/refresh', { refreshToken });
  return response.data;
};

export const revokeGoogleAccess = async (): Promise<any> => {
  const response = await api.delete('/auth/google/revoke');
  return response.data;
};

export const getGoogleCalendarEvents = async (maxResults: number = 10): Promise<any> => {
  const response = await api.get(`/auth/google/calendar?maxResults=${maxResults}`);
  return response.data;
};

export const getGoogleDriveFiles = async (maxResults: number = 10): Promise<any> => {
  const response = await api.get(`/auth/google/drive?maxResults=${maxResults}`);
  return response.data;
};

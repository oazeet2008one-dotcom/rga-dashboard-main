import { getItem, setItem, removeItem } from '../storage';

export const SESSION_STORAGE_KEYS = {
  token: 'token',
  tenantId: 'tenantId',
  userRole: 'userRole',
  currentChecklistKey: 'currentChecklistKey',
  currentUserId: 'currentUserId',
  hasCompletedChecklist: 'hasCompletedChecklist',
  rgaProfileAvatar: 'rga_profile_avatar',
  dashboardBranding: 'dashboardBranding',
  dashboardSettings: 'dashboardSettings',
} as const;

export const getToken = (): string | null => getItem(SESSION_STORAGE_KEYS.token);

export const setToken = (token: string): void => {
  setItem(SESSION_STORAGE_KEYS.token, token);
};

export const clearToken = (): void => {
  removeItem(SESSION_STORAGE_KEYS.token);
};

export const getTenantId = (): string | null => getItem(SESSION_STORAGE_KEYS.tenantId);

export const setTenantId = (tenantId: string): void => {
  setItem(SESSION_STORAGE_KEYS.tenantId, tenantId);
};

export const clearTenantId = (): void => {
  removeItem(SESSION_STORAGE_KEYS.tenantId);
};

export const getUserRole = (): string | null => getItem(SESSION_STORAGE_KEYS.userRole);

export const setUserRole = (role: string): void => {
  setItem(SESSION_STORAGE_KEYS.userRole, role);
};

export const getCurrentChecklistKey = (): string | null => getItem(SESSION_STORAGE_KEYS.currentChecklistKey);

export const setCurrentChecklistKey = (key: string): void => {
  setItem(SESSION_STORAGE_KEYS.currentChecklistKey, key);
};

export const clearCurrentChecklistKey = (): void => {
  removeItem(SESSION_STORAGE_KEYS.currentChecklistKey);
};

export const getCurrentUserId = (): string | null => getItem(SESSION_STORAGE_KEYS.currentUserId);

export const setCurrentUserId = (userId: string): void => {
  setItem(SESSION_STORAGE_KEYS.currentUserId, userId);
};

export const clearCurrentUserId = (): void => {
  removeItem(SESSION_STORAGE_KEYS.currentUserId);
};

export const getHasCompletedChecklist = (): boolean => {
  return getItem(SESSION_STORAGE_KEYS.hasCompletedChecklist) === 'true';
};

export const setHasCompletedChecklist = (value: boolean): void => {
  setItem(SESSION_STORAGE_KEYS.hasCompletedChecklist, value ? 'true' : 'false');
};

export const clearHasCompletedChecklist = (): void => {
  removeItem(SESSION_STORAGE_KEYS.hasCompletedChecklist);
};

export const clearSession = (): void => {
  clearToken();
  clearTenantId();
};

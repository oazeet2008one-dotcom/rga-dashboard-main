// FLOW START: RBAC Constants (EN)
// จุดเริ่มต้น: ค่าคงที่ RBAC (TH)

export type Role = 'super_admin' | 'admin_full' | 'admin_mess' | 'manager' | 'viewer';

export const ROLES: Role[] = ['super_admin', 'admin_full', 'admin_mess', 'manager', 'viewer'];

export const PERMISSIONS = {
  manage_system: 'manage_system',
  manage_admins: 'manage_admins',
  view_system_history: 'view_system_history',
  view_admin_history: 'view_admin_history',
  view_user_history: 'view_user_history',
  export_logs: 'export_logs',
  manage_users: 'manage_users',
  manage_alerts: 'manage_alerts',
  manage_integrations: 'manage_integrations',
  manage_tenants: 'manage_tenants',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const map: Record<Role, Permission[]> = {
  super_admin: [
    PERMISSIONS.manage_system,
    PERMISSIONS.manage_admins,
    PERMISSIONS.view_system_history,
    PERMISSIONS.view_admin_history,
    PERMISSIONS.view_user_history,
    PERMISSIONS.export_logs,
    PERMISSIONS.manage_users,
    PERMISSIONS.manage_alerts,
    PERMISSIONS.manage_integrations,
    PERMISSIONS.manage_tenants,
  ],
  admin_full: [
    PERMISSIONS.view_admin_history,
    PERMISSIONS.view_user_history,
    PERMISSIONS.export_logs,
    PERMISSIONS.manage_users,
    PERMISSIONS.manage_alerts,
    PERMISSIONS.manage_integrations,
    PERMISSIONS.manage_tenants,
  ],
  admin_mess: [
    PERMISSIONS.view_user_history,
    PERMISSIONS.export_logs,
    PERMISSIONS.manage_users,
    PERMISSIONS.manage_alerts,
    PERMISSIONS.manage_integrations,
  ],
  manager: [PERMISSIONS.view_user_history, PERMISSIONS.manage_users, PERMISSIONS.manage_alerts],
  viewer: [],
};

export const getRolePermissions = (role?: string): Permission[] => {
  if (!role) return [];
  return map[role as Role] || [];
};

// FLOW END: RBAC Constants (EN)
// จุดสิ้นสุด: ค่าคงที่ RBAC (TH)

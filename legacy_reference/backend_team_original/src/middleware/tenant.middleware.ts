import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { getRolePermissions, type Permission } from '../constants/rbac';

// FLOW START: Tenant Middleware (EN)
// จุดเริ่มต้น: Middleware จัดการ Tenant (TH)

export interface TenantRequest extends Request {
  tenantId?: string;
  userId?: string;
  userRole?: string;
}

export const tenantMiddleware = (req: TenantRequest, _res: Response, next: NextFunction) => {
  // Resolve tenantId
  // Priority:
  // 1) tenantId already set on req (e.g. by authenticate)
  // 2) if Bearer token exists, derive tenantId from JWT (prevents spoofing)
  //    - allow super_admin to override with explicit x-tenant-id/body.tenantId
  // 3) fall back to x-tenant-id/body.tenantId (legacy)

  const headerTenantId = (req.headers['x-tenant-id'] as string) || undefined;
  const bodyTenantId = (req.body?.tenantId as string) || undefined;
  const explicitTenantId = (headerTenantId || bodyTenantId)?.toString();

  const authHeader = req.headers.authorization;
  const hasBearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ');

  let tenantId = req.tenantId;

  if (!tenantId && hasBearer) {
    const token = (authHeader as string).substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const tokenTenantId = decoded?.tenantId ? String(decoded.tenantId) : undefined;
      const tokenRole = decoded?.role ? String(decoded.role) : undefined;

      if (tokenTenantId) {
        if (explicitTenantId && explicitTenantId !== tokenTenantId) {
          if (tokenRole === 'super_admin') {
            tenantId = explicitTenantId;
          } else {
            return next(new AppError('Tenant ID mismatch', 403));
          }
        } else {
          tenantId = tokenTenantId;
        }
      }
    } catch {
      return next(new AppError('Invalid token', 401));
    }
  }

  if (!tenantId) {
    tenantId = explicitTenantId;
  }

  if (!tenantId) {
    return next(new AppError('Tenant ID is required', 400));
  }

  // Add tenant ID to request
  req.tenantId = tenantId;

  next();
};

export const requireRole = (roles: string[]) => {
  return (req: TenantRequest, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};

export const selfOrRoles = (paramKey: string, roles: string[]) => {
  return (req: TenantRequest, _res: Response, next: NextFunction) => {
    const targetId = req.params?.[paramKey];
    if (targetId && req.userId === targetId) return next();
    if (req.userRole && roles.includes(req.userRole)) return next();
    return next(new AppError('Insufficient permissions', 403));
  };
};

export const requireAnyRole = (roles: string[]) => {
  return (req: TenantRequest, _res: Response, next: NextFunction) => {
    if (req.userRole && roles.includes(req.userRole)) return next();
    return next(new AppError('Insufficient permissions', 403));
  };
};

export const requirePermission = (perm: Permission) => {
  return (req: TenantRequest, _res: Response, next: NextFunction) => {
    const perms = getRolePermissions(req.userRole);
    if (perms.includes(perm)) return next();
    return next(new AppError('Insufficient permissions', 403));
  };
};

// FLOW END: Tenant Middleware (EN)
// จุดสิ้นสุด: Middleware จัดการ Tenant (TH)

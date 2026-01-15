import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { TenantRequest } from '../middleware/tenant.middleware';
import { AppError } from '../middleware/error.middleware';
import { getRolePermissions, PERMISSIONS } from '../constants/rbac';

// FLOW START: History Controller (EN)
// จุดเริ่มต้น: Controller ของ History (TH)

const buildWhere = (req: TenantRequest, scope: 'system' | 'admin' | 'users' | 'me') => {
  const { startDate, endDate, userId, action, entityType } = (req.query || {}) as any;
  const where: any = {};

  // Date range
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Filters
  if (action) where.action = String(action);
  if (entityType) where.entityType = String(entityType);

  const rolePerms = getRolePermissions(req.userRole);

  if (scope === 'system') {
    // super_admin only; no tenant filter
    return where;
  }

  if (scope === 'admin') {
    // admin activities across tenants allowed for super_admin; otherwise restrict by tenant
    if (!rolePerms.includes(PERMISSIONS.view_admin_history)) throw new AppError('Forbidden', 403);
    if (req.userRole !== 'super_admin') where.tenantId = req.tenantId;
    return where;
  }

  if (scope === 'users') {
    // user activities; restrict by tenant unless super_admin
    if (!rolePerms.includes(PERMISSIONS.view_user_history)) throw new AppError('Forbidden', 403);
    if (req.userRole !== 'super_admin') where.tenantId = req.tenantId;
    if (userId) where.userId = String(userId);
    return where;
  }

  // me
  where.userId = req.userId;
  return where;
};

const getPagination = (req: TenantRequest) => {
  const q = (req.query || {}) as any;
  const take = Math.max(1, Math.min(500, Number(q.limit ?? 200)));
  const skip = Math.max(0, Number(q.offset ?? 0));
  return { take, skip };
};

export const getSystemHistory = async (req: TenantRequest, res: Response) => {
  if (req.userRole !== 'super_admin') throw new AppError('Forbidden', 403);
  const where = buildWhere(req, 'system');
  const { take, skip } = getPagination(req);
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ]);
  res.json({ items, total });
};

export const getAdminHistory = async (req: TenantRequest, res: Response) => {
  const where = buildWhere(req, 'admin');
  const { take, skip } = getPagination(req);
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ]);
  res.json({ items, total });
};

export const getUsersHistory = async (req: TenantRequest, res: Response) => {
  const where = buildWhere(req, 'users');
  const { take, skip } = getPagination(req);
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ]);
  res.json({ items, total });
};

export const getMyHistory = async (req: TenantRequest, res: Response) => {
  const where = buildWhere(req, 'me');
  const { take, skip } = getPagination(req);
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ]);
  res.json({ items, total });
};

export const exportHistory = async (req: TenantRequest, res: Response) => {
  const perms = getRolePermissions(req.userRole);
  if (!perms.includes(PERMISSIONS.export_logs)) throw new AppError('Forbidden', 403);

  const requestedScope = String(((req.query || {}) as any).scope || 'users') as
    | 'system'
    | 'admin'
    | 'users'
    | 'me';

  // Enforce that the caller can export only scopes they are allowed to view.
  if (requestedScope === 'system' && req.userRole !== 'super_admin') {
    throw new AppError('Forbidden', 403);
  }
  if (requestedScope === 'admin' && !perms.includes(PERMISSIONS.view_admin_history)) {
    throw new AppError('Forbidden', 403);
  }
  if (requestedScope === 'users' && !perms.includes(PERMISSIONS.view_user_history)) {
    throw new AppError('Forbidden', 403);
  }

  const where = buildWhere(req, requestedScope);
  const items = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  // Export as CSV (simple)
  const headers = [
    'id',
    'tenantId',
    'userId',
    'action',
    'entityType',
    'entityId',
    'ipAddress',
    'userAgent',
    'createdAt',
  ];
  const lines = [headers.join(',')];
  for (const it of items as any[]) {
    lines.push(
      [
        it.id,
        it.tenantId,
        it.userId,
        it.action,
        it.entityType,
        it.entityId,
        it.ipAddress || '',
        it.userAgent || '',
        it.createdAt.toISOString(),
      ]
        .map((v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
  }
  const csv = lines.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="history.csv"');
  res.send(csv);
};

// FLOW END: History Controller (EN)
// จุดสิ้นสุด: Controller ของ History (TH)

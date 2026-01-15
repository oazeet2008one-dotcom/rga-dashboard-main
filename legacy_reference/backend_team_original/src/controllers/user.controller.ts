import { Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { TenantRequest } from '../middleware/tenant.middleware';

// FLOW START: Users Controller (EN)
// จุดเริ่มต้น: Controller ของ Users (TH)

const sanitizeUser = (u: any) => {
  if (!u) return u;
  const { passwordHash: _passwordHash, ...rest } = u;
  return rest;
};

const canAssignRole = (actorRole: string | undefined, targetRole: string): boolean => {
  // Default: no permissions
  if (!actorRole) return false;

  // Super admin can assign anything
  if (actorRole === 'super_admin') return true;

  // Admin full can assign anything except super_admin
  if (actorRole === 'admin_full') {
    return targetRole !== 'super_admin';
  }

  // Admin mess can assign manager/viewer only
  if (actorRole === 'admin_mess') {
    return targetRole === 'manager' || targetRole === 'viewer';
  }

  // Manager can assign viewer only
  if (actorRole === 'manager') {
    return targetRole === 'viewer';
  }

  // Viewer cannot assign roles
  return false;
};

const canManageTarget = (actorRole: string | undefined, targetRole: string): boolean => {
  if (!actorRole) return false;
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin_full') return targetRole !== 'super_admin';
  if (actorRole === 'admin_mess') return targetRole === 'manager' || targetRole === 'viewer';
  if (actorRole === 'manager') return targetRole === 'viewer';
  return false;
};

const buildListUsersVisibilityWhere = (actorRole: string | undefined, actorUserId: string | undefined) => {
  if (!actorRole) return { id: actorUserId || '__none__' };
  if (actorRole === 'super_admin') return {};
  if (actorRole === 'admin_full') {
    return { role: { in: ['admin_full', 'admin_mess', 'manager', 'viewer'] } };
  }
  if (actorRole === 'admin_mess') {
    return {
      OR: [{ id: actorUserId || '__none__' }, { role: { in: ['manager', 'viewer'] } }],
    };
  }
  if (actorRole === 'manager') {
    return {
      OR: [{ id: actorUserId || '__none__' }, { role: 'viewer' }],
    };
  }
  return { id: actorUserId || '__none__' };
};

const canViewTarget = (actorRole: string | undefined, actorUserId: string | undefined, targetUser: any): boolean => {
  if (!targetUser) return false;
  if (actorUserId && targetUser.id === actorUserId) return true;
  if (!actorRole) return false;
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin_full') return targetUser.role !== 'super_admin';
  if (actorRole === 'admin_mess') return targetUser.role === 'manager' || targetUser.role === 'viewer';
  if (actorRole === 'manager') return targetUser.role === 'viewer';
  return false;
};

export const listUsers = async (req: TenantRequest, res: Response) => {
  const { page = 1, limit = 20, search, role, isActive } = req.query;

  // Build where clause
  const where: any = { tenantId: req.tenantId! };

  const visibilityWhere = buildListUsersVisibilityWhere(req.userRole, req.userId);
  if (Object.keys(visibilityWhere).length) {
    where.AND = [...(where.AND || []), visibilityWhere];
  }

  if (search) {
    where.OR = [
      { email: { contains: search as string, mode: 'insensitive' } },
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role as string;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        sessions: { select: { id: true, lastActivityAt: true } },
        reports: { select: { id: true } },
        aiQueries: { select: { id: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users: users.map(sanitizeUser),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

export const getUserById = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findFirst({
    where: { id, tenantId: req.tenantId! },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      sessions: true,
    },
  });
  if (!user) throw new AppError('User not found', 404);

  if (!canViewTarget(req.userRole, req.userId, user)) {
    throw new AppError('Insufficient permissions', 403);
  }
  res.json({ user: sanitizeUser(user) });
};

export const createUser = async (req: TenantRequest, res: Response) => {
  const { email, password, firstName, lastName, role } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const exists = await prisma.user.findFirst({ where: { email, tenantId: req.tenantId! } });
  if (exists) throw new AppError('User already exists', 409);

  const passwordHash = await bcrypt.hash(password, 10);

  const desiredRole = (role || 'viewer') as string;
  if (!canAssignRole(req.userRole, desiredRole)) {
    throw new AppError('Insufficient permissions', 403);
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: desiredRole,
      tenantId: req.tenantId!,
      emailVerified: true,
    },
  });

  res.status(201).json({ user: sanitizeUser(user) });
};

export const updateUser = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { password, ...rest } = req.body || {};

  const data: any = { ...rest };

  // Self-update guard: users can update their own profile, but cannot self-escalate privileges
  const isSelf = Boolean(req.userId && req.userId === id);
  if (isSelf) {
    delete data.role;
    delete data.tenantId;
    delete data.isActive;
    delete data.emailVerified;
    delete data.adminType;
  }

  if (typeof data.role === 'string' && data.role.trim()) {
    if (!canAssignRole(req.userRole, data.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
  }
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findFirst({ where: { id, tenantId: req.tenantId! } });
  if (!existing) throw new AppError('User not found', 404);

  if (!isSelf && !canManageTarget(req.userRole, existing.role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  const user = await prisma.user.update({ where: { id }, data });
  res.json({ user: sanitizeUser(user) });
};

export const deleteUser = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.user.findFirst({ where: { id, tenantId: req.tenantId! } });
  if (!existing) throw new AppError('User not found', 404);

  if (!canManageTarget(req.userRole, existing.role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  const deleted = await prisma.user.deleteMany({ where: { id, tenantId: req.tenantId! } });
  if (!deleted.count) throw new AppError('User not found', 404);
  res.json({ message: 'User deleted' });
};

export const changePassword = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword) throw new AppError('New password required', 400);

  if (req.userId === id && !currentPassword) {
    throw new AppError('Current password required', 400);
  }

  const user = await prisma.user.findFirst({ where: { id, tenantId: req.tenantId! } });
  if (!user) throw new AppError('User not found', 404);
  if (currentPassword) {
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new AppError('Current password incorrect', 401);
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  res.json({ message: 'Password updated' });
};

// FLOW END: Users Controller (EN)
// จุดสิ้นสุด: Controller ของ Users (TH)

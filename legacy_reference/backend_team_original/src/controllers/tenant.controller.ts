import { Response } from 'express';
import bcrypt from 'bcrypt';
import { TenantRequest } from '../middleware/tenant.middleware';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';

// FLOW START: Tenant Controller (EN)
// จุดเริ่มต้น: Controller ของ Tenant (TH)

export const getTenants = async (_req: TenantRequest, res: Response) => {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      createdAt: true,
    },
  });

  res.json({ tenants });
};

export const getTenantById = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  res.json({ tenant });
};

export const updateTenant = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const tenant = await prisma.tenant.update({
    where: { id },
    data: req.body,
  });

  res.json({ tenant });
};

export const getTenantUsers = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const users = await prisma.user.findMany({
    where: { tenantId: id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.json({ users });
};

export const createUser = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const { email, password, firstName, lastName, role } = req.body;

  // Check if user exists
  const existing = await prisma.user.findFirst({
    where: { email, tenantId: id },
  });

  if (existing) {
    throw new AppError('User already exists', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      tenantId: id,
    },
  });

  res.status(201).json({ user });
};

export const updateUser = async (req: TenantRequest, res: Response) => {
  const { id, userId } = req.params;

  const user = await prisma.user.updateMany({
    where: { id: userId, tenantId: id },
    data: req.body,
  });

  res.json({ user });
};

export const deleteUser = async (req: TenantRequest, res: Response) => {
  const { id, userId } = req.params;

  await prisma.user.updateMany({
    where: { id: userId, tenantId: id },
    data: { deletedAt: new Date(), isActive: false },
  });

  res.json({ message: 'User deleted successfully' });
};

// FLOW END: Tenant Controller (EN)
// จุดสิ้นสุด: Controller ของ Tenant (TH)

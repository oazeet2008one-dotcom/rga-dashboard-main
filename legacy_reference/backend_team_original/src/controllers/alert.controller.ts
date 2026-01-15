import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';

// FLOW START: Alerts Controller (EN)
// จุดเริ่มต้น: Controller ของ Alerts (TH)

export const getAlerts = async (req: TenantRequest, res: Response) => {
  const alerts = await prisma.alert.findMany({
    where: { tenantId: req.tenantId! },
    include: { campaign: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ alerts });
};

export const getAlertById = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const alert = await prisma.alert.findFirst({
    where: { id, tenantId: req.tenantId! },
    include: { campaign: true },
  });

  if (!alert) {
    throw new AppError('Alert not found', 404);
  }

  res.json({ alert });
};

export const createAlert = async (req: TenantRequest, res: Response) => {
  const alert = await prisma.alert.create({
    data: {
      ...req.body,
      tenantId: req.tenantId!,
    },
  });

  res.status(201).json({ alert });
};

export const updateAlert = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const alert = await prisma.alert.updateMany({
    where: { id, tenantId: req.tenantId! },
    data: req.body,
  });

  res.json({ alert });
};

export const deleteAlert = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  await prisma.alert.deleteMany({
    where: { id, tenantId: req.tenantId! },
  });

  res.json({ message: 'Alert deleted successfully' });
};

export const getAlertHistory = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const history = await prisma.alertHistory.findMany({
    where: { alertId: id, tenantId: req.tenantId! },
    orderBy: { triggeredAt: 'desc' },
    take: 100,
  });

  res.json({ history });
};

// FLOW END: Alerts Controller (EN)
// จุดสิ้นสุด: Controller ของ Alerts (TH)

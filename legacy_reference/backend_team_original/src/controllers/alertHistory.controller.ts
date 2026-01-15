import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { TenantRequest } from '../middleware/tenant.middleware';

// FLOW START: Alert History Controller (EN)
// จุดเริ่มต้น: Controller ของ Alert History (TH)

export const listAlertHistory = async (req: TenantRequest, res: Response) => {
  const history = await prisma.alertHistory.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: { triggeredAt: 'desc' },
    include: {
      alert: {
        select: {
          id: true,
          name: true,
          alertType: true,
          metric: true,
          operator: true,
          threshold: true,
          campaign: { select: { id: true, name: true } },
        },
      },
      tenant: { select: { id: true, name: true, slug: true } },
    },
    take: 200,
  });
  res.json({ history });
};

export const getAlertHistoryById = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const item = await prisma.alertHistory.findFirst({
    where: { id, tenantId: req.tenantId! },
    include: {
      alert: {
        select: {
          id: true,
          name: true,
          alertType: true,
          metric: true,
          operator: true,
          threshold: true,
          campaign: { select: { id: true, name: true } },
        },
      },
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!item) throw new AppError('Alert history not found', 404);
  res.json({ history: item });
};

export const createAlertHistory = async (req: TenantRequest, res: Response) => {
  const { alertId, metricValue, thresholdValue, message, metadata, notificationSent } =
    req.body || {};
  if (!alertId) throw new AppError('alertId is required', 400);

  // Ensure alert belongs to this tenant
  const alert = await prisma.alert.findFirst({ where: { id: alertId, tenantId: req.tenantId! } });
  if (!alert) throw new AppError('Alert not found for this tenant', 404);

  const item = await prisma.alertHistory.create({
    data: {
      alertId,
      tenantId: req.tenantId!,
      metricValue,
      thresholdValue,
      message,
      metadata,
      notificationSent: !!notificationSent,
      notificationSentAt: notificationSent ? new Date() : null,
    },
  });
  res.status(201).json({ history: item });
};

export const deleteAlertHistory = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const item = await prisma.alertHistory.findUnique({ where: { id } });
  if (!item || item.tenantId !== req.tenantId) throw new AppError('Not found', 404);
  await prisma.alertHistory.delete({ where: { id } });
  res.json({ message: 'Alert history deleted' });
};

// FLOW END: Alert History Controller (EN)
// จุดสิ้นสุด: Controller ของ Alert History (TH)

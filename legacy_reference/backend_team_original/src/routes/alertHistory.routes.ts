import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import * as controller from '../controllers/alertHistory.controller';
import { requireRole } from '../middleware/tenant.middleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.middleware';

// FLOW START: Alert History Routes (EN)
// จุดเริ่มต้น: Routes ของ Alert History (TH)

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(controller.listAlertHistory));

router.get(
  '/:id',
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(controller.getAlertHistoryById),
);

router.post(
  '/',
  requireRole(['super_admin', 'admin_full', 'admin_mess', 'manager']),
  body('alertId').isString().notEmpty(),
  body('metricValue').optional().isNumeric(),
  body('thresholdValue').optional().isNumeric(),
  body('message').optional().isString(),
  body('notificationSent').optional().isBoolean(),
  validate,
  asyncHandler(controller.createAlertHistory),
);

router.delete(
  '/:id',
  requireRole(['super_admin', 'admin_full', 'admin_mess', 'manager']),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(controller.deleteAlertHistory),
);

// FLOW END: Alert History Routes (EN)
// จุดสิ้นสุด: Routes ของ Alert History (TH)

export default router;

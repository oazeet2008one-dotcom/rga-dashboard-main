import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import * as history from '../controllers/history.controller';
import { requirePermission } from '../middleware/tenant.middleware';
import { PERMISSIONS } from '../constants/rbac';
import { query } from 'express-validator';
import { validate } from '../middleware/validate.middleware';

// FLOW START: History Routes (EN)
// จุดเริ่มต้น: Routes ของ History (TH)

const router = Router();

router.use(authenticate);

const filters = [
  query('scope').optional().isIn(['system', 'admin', 'users', 'me']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('userId').optional().isString(),
  query('action').optional().isString(),
  query('entityType').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  query('offset').optional().isInt({ min: 0 }),
  validate,
];

// System history (super_admin only via permission)
router.get(
  '/system',
  requirePermission(PERMISSIONS.view_system_history),
  filters,
  asyncHandler(history.getSystemHistory),
);

// Admin activity history
router.get(
  '/admin',
  requirePermission(PERMISSIONS.view_admin_history),
  filters,
  asyncHandler(history.getAdminHistory),
);

// Users activity history (by tenant unless super_admin)
router.get(
  '/users',
  requirePermission(PERMISSIONS.view_user_history),
  filters,
  asyncHandler(history.getUsersHistory),
);

// Personal history
router.get('/me', filters, asyncHandler(history.getMyHistory));

// Export logs (CSV)
router.get(
  '/export',
  requirePermission(PERMISSIONS.export_logs),
  filters,
  asyncHandler(history.exportHistory),
);

// FLOW END: History Routes (EN)
// จุดสิ้นสุด: Routes ของ History (TH)

export default router;

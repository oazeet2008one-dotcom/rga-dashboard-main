import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  getIntegrations,
  getIntegrationNotifications,
  getIntegrationById,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  syncIntegration,
  syncAllIntegrations,
  testIntegration,
  getSyncHistory,
} from '../controllers/integration.controller';
import { requirePermission } from '../middleware/tenant.middleware';
import { PERMISSIONS } from '../constants/rbac';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import * as oauthController from '../controllers/oauth.controller';

// FLOW START: Integrations Routes (EN)
// จุดเริ่มต้น: Routes ของ Integrations (TH)

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getIntegrations));
router.get('/notifications', asyncHandler(getIntegrationNotifications));
router.get(
  '/sync-history',
  requirePermission(PERMISSIONS.manage_integrations),
  query('platform').optional().isString(),
  query('status').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('offset').optional().isInt({ min: 0 }),
  validate,
  asyncHandler(getSyncHistory),
);
router.get('/:id', asyncHandler(getIntegrationById));

router.post(
  '/',
  requirePermission(PERMISSIONS.manage_integrations),
  body().custom((value: any) => {
    const provider = value?.provider;
    const type = value?.type;
    if (typeof provider === 'string' && provider.trim()) return true;
    if (typeof type === 'string' && type.trim()) return true;
    throw new Error('provider or type is required');
  }),
  body('provider').optional().isString().notEmpty(),
  body('type').optional().isString().notEmpty(),
  body('name').optional().isString().notEmpty(),
  body('credentials').optional(),
  body('config').optional(),
  validate,
  asyncHandler(createIntegration),
);

router.put(
  '/:id',
  requirePermission(PERMISSIONS.manage_integrations),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(updateIntegration),
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.manage_integrations),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(deleteIntegration),
);

router.post(
  '/sync-all',
  requirePermission(PERMISSIONS.manage_integrations),
  body('providers').optional().isArray(),
  validate,
  asyncHandler(syncAllIntegrations),
);

router.post(
  '/:id/sync',
  requirePermission(PERMISSIONS.manage_integrations),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(syncIntegration),
);

router.post(
  '/:id/test',
  requirePermission(PERMISSIONS.manage_integrations),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(testIntegration),
);

// OAuth endpoints
router.post(
  '/:id/oauth/start',
  requirePermission(PERMISSIONS.manage_integrations),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(oauthController.startOAuth),
);

router.get(
  '/:id/oauth/callback',
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(oauthController.handleCallback),
);

router.post(
  '/:id/oauth/refresh',
  requirePermission(PERMISSIONS.manage_integrations),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(oauthController.refreshToken),
);

router.get(
  '/:id/oauth/status',
  requirePermission(PERMISSIONS.manage_integrations),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(oauthController.getOAuthStatus),
);

router.post(
  '/:id/oauth/revoke',
  requirePermission(PERMISSIONS.manage_integrations),
  param('id').isString().notEmpty(),
  validate,
  asyncHandler(oauthController.revokeAccess),
);

// FLOW END: Integrations Routes (EN)
// จุดสิ้นสุด: Routes ของ Integrations (TH)

export default router;

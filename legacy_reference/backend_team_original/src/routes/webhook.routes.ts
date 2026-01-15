import { Router } from 'express';
import { query, param } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, requirePermission } from '../middleware/tenant.middleware';
import { PERMISSIONS } from '../constants/rbac';
import {
  handleFacebookWebhook,
  verifyFacebookWebhook,
  handleLINEWebhook,
  handleTikTokWebhook,
  handleShopeeWebhook,
  getWebhookEvents,
  replayWebhookEvent,
  deleteWebhookEvent,
} from '../controllers/webhook.controller';

// FLOW START: Webhook Routes (EN)
// จุดเริ่มต้น: Routes ของ Webhooks (TH)

const router = Router();

// Facebook Webhooks
router.get('/facebook', verifyFacebookWebhook);
router.post('/facebook', handleFacebookWebhook);

// LINE Webhooks
router.post('/line', handleLINEWebhook);

// TikTok Webhooks
router.post('/tiktok', handleTikTokWebhook);

// Shopee Webhooks
router.post('/shopee', handleShopeeWebhook);

// Webhook Management (protected routes would go here)
router.get(
  '/events',
  authenticate,
  tenantMiddleware,
  requirePermission(PERMISSIONS.manage_integrations),
  [
    query('platform')
      .optional()
      .isIn(['facebook', 'line', 'tiktok', 'shopee'])
      .withMessage('Invalid platform'),
    query('type').optional().isString().withMessage('Type must be a string'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  validate,
  getWebhookEvents,
);

router.post(
  '/events/:id/replay',
  authenticate,
  tenantMiddleware,
  requirePermission(PERMISSIONS.manage_integrations),
  [param('id').isString().notEmpty().withMessage('Event ID is required')],
  validate,
  replayWebhookEvent,
);

router.delete(
  '/events/:id',
  authenticate,
  tenantMiddleware,
  requirePermission(PERMISSIONS.manage_integrations),
  [param('id').isString().notEmpty().withMessage('Event ID is required')],
  validate,
  deleteWebhookEvent,
);

// FLOW END: Webhook Routes (EN)
// จุดสิ้นสุด: Routes ของ Webhooks (TH)

export default router;

import { Router } from 'express';
import { query } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  getFacebookData,
  getGoogleAdsData,
  getLINEData,
  getTikTokData,
  getShopeeData,
  getAllData,
} from '../controllers/data.controller';

// FLOW START: Data Routes (EN)
// จุดเริ่มต้น: Routes สำหรับดึงข้อมูล provider (TH)

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// GET /api/v1/data/facebook - Get Facebook data
router.get(
  '/facebook',
  [
    query('type').isIn(['campaigns', 'insights', 'accounts']).withMessage('Invalid type'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  getFacebookData,
);

// GET /api/v1/data/googleads - Get Google Ads data
router.get(
  '/googleads',
  [
    query('type').isIn(['campaigns', 'insights', 'customers']).withMessage('Invalid type'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  getGoogleAdsData,
);

// GET /api/v1/data/line - Get LINE data
router.get(
  '/line',
  [
    query('type')
      .isIn(['message-stats', 'user-stats', 'friend-events', 'profile'])
      .withMessage('Invalid type'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
    query('userId').optional().isString().withMessage('User ID must be a string'),
  ],
  validate,
  getLINEData,
);

// GET /api/v1/data/tiktok - Get TikTok data
router.get(
  '/tiktok',
  [
    query('type').isIn(['campaigns', 'insights', 'accounts']).withMessage('Invalid type'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  getTikTokData,
);

// GET /api/v1/data/shopee - Get Shopee data
router.get(
  '/shopee',
  [
    query('type')
      .isIn(['orders', 'products', 'insights', 'shop-info', 'shop-metrics'])
      .withMessage('Invalid type'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  getShopeeData,
);

// GET /api/v1/data/all - Get data from all platforms
router.get(
  '/all',
  [
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  getAllData,
);

// FLOW END: Data Routes (EN)
// จุดสิ้นสุด: Routes สำหรับดึงข้อมูล provider (TH)

export default router;

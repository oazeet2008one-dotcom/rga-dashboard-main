import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as mockController from '../controllers/mock.controller';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate.middleware';

// FLOW START: Mock Routes (EN)
// จุดเริ่มต้น: Routes ของ Mock Data (TH)

const router = Router();

router.use(authenticate);

router.post(
  '/generate',
  body('providers').optional().isArray(),
  body('lookbackDays').optional().isInt({ min: 1, max: 365 }),
  validate,
  asyncHandler(mockController.generateMockData),
);

router.get(
  '/metrics',
  query('startDate').optional().isISO8601().toDate(),
  query('endDate').optional().isISO8601().toDate(),
  query('platform').optional().isString(),
  validate,
  asyncHandler(mockController.getMockMetrics),
);

router.get(
  '/campaigns',
  query('platform').optional().isString(),
  validate,
  asyncHandler(mockController.getMockCampaigns),
);

// FLOW END: Mock Routes (EN)
// จุดสิ้นสุด: Routes ของ Mock Data (TH)

export default router;

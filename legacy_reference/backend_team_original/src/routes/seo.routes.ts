import { Router } from 'express';
import { query } from 'express-validator';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { getSeoOverview } from '../controllers/seo.controller';

// FLOW START: SEO Routes (EN)
// จุดเริ่มต้น: Routes ของ SEO (TH)

const router = Router();

router.use(authenticate);

// GET /api/v1/seo/overview - Aggregate SEO overview (GA4 + GSC)
router.get(
  '/overview',
  [
    query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom'),
    query('dateTo').optional().isISO8601().withMessage('Invalid dateTo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
  ],
  validate,
  getSeoOverview,
);

// FLOW END: SEO Routes (EN)
// จุดสิ้นสุด: Routes ของ SEO (TH)

export default router;

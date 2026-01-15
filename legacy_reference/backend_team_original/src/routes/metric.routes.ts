import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as metricController from '../controllers/metric.controller';

// FLOW START: Metrics Routes (EN)
// จุดเริ่มต้น: Routes ของ Metrics (TH)

const router = Router();

router.use(authenticate);

// Metrics
router.get('/overview', asyncHandler(metricController.getOverview));
router.get('/dashboard', asyncHandler(metricController.getDashboardData));
router.get('/platform-breakdown', asyncHandler(metricController.getPlatformBreakdown));
router.get('/snapshots', asyncHandler(metricController.getCachedSnapshots));
router.get('/trends', asyncHandler(metricController.getTrends));
router.get('/comparison', asyncHandler(metricController.getComparison));
router.post('/bulk', asyncHandler(metricController.bulkCreateMetrics));

// FLOW END: Metrics Routes (EN)
// จุดสิ้นสุด: Routes ของ Metrics (TH)

export default router;

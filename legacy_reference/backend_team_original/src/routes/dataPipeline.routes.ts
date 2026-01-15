import { Router } from 'express';
import { dataPipelineController } from '../controllers/dataPipeline.controller';
import { authenticateToken } from '../middleware/auth';

// FLOW START: Data Pipeline Routes (EN)
// จุดเริ่มต้น: Routes ของ Data Pipeline (TH)

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Run full data pipeline
router.post('/run', dataPipelineController.runPipeline);

// Get sync status for all integrations
router.get('/status', dataPipelineController.getSyncStatus);

// Get aggregated metrics across platforms
router.get('/metrics', dataPipelineController.getAggregatedMetrics);

// Get cross-platform summary
router.get('/summary', dataPipelineController.getCrossPlatformSummary);

// Sync single provider
router.post('/sync/:provider', dataPipelineController.syncSingleProvider);

// Get list of available providers
router.get('/providers', dataPipelineController.getProviderList);

// FLOW END: Data Pipeline Routes (EN)
// จุดสิ้นสุด: Routes ของ Data Pipeline (TH)

export default router;

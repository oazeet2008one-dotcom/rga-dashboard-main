import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as reportController from '../controllers/report.controller';

// FLOW START: Reports Routes (EN)
// จุดเริ่มต้น: Routes ของ Reports (TH)

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(reportController.getReports));
router.get('/:id', asyncHandler(reportController.getReportById));
router.post('/', asyncHandler(reportController.createReport));
router.put('/:id', asyncHandler(reportController.updateReport));
router.delete('/:id', asyncHandler(reportController.deleteReport));
router.post('/:id/generate', asyncHandler(reportController.generateReport));
router.get('/:id/download', asyncHandler(reportController.downloadReport));

// FLOW END: Reports Routes (EN)
// จุดสิ้นสุด: Routes ของ Reports (TH)

export default router;

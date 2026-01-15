import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as campaignController from '../controllers/campaign.controller';

// FLOW START: Campaign Routes (EN)
// จุดเริ่มต้น: Routes ของ Campaign (TH)

const router = Router();

// All routes require authentication
router.use(authenticate);

// Campaign CRUD
router.get('/', asyncHandler(campaignController.getCampaigns));
router.get('/:id', asyncHandler(campaignController.getCampaignById));
router.post('/', asyncHandler(campaignController.createCampaign));
router.put('/:id', asyncHandler(campaignController.updateCampaign));
router.delete('/:id', asyncHandler(campaignController.deleteCampaign));

// Campaign Analytics
router.get('/:id/metrics', asyncHandler(campaignController.getCampaignMetrics));
router.get('/:id/performance', asyncHandler(campaignController.getCampaignPerformance));

// FLOW END: Campaign Routes (EN)
// จุดสิ้นสุด: Routes ของ Campaign (TH)

export default router;

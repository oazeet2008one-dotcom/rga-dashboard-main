import { Router } from 'express';
import { tiktokAuthController } from '../controllers/tiktok-auth.controller';
import { authenticateToken } from '../middleware/auth';

// FLOW START: TikTok Auth Routes (EN)
// จุดเริ่มต้น: Routes ของ TikTok Auth (TH)

const router = Router();

// Public routes
router.get('/tiktok', tiktokAuthController.initiateTikTokAuth);
router.get('/tiktok/callback', tiktokAuthController.handleTikTokCallback);
router.post('/tiktok/token', tiktokAuthController.exchangeTikTokToken);

// Protected routes (require authentication)
router.post('/tiktok/refresh', authenticateToken, tiktokAuthController.refreshTikTokToken);
router.delete('/tiktok/revoke', authenticateToken, tiktokAuthController.revokeTikTokAccess);
router.get('/tiktok/videos', authenticateToken, tiktokAuthController.getTikTokVideos);
router.post('/tiktok/analytics', authenticateToken, tiktokAuthController.getTikTokAnalytics);
router.post('/tiktok/upload', authenticateToken, tiktokAuthController.uploadToTikTok);

// FLOW END: TikTok Auth Routes (EN)
// จุดสิ้นสุด: Routes ของ TikTok Auth (TH)

export default router;

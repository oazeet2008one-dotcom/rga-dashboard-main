import { Router } from 'express';
import { googleAuthController } from '../controllers/google-auth.controller';
import { authenticateToken } from '../middleware/auth';

// FLOW START: Google Auth Routes (EN)
// จุดเริ่มต้น: Routes ของ Google Auth (TH)

const router = Router();

// Public routes
router.get('/google', googleAuthController.initiateGoogleAuth);
router.get('/google/callback', googleAuthController.handleGoogleCallback);
router.post('/google/token', googleAuthController.exchangeGoogleToken);

// Protected routes (require authentication)
router.post('/google/refresh', authenticateToken, googleAuthController.refreshGoogleToken);
router.delete('/google/revoke', authenticateToken, googleAuthController.revokeGoogleAccess);
router.get('/google/calendar', authenticateToken, googleAuthController.getCalendarEvents);
router.get('/google/drive', authenticateToken, googleAuthController.getDriveFiles);

// FLOW END: Google Auth Routes (EN)
// จุดสิ้นสุด: Routes ของ Google Auth (TH)

export default router;

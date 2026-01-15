import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as aiController from '../controllers/ai.controller';

// FLOW START: AI Routes (EN)
// จุดเริ่มต้น: Routes ของ AI (TH)

const router = Router();

router.use(authenticate);

// AI Query (Natural Language)
router.post('/query', asyncHandler(aiController.naturalLanguageQuery));

// Chat (proxy to n8n webhook to avoid browser CORS)
router.post('/chat', asyncHandler(aiController.chatWithN8n));

// AI Insights
router.get('/insights', asyncHandler(aiController.getInsights));
router.get('/insights/:id', asyncHandler(aiController.getInsightById));
router.post('/insights/:id/action', asyncHandler(aiController.actionInsight));
router.post('/insights/:id/dismiss', asyncHandler(aiController.dismissInsight));

// AI Analysis
router.post('/analyze', asyncHandler(aiController.analyzeData));
router.post('/predict', asyncHandler(aiController.predictTrends));
router.post('/recommend', asyncHandler(aiController.getRecommendations));
router.post('/what-if', asyncHandler(aiController.whatIfAnalysis));

// FLOW END: AI Routes (EN)
// จุดสิ้นสุด: Routes ของ AI (TH)

export default router;

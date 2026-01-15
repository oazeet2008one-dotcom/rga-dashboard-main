import axios from 'axios';
import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { prisma } from '../utils/prisma';

// FLOW START: AI Controller (EN)
// จุดเริ่มต้น: Controller ของ AI (TH)

export const naturalLanguageQuery = async (req: TenantRequest, res: Response) => {
  const { query, language = 'th' } = req.body;

  // TODO: Implement NLP logic with OpenAI
  const aiQuery = await prisma.aiQuery.create({
    data: {
      query,
      language,
      tenantId: req.tenantId!,
      userId: req.userId,
      response: 'AI response will be implemented',
    },
  });

  res.json({
    query,
    response: 'AI-powered natural language query - Coming soon',
    data: aiQuery,
  });
};

export const getInsights = async (req: TenantRequest, res: Response) => {
  const { status, priority } = req.query;

  const insights = await prisma.aiInsight.findMany({
    where: {
      tenantId: req.tenantId!,
      ...(status && { status: status as string }),
      ...(priority && { priority: priority as string }),
    },
    include: {
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ insights });
};

export const getInsightById = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const insight = await prisma.aiInsight.findFirst({
    where: { id, tenantId: req.tenantId! },
    include: { campaign: true },
  });

  res.json({ insight });
};

export const actionInsight = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const insight = await prisma.aiInsight.updateMany({
    where: { id, tenantId: req.tenantId! },
    data: {
      status: 'actioned',
      actionedAt: new Date(),
    },
  });

  res.json({ insight, message: 'Insight actioned successfully' });
};

export const dismissInsight = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const insight = await prisma.aiInsight.updateMany({
    where: { id, tenantId: req.tenantId! },
    data: { status: 'dismissed' },
  });

  res.json({ insight, message: 'Insight dismissed' });
};

export const analyzeData = async (_req: TenantRequest, res: Response) => {
  // TODO: Implement data analysis logic
  res.json({ message: 'AI Data Analysis - Coming soon' });
};

export const predictTrends = async (_req: TenantRequest, res: Response) => {
  // TODO: Implement trend prediction logic
  res.json({ message: 'AI Trend Prediction - Coming soon' });
};

export const getRecommendations = async (_req: TenantRequest, res: Response) => {
  // TODO: Implement recommendation engine
  res.json({ message: 'AI Recommendations - Coming soon' });
};

export const whatIfAnalysis = async (_req: TenantRequest, res: Response) => {
  // TODO: Implement what-if analysis
  res.json({ message: 'What-if Analysis - Coming soon' });
};

export const chatWithN8n = async (req: TenantRequest, res: Response) => {
  const { chatInput } = req.body as { chatInput?: string };

  if (!chatInput || !chatInput.trim()) {
    return res.status(400).json({ message: 'chatInput is required' });
  }

  const webhookUrl =
    process.env.N8N_CHAT_WEBHOOK_URL ||
    process.env.AI_WEBHOOK_URL ||
    'https://sand21.app.n8n.cloud/webhook/99f1100e-e91a-4ea9-aa8a-531aa06ada36';

  try {
    const response = await axios.post(
      webhookUrl,
      { chatInput: chatInput.trim() },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 45_000,
      },
    );

    const data: any = response.data;
    const output =
      (typeof data === 'string' ? data : null) ||
      data?.output ||
      data?.text ||
      data?.message ||
      (Array.isArray(data?.messages) ? data.messages?.[data.messages.length - 1]?.text : null);

    return res.json({
      output: typeof output === 'string' && output.trim() ? output : 'ขออภัย ระบบขัดข้อง',
    });
  } catch (error: any) {
    const status = typeof error?.response?.status === 'number' ? error.response.status : 502;
    const message = error?.response?.data?.message || error?.message || 'AI request failed';
    return res.status(status).json({ message });
  }
};

// FLOW END: AI Controller (EN)
// จุดสิ้นสุด: Controller ของ AI (TH)

import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { integrationService } from '../services/integration.service';
import { lineService } from '../services/line.service';
import { prisma } from '../utils/prisma';

// FLOW START: Webhook Controller (EN)
// จุดเริ่มต้น: Controller ของ Webhooks (TH)

export const handleFacebookWebhook = async (req: TenantRequest, res: Response) => {
  try {
    const { entry } = req.body;

    for (const pageEntry of entry) {
      for (const change of pageEntry.changes) {
        const event = {
          platform: 'facebook',
          type: change.field,
          data: change.value,
          timestamp: new Date(),
        };

        await integrationService.processWebhook('facebook', event);
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Facebook webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
};

export const verifyFacebookWebhook = async (req: TenantRequest, res: Response) => {
  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'your_verify_token';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

export const handleLINEWebhook = async (req: TenantRequest, res: Response) => {
  try {
    const signature = req.headers['x-line-signature'] as string;
    const body = JSON.stringify(req.body);

    // Get LINE credentials to validate signature
    const integration = await prisma.integration.findFirst({
      where: { provider: 'line', isActive: true },
    });

    if (!integration) {
      return res.status(400).send('LINE integration not found');
    }

    const credentials = integration.config as any;
    const isValid = lineService.validateSignature(body, signature, credentials.channelSecret);

    if (!isValid) {
      return res.status(400).send('Invalid signature');
    }

    const { events } = req.body;

    for (const event of events) {
      const webhookEvent = {
        platform: 'line',
        type: event.type,
        data: event,
        signature,
        timestamp: new Date(),
      };

      await integrationService.processWebhook('line', webhookEvent);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('LINE webhook error:', error);
    return res.status(500).send('Webhook processing failed');
  }
};

export const handleTikTokWebhook = async (req: TenantRequest, res: Response) => {
  try {
    const { event_type, event_data, timestamp } = req.body;

    const webhookEvent = {
      platform: 'tiktok',
      type: event_type,
      data: event_data,
      timestamp: new Date(timestamp * 1000), // Convert Unix timestamp
    };

    await integrationService.processWebhook('tiktok', webhookEvent);

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('TikTok webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
};

export const handleShopeeWebhook = async (req: TenantRequest, res: Response) => {
  try {
    const { code, shop_id, timestamp } = req.body;

    const webhookEvent = {
      platform: 'shopee',
      type: code,
      data: { shop_id, timestamp },
      timestamp: new Date(),
    };

    await integrationService.processWebhook('shopee', webhookEvent);

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Shopee webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
};

export const getWebhookEvents = async (req: TenantRequest, res: Response) => {
  try {
    const { platform, type, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (req.userRole !== 'super_admin') {
      where.tenantId = req.tenantId;
    }
    if (platform) where.platform = platform as string;
    if (type) where.type = type as string;

    const events = await prisma.webhookEvent.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.webhookEvent.count({ where });

    return res.json({ events, total, limit: Number(limit), offset: Number(offset) });
  } catch (error) {
    console.error('Get webhook events error:', error);
    return res.status(500).json({ message: 'Failed to fetch webhook events' });
  }
};

export const replayWebhookEvent = async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.webhookEvent.findFirst({
      where: {
        id,
        ...(req.userRole !== 'super_admin' ? { tenantId: req.tenantId } : {}),
      },
    });

    if (!event) {
      return res.status(404).json({ message: 'Webhook event not found' });
    }

    const eventData =
      typeof (event as any).data === 'string'
        ? JSON.parse((event as any).data)
        : (event as any).data;

    const webhookEvent = {
      platform: event.platform,
      type: event.type,
      data: eventData,
      signature: event.signature ?? undefined,
      timestamp: event.receivedAt,
    };

    await integrationService.processWebhook(event.platform, webhookEvent);

    return res.json({ message: 'Webhook event replayed successfully' });
  } catch (error) {
    console.error('Replay webhook event error:', error);
    return res.status(500).json({ message: 'Failed to replay webhook event' });
  }
};

export const deleteWebhookEvent = async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.userRole !== 'super_admin') {
      const existing = await prisma.webhookEvent.findFirst({
        where: { id, tenantId: req.tenantId },
      });
      if (!existing) {
        return res.status(404).json({ message: 'Webhook event not found' });
      }
    }

    await prisma.webhookEvent.delete({ where: { id } });

    return res.json({ message: 'Webhook event deleted successfully' });
  } catch (error) {
    console.error('Delete webhook event error:', error);
    return res.status(500).json({ message: 'Failed to delete webhook event' });
  }
};

// FLOW END: Webhook Controller (EN)
// จุดสิ้นสุด: Controller ของ Webhooks (TH)

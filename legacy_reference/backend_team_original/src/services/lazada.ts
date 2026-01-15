import { Integration } from '@prisma/client';
import axios from 'axios';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// FLOW START: Lazada Sync Service (EN)
// จุดเริ่มต้น: Service ซิงค์ Lazada (TH)

export async function sync(integration: Integration) {
  try {
    const credentials = integration.credentials as any;

    if (!credentials.appKey || !credentials.appSecret || !credentials.accessToken) {
      throw new Error('Missing Lazada credentials');
    }

    // Lazada API base URL
    const baseUrl = credentials.sandbox
      ? 'https://api.sandbox.lazada.com.my/rest'
      : 'https://api.lazada.com.my/rest';

    // Generate signature for Lazada API
    const timestamp = Date.now();
    const params: any = {
      app_key: credentials.appKey,
      access_token: credentials.accessToken,
      timestamp: timestamp.toString(),
      sign_method: 'sha256',
      format: 'JSON',
      v: '2.0',
    };

    // Sort and build signature
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join('');
    const signString = `${credentials.appSecret}${sortedParams}${credentials.appSecret}`;
    const crypto = require('crypto');
    const signature = crypto.createHash('sha256').update(signString).digest('hex').toUpperCase();
    params.sign = signature;

    // Fetch orders from Lazada
    const response = await axios.get(`${baseUrl}/order/get`, {
      params: {
        ...params,
        created_after: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_before: new Date().toISOString(),
        limit: 100,
      },
    });

    const orders = response.data?.data?.orders || [];

    const ordersCampaign = await prisma.campaign.upsert({
      where: {
        tenantId_platform_externalId: {
          tenantId: integration.tenantId,
          platform: 'lazada',
          externalId: `orders_${integration.id}`,
        },
      },
      update: {
        name: 'Lazada Orders',
        status: 'active',
      },
      create: {
        tenantId: integration.tenantId,
        integrationId: integration.id,
        externalId: `orders_${integration.id}`,
        name: 'Lazada Orders',
        platform: 'lazada',
        status: 'active',
      },
    });

    // Sync orders as metrics
    let syncedCount = 0;
    for (const order of orders) {
      const orderDate = new Date(order.created_at);

      await prisma.metric.upsert({
        where: {
          tenantId_campaignId_date_hour_platform_source: {
            tenantId: integration.tenantId,
            campaignId: ordersCampaign.id,
            date: orderDate,
            hour: 0,
            platform: 'lazada',
            source: `order_${order.order_id}`,
          },
        },
        update: {
          orders: 1,
          revenue: Number(order.price) || 0,
        },
        create: {
          tenantId: integration.tenantId,
          campaignId: ordersCampaign.id,
          date: orderDate,
          hour: 0,
          platform: 'lazada',
          source: `order_${order.order_id}`,
          orders: 1,
          revenue: Number(order.price) || 0,
        },
      });

      syncedCount++;
    }

    // Update last sync time
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    logger.info(`Lazada sync completed: ${syncedCount} orders synced`);

    return {
      status: 'success',
      provider: 'lazada',
      integrationId: integration.id,
      synced: syncedCount,
    };
  } catch (error: any) {
    logger.error(`Lazada sync failed: ${error.message}`);

    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'error' },
    });

    throw error;
  }
}

// FLOW END: Lazada Sync Service (EN)
// จุดสิ้นสุด: Service ซิงค์ Lazada (TH)

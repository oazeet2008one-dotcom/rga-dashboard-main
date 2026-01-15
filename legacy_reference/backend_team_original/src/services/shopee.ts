import { Integration } from '@prisma/client';
import axios from 'axios';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// FLOW START: Shopee Sync Service (EN)
// จุดเริ่มต้น: Service ซิงค์ Shopee (TH)

export async function sync(integration: Integration) {
  try {
    const credentials = integration.credentials as any;

    if (!credentials.partnerId || !credentials.partnerKey || !credentials.shopId) {
      throw new Error('Missing Shopee credentials');
    }

    // Shopee API base URL
    const baseUrl = credentials.sandbox
      ? 'https://partner.test-stable.shopeemobile.com'
      : 'https://partner.shopeemobile.com';

    // Generate signature for Shopee API
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/order/get_order_list';
    const baseString = `${credentials.partnerId}${path}${timestamp}${credentials.accessToken || ''}${credentials.shopId}`;
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', credentials.partnerKey)
      .update(baseString)
      .digest('hex');

    // Fetch orders from Shopee
    const response = await axios.get(`${baseUrl}${path}`, {
      params: {
        partner_id: credentials.partnerId,
        shop_id: credentials.shopId,
        timestamp,
        access_token: credentials.accessToken || '',
        sign: signature,
        time_range_field: 'create_time',
        time_from: Math.floor(Date.now() / 1000) - 86400 * 7, // Last 7 days
        time_to: Math.floor(Date.now() / 1000),
        page_size: 100,
      },
    });

    const orders = response.data?.response?.order_list || [];

    const ordersCampaign = await prisma.campaign.upsert({
      where: {
        tenantId_platform_externalId: {
          tenantId: integration.tenantId,
          platform: 'shopee',
          externalId: `orders_${integration.id}`,
        },
      },
      update: {
        name: 'Shopee Orders',
        status: 'active',
      },
      create: {
        tenantId: integration.tenantId,
        integrationId: integration.id,
        externalId: `orders_${integration.id}`,
        name: 'Shopee Orders',
        platform: 'shopee',
        status: 'active',
      },
    });

    // Sync orders as metrics
    let syncedCount = 0;
    for (const order of orders) {
      const orderDate = new Date(Number(order.create_time) * 1000);

      await prisma.metric.upsert({
        where: {
          tenantId_campaignId_date_hour_platform_source: {
            tenantId: integration.tenantId,
            campaignId: ordersCampaign.id,
            date: orderDate,
            hour: 0,
            platform: 'shopee',
            source: `order_${order.order_sn}`,
          },
        },
        update: {
          orders: 1,
          revenue: Number(order.actual_shipping_cost) + Number(order.total_amount),
        },
        create: {
          tenantId: integration.tenantId,
          campaignId: ordersCampaign.id,
          date: orderDate,
          hour: 0,
          platform: 'shopee',
          source: `order_${order.order_sn}`,
          orders: 1,
          revenue: Number(order.actual_shipping_cost) + Number(order.total_amount),
        },
      });

      syncedCount++;
    }

    // Update last sync time
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    logger.info(`Shopee sync completed: ${syncedCount} orders synced`);

    return {
      status: 'success',
      provider: 'shopee',
      integrationId: integration.id,
      synced: syncedCount,
    };
  } catch (error: any) {
    logger.error(`Shopee sync failed: ${error.message}`);

    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'error' },
    });

    throw error;
  }
}

// FLOW END: Shopee Sync Service (EN)
// จุดสิ้นสุด: Service ซิงค์ Shopee (TH)

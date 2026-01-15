import { Integration } from '@prisma/client';
import { GoogleAdsApi } from 'google-ads-api';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// FLOW START: Google Ads Sync Service (EN)
// จุดเริ่มต้น: Service ซิงค์ Google Ads (TH)

export async function sync(integration: Integration) {
  try {
    const credentials = integration.credentials as any;

    if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken) {
      throw new Error('Missing Google Ads credentials');
    }

    // Initialize Google Ads API client
    const client = new GoogleAdsApi({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      developer_token: credentials.developerToken || '',
    });

    const customer = client.Customer({
      customer_id: credentials.customerId || '',
      refresh_token: credentials.refreshToken,
    });

    // Fetch campaigns
    const campaigns = await customer.query(`
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.start_date,
        campaign.end_date,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.id
      LIMIT 100
    `);

    // Sync campaigns to database
    const syncedCampaigns = [];
    for (const campaignData of campaigns) {
      const campaign = campaignData.campaign;
      const metrics = campaignData.metrics;
      const metricDate = (campaignData as any)?.segments?.date
        ? new Date(`${(campaignData as any).segments.date}T00:00:00.000Z`)
        : null;

      // Create or update campaign
      const dbCampaign = await prisma.campaign.upsert({
        where: {
          tenantId_platform_externalId: {
            tenantId: integration.tenantId,
            platform: 'google',
            externalId: campaign?.id?.toString() || '',
          },
        },
        update: {
          name: campaign?.name || '',
          status: (campaign?.status as string)?.toLowerCase() || 'unknown',
          campaignType: (campaign?.advertising_channel_type as string)?.toLowerCase() || 'unknown',
          budget: metrics?.cost_micros ? Number(metrics.cost_micros) / 1000000 : null,
        },
        create: {
          tenantId: integration.tenantId,
          integrationId: integration.id,
          externalId: campaign?.id?.toString() || '',
          name: campaign?.name || '',
          platform: 'google',
          status: (campaign?.status as string)?.toLowerCase() || 'unknown',
          campaignType: (campaign?.advertising_channel_type as string)?.toLowerCase() || 'unknown',
          startDate: campaign?.start_date ? new Date(campaign.start_date) : null,
          endDate: campaign?.end_date ? new Date(campaign.end_date) : null,
          budget: metrics?.cost_micros ? Number(metrics.cost_micros) / 1000000 : null,
        },
      });

      // Create metrics if available
      if (metrics && metricDate) {
        await prisma.metric.upsert({
          where: {
            tenantId_campaignId_date_hour_platform_source: {
              tenantId: integration.tenantId,
              campaignId: dbCampaign.id,
              date: metricDate,
              hour: 0,
              platform: 'google',
              source: campaign?.id?.toString() || '',
            },
          },
          update: {
            impressions: metrics.impressions || 0,
            clicks: metrics.clicks || 0,
            conversions: metrics.conversions || 0,
            spend: metrics.cost_micros ? Number(metrics.cost_micros) / 1000000 : 0,
          },
          create: {
            tenantId: integration.tenantId,
            campaignId: dbCampaign.id,
            date: metricDate,
            hour: 0,
            platform: 'google',
            source: campaign?.id?.toString() || '',
            impressions: metrics.impressions || 0,
            clicks: metrics.clicks || 0,
            conversions: metrics.conversions || 0,
            spend: metrics.cost_micros ? Number(metrics.cost_micros) / 1000000 : 0,
          },
        });
      }

      syncedCampaigns.push(dbCampaign);
    }

    // Update last sync time
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    logger.info(`Google Ads sync completed: ${syncedCampaigns.length} campaigns synced`);

    return {
      status: 'success',
      provider: 'google_ads',
      integrationId: integration.id,
      synced: syncedCampaigns.length,
      campaigns: syncedCampaigns,
    };
  } catch (error: any) {
    logger.error(`Google Ads sync failed: ${error.message}`);

    // Update integration status
    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'error' },
    });

    throw error;
  }
}

// FLOW END: Google Ads Sync Service (EN)
// จุดสิ้นสุด: Service ซิงค์ Google Ads (TH)

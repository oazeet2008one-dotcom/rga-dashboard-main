import { Integration, Prisma } from '@prisma/client';
import axios, { AxiosResponse } from 'axios';
import { prisma } from '../utils/prisma';

// FLOW START: Facebook Sync Service (EN)
// จุดเริ่มต้น: Service ซิงค์ Facebook (TH)

function parseJson<T = any>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    return typeof value === 'string' ? JSON.parse(value) : (value as T);
  } catch {
    return fallback;
  }
}

type FBConfig = {
  accounts?: string[];
  lookbackDays?: number;
};

export async function sync(integration: Integration) {
  const creds = parseJson<any>(integration.credentials, {});
  const config = parseJson<FBConfig>(integration.config, {});

  const accessToken: string | undefined = creds?.auth?.access_token || creds?.systemUserToken;
  if (!accessToken) {
    return {
      status: 'error',
      message: 'Facebook access token is missing in integration.credentials',
    };
  }

  const accounts = config.accounts || [];
  if (!accounts.length) {
    return {
      status: 'error',
      message: 'Facebook ad account IDs are required in integration.config.accounts',
    };
  }

  const lookbackDays = Number(config.lookbackDays || 30);
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (lookbackDays - 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  let totalCampaigns = 0;
  let totalMetricDays = 0;

  for (const accountId of accounts) {
    // Fetch campaigns
    let next: string | null =
      `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,start_time,stop_time&limit=50&access_token=${encodeURIComponent(
        accessToken,
      )}`;
    const campaigns: Array<any> = [];

    while (next) {
      const resp: AxiosResponse<any> = await axios.get(next);
      campaigns.push(...(resp.data?.data || []));
      next = resp.data?.paging?.next || null;
    }

    for (const c of campaigns) {
      totalCampaigns += 1;
      // Upsert campaign
      const camp = await prisma.campaign.upsert({
        where: {
          tenantId_platform_externalId: {
            tenantId: integration.tenantId,
            platform: 'facebook',
            externalId: String(c.id),
          },
        },
        update: {
          name: c.name || 'Unnamed',
          status: c.status || 'active',
          objective: c.objective || null,
          budget: c.daily_budget ? new Prisma.Decimal(Number(c.daily_budget) / 100) : null,
          budgetType: c.daily_budget ? 'daily' : null,
        },
        create: {
          tenantId: integration.tenantId,
          integrationId: integration.id,
          externalId: String(c.id),
          name: c.name || 'Unnamed',
          platform: 'facebook',
          status: c.status || 'active',
          objective: c.objective || null,
          budget: c.daily_budget ? new Prisma.Decimal(Number(c.daily_budget) / 100) : null,
          budgetType: c.daily_budget ? 'daily' : null,
          currency: 'THB',
          startDate: c.start_time ? new Date(c.start_time) : null,
          endDate: c.stop_time ? new Date(c.stop_time) : null,
        },
      });

      // Fetch insights per day for the period
      const insightsUrl = `https://graph.facebook.com/v19.0/${c.id}/insights?level=campaign&time_increment=1&time_range={"since":"${fmt(
        start,
      )}","until":"${fmt(end)}"}&fields=impressions,clicks,spend,actions,action_values,conversions&limit=100&access_token=${encodeURIComponent(
        accessToken,
      )}`;
      const insResp: AxiosResponse<any> = await axios.get(insightsUrl);
      const data = insResp.data?.data || [];

      for (const d of data) {
        // d.date_start is YYYY-MM-DD
        const day = new Date(d.date_start + 'T00:00:00.000Z');
        const impressions = Number(d.impressions || 0);
        const clicks = Number(d.clicks || 0);
        const spend = d.spend != null ? new Prisma.Decimal(Number(d.spend)) : null;

        // Parse conversions/revenue if present
        let conversions = 0;
        let revenue: Prisma.Decimal | null = null;
        const actions = Array.isArray(d.actions) ? d.actions : [];
        const actionValues = Array.isArray(d.action_values) ? d.action_values : [];

        for (const a of actions) {
          if (a.action_type === 'offsite_conversion' || a.action_type === 'purchase') {
            conversions += Number(a.value || 0);
          }
        }
        for (const av of actionValues) {
          if (av.action_type === 'offsite_conversion.purchase' || av.action_type === 'purchase') {
            revenue = new Prisma.Decimal(Number(av.value || 0));
          }
        }

        // Upsert metric by unique composite
        const existing = await prisma.metric.findFirst({
          where: {
            tenantId: integration.tenantId,
            campaignId: camp.id,
            date: day as any,
            hour: null,
            platform: 'facebook',
            source: 'facebook',
          },
          select: { id: true },
        });

        const payload = {
          impressions,
          clicks,
          conversions,
          spend,
          revenue,
          metadata: {},
        } as const;

        if (existing) {
          await prisma.metric.update({ where: { id: existing.id }, data: payload as any });
        } else {
          await prisma.metric.create({
            data: {
              tenantId: integration.tenantId,
              campaignId: camp.id,
              date: day as any,
              hour: null,
              platform: 'facebook',
              source: 'facebook',
              ...payload,
            } as any,
          });
        }
        totalMetricDays += 1;
      }
    }
  }

  return {
    status: 'ok',
    provider: 'facebook',
    integrationId: integration.id,
    campaigns: totalCampaigns,
    metricDays: totalMetricDays,
  };
}

// FLOW END: Facebook Sync Service (EN)
// จุดสิ้นสุด: Service ซิงค์ Facebook (TH)

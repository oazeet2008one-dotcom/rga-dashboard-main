import { Integration } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

// FLOW START: Google Search Console Sync Service (EN)
// จุดเริ่มต้น: Service ซิงค์ Google Search Console (TH)

type SAJson = {
  client_email: string;
  private_key: string;
  project_id?: string;
  [k: string]: any;
};

function parseJson<T = any>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    return typeof value === 'string' ? JSON.parse(value) : (value as T);
  } catch {
    return fallback;
  }
}

export interface SearchConsoleMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleData {
  date: string;
  page?: string;
  query?: string;
  device?: string;
  country?: string;
  metrics: SearchConsoleMetrics;
}

export async function sync(integration: Integration) {
  try {
    const config = parseJson<any>(integration.config, {});
    const creds = parseJson<any>(integration.credentials, {});

    const siteUrl: string = config.siteUrl || creds.siteUrl;
    const lookbackDays: number = Number(config.lookbackDays || 30);

    if (!siteUrl) {
      throw new Error('Google Search Console siteUrl is required in integration.config.siteUrl');
    }

    // Service Account JSON can be at credentials.serviceAccount or flat root
    const sa: SAJson | undefined =
      creds.serviceAccount || (creds.client_email && creds.private_key ? creds : undefined);
    if (!sa?.client_email || !sa?.private_key) {
      throw new Error('Service Account JSON missing in integration.credentials');
    }

    const auth = new GoogleAuth({
      credentials: {
        client_email: sa.client_email,
        private_key: sa.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - lookbackDays);

    // Fetch search analytics data
    const response = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        dimensions: ['date', 'page', 'query', 'device', 'country'],
        rowLimit: 25000,
      },
    });

    const rows = response.data.rows || [];
    const syncedData = [];

    for (const row of rows) {
      const dimensions = row.keys || [];
      const date = dimensions[0] || new Date().toISOString().split('T')[0];
      const page = dimensions[1] || '';
      const query = dimensions[2] || '';
      const device = dimensions[3] || '';
      const country = dimensions[4] || '';

      const dateObj = new Date(`${date}T00:00:00.000Z`);
      const externalKey = `${date}|${page}|${query}|${device}|${country}`;

      // Store SEO metrics
      const seoMetric = await prisma.seoMetric.upsert({
        where: {
          tenantId_metricType_externalKey: {
            tenantId: integration.tenantId,
            metricType: 'search_performance',
            externalKey,
          },
        } as any,
        update: {
          metricType: 'search_performance',
          label: `${page} - ${query}`,
          date: dateObj as any,
          externalKey,
          numericValue: row.ctr || 0,
          volume: row.impressions || 0,
          sessions: row.clicks || 0,
          metadata: {
            position: row.position || 0,
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            date,
            page,
            query,
            device,
            country,
          },
        } as any,
        create: {
          tenantId: integration.tenantId,
          metricType: 'search_performance',
          label: `${page} - ${query}`,
          date: dateObj as any,
          externalKey,
          numericValue: row.ctr || 0,
          volume: row.impressions || 0,
          sessions: row.clicks || 0,
          metadata: {
            position: row.position || 0,
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            date,
            page,
            query,
            device,
            country,
          },
        } as any,
      });

      syncedData.push(seoMetric);
    }

    // Update last sync time
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return {
      status: 'success',
      provider: 'google_search_console',
      integrationId: integration.id,
      synced: syncedData.length,
      metrics: syncedData,
    };
  } catch (error: any) {
    console.error(`Google Search Console sync failed: ${error.message}`);

    // Update integration status
    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'error' },
    });

    throw error;
  }
}

export async function getTopPages(integration: Integration, limit: number = 10) {
  try {
    const config = parseJson<any>(integration.config, {});
    const creds = parseJson<any>(integration.credentials, {});

    const siteUrl: string = config.siteUrl || creds.siteUrl;
    const lookbackDays: number = Number(config.lookbackDays || 30);

    if (!siteUrl) {
      throw new Error('Google Search Console siteUrl is required');
    }

    const sa: SAJson | undefined =
      creds.serviceAccount || (creds.client_email && creds.private_key ? creds : undefined);
    if (!sa?.client_email || !sa?.private_key) {
      throw new Error('Service Account JSON missing');
    }

    const auth = new GoogleAuth({
      credentials: {
        client_email: sa.client_email,
        private_key: sa.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - lookbackDays);

    const response = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: limit,
      },
    });

    return (
      response.data.rows?.map((row) => ({
        page: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })) || []
    );
  } catch (error: any) {
    console.error(`Failed to get top pages: ${error.message}`);
    throw error;
  }
}

export async function getTopQueries(integration: Integration, limit: number = 10) {
  try {
    const config = parseJson<any>(integration.config, {});
    const creds = parseJson<any>(integration.credentials, {});

    const siteUrl: string = config.siteUrl || creds.siteUrl;
    const lookbackDays: number = Number(config.lookbackDays || 30);

    if (!siteUrl) {
      throw new Error('Google Search Console siteUrl is required');
    }

    const sa: SAJson | undefined =
      creds.serviceAccount || (creds.client_email && creds.private_key ? creds : undefined);
    if (!sa?.client_email || !sa?.private_key) {
      throw new Error('Service Account JSON missing');
    }

    const auth = new GoogleAuth({
      credentials: {
        client_email: sa.client_email,
        private_key: sa.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - lookbackDays);

    const response = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: limit,
      },
    });

    return (
      response.data.rows?.map((row) => ({
        query: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })) || []
    );
  } catch (error: any) {
    console.error(`Failed to get top queries: ${error.message}`);
    throw error;
  }
}

// FLOW END: Google Search Console Sync Service (EN)
// จุดสิ้นสุด: Service ซิงค์ Google Search Console (TH)

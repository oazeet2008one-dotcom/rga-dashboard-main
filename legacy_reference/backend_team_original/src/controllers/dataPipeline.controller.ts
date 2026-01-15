import { Request, Response } from 'express';
import { dataPipelineService } from '../services/dataPipeline.service';
import { logger } from '../utils/logger';

// FLOW START: Data Pipeline Controller (EN)
// จุดเริ่มต้น: Controller ของ Data Pipeline (TH)

export class DataPipelineController {
  async runPipeline(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID required' });
        return;
      }

      const { providers, forceSync, dateRange } = req.body;

      const config = {
        tenantId,
        providers,
        forceSync: forceSync || false,
        dateRange: dateRange
          ? {
              start: new Date(dateRange.start),
              end: new Date(dateRange.end),
            }
          : undefined,
      };

      const results = await dataPipelineService.runPipeline(config);

      res.json({
        success: true,
        results,
        summary: {
          total: results.length,
          successful: results.filter((r) => r.status === 'success').length,
          failed: results.filter((r) => r.status === 'error').length,
        },
      });
    } catch (error: any) {
      logger.error('Pipeline run failed:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID required' });
        return;
      }

      const status = await dataPipelineService.getSyncStatus(tenantId);

      res.json({
        success: true,
        status,
      });
    } catch (error: any) {
      logger.error('Get sync status failed:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAggregatedMetrics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID required' });
        return;
      }

      const { startDate, endDate, platforms } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      const metrics = await dataPipelineService.getAggregatedMetrics(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string),
        platforms ? (platforms as string).split(',') : undefined,
      );

      res.json({
        success: true,
        metrics,
        period: {
          start: startDate,
          end: endDate,
        },
      });
    } catch (error: any) {
      logger.error('Get aggregated metrics failed:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCrossPlatformSummary(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID required' });
        return;
      }

      const { days = 30 } = req.query;

      const summary = await dataPipelineService.getCrossPlatformSummary(tenantId, Number(days));

      res.json({
        success: true,
        summary,
        period: {
          days: Number(days),
        },
      });
    } catch (error: any) {
      logger.error('Get cross-platform summary failed:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async syncSingleProvider(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID required' });
        return;
      }

      const { provider } = req.params;
      const { forceSync = false } = req.body;

      const config = {
        tenantId,
        providers: [provider],
        forceSync,
      };

      const results = await dataPipelineService.runPipeline(config);

      if (results.length === 0) {
        res.status(404).json({ error: 'No active integration found for this provider' });
        return;
      }

      const result = results[0];

      res.json({
        success: result.status === 'success',
        result,
      });
    } catch (error: any) {
      logger.error(`Sync ${req.params.provider} failed:`, error);
      res.status(500).json({ error: error.message });
    }
  }

  async getProviderList(_req: Request, res: Response): Promise<void> {
    try {
      const providers = [
        {
          id: 'google_ads',
          name: 'Google Ads',
          description: 'Google Ads campaigns and performance metrics',
          category: 'advertising',
          syncInterval: 4, // hours
        },
        {
          id: 'facebook',
          name: 'Facebook Ads',
          description: 'Facebook/Instagram advertising campaigns',
          category: 'advertising',
          syncInterval: 4,
        },
        {
          id: 'tiktok',
          name: 'TikTok Ads',
          description: 'TikTok advertising campaigns',
          category: 'advertising',
          syncInterval: 4,
        },
        {
          id: 'line_ads',
          name: 'LINE Ads',
          description: 'LINE advertising campaigns',
          category: 'advertising',
          syncInterval: 4,
        },
        {
          id: 'ga4',
          name: 'Google Analytics 4',
          description: 'Website analytics and traffic data',
          category: 'analytics',
          syncInterval: 6,
        },
        {
          id: 'google_search_console',
          name: 'Google Search Console',
          description: 'Search performance and SEO metrics',
          category: 'seo',
          syncInterval: 6,
        },
      ];

      res.json({
        success: true,
        providers,
      });
    } catch (error: any) {
      logger.error('Get provider list failed:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const dataPipelineController = new DataPipelineController();

// FLOW END: Data Pipeline Controller (EN)
// จุดสิ้นสุด: Controller ของ Data Pipeline (TH)

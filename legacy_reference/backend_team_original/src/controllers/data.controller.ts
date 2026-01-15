import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { integrationService } from '../services/integration.service';
import { facebookService } from '../services/facebook.service';
import { googleAdsService } from '../services/googleads.service';
import { lineService } from '../services/line.service';
import { tiktokService } from '../services/tiktok.service';
import { shopeeService } from '../services/shopee.service';

// FLOW START: Data Controller (EN)
// จุดเริ่มต้น: Controller สำหรับดึงข้อมูล provider (TH)

export const getFacebookData = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, type } = req.query;

    const dateRange =
      dateFrom && dateTo
        ? {
            start: dateFrom as string,
            end: dateTo as string,
          }
        : undefined;

    let data = null;

    switch (type) {
      case 'campaigns':
        data = await facebookService.getCampaigns(req.tenantId!, dateRange);
        break;
      case 'insights':
        data = await facebookService.getInsights(req.tenantId!, undefined, dateRange);
        break;
      case 'accounts':
        data = await facebookService.getAdAccounts(req.tenantId!);
        break;
      default:
        res.status(400).json({ message: 'Invalid data type' });
        return;
    }

    res.json({ data });
    return;
  } catch (error) {
    console.error('Get Facebook data error:', error);
    res.status(500).json({ message: 'Failed to fetch Facebook data' });
    return;
  }
};

export const getGoogleAdsData = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, type } = req.query;

    const dateRange =
      dateFrom && dateTo
        ? {
            start: dateFrom as string,
            end: dateTo as string,
          }
        : undefined;

    let data = null;

    switch (type) {
      case 'campaigns':
        data = await googleAdsService.getCampaigns(req.tenantId!, dateRange);
        break;
      case 'insights':
        data = await googleAdsService.getInsights(req.tenantId!, dateRange);
        break;
      case 'customers':
        data = await googleAdsService.getCustomers(req.tenantId!);
        break;
      default:
        res.status(400).json({ message: 'Invalid data type' });
        return;
    }

    res.json({ data });
    return;
  } catch (error) {
    console.error('Get Google Ads data error:', error);
    res.status(500).json({ message: 'Failed to fetch Google Ads data' });
    return;
  }
};

export const getLINEData = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, type, userId } = req.query;

    let data = null;

    switch (type) {
      case 'message-stats':
        if (!dateFrom || !dateTo) {
          res
            .status(400)
            .json({ message: 'dateFrom and dateTo are required for message stats' });
          return;
        }
        data = await lineService.getMessageStats(
          req.tenantId!,
          dateFrom as string,
          dateTo as string,
        );
        break;
      case 'user-stats':
        data = await lineService.getUserStats(req.tenantId!);
        break;
      case 'friend-events':
        data = await lineService.getFriendEvents(req.tenantId!, dateFrom as string);
        break;
      case 'profile':
        if (!userId) {
          res.status(400).json({ message: 'userId is required for profile' });
          return;
        }
        data = await lineService.getUserProfile(req.tenantId!, userId as string);
        break;
      default:
        res.status(400).json({ message: 'Invalid data type' });
        return;
    }

    res.json({ data });
    return;
  } catch (error) {
    console.error('Get LINE data error:', error);
    res.status(500).json({ message: 'Failed to fetch LINE data' });
    return;
  }
};

export const getTikTokData = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, type } = req.query;

    const dateRange =
      dateFrom && dateTo
        ? {
            start: dateFrom as string,
            end: dateTo as string,
          }
        : undefined;

    let data = null;

    switch (type) {
      case 'campaigns':
        data = await tiktokService.getCampaigns(req.tenantId!, dateRange);
        break;
      case 'insights':
        data = await tiktokService.getInsights(req.tenantId!, dateRange);
        break;
      case 'accounts':
        data = await tiktokService.getAdAccounts(req.tenantId!);
        break;
      default:
        res.status(400).json({ message: 'Invalid data type' });
        return;
    }

    res.json({ data });
    return;
  } catch (error) {
    console.error('Get TikTok data error:', error);
    res.status(500).json({ message: 'Failed to fetch TikTok data' });
    return;
  }
};

export const getShopeeData = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo, type } = req.query;

    const dateRange =
      dateFrom && dateTo
        ? {
            start: dateFrom as string,
            end: dateTo as string,
          }
        : undefined;

    let data = null;

    switch (type) {
      case 'orders':
        data = await shopeeService.getOrders(req.tenantId!, dateRange);
        break;
      case 'products':
        data = await shopeeService.getProducts(req.tenantId!);
        break;
      case 'insights':
        data = await shopeeService.getInsights(req.tenantId!, dateRange);
        break;
      case 'shop-info':
        data = await shopeeService.getShopInfo(req.tenantId!);
        break;
      case 'shop-metrics':
        data = await shopeeService.getShopMetrics(req.tenantId!);
        break;
      default:
        res.status(400).json({ message: 'Invalid data type' });
        return;
    }

    res.json({ data });
    return;
  } catch (error) {
    console.error('Get Shopee data error:', error);
    res.status(500).json({ message: 'Failed to fetch Shopee data' });
    return;
  }
};

export const getAllData = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo } = req.query;

    const dateRange =
      dateFrom && dateTo
        ? {
            start: dateFrom as string,
            end: dateTo as string,
          }
        : undefined;

    // Use the integration service to get all platform data
    const results = await integrationService.syncAllPlatforms(req.tenantId!, dateRange);

    // Transform results to match expected format
    const transformedResults: any = {};
    results.forEach((result) => {
      if (result.success) {
        transformedResults[result.platform] = result.data;
      } else {
        transformedResults[result.platform] = { error: result.error };
      }
    });

    res.json({ data: transformedResults });
    return;
  } catch (error) {
    console.error('Get all data error:', error);
    res.status(500).json({ message: 'Failed to fetch data' });
    return;
  }
};

// FLOW END: Data Controller (EN)
// จุดสิ้นสุด: Controller สำหรับดึงข้อมูล provider (TH)

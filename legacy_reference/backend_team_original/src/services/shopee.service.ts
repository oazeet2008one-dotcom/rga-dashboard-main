import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';

// FLOW START: Shopee Service API (EN)
// จุดเริ่มต้น: Service Shopee (เรียก API) (TH)

export interface ShopeeCredentials {
  partnerId: number;
  partnerKey: string;
  shopId: number;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ShopeeOrder {
  order_sn: string;
  order_status: string;
  create_time: number;
  update_time: number;
  total_amount: number;
  currency: string;
  item_count: number;
  buyer_username: string;
  payment_method: string;
}

export interface ShopeeProduct {
  item_id: number;
  item_name: string;
  item_status: string;
  price: number;
  stock: number;
  sales: number;
  views: number;
  likes: number;
  rating_star: number;
  created_time: number;
  updated_time: number;
}

export interface ShopeeInsight {
  date: string;
  metrics: {
    orders: number;
    revenue: number;
    visitors: number;
    conversion_rate: number;
    cart_addition: number;
    checkout: number;
    payment: number;
  };
}

class ShopeeService {
  private baseUrl = 'https://partner.test-stable.shopeemobile.com';
  private productionUrl = 'https://partner.shopeemobile.com';

  async getCredentials(tenantId: string): Promise<ShopeeCredentials | null> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId,
        provider: 'shopee',
        isActive: true,
      },
    });

    if (!integration) return null;

    return integration.config as unknown as ShopeeCredentials;
  }

  async validateCredentials(credentials: ShopeeCredentials): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/api/v2/shop/get_shop_info', {}, credentials);
      return response.error === null;
    } catch (error) {
      console.error('Shopee API validation failed:', error);
      return false;
    }
  }

  private generateSignature(
    partnerId: number,
    partnerKey: string,
    endpoint: string,
    timestamp: number,
    accessToken?: string,
    shopId?: number,
  ): string {
    let baseString = `${partnerId}${endpoint}${timestamp}`;
    if (accessToken) {
      baseString += accessToken;
    }
    if (shopId) {
      baseString += shopId;
    }

    return crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');
  }

  private async makeRequest(
    method: string,
    endpoint: string,
    params: any = {},
    credentials: ShopeeCredentials,
    useProduction: boolean = false,
  ): Promise<any> {
    const baseUrl = useProduction ? this.productionUrl : this.baseUrl;
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = this.generateSignature(
      credentials.partnerId,
      credentials.partnerKey,
      endpoint,
      timestamp,
      credentials.accessToken,
      credentials.shopId,
    );

    const url = `${baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `SHA256 ${signature}`,
    };

    const queryParams = {
      partner_id: credentials.partnerId,
      timestamp: timestamp.toString(),
      access_token: credentials.accessToken,
      shop_id: credentials.shopId,
      ...params,
    };

    try {
      const response = await axios({
        method,
        url,
        params:
          method === 'GET'
            ? queryParams
            : {
                partner_id: credentials.partnerId,
                timestamp: timestamp.toString(),
                access_token: credentials.accessToken,
                shop_id: credentials.shopId,
              },
        data: method === 'POST' ? queryParams : undefined,
        headers,
      });

      return response.data;
    } catch (error) {
      console.error('Shopee API request failed:', error);
      throw error;
    }
  }

  async getOrders(
    tenantId: string,
    dateRange?: { start: string; end: string },
  ): Promise<ShopeeOrder[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Shopee credentials not found');

    try {
      const params: any = {
        page_size: 100,
        order_status: 'ALL',
      };

      if (dateRange) {
        params.create_time_from = Math.floor(new Date(dateRange.start).getTime() / 1000);
        params.create_time_to = Math.floor(new Date(dateRange.end).getTime() / 1000);
      }

      const response = await this.makeRequest(
        'GET',
        '/api/v2/order/get_order_list',
        params,
        credentials,
      );

      return response.response?.order_list || [];
    } catch (error) {
      console.error('Shopee orders fetch failed:', error);
      throw new Error('Failed to fetch Shopee orders');
    }
  }

  async getProducts(tenantId: string): Promise<ShopeeProduct[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Shopee credentials not found');

    try {
      const params = {
        page_size: 100,
        item_status: 'NORMAL',
      };

      const response = await this.makeRequest(
        'GET',
        '/api/v2/product/get_item_list',
        params,
        credentials,
      );

      return response.response?.item_list || [];
    } catch (error) {
      console.error('Shopee products fetch failed:', error);
      throw new Error('Failed to fetch Shopee products');
    }
  }

  async getShopInfo(tenantId: string): Promise<any> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Shopee credentials not found');

    try {
      const response = await this.makeRequest('GET', '/api/v2/shop/get_shop_info', {}, credentials);

      return response.response;
    } catch (error) {
      console.error('Shopee shop info fetch failed:', error);
      throw new Error('Failed to fetch Shopee shop info');
    }
  }

  async getInsights(
    tenantId: string,
    dateRange?: { start: string; end: string },
  ): Promise<ShopeeInsight[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Shopee credentials not found');

    try {
      // Shopee doesn't have a direct insights API, so we'll aggregate from orders
      const orders = await this.getOrders(tenantId, dateRange);

      // Group orders by date
      const dailyStats = new Map<string, ShopeeInsight>();

      orders.forEach((order) => {
        const date = new Date(order.create_time * 1000).toISOString().split('T')[0];

        if (!dailyStats.has(date)) {
          dailyStats.set(date, {
            date,
            metrics: {
              orders: 0,
              revenue: 0,
              visitors: 0,
              conversion_rate: 0,
              cart_addition: 0,
              checkout: 0,
              payment: 0,
            },
          });
        }

        const stats = dailyStats.get(date)!;
        stats.metrics.orders++;
        stats.metrics.revenue += order.total_amount;
        stats.metrics.payment++;
      });

      return Array.from(dailyStats.values());
    } catch (error) {
      console.error('Shopee insights fetch failed:', error);
      throw new Error('Failed to fetch Shopee insights');
    }
  }

  async getShopMetrics(tenantId: string): Promise<any> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Shopee credentials not found');

    try {
      const [orders, products, shopInfo] = await Promise.all([
        this.getOrders(tenantId),
        this.getProducts(tenantId),
        this.getShopInfo(tenantId),
      ]);

      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const totalOrders = orders.length;
      const totalProducts = products.length;
      const totalSales = products.reduce((sum, product) => sum + product.sales, 0);
      const totalViews = products.reduce((sum, product) => sum + product.views, 0);
      const totalLikes = products.reduce((sum, product) => sum + product.likes, 0);

      return {
        shop: shopInfo,
        metrics: {
          totalRevenue,
          totalOrders,
          totalProducts,
          totalSales,
          totalViews,
          totalLikes,
          averageRating:
            products.reduce((sum, product) => sum + product.rating_star, 0) / products.length || 0,
        },
      };
    } catch (error) {
      console.error('Shopee shop metrics fetch failed:', error);
      throw new Error('Failed to fetch Shopee shop metrics');
    }
  }

  // OAuth flow helpers
  getAuthUrl(partnerId: number, redirectUri: string, state: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const endpoint = '/api/v2/shop/auth_partner';

    const signature = this.generateSignature(
      partnerId,
      '', // Partner key not needed for auth URL
      endpoint,
      timestamp,
    );

    return (
      `${this.baseUrl}${endpoint}?` +
      `partner_id=${partnerId}&` +
      `timestamp=${timestamp}&` +
      `sign=${signature}&` +
      `redirect=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`
    );
  }

  async exchangeCodeForToken(
    code: string,
    shopId: number,
    partnerId: number,
    partnerKey: string,
  ): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const endpoint = '/api/v2/auth/token/get';

      const signature = this.generateSignature(partnerId, partnerKey, endpoint, timestamp);

      const response = await axios.post(
        `${this.baseUrl}${endpoint}`,
        {
          code: code,
          shop_id: shopId,
          partner_id: partnerId,
        },
        {
          params: {
            timestamp: timestamp.toString(),
            sign: signature,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Shopee token exchange failed:', error);
      throw new Error('Failed to exchange Shopee code for token');
    }
  }

  async refreshToken(tenantId: string): Promise<string> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Shopee credentials not found');

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const endpoint = '/api/v2/auth/access_token/get';

      const signature = this.generateSignature(
        credentials.partnerId,
        credentials.partnerKey,
        endpoint,
        timestamp,
        credentials.refreshToken,
        credentials.shopId,
      );

      const response = await axios.post(
        `${this.baseUrl}${endpoint}`,
        {
          refresh_token: credentials.refreshToken,
          partner_id: credentials.partnerId,
          shop_id: credentials.shopId,
        },
        {
          params: {
            timestamp: timestamp.toString(),
            sign: signature,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const newAccessToken = response.data.access_token;

      // Update credentials in database
      await prisma.integration.updateMany({
        where: { tenantId, provider: 'shopee' },
        data: {
          config: { ...credentials, accessToken: newAccessToken },
        },
      });

      return newAccessToken;
    } catch (error) {
      console.error('Shopee token refresh failed:', error);
      throw new Error('Failed to refresh Shopee token');
    }
  }
}

export const shopeeService = new ShopeeService();

// FLOW END: Shopee Service API (EN)
// จุดสิ้นสุด: Service Shopee (เรียก API) (TH)

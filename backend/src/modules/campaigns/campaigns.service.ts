import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignsRepository } from './campaigns.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateCampaignDto, UpdateCampaignDto, QueryCampaignsDto } from './dto';
import { Campaign, Metric, Prisma } from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly repository: CampaignsRepository,
    private readonly auditLogsService: AuditLogsService,
  ) { }

  /**
   * Safely convert unknown value to number
   */
  private safe(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Parse string to Date, returns undefined if invalid
   */
  private toDate(s?: string): Date | undefined {
    if (!s) return undefined;
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  }

  /**
   * Create a new campaign
   */
  async create(tenantId: string, dto: CreateCampaignDto) {
    const campaign = await this.repository.create(tenantId, dto);

    await this.auditLogsService.createLog({
      action: 'CREATE_CAMPAIGN',
      resource: 'Campaign',
      details: { campaignId: campaign.id, name: campaign.name, platform: campaign.platform },
    });

    return this.normalizeCampaign(campaign);
  }

  /**
   * Find all campaigns with filtering, pagination, and TIME-WINDOW METRICS
   * 
   * When startDate/endDate are provided, metrics are filtered to that range.
   * This enables accurate "Last 7 Days" / "This Month" reporting.
   */
  async findAll(tenantId: string, query: QueryCampaignsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    // Fields that exist in the database and can be sorted via SQL
    const dbSortFields = ['name', 'createdAt', 'status', 'platform'];
    const isDbSort = dbSortFields.includes(sortBy);

    if (isDbSort) {
      // Repository handles pagination and sorting for DB fields
      const [items, total] = await this.repository.findAll(tenantId, query);
      const normalized = items.map((c) => this.normalizeCampaign(c));

      // NEW: Get global summary for all matching campaigns
      const summaryRaw = await this.repository.getSummary(tenantId, query);
      const s = summaryRaw._sum;

      const summary = {
        spend: this.safe(s.spend),
        impressions: this.safe(s.impressions),
        clicks: this.safe(s.clicks),
        revenue: this.safe(s.revenue),
        conversions: this.safe(s.conversions),
        // Global Derived Metrics (Safe Math: defaults to 0 or -100)
        roas: s.spend ? Number((this.safe(s.revenue) / s.spend).toFixed(2)) : 0,
        roi: s.spend ? Number(((this.safe(s.revenue) - s.spend) / s.spend * 100).toFixed(2)) : -100,
        ctr: s.impressions ? Number(((this.safe(s.clicks) / s.impressions) * 100).toFixed(2)) : 0,
        cpc: s.clicks ? Number((this.safe(s.spend) / s.clicks).toFixed(2)) : 0,
        cpm: s.impressions ? Number(((this.safe(s.spend) / s.impressions) * 1000).toFixed(2)) : 0,
      };

      return {
        data: normalized,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          ...(query.startDate && { startDate: query.startDate }),
          ...(query.endDate && { endDate: query.endDate }),
        },
        summary,
      };

    } else {
      // In-memory sorting for calculated metrics (CTR, ROAS, Spend, etc.)
      const queryForRepo = {
        ...query,
        page: 1,
        limit: 10000,
        sortBy: 'createdAt'
      };

      const [items, total] = await this.repository.findAll(tenantId, queryForRepo);

      // NEW: Get global summary for all matching campaigns
      const summaryRaw = await this.repository.getSummary(tenantId, query);
      const s = summaryRaw._sum;

      const summary = {
        spend: this.safe(s.spend),
        impressions: this.safe(s.impressions),
        clicks: this.safe(s.clicks),
        revenue: this.safe(s.revenue),
        conversions: this.safe(s.conversions),
        roas: s.spend ? Number((this.safe(s.revenue) / s.spend).toFixed(2)) : 0,
        roi: s.spend ? Number(((this.safe(s.revenue) - s.spend) / s.spend * 100).toFixed(2)) : -100,
        ctr: s.impressions ? Number(((this.safe(s.clicks) / s.impressions) * 100).toFixed(2)) : 0,
        cpc: s.clicks ? Number((this.safe(s.spend) / s.clicks).toFixed(2)) : 0,
        cpm: s.impressions ? Number(((this.safe(s.spend) / s.impressions) * 1000).toFixed(2)) : 0,
      };

      let normalized = items.map((c) => this.normalizeCampaign(c));

      normalized.sort((a, b) => {
        // @ts-ignore
        const valA = a[sortBy] ?? 0;
        // @ts-ignore
        const valB = b[sortBy] ?? 0;

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const startIndex = (page - 1) * limit;
      const paginated = normalized.slice(startIndex, startIndex + limit);

      return {
        data: paginated,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          ...(query.startDate && { startDate: query.startDate }),
          ...(query.endDate && { endDate: query.endDate }),
        },
        summary,
      };
    }
  }

  /**
   * Find single campaign by ID
   */
  async findOne(tenantId: string, id: string) {
    const campaign = await this.repository.findOne(tenantId, id);

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return this.normalizeCampaign(campaign);
  }

  /**
   * Update campaign
   */
  async update(tenantId: string, id: string, dto: UpdateCampaignDto) {
    // Check if campaign exists
    await this.findOne(tenantId, id);

    const data: Prisma.CampaignUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.platform !== undefined) {
      data.platform = dto.platform;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.budget !== undefined) {
      data.budget = dto.budget;
    }

    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }

    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    const campaign = await this.repository.update(tenantId, id, data);

    return this.normalizeCampaign(campaign);
  }

  /**
   * Remove (delete) campaign
   */
  async remove(tenantId: string, id: string) {
    // Check if campaign exists
    await this.findOne(tenantId, id);

    await this.repository.remove(tenantId, id);

    return { message: 'Campaign deleted successfully' };
  }

  /**
   * Get metrics for a single campaign with optional date range
   */
  async getCampaignMetrics(
    tenantId: string,
    id: string,
    startDate?: string,
    endDate?: string,
  ) {
    // Check if campaign exists
    const campaign = await this.findOne(tenantId, id);

    const start = this.toDate(startDate);
    const end = this.toDate(endDate);

    const metrics = await this.repository.getMetrics(id, start, end);

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
      },
      metrics: metrics.map((m) => {
        const spend = this.safe(m.spend);
        const impressions = m.impressions ?? 0;
        const clicks = m.clicks ?? 0;

        return {
          date: m.date,
          impressions,
          clicks,
          spend,
          conversions: m.conversions,
          revenue: this.safe(m.revenue),
          // Calculated fields (Safe Math - not stored in DB):
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cpc: clicks > 0 ? spend / clicks : 0,
          cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
          roas: this.safe(m.roas),
        };
      }),
    };
  }

  /**
   * Normalize campaign data with aggregated metrics
   * 
   * IMPORTANT: The metrics array is already filtered by the repository
   * when startDate/endDate query params are provided.
   * This ensures spend, impressions, etc. reflect the selected time window.
   */
  private normalizeCampaign(c: Campaign & { metrics: Metric[] }) {
    const m = c.metrics || [];

    // Aggregate metrics - these are already filtered by date range if provided
    const spend = m.reduce((s: number, x: Metric) => s + this.safe(x.spend), 0);
    const revenue = m.reduce((s: number, x: Metric) => s + this.safe(x.revenue), 0);
    const clicks = m.reduce((s: number, x: Metric) => s + this.safe(x.clicks), 0);
    const impressions = m.reduce((s: number, x: Metric) => s + this.safe(x.impressions), 0);
    const conversions = m.reduce((s: number, x: Metric) => s + this.safe(x.conversions), 0);

    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      status: c.status,
      budget: this.safe(c.budget),
      startDate: c.startDate,
      endDate: c.endDate,
      externalId: c.externalId,
      // Aggregated metrics (time-window aware)
      spend,
      revenue,
      clicks,
      impressions,
      conversions,
      // Calculated ratios
      // Calculated ratios
      roas: spend ? Number((revenue / spend).toFixed(2)) : 0,
      roi: spend ? Number(((revenue - spend) / spend * 100).toFixed(2)) : -100,
      ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
      cpc: clicks ? Number((spend / clicks).toFixed(2)) : 0,
      cpm: impressions ? Number(((spend / impressions) * 1000).toFixed(2)) : 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}

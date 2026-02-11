import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto, QueryCampaignsDto } from './dto';
import { Campaign, Metric, Prisma, CampaignStatus, AdPlatform } from '@prisma/client';

export abstract class CampaignsRepository {
  abstract create(tenantId: string, data: CreateCampaignDto): Promise<Campaign & { metrics: Metric[] }>;
  abstract findAll(tenantId: string, query: QueryCampaignsDto): Promise<[(Campaign & { metrics: Metric[] })[], number]>;
  abstract findOne(tenantId: string, id: string): Promise<(Campaign & { metrics: Metric[] }) | null>;
  abstract update(tenantId: string, id: string, data: any): Promise<Campaign & { metrics: Metric[] }>;
  abstract remove(tenantId: string, id: string): Promise<void>;
  abstract getMetrics(campaignId: string, startDate?: Date, endDate?: Date): Promise<Metric[]>;
  abstract getSummary(tenantId: string, query: QueryCampaignsDto): Promise<any>;
}

@Injectable()
export class PrismaCampaignsRepository implements CampaignsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(tenantId: string, dto: CreateCampaignDto): Promise<Campaign & { metrics: Metric[] }> {
    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        platform: dto.platform,
        status: dto.status || CampaignStatus.PENDING,
        budget: dto.budget,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        externalId: dto.externalId || null,
        tenantId,
      },
      include: { metrics: true },
    });
  }

  // ==========================================================================
  // Helper: Build Where Clause
  // ==========================================================================
  private buildWhereClause(tenantId: string, query: QueryCampaignsDto): Prisma.CampaignWhereInput {
    const search = query.search || undefined;

    // Handle multi-select Status
    let statusFilter: Prisma.EnumCampaignStatusFilter | undefined;
    if (query.status && query.status !== 'ALL') {
      const statuses = query.status.split(',').filter(s => s !== 'ALL') as CampaignStatus[];
      if (statuses.length > 0) {
        statusFilter = statuses.length === 1 ? { equals: statuses[0] } : { in: statuses };
      }
    }

    // Handle multi-select Platform
    let platformFilter: Prisma.EnumAdPlatformFilter | undefined;

    // DEBUG LOG
    if (query.platform) {
      console.log('DEBUG: buildWhereClause platform input:', query.platform);
      console.log('DEBUG: AdPlatform Enum Keys/Values:', JSON.stringify(AdPlatform));
    }

    if (query.platform && query.platform !== 'ALL') {
      const platforms = query.platform.split(',').filter(p => p !== 'ALL').map(p => {
        const key = p.trim().toUpperCase().replace('-', '_');

        // Explicit mapping for known variations
        if (key === 'GOOGLE') return AdPlatform.GOOGLE_ADS;
        if (key === 'LINE') return AdPlatform.LINE_ADS;

        // Check if key exists in Enum, otherwise attempt as-is (though likely invalid)
        if (key in AdPlatform) {
          return AdPlatform[key as keyof typeof AdPlatform];
        }

        // Fallback: return the uppercased key which matches standard Prisma Enum Keys
        return key as AdPlatform;
      }) as AdPlatform[];

      if (platforms.length > 0) {
        platformFilter = platforms.length === 1 ? { equals: platforms[0] } : { in: platforms };
      }
    }

    const ids = query.ids ? query.ids.split(',').filter(id => id.trim().length > 0) : undefined;

    const where: Prisma.CampaignWhereInput = { tenantId };

    if (ids && ids.length > 0) {
      where.id = { in: ids };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { externalId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (platformFilter) {
      where.platform = platformFilter;
    }

    return where;
  }

  async findAll(tenantId: string, query: QueryCampaignsDto): Promise<[(Campaign & { metrics: Metric[] })[], number]> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const where = this.buildWhereClause(tenantId, query);

    const take = limit;
    const skip = (page - 1) * take;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Construct metrics include logic explicitly
    let metricsInclude: any = true;

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;

      metricsInclude = {
        where: { date: dateFilter }
      };
    }

    // DEBUG: Log the final query object
    console.log('DEBUG: findAll execution');
    console.log('DEBUG: where clause:', JSON.stringify(where, null, 2));
    console.log('DEBUG: metricsInclude:', JSON.stringify(metricsInclude, null, 2));

    return Promise.all([
      this.prisma.campaign.findMany({
        where,
        take,
        skip,
        include: { metrics: metricsInclude },
        orderBy,
      }),
      this.prisma.campaign.count({ where }),
    ]);
  }

  async findOne(tenantId: string, id: string): Promise<(Campaign & { metrics: Metric[] }) | null> {
    return this.prisma.campaign.findFirst({
      where: { id, tenantId },
      include: { metrics: true },
    });
  }

  async update(tenantId: string, id: string, data: any): Promise<Campaign & { metrics: Metric[] }> {
    await this.prisma.campaign.updateMany({
      where: { id, tenantId },
      data,
    });

    // Fetch the updated record with metrics (tenant-scoped)
    return this.prisma.campaign.findFirstOrThrow({
      where: { id, tenantId },
      include: { metrics: true },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.prisma.campaign.deleteMany({
      where: { id, tenantId },
    });
  }

  async getMetrics(campaignId: string, startDate?: Date, endDate?: Date): Promise<Metric[]> {
    const where: Prisma.MetricWhereInput = { campaignId };

    if (startDate || endDate) {
      where.date = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    return this.prisma.metric.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  // ==========================================================================
  // New Method: Get Global Summary (Aggregated)
  // ==========================================================================
  async getSummary(tenantId: string, query: QueryCampaignsDto) {
    const where = this.buildWhereClause(tenantId, query);
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    // 1. Find all matching campaign IDs first
    const campaigns = await this.prisma.campaign.findMany({
      where,
      select: { id: true },
    });

    const campaignIds = campaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      return {
        _sum: {
          spend: 0,
          impressions: 0,
          clicks: 0,
          revenue: 0,
          conversions: 0,
          budget: 0,
        }
      };
    }

    // 2. Aggregate metrics for these campaigns, respecting date filters
    const metricWhere: Prisma.MetricWhereInput = {
      campaignId: { in: campaignIds },
      ...(startDate || endDate ? {
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      } : {}),
    };

    // Parallel: Aggregate Metrics AND Sum Budget
    // Note: Budget is a campaign-level field, while others are metric-level
    const [metricsAgg, budgetAgg] = await Promise.all([
      this.prisma.metric.aggregate({
        where: metricWhere,
        _sum: {
          spend: true,
          impressions: true,
          clicks: true,
          revenue: true,
          conversions: true,
        },
      }),
      this.prisma.campaign.aggregate({
        where,
        _sum: {
          budget: true,
        },
      }),
    ]);

    return {
      _sum: {
        ...metricsAgg._sum,
        budget: budgetAgg._sum.budget,
      },
    };
  }
}

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
    const status = query.status || undefined;
    const platform = query.platform || undefined;

    const where: Prisma.CampaignWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { externalId: { contains: search } },
      ];
    }

    if (status) {
      where.status = status as CampaignStatus;
    }

    if (platform) {
      where.platform = platform as AdPlatform;
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

    const metricsInclude: Prisma.CampaignInclude['metrics'] =
      (startDate || endDate)
        ? {
          where: {
            date: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          },
        }
        : true;

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
    return this.prisma.campaign.update({
      where: { id },
      data,
      include: { metrics: true },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.prisma.campaign.delete({
      where: { id },
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

    return this.prisma.metric.aggregate({
      where: metricWhere,
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        revenue: true,
        conversions: true,
      },
    });
  }
}

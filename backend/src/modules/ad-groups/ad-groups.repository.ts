import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdGroup, Prisma } from '@prisma/client';
import { QueryAdGroupsDto } from './dto';

@Injectable()
export class AdGroupsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(
        tenantId: string,
        data: Prisma.AdGroupCreateInput,
    ): Promise<AdGroup> {
        return this.prisma.adGroup.create({
            data: {
                ...data,
                tenant: { connect: { id: tenantId } },
            },
        });
    }

    async findAll(
        tenantId: string,
        query: QueryAdGroupsDto,
    ): Promise<[AdGroup[], number]> {
        const { page = 1, limit = 10, search, status, campaignId, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AdGroupWhereInput = {
            tenantId,
            // Exclude soft-deleted records by default (if needed)
            // status: { not: 'DELETED' }, 
        };

        // Filter by campaignId (Essential for UI)
        if (campaignId) {
            where.campaignId = campaignId;
        }

        // Search by name
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        // Filter by status
        if (status) {
            where.status = status.toUpperCase() as Prisma.EnumAdGroupStatusFilter;
        }

        // Build orderBy
        const orderBy: Prisma.AdGroupOrderByWithRelationInput = {};
        if (sortBy) {
            orderBy[sortBy as keyof Prisma.AdGroupOrderByWithRelationInput] = sortOrder || 'asc';
        } else {
            orderBy.createdAt = 'desc'; // Default sort
        }

        const [items, total] = await Promise.all([
            this.prisma.adGroup.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    campaign: {
                        select: {
                            id: true,
                            name: true,
                            platform: true,
                        },
                    },
                },
            }),
            this.prisma.adGroup.count({ where }),
        ]);

        return [items, total];
    }

    async findOne(tenantId: string, id: string): Promise<AdGroup | null> {
        return this.prisma.adGroup.findFirst({
            where: { id, tenantId },
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        platform: true,
                        status: true,
                    },
                },
            },
        });
    }

    async findByCampaignId(
        tenantId: string,
        campaignId: string,
    ): Promise<AdGroup[]> {
        return this.prisma.adGroup.findMany({
            where: { tenantId, campaignId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async update(
        tenantId: string,
        id: string,
        data: Prisma.AdGroupUpdateInput,
    ): Promise<AdGroup> {
        return this.prisma.adGroup.update({
            where: { id },
            data,
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        platform: true,
                    },
                },
            },
        });
    }

    async remove(tenantId: string, id: string): Promise<void> {
        // Soft delete by setting status to DELETED
        await this.prisma.adGroup.update({
            where: { id },
            data: { status: 'DELETED' },
        });
    }

    async hardDelete(tenantId: string, id: string): Promise<void> {
        await this.prisma.adGroup.delete({
            where: { id },
        });
    }

    /**
     * Verify campaign exists and belongs to the tenant
     */
    async verifyCampaignOwnership(
        tenantId: string,
        campaignId: string,
    ): Promise<boolean> {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id: campaignId, tenantId },
            select: { id: true },
        });
        return !!campaign;
    }
}

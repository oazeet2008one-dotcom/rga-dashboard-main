import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { AdGroupsRepository } from './ad-groups.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateAdGroupDto, UpdateAdGroupDto, QueryAdGroupsDto } from './dto';
import { AdGroup, Prisma } from '@prisma/client';

@Injectable()
export class AdGroupsService {
    constructor(
        private readonly repository: AdGroupsRepository,
        private readonly auditLogsService: AuditLogsService,
    ) { }

    /**
     * Create a new Ad Group
     * - Validates that campaignId exists and belongs to the user's tenant
     * - Automatically sets tenantId from user context
     */
    async create(tenantId: string, dto: CreateAdGroupDto) {
        // ✅ CRITICAL: Validate campaign ownership (Tenant Isolation)
        const campaignValid = await this.repository.verifyCampaignOwnership(
            tenantId,
            dto.campaignId,
        );

        if (!campaignValid) {
            throw new ForbiddenException(
                'Campaign not found or does not belong to your organization',
            );
        }

        // Build create input
        const createData: Prisma.AdGroupCreateInput = {
            name: dto.name,
            status: dto.status || 'ACTIVE',
            campaign: { connect: { id: dto.campaignId } },
            tenant: { connect: { id: tenantId } },
        };

        // Optional fields
        if (dto.budget !== undefined) {
            createData.budget = dto.budget;
        }
        if (dto.bidAmount !== undefined) {
            createData.bidAmount = dto.bidAmount;
        }
        if (dto.bidType) {
            createData.bidType = dto.bidType;
        }
        if (dto.targeting) {
            createData.targeting = dto.targeting as Prisma.InputJsonValue;
        }
        if (dto.externalId) {
            createData.externalId = dto.externalId;
        }

        const adGroup = await this.repository.create(tenantId, createData);

        // Audit log
        await this.auditLogsService.createLog({
            action: 'CREATE_AD_GROUP',
            resource: 'AdGroup',
            details: {
                adGroupId: adGroup.id,
                name: adGroup.name,
                campaignId: dto.campaignId,
            },
        });

        return this.normalizeAdGroup(adGroup);
    }

    /**
     * Find all ad groups with filtering and pagination
     */
    async findAll(tenantId: string, query: QueryAdGroupsDto) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;

        const [items, total] = await this.repository.findAll(tenantId, query);

        const normalized = items.map((adGroup) => this.normalizeAdGroup(adGroup));

        return {
            data: normalized,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    /**
     * Find one ad group by ID
     */
    async findOne(tenantId: string, id: string) {
        const adGroup = await this.repository.findOne(tenantId, id);

        if (!adGroup) {
            throw new NotFoundException('Ad Group not found');
        }

        return this.normalizeAdGroup(adGroup);
    }

    /**
     * Update an ad group
     */
    async update(
        tenantId: string,
        id: string,
        dto: UpdateAdGroupDto,
    ): Promise<{ id: string; name: string;[key: string]: unknown }> {
        // Check if ad group exists and belongs to tenant
        await this.findOne(tenantId, id);

        const updateData: Prisma.AdGroupUpdateInput = {};

        if (dto.name !== undefined) {
            updateData.name = dto.name;
        }
        if (dto.status !== undefined) {
            updateData.status = dto.status;
        }
        if (dto.budget !== undefined) {
            updateData.budget = dto.budget;
        }
        if (dto.bidAmount !== undefined) {
            updateData.bidAmount = dto.bidAmount;
        }
        if (dto.bidType !== undefined) {
            updateData.bidType = dto.bidType;
        }
        if (dto.targeting !== undefined) {
            updateData.targeting = dto.targeting as Prisma.InputJsonValue;
        }
        if (dto.externalId !== undefined) {
            updateData.externalId = dto.externalId;
        }

        const adGroup = await this.repository.update(tenantId, id, updateData);

        // Audit log
        await this.auditLogsService.createLog({
            action: 'UPDATE_AD_GROUP',
            resource: 'AdGroup',
            details: {
                adGroupId: id,
                changes: dto,
            },
        });

        return this.normalizeAdGroup(adGroup);
    }

    /**
     * Delete (soft delete) an ad group
     */
    async remove(tenantId: string, id: string): Promise<{ message: string }> {
        // Check if ad group exists
        await this.findOne(tenantId, id);

        await this.repository.remove(tenantId, id);

        // Audit log
        await this.auditLogsService.createLog({
            action: 'DELETE_AD_GROUP',
            resource: 'AdGroup',
            details: { adGroupId: id },
        });

        return { message: 'Ad Group deleted successfully' };
    }

    /**
     * Get all ad groups for a specific campaign
     */
    async findByCampaignId(
        tenantId: string,
        campaignId: string,
    ): Promise<Array<{ id: string; name: string;[key: string]: unknown }>> {
        // Validate campaign ownership first
        const campaignValid = await this.repository.verifyCampaignOwnership(
            tenantId,
            campaignId,
        );

        if (!campaignValid) {
            throw new ForbiddenException(
                'Campaign not found or does not belong to your organization',
            );
        }

        const adGroups = await this.repository.findByCampaignId(
            tenantId,
            campaignId,
        );

        return adGroups.map((adGroup) => this.normalizeAdGroup(adGroup));
    }

    /**
     * Normalize ad group for response
     */
    private normalizeAdGroup(adGroup: AdGroup & { campaign?: unknown }) {
        return {
            ...adGroup,
            budget: adGroup.budget ? Number(adGroup.budget) : null,
            bidAmount: adGroup.bidAmount ? Number(adGroup.bidAmount) : null,
        };
    }
}

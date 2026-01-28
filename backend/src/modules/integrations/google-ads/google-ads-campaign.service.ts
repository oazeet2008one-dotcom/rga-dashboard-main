import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleAdsApiService } from './services/google-ads-api.service';
import { GoogleAdsMapperService } from './services/google-ads-mapper.service';

@Injectable()
export class GoogleAdsCampaignService {
  private readonly logger = new Logger(GoogleAdsCampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleAdsApiService: GoogleAdsApiService,
    private readonly googleAdsMapperService: GoogleAdsMapperService,
  ) { }

  /**
   * Helper to find account by ID (UUID) or Customer ID
   * Refactored to prevent Prisma UUID validation error when passing numeric Customer ID
   */
  private async findAccount(idOrCustomerId: string) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(idOrCustomerId);

    let account;

    if (isUuid) {
      // Case A: Input is a valid UUID, search by primary key
      account = await this.prisma.googleAdsAccount.findUnique({
        where: { id: idOrCustomerId },
      });
    } else {
      // Case B: Input is likely a Customer ID (10 digits), search by customerId field
      const cleanId = idOrCustomerId.replace(/-/g, '');
      account = await this.prisma.googleAdsAccount.findFirst({
        where: { customerId: cleanId },
      });
    }

    // Fallback: Not found
    if (!account) {
      this.logger.error(`Google Ads account not found for identifier: ${idOrCustomerId}`);
      throw new NotFoundException(`Google Ads account not found for identifier: ${idOrCustomerId}`);
    }

    return account;
  }

  /**
   * Fetch campaigns from Google Ads API (Facade)
   */
  async fetchCampaigns(accountId: string) {
    const account = await this.findAccount(accountId);

    const results = await this.googleAdsApiService.fetchCampaigns(account);
    const campaigns = this.googleAdsMapperService.transformCampaigns(results);

    return {
      accountId: account.id,
      accountName: account.accountName || account.customerId,
      customerId: account.customerId,
      campaigns,
      totalCampaigns: results.length,
    };
  }

  /**
   * Get all connected accounts for a specific tenant
   */
  async getAccounts(tenantId: string) {
    const accounts = await this.prisma.googleAdsAccount.findMany({
      where: { tenantId },
      select: {
        id: true,
        accountName: true,
        customerId: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return accounts;
  }

  /**
   * Fetch campaign metrics from Google Ads API (Facade)
   */
  async fetchCampaignMetrics(
    accountId: string,
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const account = await this.findAccount(accountId);

    const rawMetrics = await this.googleAdsApiService.fetchCampaignMetrics(
      account,
      campaignId,
      startDate,
      endDate,
    );

    return this.googleAdsMapperService.transformMetrics(rawMetrics);
  }
}

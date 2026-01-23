import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MockDataService } from '../mock-data/mock-data.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { DashboardOverviewResponseDto, GetDashboardOverviewDto } from '../dashboard/dto/dashboard-overview.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class IntegrationSwitchService {
    private readonly logger = new Logger(IntegrationSwitchService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly mockDataService: MockDataService,
        @Inject(DashboardService) private readonly dashboardService: DashboardService,
    ) { }

    /**
     * "Smart Switch" for Dashboard Overview
     */
    async getDashboardOverview(
        user: { tenantId: string; role: UserRole },
        query: GetDashboardOverviewDto
    ): Promise<DashboardOverviewResponseDto & { isDemo: boolean }> {

        const hasIntegrations = await this.checkActiveIntegrations(user.tenantId);

        if (!hasIntegrations) {
            this.logger.log(`Serving Mock Data for tenant ${user.tenantId} (Demo Mode)`);
            const mockData = this.mockDataService.getMockOverview(query.period);

            return {
                success: true,
                data: {
                    ...mockData,
                    isDemo: true
                },
                meta: {
                    period: query.period,
                    dateRange: { from: 'MOCK', to: 'MOCK' },
                    tenantId: user.tenantId,
                    generatedAt: new Date().toISOString(),
                },
                isDemo: true // Keep root for backward compat if needed, but rely on data.isDemo
            };
        }

        const realData = await this.dashboardService.getOverview(user, query);
        // Inject into data object
        if (realData.data) {
            (realData.data as any).isDemo = false;
        }

        return { ...realData, isDemo: false };
    }

    /**
     * "Smart Switch" for Top Campaigns
     */
    async getTopCampaigns(tenantId: string, limit = 5, days = 30) {
        const hasIntegrations = await this.checkActiveIntegrations(tenantId);

        if (!hasIntegrations) {
            // Demo Mode
            const mockCampaigns = this.mockDataService.getMockCampaigns();
            // Slice to limit
            return mockCampaigns.slice(0, limit).map(c => ({
                ...c,
                metrics: {
                    impressions: 10000,
                    clicks: 200,
                    spend: c.spending,
                    conversions: 10,
                    revenue: c.spending * 2,
                    roas: 2.0,
                    ctr: 2.0
                }
            }));
        }

        // Live Mode
        return this.dashboardService.getTopCampaigns(tenantId, limit, days);
    }

    /**
     * Helper: Check if tenant has ANY connected platform
     */
    private async checkActiveIntegrations(tenantId: string): Promise<boolean> {
        const [googleAds, fbAds, tiktokAds, lineAds] = await Promise.all([
            this.prisma.googleAdsAccount.count({ where: { tenantId, status: 'ENABLED' } }),
            this.prisma.facebookAdsAccount.count({ where: { tenantId, status: 'ACTIVE' } }),
            this.prisma.tikTokAdsAccount.count({ where: { tenantId, status: 'ACTIVE' } }),
            this.prisma.lineAdsAccount.count({ where: { tenantId, status: 'ACTIVE' } }),
        ]);

        return (googleAds + fbAds + tiktokAds + lineAds) > 0;
    }
}

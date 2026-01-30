import { Injectable } from '@nestjs/common';
import { DashboardService } from '../dashboard/dashboard.service';
import { DashboardOverviewResponseDto, GetDashboardOverviewDto } from '../dashboard/dto/dashboard-overview.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class IntegrationSwitchService {
    constructor(
        private readonly dashboardService: DashboardService,
    ) { }

    /**
     * "Smart Switch" for Dashboard Overview
     */
    async getDashboardOverview(
        user: { tenantId: string; role: UserRole },
        query: GetDashboardOverviewDto
    ): Promise<DashboardOverviewResponseDto> {
        return this.dashboardService.getOverview(user, query);
    }

    /**
     * "Smart Switch" for Top Campaigns
     */
    async getTopCampaigns(tenantId: string, limit = 5, days = 30) {
        return this.dashboardService.getTopCampaigns(tenantId, limit, days);
    }
}

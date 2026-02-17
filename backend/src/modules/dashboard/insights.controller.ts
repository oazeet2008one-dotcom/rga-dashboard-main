import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InsightsService } from './insights.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard/insights')
@UseGuards(JwtAuthGuard)
export class InsightsController {
    constructor(private readonly insightsService: InsightsService) { }

    @Get()
    @ApiOperation({ summary: 'Get AI Insights for the current tenant' })
    async getInsights(@CurrentUser('tenantId') tenantId: string) {
        return this.insightsService.getAiInsights(tenantId);
    }
}

import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SeoService } from './seo.service';

@ApiTags('SEO')
@ApiBearerAuth()
@Controller('seo')
@UseGuards(JwtAuthGuard)
export class SeoController {
    constructor(private readonly seoService: SeoService) { }

    @Get('overview')
    @ApiOperation({ summary: 'Get SEO overview (GA4 + GSC)' })
    @ApiQuery({ name: 'period', required: false, description: 'Time period (7d, 14d, 30d, 90d). Default: 30d' })
    async getSeoOverview(
        @CurrentUser('tenantId') tenantId: string,
        @Query('period') period?: string,
    ) {
        return this.seoService.getOverview(tenantId, period);
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get SEO dashboard details (trends + top breakdown)' })
    @ApiQuery({ name: 'period', required: false, description: 'Time period (7d, 14d, 30d, 90d). Default: 30d' })
    @ApiQuery({ name: 'limit', required: false, description: 'Top N breakdown rows. Default: 10' })
    async getSeoDashboard(
        @CurrentUser('tenantId') tenantId: string,
        @Query('period') period?: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? Math.max(1, parseInt(limit, 10) || 10) : 10;
        return this.seoService.getDashboard(tenantId, period, limitNum);
    }

    @Post('sync/gsc')
    @ApiOperation({ summary: 'Manually sync Google Search Console data into DB' })
    @ApiQuery({ name: 'days', required: false, description: 'How many days back to sync. Default: 30' })
    async syncGsc(
        @CurrentUser('tenantId') tenantId: string,
        @Query('days') days?: string,
    ) {
        const daysNum = days ? Math.max(1, parseInt(days, 10) || 30) : 30;
        return this.seoService.syncGscForTenant(tenantId, { days: daysNum });
    }
}
